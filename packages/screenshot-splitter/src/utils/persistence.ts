// 状态持久化工具

export interface PersistableState {
  splitHeight: number;
  fileName: string;
  language?: string;
}

const STORAGE_KEY = 'screenshot-splitter-state';

/**
 * 保存状态到 localStorage
 */
export function saveState(state: PersistableState): void {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.warn('[Persistence] 保存状态失败:', error);
  }
}

/**
 * 从 localStorage 加载状态
 */
export function loadState(): PersistableState | null {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.warn('[Persistence] 加载状态失败:', error);
    return null;
  }
}

/**
 * 清除保存的状态
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[Persistence] 清除状态失败:', error);
  }
}

/**
 * 检查是否支持 localStorage
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * 创建防抖的保存函数
 */
export function createDebouncedSave(delay: number = 500) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function debouncedSave(state: PersistableState) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      saveState(state);
      timeoutId = null;
    }, delay);
  };
}