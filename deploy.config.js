/**
 * 多目标部署配置文件
 * 定义主应用和各组件的部署策略
 */

export default {
  // 主应用配置
  mainApp: {
    name: 'component-library',
    buildMode: 'spa',
    deployPath: '/',
    customDomain: null,
    description: '组件库主页，展示所有可用组件'
  },

  // 组件配置
  components: [
    {
      name: 'screenshot-splitter',
      buildMode: 'both', // 支持SPA和单文件两种模式
      deployPath: '/screenshot-splitter',
      independentDeploy: true,
      description: '长截图分割工具',
      features: ['图片处理', '自动分割', '手动调整'],
      demoUrl: '/screenshot-splitter/',
      singleFileUrl: '/screenshot-splitter/screenshot-splitter.html',
      sourceUrl: 'https://github.com/awesome-tools/tree/main/packages/screenshot-splitter',
      documentationUrl: '/docs/screenshot-splitter'
    },
    {
      name: 'shared-components',
      buildMode: 'spa',
      deployPath: '/shared-components',
      independentDeploy: false,
      description: '共享组件库',
      features: ['组件通信', '状态管理', '生命周期管理'],
      sourceUrl: 'https://github.com/awesome-tools/tree/main/packages/shared-components',
      documentationUrl: '/docs/shared-components'
    }
  ],

  // GitHub Pages配置
  githubPages: {
    branch: 'gh-pages',
    cname: null, // 如果有自定义域名，在这里设置
    baseUrl: '', // 将在运行时自动检测
    generate404Page: true, // 是否生成404页面
    robotsTxt: true // 是否生成robots.txt
  },

  // 构建优化配置
  buildOptimization: {
    // 单文件HTML最大大小限制（字节）
    maxSingleFileSize: 5 * 1024 * 1024, // 5MB
    
    // 是否启用构建缓存
    enableCache: true,
    
    // 是否压缩输出
    compress: true,
    
    // 是否生成source map
    sourceMap: false
  },

  // 部署策略
  deployStrategy: {
    // 部署前是否运行测试
    runTests: true,
    
    // 部署前是否运行代码检查
    runLint: true,
    
    // 是否生成部署报告
    generateReport: true,
    
    // 部署失败时是否自动回滚
    autoRollback: false,
    
    // 部署成功后是否发送通知
    notifications: {
      success: true,
      failure: true,
      channels: ['console'] // 可扩展为 email, slack 等
    }
  },

  // 环境配置
  environments: {
    development: {
      baseUrl: 'http://localhost:8080',
      apiEndpoint: 'http://localhost:3000/api'
    },
    staging: {
      baseUrl: 'https://staging.your-domain.com',
      apiEndpoint: 'https://staging-api.your-domain.com'
    },
    production: {
      baseUrl: 'https://your-username.github.io/awesome-tools',
      apiEndpoint: 'https://api.your-domain.com'
    }
  },

  // 监控和分析
  monitoring: {
    // 是否启用性能监控
    performance: true,
    
    // 是否启用错误追踪
    errorTracking: true,
    
    // 是否启用用户分析
    analytics: false,
    
    // 健康检查端点
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 300000 // 5分钟
    }
  }
};