/**
 * 导航错误处理机制
 * 处理导航相关的错误、状态不一致、缺少前置条件等情况
 */

import type { AppState } from '../types';

// 导航错误类型
export enum NavigationErrorType {
  MISSING_IMAGE = 'MISSING_IMAGE',
  MISSING_SLICES = 'MISSING_SLICES',
  INVALID_STATE = 'INVALID_STATE',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  STATE_CORRUPTION = 'STATE_CORRUPTION'
}

// 导航错误接口
export interface NavigationError {
  type: NavigationErrorType;
  message: string;
  currentPath: string;
  expectedState?: Partial<AppState>;
  actualState?: Partial<AppState>;
  timestamp: number;
  recoveryAction?: string;
}

// 错误恢复策略
export interface RecoveryStrategy {
  redirectTo: string;
  clearState?: boolean;
  showMessage?: boolean;
  messageKey?: string;
}

// 导航错误处理器类
export class NavigationErrorHandler {
  private errorHistory: NavigationError[] = [];
  private maxHistorySize = 50;
  private onError?: (error: NavigationError) => void;
  private onRecovery?: (strategy: RecoveryStrategy) => void;

  constructor(
    onError?: (error: NavigationError) => void,
    onRecovery?: (strategy: RecoveryStrategy) => void
  ) {
    this.onError = onError;
    this.onRecovery = onRecovery;
  }

  /**
   * 验证导航状态
   */
  validateNavigationState(
    currentPath: string,
    appState: AppState
  ): NavigationError | null {
    const hasOriginalImage = !!appState.originalImage;
    const hasImageSlices = appState.imageSlices.length > 0;
    const hasSelectedSlices = appState.selectedSlices.size > 0;

    switch (currentPath) {
      case '/split':
        if (!hasOriginalImage) {
          return this.createError(
            NavigationErrorType.MISSING_IMAGE,
            'navigation.error.missingImage',
            currentPath,
            { originalImage: 'required' },
            { originalImage: hasOriginalImage }
          );
        }
        if (!hasImageSlices) {
          return this.createError(
            NavigationErrorType.MISSING_SLICES,
            'navigation.error.missingSlices',
            currentPath,
            { imageSlices: 'required' },
            { imageSlices: appState.imageSlices.length }
          );
        }
        break;

      case '/export':
        if (!hasOriginalImage || !hasImageSlices) {
          return this.createError(
            NavigationErrorType.MISSING_IMAGE,
            'navigation.error.missingImage',
            currentPath,
            { originalImage: 'required', imageSlices: 'required' },
            { originalImage: hasOriginalImage, imageSlices: appState.imageSlices.length }
          );
        }
        if (!hasSelectedSlices) {
          return this.createError(
            NavigationErrorType.MISSING_SLICES,
            'navigation.error.missingSlices',
            currentPath,
            { selectedSlices: 'required' },
            { selectedSlices: appState.selectedSlices.size }
          );
        }
        break;
    }

    return null;
  }

  /**
   * 处理导航错误
   */
  handleNavigationError(error: NavigationError): RecoveryStrategy {
    // 记录错误
    this.recordError(error);

    // 触发错误回调
    if (this.onError) {
      this.onError(error);
    }

    // 确定恢复策略
    const strategy = this.determineRecoveryStrategy(error);

    // 触发恢复回调
    if (this.onRecovery) {
      this.onRecovery(strategy);
    }

    return strategy;
  }

  /**
   * 处理处理错误（图片处理失败等）
   */
  handleProcessingError(
    currentPath: string,
    error: Error,
    appState: AppState
  ): RecoveryStrategy {
    const navigationError = this.createError(
      NavigationErrorType.PROCESSING_ERROR,
      'navigation.error.processingFailed',
      currentPath,
      undefined,
      { isProcessing: appState.isProcessing },
      error.message
    );

    return this.handleNavigationError(navigationError);
  }

  /**
   * 处理状态损坏
   */
  handleStateCorruption(
    currentPath: string,
    reason: string
  ): RecoveryStrategy {
    const error = this.createError(
      NavigationErrorType.STATE_CORRUPTION,
      'navigation.error.stateCorruption',
      currentPath,
      undefined,
      undefined,
      reason
    );

    return this.handleNavigationError(error);
  }

  /**
   * 检查是否需要重置状态
   */
  shouldResetState(errorType: NavigationErrorType): boolean {
    const resetTypes = [
      NavigationErrorType.STATE_CORRUPTION,
      NavigationErrorType.INVALID_STATE
    ];
    return resetTypes.includes(errorType);
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(): NavigationError[] {
    return [...this.errorHistory];
  }

  /**
   * 清除错误历史
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * 获取最近的错误
   */
  getLastError(): NavigationError | null {
    return this.errorHistory.length > 0 
      ? this.errorHistory[this.errorHistory.length - 1] 
      : null;
  }

  /**
   * 检查是否有重复错误
   */
  hasRepeatedError(errorType: NavigationErrorType, threshold = 3): boolean {
    const recentErrors = this.errorHistory
      .slice(-threshold)
      .filter(error => error.type === errorType);
    
    return recentErrors.length >= threshold;
  }

  private createError(
    type: NavigationErrorType,
    messageKey: string,
    currentPath: string,
    expectedState?: any,
    actualState?: any,
    details?: string
  ): NavigationError {
    return {
      type,
      message: messageKey,
      currentPath,
      expectedState,
      actualState,
      timestamp: Date.now(),
      recoveryAction: details
    };
  }

  private recordError(error: NavigationError): void {
    this.errorHistory.push(error);
    
    // 限制历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }

    // 在开发环境中输出错误信息
    if (import.meta.env.DEV) {
      console.warn('[NavigationErrorHandler] 导航错误:', error);
    }
  }

  private determineRecoveryStrategy(error: NavigationError): RecoveryStrategy {
    switch (error.type) {
      case NavigationErrorType.MISSING_IMAGE:
        return {
          redirectTo: '/upload',
          showMessage: true,
          messageKey: 'navigation.error.missingImage'
        };

      case NavigationErrorType.MISSING_SLICES:
        if (error.currentPath === '/export') {
          return {
            redirectTo: '/split',
            showMessage: true,
            messageKey: 'navigation.error.missingSlices'
          };
        }
        return {
          redirectTo: '/upload',
          showMessage: true,
          messageKey: 'navigation.error.missingImage'
        };

      case NavigationErrorType.PROCESSING_ERROR:
        return {
          redirectTo: '/upload',
          showMessage: true,
          messageKey: 'navigation.error.processingFailed'
        };

      case NavigationErrorType.STATE_CORRUPTION:
      case NavigationErrorType.INVALID_STATE:
        return {
          redirectTo: '/',
          clearState: true,
          showMessage: true,
          messageKey: 'navigation.error.invalidState'
        };

      case NavigationErrorType.NAVIGATION_FAILED:
      default:
        return {
          redirectTo: '/',
          showMessage: true,
          messageKey: 'navigation.error.navigationFailed'
        };
    }
  }
}

// 创建全局错误处理器实例
export const navigationErrorHandler = new NavigationErrorHandler();

// 导出便捷函数
export function validateNavigation(currentPath: string, appState: AppState) {
  return navigationErrorHandler.validateNavigationState(currentPath, appState);
}

export function handleNavigationError(error: NavigationError) {
  return navigationErrorHandler.handleNavigationError(error);
}

export function handleProcessingError(currentPath: string, error: Error, appState: AppState) {
  return navigationErrorHandler.handleProcessingError(currentPath, error, appState);
}

export function handleStateCorruption(currentPath: string, reason: string) {
  return navigationErrorHandler.handleStateCorruption(currentPath, reason);
}