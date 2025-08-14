/**
 * 路由Hook - 提供路由状态管理和导航功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RouterState, 
  RouteConfig, 
  RouterEvent, 
  RouteGuard,
  routerConfig,
  matchRoute,
  parseParams,
  parseQuery,
  buildUrl
} from '../router';
import { navigationNetworkHandler, NetworkError, NetworkErrorType } from '../utils/navigationNetworkHandler';

// 路由事件监听器
type RouterEventListener = (event: RouterEvent) => void;

// 路由管理器类
class RouterManager {
  private state: RouterState;
  private listeners: Map<string, RouterEventListener[]> = new Map();
  private guards: RouteGuard[] = [];
  private stateListeners: Set<(state: RouterState) => void> = new Set();
  private debounceTimer: number | null = null;
  private pendingNavigation: { path: string; addToHistory: boolean } | null = null;
  private isNavigating: boolean = false;
  private navigationQueue: Array<{ type: 'push' | 'replace'; path: string; query?: Record<string, string>; timestamp: number }> = [];

  constructor() {
    this.state = {
      currentPath: this.getCurrentPath(),
      currentRoute: null,
      params: {},
      query: {},
      history: []
    };

    this.init();
  }

  private init() {
    // 初始化路由
    this.updateRoute(this.state.currentPath, false);

    // 监听浏览器导航事件
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('popstate', this.handlePopState);
    
    // 监听页面卸载事件
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  private getCurrentPath(): string {
    if (routerConfig.mode === 'hash') {
      return window.location.hash.slice(1) || '/';
    } else {
      return window.location.pathname;
    }
  }

  private handleHashChange = () => {
    const newPath = this.getCurrentPath();
    this.debouncedUpdateRoute(newPath, false);
  };

  private handlePopState = (event: PopStateEvent) => {
    const path = this.getCurrentPath();
    this.debouncedUpdateRoute(path, false);
  };

  // 处理页面卸载事件
  private handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // 如果有未完成的导航，清理队列
    if (this.isNavigating || this.navigationQueue.length > 0) {
      this.navigationQueue = [];
      this.isNavigating = false;
    }
  };

  // 防抖函数
  private debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
    return ((...args: any[]) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = window.setTimeout(() => func(...args), delay);
    }) as T;
  }

  // 防抖更新路由
  private debouncedUpdateRoute = this.debounce((path: string, isPush: boolean) => {
    this.updateRoute(path, isPush);
  }, 100);

  private updateRoute(path: string, addToHistory: boolean = true) {
    const currentRoute = this.state.currentRoute;
    const newRoute = matchRoute(path, routerConfig.routes);
    
    if (!newRoute) {
      // 路由不存在，重定向到fallback
      if (routerConfig.fallback && path !== routerConfig.fallback) {
        this.push(routerConfig.fallback);
        return;
      }
    }

    // 执行路由守卫
    if (this.guards.length > 0 && newRoute) {
      let guardIndex = 0;
      const runGuards = () => {
        if (guardIndex >= this.guards.length) {
          // 所有守卫通过，继续路由
          this.completeRouteUpdate(path, newRoute, currentRoute, addToHistory);
          return;
        }

        const guard = this.guards[guardIndex];
        guardIndex++;

        guard(newRoute, currentRoute, (next) => {
          if (next === false) {
            // 守卫拒绝，停止路由
            return;
          } else if (typeof next === 'string') {
            // 重定向到其他路径
            this.push(next);
            return;
          } else {
            // 继续下一个守卫
            runGuards();
          }
        });
      };

      runGuards();
    } else {
      this.completeRouteUpdate(path, newRoute, currentRoute, addToHistory);
    }
  }

  private completeRouteUpdate(
    path: string, 
    newRoute: RouteConfig | null, 
    currentRoute: RouteConfig | null,
    addToHistory: boolean
  ) {
    // 触发beforeRouteChange事件
    this.emit('beforeRouteChange', {
      type: 'beforeRouteChange',
      from: currentRoute,
      to: newRoute,
      path
    });

    // 解析参数
    const params = newRoute ? parseParams(path, newRoute.path) : {};
    const query = parseQuery(window.location.search);

    // 更新状态
    const newState: RouterState = {
      currentPath: path,
      currentRoute: newRoute,
      params,
      query,
      history: addToHistory 
        ? [...this.state.history, path].slice(-50) // 保留最近50条历史
        : this.state.history
    };

    this.state = newState;

    // 更新页面标题
    if (newRoute?.meta?.title) {
      document.title = newRoute.meta.title;
    }

    // 通知状态监听器
    this.stateListeners.forEach(listener => listener(newState));

    // 触发afterRouteChange事件
    this.emit('afterRouteChange', {
      type: 'afterRouteChange',
      from: currentRoute,
      to: newRoute,
      path,
      params,
      query
    });

    // 完成导航，处理队列中的下一个请求
    this.isNavigating = false;
    
    if (this.navigationQueue.length > 0) {
      const nextNavigation = this.navigationQueue.shift()!;
      this.isNavigating = true;
      
      // 执行下一个导航请求
      setTimeout(() => {
        if (nextNavigation.type === 'push') {
          this.push(nextNavigation.path, nextNavigation.query);
        } else if (nextNavigation.type === 'replace') {
          this.replace(nextNavigation.path, nextNavigation.query);
        }
      }, 10);
    }
  }

  // 导航方法
  push(path: string, query?: Record<string, string>) {
    // 如果正在导航，加入队列
    if (this.isNavigating) {
      this.navigationQueue.push({
        type: 'push',
        path,
        query,
        timestamp: Date.now()
      });
      return;
    }

    this.isNavigating = true;
    const url = buildUrl(path, query);
    
    if (routerConfig.mode === 'hash') {
      window.location.hash = url;
    } else {
      window.history.pushState(null, '', routerConfig.base + url);
      this.debouncedUpdateRoute(path, true);
    }
  }

  replace(path: string, query?: Record<string, string>) {
    // 如果正在导航，加入队列
    if (this.isNavigating) {
      this.navigationQueue.push({
        type: 'replace',
        path,
        query,
        timestamp: Date.now()
      });
      return;
    }

    this.isNavigating = true;
    const url = buildUrl(path, query);
    
    if (routerConfig.mode === 'hash') {
      window.location.replace(window.location.pathname + window.location.search + '#' + url);
    } else {
      window.history.replaceState(null, '', routerConfig.base + url);
      this.debouncedUpdateRoute(path, false);
    }
  }

  go(delta: number) {
    window.history.go(delta);
  }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  // 事件系统
  on(event: string, listener: RouterEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: RouterEventListener) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: RouterEvent) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  // 路由守卫
  beforeEach(guard: RouteGuard) {
    this.guards.push(guard);
  }

  // 状态订阅
  subscribe(listener: (state: RouterState) => void) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // 获取当前状态
  getState(): RouterState {
    return { ...this.state };
  }

  // 清理方法
  // 处理导航网络错误
  async handleNavigationWithNetworkRetry(
    path: string, 
    addToHistory: boolean = true,
    options: {
      timeout?: number;
      maxRetries?: number;
      onRetry?: (attempt: number, error: NetworkError) => void;
    } = {}
  ): Promise<void> {
    const requestId = `navigation-${path}-${Date.now()}`;
    
    try {
      await navigationNetworkHandler.executeWithRetry(
        requestId,
        async (signal) => {
          // 模拟可能的网络操作（如预加载资源）
          if (signal?.aborted) {
            throw new Error('Navigation aborted');
          }
          
          // 执行实际的路由更新
          this.updateRoute(path, addToHistory);
          
          return Promise.resolve();
        },
        {
          timeout: options.timeout || 5000,
          retryConfig: {
            maxRetries: options.maxRetries || 2,
            retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.CONNECTION_FAILED]
          },
          onRetry: options.onRetry
        }
      );
    } catch (error) {
      const networkError = error as NetworkError;
      
      // 处理导航失败
      this.handleNavigationFailure(networkError, path);
      throw error;
    }
  }

  // 处理导航失败
  private handleNavigationFailure(error: NetworkError, targetPath: string) {
    console.error('Navigation failed:', error);
    
    // 触发导航错误事件
    this.emit('navigationError', {
      type: 'navigationError',
      error,
      targetPath,
      currentPath: this.state.currentPath
    } as any);
    
    // 根据错误类型决定处理策略
    switch (error.networkType) {
      case NetworkErrorType.CONNECTION_FAILED:
        // 网络连接失败，保持当前状态
        console.warn('Network connection failed, staying on current page');
        break;
        
      case NetworkErrorType.TIMEOUT:
        // 超时，可以尝试重新导航
        console.warn('Navigation timeout, you may try again');
        break;
        
      default:
        // 其他错误，记录日志
        console.error('Unknown navigation error:', error);
    }
  }

  // 增强的push方法，支持网络重试
  async pushWithRetry(path: string, query?: Record<string, string>, options?: {
    timeout?: number;
    maxRetries?: number;
    onRetry?: (attempt: number, error: NetworkError) => void;
  }): Promise<void> {
    // 如果正在导航，加入队列
    if (this.isNavigating) {
      this.navigationQueue.push({
        type: 'push',
        path,
        query,
        timestamp: Date.now()
      });
      return;
    }

    this.isNavigating = true;
    const url = buildUrl(path, query);
    
    try {
      if (routerConfig.mode === 'hash') {
        window.location.hash = url;
        // Hash模式下直接更新，不需要网络重试
        this.debouncedUpdateRoute(path, true);
      } else {
        window.history.pushState(null, '', routerConfig.base + url);
        // History模式下使用网络重试
        await this.handleNavigationWithNetworkRetry(path, true, options);
      }
    } catch (error) {
      this.isNavigating = false;
      throw error;
    }
  }

  // 增强的replace方法，支持网络重试
  async replaceWithRetry(path: string, query?: Record<string, string>, options?: {
    timeout?: number;
    maxRetries?: number;
    onRetry?: (attempt: number, error: NetworkError) => void;
  }): Promise<void> {
    // 如果正在导航，加入队列
    if (this.isNavigating) {
      this.navigationQueue.push({
        type: 'replace',
        path,
        query,
        timestamp: Date.now()
      });
      return;
    }

    this.isNavigating = true;
    const url = buildUrl(path, query);
    
    try {
      if (routerConfig.mode === 'hash') {
        window.location.replace(window.location.pathname + window.location.search + '#' + url);
        this.debouncedUpdateRoute(path, false);
      } else {
        window.history.replaceState(null, '', routerConfig.base + url);
        await this.handleNavigationWithNetworkRetry(path, false, options);
      }
    } catch (error) {
      this.isNavigating = false;
      throw error;
    }
  }

  // 获取网络状态
  getNetworkStatus() {
    return navigationNetworkHandler.getNetworkStatus();
  }

  // 清理方法
  destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.listeners.clear();
    this.guards.length = 0;
    this.stateListeners.clear();
    this.navigationQueue = [];
    this.isNavigating = false;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // 清理网络处理器
    navigationNetworkHandler.destroy();
  }
}

// 全局路由管理器实例
const routerManager = new RouterManager();

// 路由Hook
export function useRouter() {
  const [state, setState] = useState<RouterState>(routerManager.getState());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 订阅状态变化
    unsubscribeRef.current = routerManager.subscribe(setState);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const push = useCallback((path: string, query?: Record<string, string>) => {
    routerManager.push(path, query);
  }, []);

  const replace = useCallback((path: string, query?: Record<string, string>) => {
    routerManager.replace(path, query);
  }, []);

  const go = useCallback((delta: number) => {
    routerManager.go(delta);
  }, []);

  const back = useCallback(() => {
    routerManager.back();
  }, []);

  const forward = useCallback(() => {
    routerManager.forward();
  }, []);

  const pushWithRetry = useCallback(async (path: string, query?: Record<string, string>, options?: {
    timeout?: number;
    maxRetries?: number;
    onRetry?: (attempt: number, error: any) => void;
  }) => {
    return routerManager.pushWithRetry(path, query, options);
  }, []);

  const replaceWithRetry = useCallback(async (path: string, query?: Record<string, string>, options?: {
    timeout?: number;
    maxRetries?: number;
    onRetry?: (attempt: number, error: any) => void;
  }) => {
    return routerManager.replaceWithRetry(path, query, options);
  }, []);

  const getNetworkStatus = useCallback(() => {
    return routerManager.getNetworkStatus();
  }, []);

  return {
    // 状态
    currentPath: state.currentPath,
    currentRoute: state.currentRoute,
    params: state.params,
    query: state.query,
    history: state.history,
    
    // 导航方法
    push,
    replace,
    pushWithRetry,
    replaceWithRetry,
    go,
    back,
    forward,
    
    // 工具方法
    isActive: (path: string) => state.currentPath === path,
    buildUrl,
    getNetworkStatus
  };
}

// 路由事件Hook
export function useRouterEvents() {
  const addListener = useCallback((event: string, listener: RouterEventListener) => {
    routerManager.on(event, listener);
  }, []);

  const removeListener = useCallback((event: string, listener: RouterEventListener) => {
    routerManager.off(event, listener);
  }, []);

  return { addListener, removeListener };
}

// 路由守卫Hook
export function useRouterGuard(guard: RouteGuard) {
  useEffect(() => {
    routerManager.beforeEach(guard);
  }, [guard]);
}

export default routerManager;