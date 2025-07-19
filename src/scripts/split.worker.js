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
self.onmessage = function(event) {
  try {
    const { file, splitHeight } = event.data;
    
    // 参数验证
    if (!file) {
      self.postMessage({
        type: 'error',
        message: 'No file provided'
      });
      return;
    }
    
    if (!(file instanceof File)) {
      self.postMessage({
        type: 'error',
        message: 'Invalid file object provided'
      });
      return;
    }
    
    if (!splitHeight || typeof splitHeight !== 'number' || splitHeight <= 0) {
      self.postMessage({
        type: 'error',
        message: 'Invalid splitHeight provided. Must be a positive number.'
      });
      return;
    }
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      self.postMessage({
        type: 'error',
        message: 'File must be an image'
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
      message: `Worker processing error: ${error.message}`
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
      progress: 0
    });

    console.log('Starting image processing...');
    
    // 使用 createImageBitmap 解码图片
    console.log('Decoding image with createImageBitmap...');
    const imageBitmap = await createImageBitmap(file);
    
    console.log(`Image decoded successfully. Dimensions: ${imageBitmap.width} x ${imageBitmap.height}`);
    
    // 创建 OffscreenCanvas 并设置其尺寸与原图一致
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    
    console.log(`OffscreenCanvas created with dimensions: ${canvas.width} x ${canvas.height}`);
    
    // 将图片位图绘制到 OffscreenCanvas 上
    ctx.drawImage(imageBitmap, 0, 0);
    
    console.log('Image bitmap drawn to OffscreenCanvas successfully');
    
    // 验证 OffscreenCanvas 尺寸与原图一致
    console.log(`Verification - OffscreenCanvas: ${canvas.width} x ${canvas.height}, Original: ${imageBitmap.width} x ${imageBitmap.height}`);
    
    if (canvas.width === imageBitmap.width && canvas.height === imageBitmap.height) {
      console.log('✅ OffscreenCanvas dimensions match original image');
    } else {
      console.error('❌ OffscreenCanvas dimensions do not match original image');
    }
    
    // 更新进度到 25% (图片解码和绘制完成)
    self.postMessage({
      type: 'progress',
      progress: 25
    });
    
    // 释放 imageBitmap 资源
    imageBitmap.close();
    
  } catch (error) {
    console.error('Error in processImage:', error);
    self.postMessage({
      type: 'error',
      message: `Image processing error: ${error.message}`
    });
  }
} 