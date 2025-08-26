/**
 * 路由配置
 * 定义应用的路由结构和导航配置
 */

export interface RouteConfig {
  path: string;
  name: string;
  component?: string;
  title: string;
  description?: string;
  meta?: {
    requiresAuth?: boolean;
    showInNav?: boolean;
    icon?: string;
  };
}

/**
 * 应用路由配置
 */
export const routeConfig: RouteConfig[] = [
  {
    path: '/',
    name: 'home',
    component: 'ScreenshotSplitter',
    title: '长截图分割工具',
    description: '上传长截图并将其分割为多个部分',
    meta: {
      showInNav: true,
      icon: 'scissors',
    },
  },
  {
    path: '/about',
    name: 'about',
    title: '关于',
    description: '关于长截图分割工具',
    meta: {
      showInNav: true,
      icon: 'info',
    },
  },
  {
    path: '/help',
    name: 'help',
    title: '帮助',
    description: '使用帮助和常见问题',
    meta: {
      showInNav: true,
      icon: 'help',
    },
  },
];

/**
 * 导航配置
 */
export interface NavigationConfig {
  showNavigation: boolean;
  position: 'top' | 'bottom' | 'side';
  style: 'tabs' | 'buttons' | 'menu';
  routes: RouteConfig[];
}

export const navigationConfig: NavigationConfig = {
  showNavigation: true,
  position: 'top',
  style: 'tabs',
  routes: routeConfig.filter(route => route.meta?.showInNav),
};

/**
 * 获取路由配置
 */
export function getRouteConfig(): RouteConfig[] {
  return routeConfig;
}

/**
 * 根据路径获取路由
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return routeConfig.find(route => route.path === path);
}

/**
 * 根据名称获取路由
 */
export function getRouteByName(name: string): RouteConfig | undefined {
  return routeConfig.find(route => route.name === name);
}

/**
 * 获取导航配置
 */
export function getNavigationConfig(): NavigationConfig {
  return navigationConfig;
}

/**
 * 获取页面标题
 */
export function getPageTitle(path: string): string {
  const route = getRouteByPath(path);
  return route?.title || '长截图分割工具';
}

/**
 * 获取页面描述
 */
export function getPageDescription(path: string): string {
  const route = getRouteByPath(path);
  return route?.description || '上传长截图并将其分割为多个部分';
}