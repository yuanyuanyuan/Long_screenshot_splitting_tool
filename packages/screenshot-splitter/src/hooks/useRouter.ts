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

// 路由事件监听器
type RouterEventListener = (event: RouterEvent) => void;

// 路由管理器类
class RouterManager {
  private state: RouterState;
  private listeners: Map<string, RouterEventListener[]> = new Map();
  private guards: RouteGuard[] = [];
  private stateListeners: Set<(state: RouterState) => void> = new Set();

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
    this.updateRoute(newPath, false);
  };

  private handlePopState = () => {
    const newPath = this.getCurrentPath();
    this.updateRoute(newPath, false);
  };

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
  }

  // 导航方法
  push(path: string, query?: Record<string, string>) {
    const url = buildUrl(path, query);
    
    if (routerConfig.mode === 'hash') {
      window.location.hash = url;
    } else {
      window.history.pushState(null, '', routerConfig.base + url);
      this.updateRoute(path, true);
    }
  }

  replace(path: string, query?: Record<string, string>) {
    const url = buildUrl(path, query);
    
    if (routerConfig.mode === 'hash') {
      window.location.replace(window.location.pathname + window.location.search + '#' + url);
    } else {
      window.history.replaceState(null, '', routerConfig.base + url);
      this.updateRoute(path, false);
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

  // 销毁
  destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    window.removeEventListener('popstate', this.handlePopState);
    this.listeners.clear();
    this.guards.length = 0;
    this.stateListeners.clear();
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
    go,
    back,
    forward,
    
    // 工具方法
    isActive: (path: string) => state.currentPath === path,
    buildUrl
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