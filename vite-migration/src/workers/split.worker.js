// Message Contract (v1.1):
// From Main to Worker: { file: File, splitHeight: number }
// From Worker to Main:
// - Progress: { type: 'progress', progress: number } // 0-100 percentage
// - Chunk:    { type: 'chunk', blob: Blob, index: number }
// - Done:     { type: 'done' } // Simplified completion signal
// - Error:    { type: 'error', message: string }

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
 * 图片处理主函数 - task-1.3: 实现图片解码与 OffscreenCanvas 绘制
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

    console.log(
      `OffscreenCanvas created with dimensions: ${canvas.width} x ${canvas.height}`
    );

    // 将图片位图绘制到 OffscreenCanvas 上
    ctx.drawImage(imageBitmap, 0, 0);

    console.log('Image bitmap drawn to OffscreenCanvas successfully');

    // 验证 OffscreenCanvas 尺寸与原图一致
    console.log(
      `Verification - OffscreenCanvas: ${canvas.width} x ${canvas.height}, Original: ${imageBitmap.width} x ${imageBitmap.height}`
    );

    if (
      canvas.width === imageBitmap.width &&
      canvas.height === imageBitmap.height
    ) {
      console.log('✅ OffscreenCanvas dimensions match original image');
    } else {
      console.error(
        '❌ OffscreenCanvas dimensions do not match original image'
      );
    }

    // 更新进度到 25% (图片解码和绘制完成)
    self.postMessage({
      type: 'progress',
      progress: 25,
    });

    // 释放 imageBitmap 资源
    imageBitmap.close();

    // task-1.4: 开始图片切割、Blob 生成与进度上报
    console.log('Starting image splitting...');

    // 计算切片总数
    const totalChunks = Math.ceil(canvas.height / splitHeight);
    console.log(`Total chunks to create: ${totalChunks}`);

    // 循环处理每个切片
    for (let i = 0; i < totalChunks; i++) {
      const startY = i * splitHeight;
      const chunkHeight = Math.min(splitHeight, canvas.height - startY);

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

      // 转换为 Blob (JPEG 格式，质量 0.9)
      const blob = await convertToBlob(chunkCanvas, 'image/jpeg', 0.9);

      console.log(`Chunk ${i + 1} blob created, size: ${blob.size} bytes`);

      // 发送切片数据
      self.postMessage({
        type: 'chunk',
        blob: blob,
        index: i,
      });

      // 计算并发送进度 (25% 到 95%)
      const progress = Math.round(25 + ((i + 1) / totalChunks) * 70);
      self.postMessage({
        type: 'progress',
        progress: progress,
      });

      console.log(
        `Chunk ${i + 1}/${totalChunks} completed, progress: ${progress}%`
      );
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
 * 将 OffscreenCanvas 转换为 Blob
 * @param {OffscreenCanvas} canvas - 要转换的 canvas
 * @param {string} type - 图片类型 (如 'image/jpeg')
 * @param {number} quality - 图片质量 (0-1)
 * @returns {Promise<Blob>} - 转换后的 Blob 对象
 */
async function convertToBlob(canvas, type = 'image/jpeg', quality = 0.9) {
  return await canvas.convertToBlob({
    type: type,
    quality: quality,
  });
}
