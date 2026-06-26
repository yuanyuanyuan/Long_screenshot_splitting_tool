// Message Contract (v1.1):
// From Main to Worker: { file: File, splitHeight: number }
// From Worker to Main:
// - Progress: { type: 'progress', progress: number } // 0-100；分段：0-25 解码 / 25-30 内容感知分析 / 30-95 切片 / 100 完成
// - Chunk:    { type: 'chunk', blob: Blob, index: number }
// - Done:     { type: 'done' } // Simplified completion signal
// - Error:    { type: 'error', message: string }
//
// 内容感知切割（spec §4）：解码后插入「分析」阶段，调用纯函数 splitAnalyzer
// 得到切割点；有切割点则按点切，无则回退固定高度等分（绝不切得比现状差）。

import { analyzeSplitPoints } from '../utils/splitAnalyzer';

// Web Worker for handling image splitting operations
// This worker runs in a separate thread to avoid blocking the UI

/**
 * 主消息监听器 - 接收来自主线程的消息
 */
self.onmessage = function (event) {
  try {
    const { file, splitHeight } = event.data;

    // 参数验证
    if (!file) {
      self.postMessage({
        type: 'error',
        message: 'No file provided',
      });
      return;
    }

    if (!(file instanceof File)) {
      self.postMessage({
        type: 'error',
        message: 'Invalid file object provided',
      });
      return;
    }

    if (!splitHeight || typeof splitHeight !== 'number' || splitHeight <= 0) {
      self.postMessage({
        type: 'error',
        message: 'Invalid splitHeight provided. Must be a positive number.',
      });
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      self.postMessage({
        type: 'error',
        message: 'File must be an image',
      });
      return;
    }

    console.log(`Worker received: ${file.name}, splitHeight: ${splitHeight}`);

    // 开始图片处理流程
    processImage(file, splitHeight);
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      type: 'error',
      message: `Worker processing error: ${error.message}`,
    });
  }
};

/**
 * 图片处理主函数
 * 流程：解码 → 全图绘制 → 内容感知分析（得切割点）→ 按切割点切片（无切割点则等分回退）
 */
async function processImage(file, splitHeight) {
  try {
    // 发送初始进度
    self.postMessage({
      type: 'progress',
      progress: 0,
    });

    console.log('Starting image processing...');

    // 使用 createImageBitmap 解码图片
    console.log('Decoding image with createImageBitmap...');
    const imageBitmap = await createImageBitmap(file);

    console.log(
      `Image decoded successfully. Dimensions: ${imageBitmap.width} x ${imageBitmap.height}`
    );

    // 创建 OffscreenCanvas 并设置其尺寸与原图一致
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');

    console.log(`OffscreenCanvas created with dimensions: ${canvas.width} x ${canvas.height}`);

    // 将图片位图绘制到 OffscreenCanvas 上
    ctx.drawImage(imageBitmap, 0, 0);

    // 更新进度到 25% (图片解码和绘制完成)
    self.postMessage({
      type: 'progress',
      progress: 25,
    });

    // 释放 imageBitmap 资源
    imageBitmap.close();

    // 内容感知分析：读取全图像素，计算切割点
    // 注：当前为全图 getImageData（KISS）；大图（>4000px）分块读取为未来优化项（spec §4.6）
    console.log('Analyzing content for split points...');
    let splitPoints = [];
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      splitPoints = analyzeSplitPoints(imageData.data, canvas.width, canvas.height, {
        targetHeight: splitHeight,
      });
      console.log(
        `Content analysis done. splitPoints: ${JSON.stringify(splitPoints)} (mode: ${
          splitPoints.length > 0 ? 'content-aware' : 'equal-split-fallback'
        })`
      );
    } catch (analyzeError) {
      // 分析任何异常 → 安全回退等分（绝不因分析失败而中断或劣化，spec §4.5）
      console.warn('Content analysis failed, falling back to equal split:', analyzeError);
      splitPoints = [];
    }

    // 更新进度到 30% (分析完成)
    self.postMessage({
      type: 'progress',
      progress: 30,
    });

    // task-1.4: 按切割点切片（无切割点则等分回退）
    console.log('Starting image splitting...');

    const sliceBounds = computeSliceBounds(splitPoints, canvas.height, splitHeight);
    const totalChunks = sliceBounds.length;
    console.log(`Total chunks to create: ${totalChunks}`);

    // 循环处理每个切片
    for (let i = 0; i < totalChunks; i++) {
      const [startY, endY] = sliceBounds[i];
      const chunkHeight = endY - startY;

      console.log(
        `Processing chunk ${i + 1}/${totalChunks}, startY: ${startY}, height: ${chunkHeight}`
      );

      // 创建临时 OffscreenCanvas 用于当前切片
      const chunkCanvas = new OffscreenCanvas(canvas.width, chunkHeight);
      const chunkCtx = chunkCanvas.getContext('2d');

      // 使用 drawImage 复制指定区域到临时 canvas
      chunkCtx.drawImage(
        canvas, // 源 canvas
        0,
        startY, // 源区域起始位置
        canvas.width,
        chunkHeight, // 源区域尺寸
        0,
        0, // 目标位置
        canvas.width,
        chunkHeight // 目标尺寸
      );

      // 转换为 Blob (JPEG 格式，质量 0.92——减轻截图文字边缘振铃伪影)
      const blob = await convertToBlob(chunkCanvas, 'image/jpeg', 0.92);

      console.log(`Chunk ${i + 1} blob created, size: ${blob.size} bytes`);

      // 发送切片数据
      self.postMessage({
        type: 'chunk',
        blob: blob,
        index: i,
      });

      // 计算并发送进度 (30% 到 95%)
      const progress = Math.round(30 + ((i + 1) / totalChunks) * 65);
      self.postMessage({
        type: 'progress',
        progress: progress,
      });

      console.log(`Chunk ${i + 1}/${totalChunks} completed, progress: ${progress}%`);
    }

    console.log('Image splitting completed');

    // task-1.5: 发送完成消息
    console.log('Sending completion signal...');

    // 更新进度到 100%
    self.postMessage({
      type: 'progress',
      progress: 100,
    });

    // 发送简化的完成消息
    self.postMessage({
      type: 'done',
    });

    console.log('✅ All processing completed successfully');
  } catch (error) {
    console.error('Error in processImage:', error);
    self.postMessage({
      type: 'error',
      message: `Image processing error: ${error.message}`,
    });
  }
}

/**
 * 根据切割点计算切片边界 [[startY, endY], ...]（spec §4.5）
 * - 有切割点：按切割点分段，保证每段落在内容空白带之间
 * - 无切割点：回退固定高度等分（与原逻辑一致，绝不切得比现状差）
 *
 * @param {number[]} splitPoints 切割点 y 坐标数组（来自 splitAnalyzer）
 * @param {number} imageHeight   图像总高度
 * @param {number} splitHeight   等分回退时的固定页高
 * @returns {Array<[number, number]>} 切片边界数组
 */
function computeSliceBounds(splitPoints, imageHeight, splitHeight) {
  // 内容感知：按切割点分段
  if (splitPoints.length > 0) {
    const bounds = [];
    let prev = 0;
    for (const point of splitPoints) {
      bounds.push([prev, point]);
      prev = point;
    }
    bounds.push([prev, imageHeight]);
    return bounds;
  }

  // 等分回退：固定高度等分（与原 split.worker.js 行为完全一致）
  const bounds = [];
  const totalChunks = Math.ceil(imageHeight / splitHeight);
  for (let i = 0; i < totalChunks; i++) {
    const startY = i * splitHeight;
    const endY = Math.min(startY + splitHeight, imageHeight);
    bounds.push([startY, endY]);
  }
  return bounds;
}

/**
 * 将 OffscreenCanvas 转换为 Blob
 * @param {OffscreenCanvas} canvas - 要转换的 canvas
 * @param {string} type - 图片类型 (如 'image/jpeg')
 * @param {number} quality - 图片质量 (0-1)，默认 0.92（减轻文字振铃伪影）
 * @returns {Promise<Blob>} - 转换后的 Blob 对象
 */
async function convertToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return await canvas.convertToBlob({
    type: type,
    quality: quality,
  });
}
