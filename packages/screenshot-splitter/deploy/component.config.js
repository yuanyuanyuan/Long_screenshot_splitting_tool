/**
 * 长截图分割工具组件配置
 * 用于定义组件的元数据、构建配置和部署设置
 */

export const componentConfig = {
  // 基础信息
  name: 'screenshot-splitter',
  displayName: '长截图分割工具',
  version: '1.0.0',
  description: '智能分割长截图的工具，支持自动检测分割点、手动调整、批量处理等功能',
  
  // 构建配置
  build: {
    // SPA模式配置
    spa: {
      outDir: 'dist',
      base: './',
      format: 'es',
      target: 'es2015',
      sourcemap: false,
      minify: true
    },
    
    // 单文件模式配置
    single: {
      outDir: 'dist-single',
      base: './',
      inlineCSS: true,
      inlineJS: true,
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: true
    }
  },
  
  // 部署配置
  deploy: {
    // GitHub Pages配置
    githubPages: {
      enabled: true,
      branch: 'gh-pages',
      folder: 'dist',
      customDomain: null
    },
    
    // 独立部署路径
    paths: {
      spa: '/',
      single: '/components/screenshot-splitter/',
      standalone: '/screenshot-splitter/'
    }
  },
  
  // 功能特性
  features: {
    // 支持的语言
    i18n: ['zh-CN', 'en'],
    
    // 主要功能
    capabilities: [
      'image-upload',
      'auto-split-detection',
      'manual-adjustment',
      'batch-processing',
      'preview-export',
      'drag-drop-support',
      'responsive-design'
    ],
    
    // 技术栈
    techStack: {
      framework: 'React',
      language: 'TypeScript',
      bundler: 'Vite',
      styling: 'CSS Modules',
      testing: 'Vitest'
    }
  },
  
  // 依赖配置
  dependencies: {
    // 外部CDN依赖（单文件模式）
    external: {
      'react': 'https://unpkg.com/react@18/umd/react.production.min.js',
      'react-dom': 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
    },
    
    // 内部依赖
    internal: [
      'html2canvas',
      'dompurify'
    ]
  },
  
  // 环境变量
  env: {
    development: {
      DEBUG: true,
      API_BASE_URL: 'http://localhost:3000'
    },
    production: {
      DEBUG: false,
      API_BASE_URL: 'https://api.example.com'
    }
  },
  
  // 元数据
  meta: {
    author: 'CodeBuddy',
    license: 'MIT',
    repository: 'https://github.com/your-username/dual-build-monorepo-system',
    homepage: 'https://your-username.github.io/dual-build-monorepo-system',
    keywords: ['screenshot', 'image-processing', 'react', 'typescript', 'vite'],
    
    // SEO配置
    seo: {
      title: '长截图分割工具 - 智能图片处理',
      description: '免费在线长截图分割工具，支持自动检测分割点、手动调整、批量处理，无需上传到服务器，保护隐私安全',
      keywords: '长截图分割,图片处理,在线工具,免费,隐私安全',
      ogImage: '/og-image.png'
    }
  }
};

export default componentConfig;