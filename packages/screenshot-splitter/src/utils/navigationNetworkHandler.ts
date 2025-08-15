/**
 * 导航网络错误处理器
 * 处理网络错误和导航失败的情况
 */

import { NavigationError, NavigationErrorType } from './navigationErrorHandler';

// 网络错误类型
export enum NetworkErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  UPLOAD_FAILED = 'UPLOAD_FAILED'
}

// 网络错误接口
export interface NetworkError extends NavigationError {
  networkType: NetworkErrorType;
  statusCode?: number;
  retryCount?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// 网络状态接口
export interface NetworkState {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// 重试配置
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: NetworkErrorType[];
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    NetworkErrorType.CONNECTION_FAILED,
    NetworkErrorType.TIMEOUT,
    NetworkErrorType.SERVER_ERROR
  ]
};

/**
 * 导航网络处理器类
 */
export class NavigationNetworkHandler {
  private retryConfig: RetryConfig;
  private networkState: NetworkState;
  private retryAttempts: Map<string, number> = new Map();
  private pendingRequests: Map<string, AbortController> = new Map();

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.networkState = this.getNetworkState();
    
    this.initNetworkMonitoring();
  }

  /**
   * 初始化网络监控
   */
  private initNetworkMonitoring() {
    // 监听在线/离线状态
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);

    // 监听网络连接变化（如果支持）
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', this.handleConnectionChange);
      }
    }
  }

  /**
   * 处理在线状态变化
   */
  private handleOnlineStatusChange = () => {
    this.networkState.isOnline = navigator.onLine;
    
    if (this.networkState.isOnline) {
      // 网络恢复，重试失败的请求
      this.retryFailedRequests();
    } else {
      // 网络断开，取消所有待处理的请求
      this.cancelAllRequests();
    }
  };

  /**
   * 处理网络连接变化
   */
  private handleConnectionChange = () => {
    this.networkState = this.getNetworkState();
  };

  /**
   * 获取当前网络状态
   */
  private getNetworkState(): NetworkState {
    const state: NetworkState = {
      isOnline: navigator.onLine
    };

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        state.connectionType = connection.type;
        state.effectiveType = connection.effectiveType;
        state.downlink = connection.downlink;
        state.rtt = connection.rtt;
      }
    }

    return state;
  }

  /**
   * 执行网络请求，带重试机制
   */
  async executeWithRetry<T>(
    requestId: string,
    requestFn: (signal?: AbortSignal) => Promise<T>,
    options: {
      timeout?: number;
      retryConfig?: Partial<RetryConfig>;
      onRetry?: (attempt: number, error: NetworkError) => void;
    } = {}
  ): Promise<T> {
    const config = { ...this.retryConfig, ...options.retryConfig };
    const timeout = options.timeout || 30000;
    
    let lastError: NetworkError | null = null;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // 检查网络状态
        if (!this.networkState.isOnline) {
          throw this.createNetworkError(
            NetworkErrorType.CONNECTION_FAILED,
            'Network is offline',
            { requestId, attempt }
          );
        }

        // 创建AbortController用于超时控制
        const abortController = new AbortController();
        this.pendingRequests.set(requestId, abortController);

        // 设置超时
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, timeout);

        try {
          const result = await requestFn(abortController.signal);
          
          // 请求成功，清理资源
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          this.retryAttempts.delete(requestId);
          
          return result;
        } catch (error) {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          
          if (abortController.signal.aborted) {
            throw this.createNetworkError(
              NetworkErrorType.TIMEOUT,
              'Request timeout',
              { requestId, attempt, timeout }
            );
          }
          
          throw error;
        }
      } catch (error) {
        lastError = this.normalizeError(error, requestId, attempt);
        
        // 检查是否应该重试
        if (attempt < config.maxRetries && this.shouldRetry(lastError, config)) {
          this.retryAttempts.set(requestId, attempt + 1);
          
          // 调用重试回调
          if (options.onRetry) {
            options.onRetry(attempt + 1, lastError);
          }
          
          // 计算延迟时间
          const delay = this.calculateRetryDelay(attempt, config);
          await this.delay(delay);
          
          continue;
        }
        
        // 不再重试，抛出错误
        this.retryAttempts.delete(requestId);
        throw lastError;
      }
    }
    
    throw lastError;
  }

  /**
   * 创建网络错误
   */
  private createNetworkError(
    networkType: NetworkErrorType,
    message: string,
    context: any = {}
  ): NetworkError {
    return {
      type: NavigationErrorType.NAVIGATION_FAILED,
      networkType,
      message,
      currentPath: context.currentPath || '',
      timestamp: Date.now(),
      retryCount: this.retryAttempts.get(context.requestId) || 0,
      maxRetries: this.retryConfig.maxRetries
    } as NetworkError;
  }

  /**
   * 标准化错误
   */
  private normalizeError(error: any, requestId: string, attempt: number): NetworkError {
    if (error.type === 'NETWORK_ERROR') {
      return error;
    }

    let networkType = NetworkErrorType.CONNECTION_FAILED;
    let message = error.message || 'Unknown network error';
    let statusCode: number | undefined;

    if (error.name === 'AbortError') {
      networkType = NetworkErrorType.TIMEOUT;
      message = 'Request was aborted';
    } else if (error.status) {
      statusCode = error.status;
      if (error.status >= 500) {
        networkType = NetworkErrorType.SERVER_ERROR;
      } else if (error.status === 404) {
        networkType = NetworkErrorType.RESOURCE_NOT_FOUND;
      } else if (error.status >= 400) {
        networkType = NetworkErrorType.PROCESSING_FAILED;
      }
    }

    return this.createNetworkError(networkType, message, {
      requestId,
      attempt,
      statusCode,
      originalError: error
    });
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: NetworkError, config: RetryConfig): boolean {
    return config.retryableErrors.includes(error.networkType);
  }

  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重试失败的请求
   */
  private retryFailedRequests() {
    // 这里可以实现重试逻辑，比如重新发起之前失败的导航请求
    console.log('Network restored, retrying failed requests...');
  }

  /**
   * 取消所有待处理的请求
   */
  private cancelAllRequests() {
    this.pendingRequests.forEach((controller, requestId) => {
      controller.abort();
      console.log(`Cancelled request: ${requestId}`);
    });
    this.pendingRequests.clear();
  }

  /**
   * 处理图片上传错误
   */
  async handleImageUpload(
    file: File,
    uploadFn: (file: File, signal?: AbortSignal) => Promise<any>
  ): Promise<any> {
    const requestId = `upload-${Date.now()}`;
    
    try {
      return await this.executeWithRetry(
        requestId,
        (signal) => uploadFn(file, signal),
        {
          timeout: 60000, // 上传超时时间更长
          onRetry: (attempt, error) => {
            console.log(`Upload retry attempt ${attempt}:`, error.message);
          }
        }
      );
    } catch (error) {
      const networkError = error as NetworkError;
      
      // 处理上传特定的错误
      if (networkError.networkType === NetworkErrorType.TIMEOUT) {
        throw this.createNetworkError(
          NetworkErrorType.UPLOAD_FAILED,
          '图片上传超时，请检查网络连接或尝试上传更小的图片',
          { originalError: error }
        );
      }
      
      throw error;
    }
  }

  /**
   * 处理图片处理错误
   */
  async handleImageProcessing(
    processingFn: (signal?: AbortSignal) => Promise<any>
  ): Promise<any> {
    const requestId = `processing-${Date.now()}`;
    
    try {
      return await this.executeWithRetry(
        requestId,
        processingFn,
        {
          timeout: 120000, // 处理超时时间更长
          retryConfig: {
            maxRetries: 2, // 处理失败重试次数较少
            retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.SERVER_ERROR]
          },
          onRetry: (attempt, error) => {
            console.log(`Processing retry attempt ${attempt}:`, error.message);
          }
        }
      );
    } catch (error) {
      const networkError = error as NetworkError;
      
      if (networkError.networkType === NetworkErrorType.TIMEOUT) {
        throw this.createNetworkError(
          NetworkErrorType.PROCESSING_FAILED,
          '图片处理超时，请尝试上传更小的图片或稍后重试',
          { originalError: error }
        );
      }
      
      throw error;
    }
  }

  /**
   * 获取网络状态
   */
  getNetworkStatus(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * 获取重试统计
   */
  getRetryStats(): { [requestId: string]: number } {
    const stats: { [requestId: string]: number } = {};
    this.retryAttempts.forEach((count, requestId) => {
      stats[requestId] = count;
    });
    return stats;
  }

  /**
   * 清理资源
   */
  destroy() {
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.removeEventListener('change', this.handleConnectionChange);
      }
    }
    
    this.cancelAllRequests();
    this.retryAttempts.clear();
  }
}

// 导出单例实例
export const navigationNetworkHandler = new NavigationNetworkHandler();