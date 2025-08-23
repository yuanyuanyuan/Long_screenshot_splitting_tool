# 部署指南

本文档详细介绍了单模式构建Monorepo系统的部署流程和最佳实践。

## 📋 目录

- [部署概述](#部署概述)
- [GitHub Pages部署](#github-pages部署)
- [手动部署](#手动部署)
- [多环境部署](#多环境部署)
- [部署监控](#部署监控)
- [故障排除](#故障排除)

## 🚀 部署概述

### 支持的部署方式
- **GitHub Pages**: 自动化部署（推荐）
- **手动部署**: 本地构建后手动上传
- **其他平台**: Vercel、Netlify等

### 部署架构
```
GitHub Repository
├── main分支 → 自动部署到生产环境
├── develop分支 → 自动部署到测试环境
└── feature分支 → 手动部署到预览环境
```

## 🔄 GitHub Pages部署

### 1. 初始设置

#### 1.1 启用GitHub Pages
1. 进入仓库设置页面
2. 滚动到 "Pages" 部分
3. Source选择 "GitHub Actions"
4. 保存设置

#### 1.2 配置仓库权限
确保GitHub Actions有写入权限：
1. 进入 Settings → Actions → General
2. 在 "Workflow permissions" 中选择 "Read and write permissions"
3. 勾选 "Allow GitHub Actions to create and approve pull requests"

### 2. 自动部署流程

#### 2.1 触发条件
- 推送到 `main` 分支
- 创建新的Release
- 手动触发（workflow_dispatch）

#### 2.2 部署步骤
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run tests
        run: pnpm test
        
      - name: Build SPA mode
        run: pnpm build
        
      - name: Configure assets base URL
        run: |
          if [ -n \"${{ secrets.ASSETS_BASE_URL }}\" ]; then
            echo \"VITE_ASSETS_BASE_URL=${{ secrets.ASSETS_BASE_URL }}\" >> $GITHUB_ENV
          fi
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 3. 部署配置

#### 3.1 环境变量配置
在仓库设置中配置以下环境变量：

```bash
# 必需的环境变量
GITHUB_TOKEN=<自动生成>

# 可选的环境变量
NODE_ENV=production
BUILD_MODE=spa
DEPLOY_TARGET=github-pages
```

#### 3.2 部署配置文件
```javascript
// deploy.config.js
module.exports = {
  // GitHub Pages配置
  githubPages: {
    enabled: true,
    branch: 'gh-pages',
    directory: 'dist',
    cname: 'your-domain.com', // 可选：自定义域名
  },
  
  // 构建配置
  build: {
    spa: {
      enabled: true,
      outputDir: 'dist'
    }
  },
  
  // 组件配置
  components: {
    'screenshot-splitter': {
      enabled: true,
      path: '/screenshot-splitter/',
      spa: true
    }
  },
  
  // 资源配置
  assets: {
    baseUrl: process.env.VITE_ASSETS_BASE_URL || '',
    cdn: {
      enabled: false,
      domain: 'cdn.example.com',
      paths: {
        js: '/js/',
        css: '/css/',
        images: '/images/'
      }
    }
  }
};
```

## 🛠️ 手动部署

### 1. 本地构建
```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建所有组件
pnpm build

# 验证构建结果
pnpm preview
```

### 2. 部署到GitHub Pages
```bash
# 使用内置部署脚本
pnpm deploy

# 或者手动部署
gh-pages -d dist
```

### 3. 部署到其他平台

#### 3.1 Vercel部署
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### 3.2 Netlify部署
```bash
# 安装Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod --dir=dist
```

## 🌍 多环境部署

### 1. 环境配置

#### 1.1 开发环境
```bash
# 启动开发服务器
pnpm dev

# 访问地址
http://localhost:5173
```

#### 1.2 测试环境
```bash
# 构建测试版本
NODE_ENV=staging pnpm build

# 部署到测试环境
pnpm deploy:staging
```

#### 1.3 生产环境
```bash
# 构建生产版本
NODE_ENV=production pnpm build

# 部署到生产环境
pnpm deploy:production
```

### 2. 环境变量管理

#### 2.1 环境文件
```bash
# .env.development
NODE_ENV=development
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=开发环境

# .env.staging
NODE_ENV=staging
VITE_API_URL=https://api-staging.example.com
VITE_APP_TITLE=测试环境

# .env.production
NODE_ENV=production
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=生产环境
```

#### 2.2 动态配置
```javascript
// vite.config.js
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      __APP_ENV__: JSON.stringify(env.NODE_ENV),
      __API_URL__: JSON.stringify(env.VITE_API_URL),
    },
    // ...其他配置
  };
});
```

## 📊 部署监控

### 1. 健康检查

#### 1.1 自动生成健康检查页面
```bash
# 生成健康检查页面
node tools/build-scripts/health-check-generator.js
```

#### 1.2 健康检查端点
- 主应用: `/health.html`
- 组件: `/screenshot-splitter/health.html`
- API状态: `/api/health`

### 2. 部署监控

#### 2.1 部署状态监控
```bash
# 启动部署监控
node tools/build-scripts/deploy-monitor.js
```

#### 2.2 监控指标
- 部署成功率
- 部署时间
- 构建大小
- 页面加载时间

### 3. 错误监控

#### 3.1 自动错误收集
```javascript
// 错误监控配置
window.addEventListener('error', (event) => {
  // 收集错误信息
  const errorInfo = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // 发送错误报告
  sendErrorReport(errorInfo);
});
```

#### 3.2 性能监控
```javascript
// 性能监控
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  
  const metrics = {
    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
    firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
    firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
  };
  
  // 发送性能数据
  sendPerformanceData(metrics);
});
```

## 🔧 部署优化

### 1. 构建优化

#### 1.1 代码分割
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'dayjs']
        }
      }
    }
  }
});
```

#### 1.2 资源压缩
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
});
```

### 2. 缓存策略

#### 2.1 浏览器缓存
```javascript
// 设置缓存头
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000', // 1年
  'ETag': generateETag(content),
  'Last-Modified': new Date().toUTCString()
};
```

#### 2.2 CDN缓存
```javascript
// CDN配置
const cdnConfig = {
  domain: 'cdn.example.com',
  paths: {
    assets: '/assets/',
    images: '/images/',
    fonts: '/fonts/'
  },
  cache: {
    maxAge: 86400, // 24小时
    staleWhileRevalidate: 3600 // 1小时
  }
};
```

## 🚨 故障排除

### 1. 常见部署问题

#### 1.1 构建失败
```bash
# 问题：依赖安装失败
# 解决：清理缓存重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 问题：TypeScript类型错误
# 解决：检查类型定义
pnpm type-check

# 问题：内存不足
# 解决：增加内存限制
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

#### 1.2 部署失败
```bash
# 问题：GitHub Pages部署失败
# 解决：检查权限设置
# 1. 确认Actions权限
# 2. 检查分支保护规则
# 3. 验证GITHUB_TOKEN

# 问题：文件大小超限
# 解决：优化构建产物
pnpm build:optimize
```

#### 1.3 运行时错误
```bash
# 问题：页面无法加载
# 解决：检查路径配置
# 1. 确认base路径设置
# 2. 检查资源路径
# 3. 验证路由配置

# 问题：组件无法访问
# 解决：检查组件配置
# 1. 验证组件路由
# 2. 检查构建输出
# 3. 确认部署路径
```

### 2. 调试工具

#### 2.1 部署日志
```bash
# 查看GitHub Actions日志
# 1. 进入Actions页面
# 2. 选择失败的workflow
# 3. 查看详细日志

# 本地调试部署
DEBUG=1 pnpm deploy
```

#### 2.2 性能分析
```bash
# 分析构建产物
pnpm analyze

# 检查页面性能
# 使用浏览器开发者工具
# 1. Network面板检查资源加载
# 2. Performance面板分析性能
# 3. Lighthouse检查优化建议
```

### 3. 回滚策略

#### 3.1 自动回滚
```bash
# 部署失败自动回滚
node tools/build-scripts/deploy-rollback.js
```

#### 3.2 手动回滚
```bash
# 回滚到上一个版本
git revert HEAD
git push origin main

# 回滚到指定版本
git reset --hard <commit-hash>
git push --force origin main
```

## 📚 最佳实践

### 1. 部署前检查清单
- [ ] 代码通过所有测试
- [ ] 构建成功无错误
- [ ] 性能指标符合要求
- [ ] 安全扫描通过
- [ ] 文档更新完整

### 2. 部署流程规范
1. **开发阶段**: 功能开发和单元测试
2. **集成阶段**: 集成测试和代码审查
3. **预发布**: 在测试环境验证
4. **发布**: 部署到生产环境
5. **监控**: 监控部署状态和性能

### 3. 安全考虑
- 使用HTTPS部署
- 设置适当的CSP头
- 定期更新依赖
- 监控安全漏洞

---

**需要帮助？** 查看 [故障排除指南](TROUBLESHOOTING.md) 或 [提交Issue](https://github.com/your-username/Long_screenshot_splitting_tool/issues)