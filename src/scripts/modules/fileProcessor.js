// 文件处理模块
// 管理图片上传、Worker处理、进度更新等功能

import { cleanupPreviousSession, updateAppState } from './appState.js';
import { addThumbnailToList, toggleNewExportButtons } from './previewInterface.js';

/**
 * 处理文件选择
 * @param {Event} e - 文件选择事件
 * @param {Object} appState - 应用状态对象
 */
export function handleFileSelect(e, appState) {
  const file = e.target.files[0];
  if (file && file.type.match("image.*")) {
    loadImage(file, appState);
  }
}

/**
 * 处理拖放事件
 * @param {Event} e - 拖放事件
 */
export function handleDragOver(e) {
  e.preventDefault();
  const dropZone = document.getElementById("dropZone");
  dropZone.classList.add("drag-over");
}

/**
 * 处理拖放离开事件
 */
export function handleDragLeave() {
  const dropZone = document.getElementById("dropZone");
  dropZone.classList.remove("drag-over");
}

/**
 * 处理拖放释放事件
 * @param {Event} e - 拖放释放事件
 * @param {Object} appState - 应用状态对象
 */
export function handleDrop(e, appState) {
  e.preventDefault();
  const dropZone = document.getElementById("dropZone");
  dropZone.classList.remove("drag-over");

  const file = e.dataTransfer.files[0];
  if (file && file.type.match("image.*")) {
    loadImage(file, appState);
  }
}

/**
 * 加载图片
 * @param {File} file - 图片文件
 * @param {Object} appState - 应用状态对象
 */
export function loadImage(file, appState) {
  if (file.size > 50 * 1024 * 1024) {
    alert(window.i18n.t("js.alert.fileTooLarge"));
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      appState.originalImage = img;
      
      const controls = document.getElementById("controls");
      const dropZone = document.getElementById("dropZone");
      const sliceHeightInput = document.getElementById("sliceHeight");
      
      controls.classList.remove("hidden");
      dropZone.style.display = "none";

      // 设置合适的默认分割高度（屏幕高度的80%）
      const defaultHeight = Math.min(
        1200,
        Math.floor(window.innerHeight * 0.8)
      );
      sliceHeightInput.value = defaultHeight;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * 处理图片分割 (使用 Worker 模式)
 * @param {Object} appState - 应用状态对象
 */
export function processImage(appState) {
  if (!appState.originalImage) return;

  const sliceHeightInput = document.getElementById("sliceHeight");
  const fileNameInput = document.getElementById("fileName");
  const sliceHeight = parseInt(sliceHeightInput.value);
  
  if (isNaN(sliceHeight) || sliceHeight < 100 || sliceHeight > 5000) {
    alert(window.i18n.t("js.alert.invalidSliceHeight"));
    return;
  }

  // 1. 执行清理函数：清理之前会话的所有资源
  console.log('[FileProcessor] 开始资源清理...');
  cleanupPreviousSession(appState);

  // 2. 显示进度条容器
  const progressContainer = document.getElementById("progress-container");
  if (progressContainer) {
    progressContainer.classList.remove("hidden");
    console.log('[FileProcessor] 进度条容器已显示');
  }

  // 3. 实例化 Worker 并发送初始化消息
  try {
    // 创建新的 Worker 实例
    appState.worker = new Worker('/src/scripts/split.worker.js');
    console.log('[FileProcessor] Worker 实例已创建');

    // 设置 Worker 消息监听器
    appState.worker.onmessage = function(event) {
      handleWorkerMessage(event, appState);
    };

    // 设置 Worker 错误监听器
    appState.worker.onerror = function(error) {
      console.error('[FileProcessor] Worker 错误:', error);
      alert(`处理过程中发生错误: ${error.message}`);
      
      // 隐藏进度条
      if (progressContainer) {
        progressContainer.classList.add("hidden");
      }
    };

    // 更新应用状态
    updateAppState(appState, {
      isProcessing: true,
      splitHeight: sliceHeight,
      fileName: fileNameInput.value || "分割结果"
    });

    // 创建 File 对象从 originalImage
    const canvas = document.createElement('canvas');
    canvas.width = appState.originalImage.width;
    canvas.height = appState.originalImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(appState.originalImage, 0, 0);

    // 将 canvas 转换为 Blob，然后创建 File 对象
    canvas.toBlob((blob) => {
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      
      // 发送初始化消息给 Worker
      appState.worker.postMessage({
        file: file,
        splitHeight: sliceHeight
      });
      
      console.log('[FileProcessor] 已发送初始化消息给 Worker');
    }, 'image/jpeg', 0.9);

  } catch (error) {
    console.error('[FileProcessor] Worker 初始化失败:', error);
    alert(`初始化处理器失败: ${error.message}`);
    
    // 隐藏进度条
    if (progressContainer) {
      progressContainer.classList.add("hidden");
    }
  }
}

/**
 * 处理 Worker 消息
 * @param {MessageEvent} event - Worker 消息事件
 * @param {Object} appState - 应用状态对象
 */
function handleWorkerMessage(event, appState) {
  const { type, progress, blob, index, message } = event.data;
  
  console.log(`[FileProcessor] 收到 Worker 消息: ${type}`, event.data);
  
  switch (type) {
    case 'progress':
      // 更新进度条宽度样式
      updateProgressBar(progress);
      break;
      
    case 'chunk':
      // 将 blob 存入 appState.blobs，创建缩略图并存储 URL
      handleChunkMessage(blob, index, appState);
      break;
      
    case 'done':
      // 隐藏进度条，显示预览界面，启用导出按钮
      handleProcessingComplete(appState);
      break;
      
    case 'error':
      // 隐藏进度条，显示错误信息
      handleProcessingError(message, appState);
      break;
      
    default:
      console.warn('[FileProcessor] 未知的 Worker 消息类型:', type);
  }
}

/**
 * 更新进度条宽度样式
 * @param {number} progress - 进度百分比 (0-100)
 */
function updateProgressBar(progress) {
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const progressDescription = document.getElementById("progress-description");
  
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
    console.log(`[FileProcessor] 进度条更新至 ${progress}%`);
  }
  
  if (progressText) {
    progressText.textContent = `${progress}%`;
  }
  
  if (progressDescription) {
    if (progress === 0) {
      progressDescription.textContent = "开始处理图片...";
    } else if (progress <= 25) {
      progressDescription.textContent = "正在解码图片...";
    } else if (progress < 95) {
      progressDescription.textContent = "正在分割图片...";
    } else if (progress < 100) {
      progressDescription.textContent = "即将完成...";
    } else {
      progressDescription.textContent = "处理完成！";
    }
  }
}

/**
 * 处理切片消息：存储 blob 并创建缩略图
 * @param {Blob} blob - 图片切片的 Blob 对象
 * @param {number} index - 切片索引
 * @param {Object} appState - 应用状态对象
 */
function handleChunkMessage(blob, index, appState) {
  // 将 blob 存入 appState.blobs
  appState.blobs[index] = blob;
  
  // 创建 Object URL 并存储
  const imageUrl = URL.createObjectURL(blob);
  appState.objectUrls[index] = imageUrl;
  
  // 调用预览界面模块的函数创建缩略图
  addThumbnailToList({ blob, index }, appState);
  
  console.log(`[FileProcessor] 处理切片 ${index + 1}，Blob存储完成，缩略图已添加`);
}

/**
 * 处理处理完成消息：隐藏进度条，显示预览界面，启用导出按钮
 * @param {Object} appState - 应用状态对象
 */
function handleProcessingComplete(appState) {
  console.log('[FileProcessor] 图片处理完成，更新UI...');
  
  // 1. 隐藏进度条
  const progressContainer = document.getElementById("progress-container");
  if (progressContainer) {
    progressContainer.classList.add("hidden");
    console.log('[FileProcessor] 进度条已隐藏');
  }
  
  // 2. 显示预览界面 (#preview-section)
  const newPreviewSection = document.getElementById('preview-section');
  if (newPreviewSection) {
    newPreviewSection.classList.remove('hidden');
    console.log('[FileProcessor] 新预览界面已显示');
  }
  
  // 3. 启用导出按钮（新预览界面的按钮）
  toggleNewExportButtons(true);
  
  // 4. 更新应用状态
  updateAppState(appState, {
    isProcessing: false
  });
  
  console.log('[FileProcessor] UI更新完成，用户可以预览和导出');
}

/**
 * 处理错误消息：隐藏进度条，显示错误信息
 * @param {string} errorMessage - 错误信息
 * @param {Object} appState - 应用状态对象
 */
function handleProcessingError(errorMessage, appState) {
  console.error('[FileProcessor] Worker 处理错误:', errorMessage);
  
  // 1. 隐藏进度条
  const progressContainer = document.getElementById("progress-container");
  if (progressContainer) {
    progressContainer.classList.add("hidden");
    console.log('[FileProcessor] 进度条已隐藏（由于错误）');
  }
  
  // 2. 显示错误信息
  alert(`图片处理失败: ${errorMessage}`);
  
  // 3. 更新应用状态
  updateAppState(appState, {
    isProcessing: false
  });
  
  console.log('[FileProcessor] 错误处理完成');
} 