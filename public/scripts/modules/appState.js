// 应用状态管理模块
// 管理整个应用的状态，包括 Worker、Blob 数据、用户选择等

/**
 * 初始化应用状态管理器
 */
function initializeAppState() {
  // 统一的应用状态管理器，整合所有状态变量
  const appState = {
    // Worker 相关状态
    worker: null,
    blobs: [],           // 存储 Worker 生成的切片 Blob 对象
    objectUrls: [],      // 存储临时 Object URL，用于内存管理
    
    // 现有状态（保持向后兼容）
    originalImage: null,
    imageSlices: [],     // 保留现有的图片数据结构
    selectedSlices: new Set(), // 用户选择的切片索引
    
    // 处理状态
    isProcessing: false,
    
    // 元数据
    splitHeight: 1200,
    fileName: "分割结果"
  };

  return appState;
}

/**
 * 清理之前会话的所有资源
 * @param {Object} appState - 应用状态对象
 */
function cleanupPreviousSession(appState) {
  console.log('[AppState] 开始清理之前的会话资源...');
  
  // 释放所有 Object URLs
  appState.objectUrls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
      console.log('[AppState] 已释放 Object URL:', url.substring(0, 50) + '...');
    } catch (error) {
      console.warn('[AppState] 释放 Object URL 失败:', error);
    }
  });
  
  // 清空状态数组
  appState.blobs = [];
  appState.objectUrls = [];
  appState.imageSlices = [];
  appState.selectedSlices.clear();
  
  // 终止现有 Worker
  if (appState.worker) {
    try {
      appState.worker.terminate();
      console.log('[AppState] 已终止现有 Worker');
    } catch (error) {
      console.warn('[AppState] 终止 Worker 失败:', error);
    }
    appState.worker = null;
  }
  
  // 重置处理状态
  appState.isProcessing = false;
  
  console.log('[AppState] 会话清理完成');
}

/**
 * 更新应用状态，保持数据同步
 * @param {Object} appState - 应用状态对象
 * @param {Object} updates - 要更新的状态字段
 */
function updateAppState(appState, updates) {
  Object.assign(appState, updates);
  console.log('[AppState] 状态已更新:', updates);
}

/**
 * 获取当前应用状态的快照（用于调试）
 * @param {Object} appState - 应用状态对象
 */
function getAppStateSnapshot(appState) {
  return {
    hasOriginalImage: !!appState.originalImage,
    blobsCount: appState.blobs.length,
    objectUrlsCount: appState.objectUrls.length,
    imageSlicesCount: appState.imageSlices.length,
    selectedSlicesCount: appState.selectedSlices.size,
    isProcessing: appState.isProcessing,
    hasWorker: !!appState.worker,
    splitHeight: appState.splitHeight,
    fileName: appState.fileName
  };
}

// 暴露函数到全局作用域
window.initializeAppState = initializeAppState;
window.cleanupPreviousSession = cleanupPreviousSession;
window.updateAppState = updateAppState;
window.getAppStateSnapshot = getAppStateSnapshot;