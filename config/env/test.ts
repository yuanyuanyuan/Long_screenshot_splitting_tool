/**
 * 测试环境配置
 */

export const testConfig = {
  // 应用配置
  app: {
    name: 'Long Screenshot Splitter (Test)',
    debug: true,
    logLevel: 'warn',
  },

  // API配置
  api: {
    baseUrl: 'http://localhost:3001',
    timeout: 5000,
    retries: 1,
  },

  // 功能开关
  features: {
    analytics: false,
    errorReporting: false,
    performanceMonitoring: false,
    hotReload: false,
    devTools: true,
  },

  // 构建配置
  build: {
    sourcemap: true,
    minify: false,
    optimization: false,
    bundleAnalyzer: false,
  },

  // 服务器配置
  server: {
    port: 3002,
    host: 'localhost',
    https: false,
    cors: true,
  },

  // 存储配置
  storage: {
    type: 'memory',
    prefix: 'screenshot-splitter-test',
  },

  // 日志配置
  logging: {
    level: 'warn',
    console: true,
    file: false,
  },

  // 测试配置
  testing: {
    timeout: 10000,
    retries: 3,
    parallel: false,
    coverage: true,
  },

  // Mock配置
  mocks: {
    api: true,
    storage: true,
    analytics: true,
  },
};

export default testConfig;