/**
 * 环境配置加载器
 * 根据当前环境加载对应的配置
 */

import developmentConfig from './development';
import productionConfig from './production';
import testConfig from './test';

export type Environment = 'development' | 'production' | 'test';

export interface EnvironmentConfig {
  app: {
    name: string;
    debug: boolean;
    logLevel: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    analytics: boolean;
    errorReporting: boolean;
    performanceMonitoring: boolean;
    hotReload: boolean;
    devTools: boolean;
  };
  build: {
    sourcemap: boolean;
    minify: boolean;
    optimization: boolean;
    bundleAnalyzer: boolean;
  };
  server: {
    port: number;
    host: string;
    https: boolean;
    cors: boolean;
  };
  storage: {
    type: string;
    prefix: string;
  };
  logging: {
    level: string;
    console: boolean;
    file: boolean;
  };
  [key: string]: any;
}

/**
 * 环境配置映射
 */
const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  development: developmentConfig,
  production: productionConfig,
  test: testConfig,
};

/**
 * 获取当前环境
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment;
  return env && env in environmentConfigs ? env : 'development';
}

/**
 * 获取环境配置
 */
export function getEnvironmentConfig(env?: Environment): EnvironmentConfig {
  const environment = env || getCurrentEnvironment();
  return environmentConfigs[environment];
}

/**
 * 获取当前环境配置
 */
export function getCurrentConfig(): EnvironmentConfig {
  return getEnvironmentConfig();
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * 检查是否为测试环境
 */
export function isTest(): boolean {
  return getCurrentEnvironment() === 'test';
}

/**
 * 获取API基础URL
 */
export function getApiBaseUrl(): string {
  return getCurrentConfig().api.baseUrl;
}

/**
 * 获取应用名称
 */
export function getAppName(): string {
  return getCurrentConfig().app.name;
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  return getCurrentConfig().features[feature];
}

/**
 * 获取日志级别
 */
export function getLogLevel(): string {
  return getCurrentConfig().logging.level;
}

/**
 * 验证环境配置
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): boolean {
  const requiredKeys = ['app', 'api', 'features', 'build', 'server', 'storage', 'logging'];
  
  for (const key of requiredKeys) {
    if (!(key in config)) {
      console.error(`Missing required config key: ${key}`);
      return false;
    }
  }
  
  return true;
}

// 导出配置
export { developmentConfig, productionConfig, testConfig };
export default getCurrentConfig();