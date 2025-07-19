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
    
    if (!file instanceof File) {
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
    
    // TODO: 在后续任务中实现图片处理逻辑
    // 目前仅发送确认消息
    self.postMessage({
      type: 'progress',
      progress: 0
    });
    
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      type: 'error',
      message: `Worker processing error: ${error.message}`
    });
  }
}; 