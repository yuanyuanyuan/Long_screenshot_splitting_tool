/**
 * 应用配置
 * 定义应用的基本信息和功能开关
 */

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
  features: {
    i18n: boolean;
    debug: boolean;
    analytics: boolean;
    seo: boolean;
    performance: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-CN' | 'en' | 'auto';
    showDebugPanel: boolean;
  };
  export: {
    formats: string[];
    defaultFormat: string;
    maxFileSize: number; // MB
  };
}

/**
 * 默认应用配置
 */
export const defaultAppConfig: AppConfig = {
  name: 'Long Screenshot Splitter',
  version: '1.0.0',
  environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development',
  features: {
    i18n: true,
    debug: process.env.NODE_ENV === 'development',
    analytics: process.env.NODE_ENV === 'production',
    seo: true,
    performance: true,
  },
  ui: {
    theme: 'auto',
    language: 'auto',
    showDebugPanel: process.env.NODE_ENV === 'development',
  },
  export: {
    formats: ['png', 'jpg', 'pdf', 'zip'],
    defaultFormat: 'png',
    maxFileSize: 50, // 50MB
  },
};

/**
 * 获取应用配置
 */
export function getAppConfig(): AppConfig {
  return {
    ...defaultAppConfig,
    // 可以在这里添加运行时配置覆盖逻辑
  };
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return getAppConfig().features[feature];
}

/**
 * 获取应用版本信息
 */
export function getAppVersion(): string {
  return getAppConfig().version;
}

/**
 * 获取应用名称
 */
export function getAppName(): string {
  return getAppConfig().name;
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return getAppConfig().environment === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return getAppConfig().environment === 'production';
}

/**
 * 检查是否为测试环境
 */
export function isTest(): boolean {
  return getAppConfig().environment === 'test';
}