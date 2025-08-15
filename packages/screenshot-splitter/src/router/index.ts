/**
 * 长截图分割工具独立路由系统
 * 支持独立URL访问和浏览器导航
 */

import React from 'react';

export interface RouteConfig {
  path: string;
  name: string;
  component: React.ComponentType;
  meta?: {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
    keepAlive?: boolean;
  };
}

export interface RouterConfig {
  mode: 'hash' | 'history';
  base: string;
  routes: RouteConfig[];
  fallback?: string;
}

// 路由状态管理
export interface RouterState {
  currentPath: string;
  currentRoute: RouteConfig | null;
  params: Record<string, string>;
  query: Record<string, string>;
  history: string[];
}

// 路由事件类型
export type RouterEventType = 'beforeRouteChange' | 'afterRouteChange' | 'routeError';

export interface RouterEvent {
  type: RouterEventType;
  from?: RouteConfig | null;
  to: RouteConfig | null;
  path: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

// 路由守卫类型
export type RouteGuard = (
  to: RouteConfig,
  from: RouteConfig | null,
  next: (path?: string | boolean) => void
) => void;

// 简单的App组件占位符，避免循环导入
const AppPlaceholder: React.FC = () => {
  return React.createElement('div', { id: 'app-placeholder' }, 'Loading...');
};

// 获取构建模式，在single模式下使用history模式而不是hash模式
declare const __BUILD_MODE__: string;
const BUILD_MODE = typeof __BUILD_MODE__ !== 'undefined' ? __BUILD_MODE__ : 'spa';
const isSingleMode = BUILD_MODE === 'singlefile';

// 导出路由配置
export const routerConfig: RouterConfig = {
  mode: isSingleMode ? 'history' : 'hash', // single模式使用history模式，spa模式兼容GitHub Pages使用hash模式
  base: '/',
  fallback: '/',
  routes: [
    {
      path: '/',
      name: 'home',
      component: AppPlaceholder,
      meta: {
        title: 'header.title',
        description: 'header.subtitle'
      }
    },
    {
      path: '/upload',
      name: 'upload',
      component: AppPlaceholder,
      meta: {
        title: 'upload.pageTitle',
        description: 'upload.pageDescription'
      }
    },
    {
      path: '/split',
      name: 'split',
      component: AppPlaceholder,
      meta: {
        title: 'split.pageTitle',
        description: 'split.pageDescription'
      }
    },
    {
      path: '/export',
      name: 'export',
      component: AppPlaceholder,
      meta: {
        title: 'export.pageTitle',
        description: 'export.pageDescription'
      }
    }
  ]
};

// 路径匹配工具
export function matchRoute(path: string, routes: RouteConfig[]): RouteConfig | null {
  // 移除hash前缀
  const cleanPath = path.replace(/^#/, '');
  
  // 精确匹配
  const exactMatch = routes.find(route => route.path === cleanPath);
  if (exactMatch) return exactMatch;
  
  // 参数匹配（简单实现）
  for (const route of routes) {
    if (route.path.includes(':')) {
      const routeSegments = route.path.split('/');
      const pathSegments = cleanPath.split('/');
      
      if (routeSegments.length === pathSegments.length) {
        const isMatch = routeSegments.every((segment, index) => {
          return segment.startsWith(':') || segment === pathSegments[index];
        });
        
        if (isMatch) return route;
      }
    }
  }
  
  return null;
}

// 解析路径参数
export function parseParams(path: string, routePath: string): Record<string, string> {
  const params: Record<string, string> = {};
  const cleanPath = path.replace(/^#/, '');
  
  const routeSegments = routePath.split('/');
  const pathSegments = cleanPath.split('/');
  
  routeSegments.forEach((segment, index) => {
    if (segment.startsWith(':')) {
      const paramName = segment.slice(1);
      params[paramName] = pathSegments[index] || '';
    }
  });
  
  return params;
}

// 解析查询参数
export function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  const params = new URLSearchParams(search);
  
  params.forEach((value, key) => {
    query[key] = value;
  });
  
  return query;
}

// 构建URL
export function buildUrl(path: string, query?: Record<string, string>): string {
  let url = path;
  
  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams(query);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
}