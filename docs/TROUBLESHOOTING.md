# 故障排除指南

本文档提供了单模式构建Monorepo系统常见问题的解决方案和调试技巧。

## 📋 目录

- [安装和环境问题](#安装和环境问题)
- [构建问题](#构建问题)
- [部署问题](#部署问题)
- [运行时问题](#运行时问题)
- [性能问题](#性能问题)
- [调试技巧](#调试技巧)

## 🔧 安装和环境问题

### 1. pnpm安装失败

#### 问题描述
```bash
npm ERR! code ENOENT
npm ERR! syscall spawn pnpm
npm ERR! path pnpm
npm ERR! errno -2
```

#### 解决方案
```bash
# 方案1: 全局安装pnpm
npm install -g pnpm

# 方案2: 使用corepack启用pnpm
corepack enable
corepack prepare pnpm@latest --activate

# 方案3: 使用npx运行
npx pnpm install
```

### 2. Node.js版本不兼容

#### 问题描述
```bash
error This project requires Node.js >= 18.0.0
```

#### 解决方案
```bash
# 检查当前版本
node --version

# 使用nvm管理Node.js版本
nvm install 18
nvm use 18

# 或者使用fnm
fnm install 18
fnm use 18
```

### 3. 依赖安装失败

#### 问题描述
```bash
ERR_PNPM_PEER_DEP_ISSUES
```

#### 解决方案
```bash
# 清理缓存
pnpm store prune

# 删除node_modules和锁文件
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install

# 如果仍有问题，使用--force
pnpm install --force
```

## 🏗️ 构建问题

### 1. TypeScript编译错误

#### 问题描述
```bash
error TS2307: Cannot find module '@shared/components'
```

#### 解决方案
```bash
# 检查TypeScript配置
cat tsconfig.json

# 确保路径映射正确
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["packages/shared-components/src/*"]
    }
  }
}

# 重新构建TypeScript引用
pnpm build:types
```

### 2. Vite构建失败

#### 问题描述
```bash
[vite]: Rollup failed to resolve import
```

#### 解决方案
```bash
# 检查导入路径
# 错误示例
import { Component } from '@shared/components';

# 正确示例
import { Component } from '@shared/components/Component';

# 检查vite配置中的alias设置
# vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'packages/shared-components/src')
    }
  }
});
```


### 4. 内存不足错误

#### 问题描述
```bash
FATAL ERROR: Ineffective mark-compacts near heap limit
```

#### 解决方案
```bash
# 增加Node.js内存限制
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# 或者在package.json中设置
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

## 🚀 部署问题

### 1. GitHub Actions部署失败

#### 问题描述
```bash
Error: Process completed with exit code 1
```

#### 解决方案
```bash
# 检查GitHub Actions日志
# 1. 进入仓库的Actions页面
# 2. 点击失败的workflow
# 3. 查看详细错误信息

# 常见问题和解决方案：

# 权限问题
# 确保在仓库设置中启用了Actions写入权限
# Settings → Actions → General → Workflow permissions

# 依赖缓存问题
# 在workflow中清理缓存
- name: Clear cache
  run: |
    rm -rf node_modules
    rm -rf ~/.pnpm-store
```

### 2. GitHub Pages访问404

#### 问题描述
访问部署的页面显示404错误

#### 解决方案
```bash
# 检查GitHub Pages设置
# Settings → Pages → Source: GitHub Actions

# 检查base路径配置
# vite.config.js
export default defineConfig({
  base: '/Long_screenshot_splitting_tool/', // 仓库名
});

# 检查路由配置
# 确保使用Hash路由而不是Browser路由
import { HashRouter } from 'react-router-dom';
```

### 3. 部署后资源加载失败

#### 问题描述
```bash
Failed to load resource: net::ERR_ABORTED 404
```

#### 解决方案
```bash
# 检查资源路径
# 确保所有资源使用相对路径

# 检查构建输出
ls -la dist/

# 验证HTML中的资源引用
cat dist/index.html

# 如果使用CDN，检查CDN配置
# vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
```

## 🔄 运行时问题

### 1. 组件无法加载

#### 问题描述
```bash
Error: Component failed to mount
```

#### 解决方案
```javascript
// 检查组件接口实现
// packages/my-component/src/App.tsx
export const componentInterface = {
  name: 'my-component',
  version: '1.0.0',
  mount(container, props) {
    // 确保正确实现mount方法
    const root = ReactDOM.createRoot(container);
    root.render(<App {...props} />);
    return root;
  },
  unmount(root) {
    root?.unmount();
  }
};

// 检查容器元素
const container = document.getElementById('component-root');
if (!container) {
  console.error('Container element not found');
}
```

### 2. 路由不工作

#### 问题描述
路由跳转无效或显示空白页面

#### 解决方案
```javascript
// 确保使用HashRouter
import { HashRouter as Router } from 'react-router-dom';

// 检查路由配置
const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

// 检查基础路径
// 在GitHub Pages上使用hash路由
window.location.hash = '#/target-path';
```

### 3. 组件间通信失败

#### 问题描述
组件之间无法正常通信

#### 解决方案
```javascript
// 检查通信管理器初始化
import { ComponentCommunicationManager } from '@shared/managers';

// 确保在应用启动时初始化
const communicationManager = new ComponentCommunicationManager();

// 检查事件监听
useEffect(() => {
  const handleMessage = (data) => {
    console.log('Received message:', data);
  };
  
  communicationManager.on('custom:event', handleMessage);
  
  return () => {
    communicationManager.off('custom:event', handleMessage);
  };
}, []);

// 检查事件发送
const sendMessage = () => {
  communicationManager.emit('custom:event', {
    from: 'sender',
    data: 'Hello'
  });
};
```

## ⚡ 性能问题

### 1. 页面加载缓慢

#### 问题描述
首次加载时间过长

#### 解决方案
```bash
# 分析构建产物
pnpm run analyze

# 检查大文件
find dist -name "*.js" -size +1M

# 启用代码分割
# vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash']
        }
      }
    }
  }
});

# 启用压缩
# vite.config.js
import { compression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    compression({
      algorithm: 'gzip'
    })
  ]
});
```

### 2. 内存泄漏

#### 问题描述
长时间使用后页面变慢

#### 解决方案
```javascript
// 检查事件监听器清理
useEffect(() => {
  const handleResize = () => {
    // 处理逻辑
  };
  
  window.addEventListener('resize', handleResize);
  
  // 重要：清理监听器
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

// 检查定时器清理
useEffect(() => {
  const timer = setInterval(() => {
    // 定时任务
  }, 1000);
  
  // 重要：清理定时器
  return () => {
    clearInterval(timer);
  };
}, []);

// 检查组件卸载
useEffect(() => {
  return () => {
    // 清理资源
    cleanup();
  };
}, []);
```

### 3. 构建时间过长

#### 问题描述
构建过程耗时很长

#### 解决方案
```bash
# 启用构建缓存
# vite.config.js
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  optimizeDeps: {
    force: false // 不强制重新构建依赖
  }
});

# 并行构建
pnpm run build --parallel

# 使用SWC替代Babel
npm install @vitejs/plugin-react-swc
```

## 🔍 调试技巧

### 1. 开发环境调试

#### 启用详细日志
```bash
# 启用Vite调试日志
DEBUG=vite:* pnpm dev

# 启用构建调试
DEBUG=1 pnpm build

# 查看网络请求
# 在浏览器开发者工具中查看Network面板
```

#### 使用调试工具
```javascript
// React Developer Tools
// 安装浏览器扩展后可以查看组件状态

// 性能分析
console.time('component-render');
// 组件渲染代码
console.timeEnd('component-render');

// 内存使用分析
console.log('Memory usage:', performance.memory);
```

### 2. 生产环境调试

#### 启用Source Map
```javascript
// vite.config.js
export default defineConfig({
  build: {
    sourcemap: true // 生产环境启用source map
  }
});
```

#### 错误监控
```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // 发送错误报告
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  });
});

// Promise错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

### 3. 构建调试

#### 分析构建产物
```bash
# 生成构建分析报告
pnpm run build --report

# 查看文件大小
du -sh dist/*

# 分析依赖
pnpm list --depth=0
```

#### 调试构建脚本
```bash
# 启用脚本调试
node --inspect tools/build-scripts/build-manager.js

# 或使用调试模式
DEBUG=1 node tools/build-scripts/build-manager.js
```

## 🆘 获取帮助

### 1. 日志收集

#### 收集系统信息
```bash
# 创建诊断脚本
cat > diagnose.sh << 'EOF'
#!/bin/bash
echo "=== 系统信息 ==="
node --version
pnpm --version
git --version

echo "=== 项目信息 ==="
cat package.json | grep -E '"name"|"version"'

echo "=== 依赖信息 ==="
pnpm list --depth=0

echo "=== 构建信息 ==="
ls -la dist/ 2>/dev/null || echo "No dist directory"

echo "=== 错误日志 ==="
tail -n 50 .logs/*.log 2>/dev/null || echo "No log files"
EOF

chmod +x diagnose.sh
./diagnose.sh > diagnostic-report.txt
```

### 2. 问题报告模板

```markdown
## 问题描述
简要描述遇到的问题

## 复现步骤
1. 执行命令：`pnpm xxx`
2. 观察到的现象
3. 期望的结果

## 环境信息
- Node.js版本：
- pnpm版本：
- 操作系统：
- 浏览器版本：

## 错误信息
```
粘贴完整的错误信息
```

## 相关文件
- 配置文件内容
- 相关代码片段

## 已尝试的解决方案
列出已经尝试过的解决方法
```

### 3. 联系方式

- **GitHub Issues**: [提交问题](https://github.com/your-username/Long_screenshot_splitting_tool/issues)
- **讨论区**: [GitHub Discussions](https://github.com/your-username/Long_screenshot_splitting_tool/discussions)
- **文档**: [项目文档](README.md)

---

**提示**: 在提交问题前，请先查看 [常见问题FAQ](FAQ.md) 和搜索已有的Issues，可能已经有解决方案了。
