// 应用状态管理模块
// 集中管理应用的全局状态

/**
 * 初始化应用状态
 * @returns {Object} 应用状态对象
 */
export function initializeAppState() {
  const appState = {
    originalImage: null,
    imageSlices: [],
    selectedSlices: new Set(),
    isProcessing: false,
    currentPreviewIndex: 0
  };
  
  console.log('[AppState] 应用状态已初始化');
  return appState;
}

/**
 * 清理上一次会话的数据
 * @param {Object} appState - 应用状态对象
 */
export function cleanupPreviousSession(appState) {
  appState.originalImage = null;
  appState.imageSlices = [];
  appState.selectedSlices.clear();
  appState.isProcessing = false;
  appState.currentPreviewIndex = 0;
  
  console.log('[AppState] 上一次会话数据已清理');
}

/**
 * 更新应用状态
 * @param {Object} appState - 应用状态对象
 * @param {Object} updates - 要更新的状态
 */
export function updateAppState(appState, updates) {
  Object.assign(appState, updates);
  console.log('[AppState] 状态已更新:', updates);
}

/**
 * 获取应用状态快照
 * @param {Object} appState - 应用状态对象
 * @returns {Object} 状态快照
 */
export function getAppStateSnapshot(appState) {
  return {
    hasOriginalImage: !!appState.originalImage,
    slicesCount: appState.imageSlices.length,
    selectedCount: appState.selectedSlices.size,
    isProcessing: appState.isProcessing,
    currentPreviewIndex: appState.currentPreviewIndex
  };
}