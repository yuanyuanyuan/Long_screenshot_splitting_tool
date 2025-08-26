/**
 * 生产环境配置
 */

export const productionConfig = {
  // 应用配置
  app: {
    name: 'Long Screenshot Splitter',
    debug: false,
    logLevel: 'error',
  },

  // API配置
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.screenshot-splitter.com',
    timeout: 30000,
    retries: 5,
  },

  // 功能开关
  features: {
    analytics: true,
    errorReporting: true,
    performanceMonitoring: true,
    hotReload: false,
    devTools: false,
  },

  // 构建配置
  build: {
    sourcemap: false,
    minify: true,
    optimization: true,
    bundleAnalyzer: false,
  },

  // 服务器配置
  server: {
    port: 80,
    host: '0.0.0.0',
    https: true,
    cors: false,
  },

  // 存储配置
  storage: {
    type: 'localStorage',
    prefix: 'screenshot-splitter',
  },

  // 日志配置
  logging: {
    level: 'error',
    console: false,
    file: true,
  },

  // 性能配置
  performance: {
    enableServiceWorker: true,
    enableCaching: true,
    preloadCriticalResources: true,
  },

  // 安全配置
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
  },
};

export default productionConfig;