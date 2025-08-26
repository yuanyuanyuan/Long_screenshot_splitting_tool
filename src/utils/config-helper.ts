/**
 * 配置助手工具
 * 提供在应用中使用配置的便捷方法
 */

import { config, configUtils } from '../../config';

/**
 * 获取静态资源URL
 * @param assetPath 资源路径
 * @returns 完整的资源URL
 */
export function getAssetUrl(assetPath: string): string {
  return configUtils.getAssetUrl(assetPath);
}

/**
 * 获取路由URL
 * @param routePath 路由路径
 * @returns 完整的路由URL
 */
export function getRouteUrl(routePath: string): string {
  return configUtils.getRouteUrl(routePath);
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return config.environment.isProduction;
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return config.environment.isDevelopment;
}

/**
 * 获取API基础URL
 */
export function getApiBaseUrl(): string {
  return config.environment.apiBaseUrl;
}

/**
 * 检查是否启用调试模式
 */
export function isDebugEnabled(): boolean {
  return config.environment.debug;
}

/**
 * 获取应用基础路径
 */
export function getBasePath(): string {
  return config.deployment.basePath;
}

/**
 * 检查是否为GitHub Pages部署
 */
export function isGitHubPages(): boolean {
  return config.deployment.githubPages.enabled;
}

/**
 * 动态导入资源的辅助函数
 * 确保动态导入的资源也使用正确的路径
 */
export async function dynamicImport(modulePath: string): Promise<any> {
  try {
    // 如果是相对路径，使用配置的基础路径
    const fullPath = modulePath.startsWith('./') || modulePath.startsWith('../') 
      ? modulePath 
      : getAssetUrl(modulePath);
    
    return await import(/* @vite-ignore */ fullPath);
  } catch (error) {
    console.error(`Failed to dynamically import module: ${modulePath}`, error);
    throw error;
  }
}

/**
 * 创建完整的URL（用于fetch等网络请求）
 */
export function createFullUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  const baseUrl = window.location.origin;
  const basePath = getBasePath();
  
  return `${baseUrl}${basePath}${path}`.replace(/\/+/g, '/');
}