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

// 导出路由配置
export const routerConfig: RouterConfig = {
  mode: 'hash', // 使用hash模式，兼容GitHub Pages
  base: '/',
  fallback: '/',
  routes: [
    {
      path: '/',
      name: 'home',
      component: AppPlaceholder,
      meta: {
        title: '长截图分割工具',
        description: '智能分割长截图，支持自动检测和手动调整'
      }
    },
    {
      path: '/upload',
      name: 'upload',
      component: AppPlaceholder,
      meta: {
        title: '上传图片 - 长截图分割工具',
        description: '上传需要分割的长截图'
      }
    },
    {
      path: '/split',
      name: 'split',
      component: AppPlaceholder,
      meta: {
        title: '分割设置 - 长截图分割工具',
        description: '设置分割参数和预览效果'
      }
    },
    {
      path: '/export',
      name: 'export',
      component: AppPlaceholder,
      meta: {
        title: '导出结果 - 长截图分割工具',
        description: '下载分割后的图片'
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