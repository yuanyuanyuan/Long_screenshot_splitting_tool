/**
 * 环境配置
 * 统一管理不同环境下的配置参数
 */

export type Environment = 'development' | 'production' | 'test';

export interface EnvironmentConfig {
  /** 当前环境 */
  env: Environment;
  /** 是否为生产环境 */
  isProduction: boolean;
  /** 是否为开发环境 */
  isDevelopment: boolean;
  /** 是否为测试环境 */
  isTest: boolean;
  /** API 基础URL */
  apiBaseUrl: string;
  /** 是否启用调试模式 */
  debug: boolean;
  /** 是否启用源码映射 */
  sourcemap: boolean;
  /** 构建相关配置 */
  build: {
    /** 是否压缩代码 */
    minify: boolean;
    /** 是否生成报告 */
    generateReport: boolean;
    /** 是否启用代码分割 */
    codeSplitting: boolean;
  };
}

/**
 * 获取当前环境
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment;
  return env || 'development';
}

/**
 * 获取环境配置
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';
  const isTest = env === 'test';

  return {
    env,
    isProduction,
    isDevelopment,
    isTest,
    
    // API 配置
    apiBaseUrl: process.env.VITE_API_BASE_URL || (isProduction ? '/api' : 'http://localhost:3001/api'),
    
    // 调试配置
    debug: isDevelopment || process.env.VITE_DEBUG === 'true',
    sourcemap: isDevelopment || process.env.VITE_SOURCEMAP === 'true',
    
    // 构建配置
    build: {
      minify: isProduction,
      generateReport: process.env.VITE_BUILD_REPORT === 'true',
      codeSplitting: isProduction,
    },
  };
}

// 导出默认配置
export const environmentConfig = getEnvironmentConfig();