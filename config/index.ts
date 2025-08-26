/**
 * 统一配置入口
 * 导出所有配置模块，提供统一的配置访问接口
 */

// 导入所有配置模块
import { defaultAppConfig, getAppConfig, type AppConfig } from './app/app.config';
import { routeConfig, navigationConfig, getRouteConfig, type RouteConfig, type NavigationConfig } from './app/routing.config';
import { 
  deploymentConfig, 
  getDeploymentConfig, 
  getAssetUrl, 
  getRouteUrl,
  type DeploymentConfig 
} from './build/deployment.config';
import { 
  environmentConfig, 
  getEnvironmentConfig, 
  getCurrentEnvironment,
  type Environment,
  type EnvironmentConfig 
} from './env/environment.config';
import { 
  APP_INFO,
  SUPPORTED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  UI_CONSTANTS,
  SPLIT_CONSTANTS,
  EXPORT_FORMATS,
  QUALITY_SETTINGS,
  STORAGE_KEYS,
  EVENT_NAMES,
  ERROR_CODES,
  HTTP_STATUS,
  REGEX_PATTERNS
} from './constants/app.constants';

// 重新导出所有配置
export { defaultAppConfig as appConfig, getAppConfig, type AppConfig } from './app/app.config';
export { routeConfig, navigationConfig, getRouteConfig, type RouteConfig, type NavigationConfig } from './app/routing.config';
export { 
  deploymentConfig, 
  getDeploymentConfig, 
  getAssetUrl, 
  getRouteUrl,
  type DeploymentConfig 
} from './build/deployment.config';
export { 
  environmentConfig, 
  getEnvironmentConfig, 
  getCurrentEnvironment,
  type Environment,
  type EnvironmentConfig 
} from './env/environment.config';
export { 
  APP_INFO,
  SUPPORTED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  UI_CONSTANTS,
  SPLIT_CONSTANTS,
  EXPORT_FORMATS,
  QUALITY_SETTINGS,
  STORAGE_KEYS,
  EVENT_NAMES,
  ERROR_CODES,
  HTTP_STATUS,
  REGEX_PATTERNS
} from './constants/app.constants';

/**
 * 统一配置对象
 * 提供应用运行时需要的所有配置
 */
export const config = {
  app: defaultAppConfig,
  routing: routeConfig,
  navigation: navigationConfig,
  deployment: deploymentConfig,
  environment: environmentConfig,
  constants: {
    APP_INFO,
    SUPPORTED_FILE_TYPES,
    FILE_SIZE_LIMITS,
    UI_CONSTANTS,
    SPLIT_CONSTANTS,
    EXPORT_FORMATS,
    QUALITY_SETTINGS,
    STORAGE_KEYS,
    EVENT_NAMES,
    ERROR_CODES,
    HTTP_STATUS,
    REGEX_PATTERNS,
  },
} as const;

/**
 * 配置工具函数
 */
export const configUtils = {
  getAssetUrl,
  getRouteUrl,
  getEnvironmentConfig,
  getDeploymentConfig,
  getCurrentEnvironment,
  getAppConfig,
  getRouteConfig,
} as const;

// 默认导出统一配置
export default config;