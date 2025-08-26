/**
 * 开发环境配置
 */

export const developmentConfig = {
  // 应用配置
  app: {
    name: 'Long Screenshot Splitter (Dev)',
    debug: true,
    logLevel: 'debug',
  },

  // API配置
  api: {
    baseUrl: 'http://localhost:3001',
    timeout: 10000,
    retries: 3,
  },

  // 功能开关
  features: {
    analytics: false,
    errorReporting: false,
    performanceMonitoring: true,
    hotReload: true,
    devTools: true,
  },

  // 构建配置
  build: {
    sourcemap: true,
    minify: false,
    optimization: false,
    bundleAnalyzer: true,
  },

  // 服务器配置
  server: {
    port: 3000,
    host: 'localhost',
    https: false,
    cors: true,
  },

  // 存储配置
  storage: {
    type: 'localStorage',
    prefix: 'screenshot-splitter-dev',
  },

  // 日志配置
  logging: {
    level: 'debug',
    console: true,
    file: false,
  },
};

export default developmentConfig;