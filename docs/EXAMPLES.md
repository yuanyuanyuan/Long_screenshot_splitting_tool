# 使用示例和最佳实践

本文档提供了双模式构建Monorepo系统的详细使用示例和开发最佳实践。

## 📋 目录

- [基础使用示例](#基础使用示例)
- [组件开发示例](#组件开发示例)
- [构建配置示例](#构建配置示例)
- [部署示例](#部署示例)
- [最佳实践](#最佳实践)
- [常见场景](#常见场景)

## 🚀 基础使用示例

### 1. 项目初始化

#### 1.1 克隆和安装
```bash
# 克隆项目
git clone https://github.com/your-username/Long_screenshot_splitting_tool.git
cd Long_screenshot_splitting_tool

# 安装依赖
pnpm install

# 验证安装
pnpm --version  # 应该显示 >= 8.0
node --version  # 应该显示 >= 18.0
```

#### 1.2 开发环境启动
```bash
# 启动所有组件的开发服务器
pnpm dev

# 或者启动特定组件
pnpm dev:screenshot-splitter

# 访问应用
# 主应用: http://localhost:5173
# 长截图分割工具: http://localhost:5173/screenshot-splitter
```

### 2. 构建示例

#### 2.1 基础构建
```bash
# 构建所有组件（SPA模式）
pnpm build

# 构建单文件HTML模式
pnpm build:singlefile

# 构建特定组件
pnpm build:screenshot-splitter

# 构建特定组件的单文件版本
BUILD_MODE=singlefile pnpm build:screenshot-splitter
```

#### 2.2 预览构建结果
```bash
# 预览SPA模式
pnpm preview:spa

# 预览单文件模式
pnpm preview:singlefile

# 预览特定组件
pnpm preview:screenshot-splitter
```

## 🧩 组件开发示例

### 1. 创建新组件

#### 1.1 组件目录结构
```bash
packages/
└── my-new-component/
    ├── src/
    │   ├── components/
    │   │   ├── MyComponent.tsx
    │   │   └── MyComponent.css
    │   ├── hooks/
    │   │   └── useMyHook.ts
    │   ├── utils/
    │   │   └── helpers.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── public/
    │   └── index.html
    ├── component.config.js
    ├── vite.config.js
    ├── package.json
    └── tsconfig.json
```

#### 1.2 组件配置示例
```javascript
// packages/my-new-component/component.config.js
module.exports = {
  name: 'my-new-component',
  displayName: '我的新组件',
  description: '这是一个示例组件',
  version: '1.0.0',
  author: 'Your Name',
  homepage: 'https://your-username.github.io/Long_screenshot_splitting_tool/my-new-component/',
  repository: 'https://github.com/your-username/Long_screenshot_splitting_tool',
  keywords: ['component', 'example', 'demo'],
  category: 'utility',
  tags: ['工具', '示例'],
  
  // 构建配置
  build: {
    spa: {
      enabled: true,
      entry: 'src/main.tsx',
      template: 'public/index.html'
    },
    singlefile: {
      enabled: true,
      inlineAssets: true,
      removeViteModuleLoader: true
    }
  },
  
  // 路由配置
  routing: {
    basePath: '/my-new-component/',
    routes: [
      { path: '/', component: 'Home' },
      { path: '/demo', component: 'Demo' }
    ]
  },
  
  // 依赖配置
  dependencies: {
    external: ['react', 'react-dom'],
    shared: ['@shared/components']
  }
};
```

#### 1.3 组件主文件示例
```tsx
// packages/my-new-component/src/App.tsx
import React from 'react';
import { ComponentInterface } from '@shared/interfaces';
import { useComponentCommunication } from '@shared/hooks';
import './App.css';

interface MyComponentProps {
  config?: any;
  onStateChange?: (state: any) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ config, onStateChange }) => {
  const { emit, on, off } = useComponentCommunication();
  const [state, setState] = React.useState({
    initialized: false,
    data: null
  });

  // 组件初始化
  React.useEffect(() => {
    setState(prev => ({ ...prev, initialized: true }));
    emit('component:mounted', { name: 'my-new-component' });
    
    return () => {
      emit('component:unmounted', { name: 'my-new-component' });
    };
  }, []);

  // 状态变化通知
  React.useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  const handleAction = () => {
    const newData = { timestamp: Date.now(), action: 'button-clicked' };
    setState(prev => ({ ...prev, data: newData }));
    emit('component:action', newData);
  };

  return (
    <div className="my-component">
      <h1>我的新组件</h1>
      <p>状态: {state.initialized ? '已初始化' : '初始化中...'}</p>
      <button onClick={handleAction}>执行操作</button>
      {state.data && (
        <div className="result">
          <h3>操作结果:</h3>
          <pre>{JSON.stringify(state.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// 实现组件接口
const componentInterface: ComponentInterface = {
  name: 'my-new-component',
  version: '1.0.0',
  
  mount(container: HTMLElement, props?: any) {
    const root = ReactDOM.createRoot(container);
    root.render(<MyComponent {...props} />);
    return root;
  },
  
  unmount(root: any) {
    root?.unmount();
  },
  
  getState() {
    // 返回组件状态
    return { initialized: true };
  },
  
  setState(newState: any) {
    // 设置组件状态
    console.log('Setting state:', newState);
  }
};

export default MyComponent;
export { componentInterface };
```

### 2. 组件间通信示例

#### 2.1 事件通信
```tsx
// 发送事件
import { useComponentCommunication } from '@shared/hooks';

const SenderComponent = () => {
  const { emit } = useComponentCommunication();
  
  const sendMessage = () => {
    emit('custom:message', {
      from: 'sender-component',
      data: 'Hello from sender!',
      timestamp: Date.now()
    });
  };
  
  return <button onClick={sendMessage}>发送消息</button>;
};

// 接收事件
const ReceiverComponent = () => {
  const { on, off } = useComponentCommunication();
  const [messages, setMessages] = React.useState([]);
  
  React.useEffect(() => {
    const handleMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };
    
    on('custom:message', handleMessage);
    
    return () => {
      off('custom:message', handleMessage);
    };
  }, [on, off]);
  
  return (
    <div>
      <h3>接收到的消息:</h3>
      {messages.map((msg, index) => (
        <div key={index}>{msg.data}</div>
      ))}
    </div>
  );
};
```

#### 2.2 状态共享
```tsx
// 使用共享状态
import { useSharedState } from '@shared/hooks';

const ComponentA = () => {
  const [sharedData, setSharedData] = useSharedState('global-data', {});
  
  const updateData = () => {
    setSharedData({
      ...sharedData,
      lastUpdated: Date.now(),
      updatedBy: 'ComponentA'
    });
  };
  
  return (
    <div>
      <h3>组件A</h3>
      <button onClick={updateData}>更新共享数据</button>
      <pre>{JSON.stringify(sharedData, null, 2)}</pre>
    </div>
  );
};

const ComponentB = () => {
  const [sharedData] = useSharedState('global-data', {});
  
  return (
    <div>
      <h3>组件B</h3>
      <p>共享数据: {JSON.stringify(sharedData)}</p>
    </div>
  );
};
```

## ⚙️ 构建配置示例

### 1. Vite配置示例

#### 1.1 基础配置
```javascript
// packages/my-component/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { createViteConfig } from '../../vite.config.base.js';

export default defineConfig(({ mode }) => {
  const baseConfig = createViteConfig({
    componentName: 'my-component',
    mode
  });
  
  return {
    ...baseConfig,
    
    // 自定义配置
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@shared': resolve(__dirname, '../shared-components/src')
      }
    },
    
    // 开发服务器配置
    server: {
      port: 5174,
      open: '/my-component/'
    },
    
    // 构建配置
    build: {
      ...baseConfig.build,
      lib: mode === 'library' ? {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'MyComponent',
        fileName: 'my-component'
      } : undefined
    }
  };
});
```

#### 1.2 环境特定配置
```javascript
// vite.config.production.js
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // Gzip压缩
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    
    // Brotli压缩
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    }),
    
    // 构建分析
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true
    })
  ],
  
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'dayjs']
        }
      }
    },
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### 2. TypeScript配置示例

#### 2.1 组件TypeScript配置
```json
// packages/my-component/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["../shared-components/src/*"]
    },
    "types": ["vite/client", "jest", "@testing-library/jest-dom"]
  },
  "include": [
    "src/**/*",
    "**/*.test.ts",
    "**/*.test.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ],
  "references": [
    {
      "path": "../shared-components"
    }
  ]
}
```

## 🚀 部署示例

### 1. GitHub Actions部署

#### 1.1 基础部署工作流
```yaml
# .github/workflows/deploy-component.yml
name: Deploy Component

on:
  push:
    paths:
      - 'packages/my-component/**'
  workflow_dispatch:
    inputs:
      component:
        description: 'Component to deploy'
        required: true
        default: 'my-component'

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
        
      - name: Build component
        run: |
          COMPONENT=${{ github.event.inputs.component || 'my-component' }}
          pnpm build:$COMPONENT
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/${{ github.event.inputs.component || 'my-component' }}/dist
          destination_dir: ${{ github.event.inputs.component || 'my-component' }}
```

#### 1.2 多环境部署
```yaml
# .github/workflows/deploy-multi-env.yml
name: Multi-Environment Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [staging, production]
        include:
          - environment: staging
            branch: develop
            url: https://staging.example.com
          - environment: production
            branch: main
            url: https://example.com
            
    steps:
      - name: Deploy to ${{ matrix.environment }}
        if: github.ref == 'refs/heads/${{ matrix.branch }}'
        run: |
          echo "Deploying to ${{ matrix.environment }}"
          NODE_ENV=${{ matrix.environment }} pnpm build
          pnpm deploy:${{ matrix.environment }}
```

### 2. 手动部署脚本

#### 2.1 部署脚本示例
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

COMPONENT=${1:-"all"}
MODE=${2:-"spa"}
ENV=${3:-"production"}

echo "🚀 开始部署..."
echo "组件: $COMPONENT"
echo "模式: $MODE"
echo "环境: $ENV"

# 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 运行测试
echo "🧪 运行测试..."
pnpm test

# 构建项目
echo "🏗️ 构建项目..."
if [ "$COMPONENT" = "all" ]; then
  if [ "$MODE" = "singlefile" ]; then
    NODE_ENV=$ENV pnpm build:singlefile
  else
    NODE_ENV=$ENV pnpm build
  fi
else
  if [ "$MODE" = "singlefile" ]; then
    NODE_ENV=$ENV BUILD_MODE=singlefile pnpm build:$COMPONENT
  else
    NODE_ENV=$ENV pnpm build:$COMPONENT
  fi
fi

# 部署
echo "🚀 部署到 GitHub Pages..."
pnpm gh-pages -d dist

echo "✅ 部署完成!"
```

#### 2.2 回滚脚本示例
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

VERSION=${1:-"previous"}

echo "🔄 开始回滚到版本: $VERSION"

# 获取上一个版本
if [ "$VERSION" = "previous" ]; then
  VERSION=$(git log --oneline -n 2 | tail -n 1 | cut -d' ' -f1)
fi

echo "回滚到提交: $VERSION"

# 检出指定版本
git checkout $VERSION

# 重新构建和部署
pnpm install
pnpm build
pnpm deploy

echo "✅ 回滚完成!"
```

## 💡 最佳实践

### 1. 代码组织

#### 1.1 目录结构最佳实践
```
packages/my-component/
├── src/
│   ├── components/          # UI组件
│   │   ├── common/         # 通用组件
│   │   ├── forms/          # 表单组件
│   │   └── layout/         # 布局组件
│   ├── hooks/              # 自定义Hook
│   ├── utils/              # 工具函数
│   ├── services/           # API服务
│   ├── types/              # TypeScript类型定义
│   ├── constants/          # 常量定义
│   └── styles/             # 样式文件
├── public/                 # 静态资源
├── tests/                  # 测试文件
└── docs/                   # 组件文档
```

#### 1.2 命名规范
```typescript
// 组件命名：PascalCase
const MyComponent = () => {};

// Hook命名：use + PascalCase
const useMyHook = () => {};

// 工具函数：camelCase
const formatDate = () => {};

// 常量：UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// 类型定义：PascalCase + 后缀
interface UserData {}
type ComponentProps = {};
enum StatusType {}
```

### 2. 性能优化

#### 2.1 代码分割
```tsx
// 路由级别的代码分割
const LazyComponent = React.lazy(() => import('./LazyComponent'));

const App = () => (
  <Router>
    <Routes>
      <Route 
        path="/lazy" 
        element={
          <Suspense fallback={<div>加载中...</div>}>
            <LazyComponent />
          </Suspense>
        } 
      />
    </Routes>
  </Router>
);

// 组件级别的代码分割
const HeavyComponent = React.lazy(() => 
  import('./HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);
```

#### 2.2 缓存策略
```typescript
// React Query缓存
import { useQuery } from 'react-query';

const useUserData = (userId: string) => {
  return useQuery(
    ['user', userId],
    () => fetchUser(userId),
    {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
    }
  );
};

// 内存缓存
const cache = new Map();

const memoizedFunction = (key: string, fn: Function) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = fn();
  cache.set(key, result);
  return result;
};
```

### 3. 错误处理

#### 3.1 错误边界
```tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('组件错误:', error, errorInfo);
    
    // 发送错误报告
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // 发送到错误监控服务
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.toString(),
        errorInfo,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出现了错误</h2>
          <p>请刷新页面重试，或联系技术支持。</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### 3.2 异步错误处理
```typescript
// Promise错误处理
const handleAsyncOperation = async () => {
  try {
    const result = await someAsyncOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('异步操作失败:', error);
    return { 
      success: false, 
      error: error.message || '操作失败' 
    };
  }
};

// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
  
  // 发送错误报告
  reportError(event.reason);
  
  // 阻止默认的错误处理
  event.preventDefault();
});
```

### 4. 测试策略

#### 4.1 单元测试示例
```typescript
// MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('应该正确渲染', () => {
    render(<MyComponent />);
    expect(screen.getByText('我的组件')).toBeInTheDocument();
  });

  it('应该处理点击事件', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该正确更新状态', async () => {
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await screen.findByText('状态已更新');
    expect(screen.getByText('状态已更新')).toBeInTheDocument();
  });
});
```

#### 4.2 集成测试示例
```typescript
// integration.test.ts
import { buildComponent, deployComponent } from '../tools/build-scripts';

describe('构建和部署集成测试', () => {
  it('应该成功构建组件', async () => {
    const result = await buildComponent('my-component', 'spa');
    
    expect(result.success).toBe(true);
    expect(result.outputPath).toContain('dist');
    expect(result.files).toContain('index.html');
  });

  it('应该成功部署组件', async () => {
    // 先构建
    await buildComponent('my-component', 'spa');
    
    // 再部署
    const deployResult = await deployComponent('my-component');
    
    expect(deployResult.success).toBe(true);
    expect(deployResult.url).toContain('github.io');
  });
});
```

## 🎯 常见场景

### 1. 添加新功能

#### 1.1 功能开发流程
```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
# 编写代码...

# 3. 添加测试
# 编写测试用例...

# 4. 运行测试
pnpm test

# 5. 构建验证
pnpm build

# 6. 提交代码
git add .
git commit -m "feat: 添加新功能"

# 7. 推送分支
git push origin feature/new-feature

# 8. 创建Pull Request
```

#### 1.2 功能配置示例
```javascript
// 功能开关配置
const featureFlags = {
  newFeature: {
    enabled: process.env.NODE_ENV === 'development',
    rollout: 0.1, // 10%用户
    dependencies: ['feature-a', 'feature-b']
  }
};

// 功能组件
const NewFeature = () => {
  const isEnabled = useFeatureFlag('newFeature');
  
  if (!isEnabled) {
    return null;
  }
  
  return <div>新功能内容</div>;
};
```

### 2. 性能监控

#### 2.1 性能指标收集
```typescript
// 性能监控
const performanceMonitor = {
  // 页面加载时间
  measurePageLoad() {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
      
      this.reportMetric('page_load_time', loadTime);
    });
  },

  // 组件渲染时间
  measureComponentRender(componentName: string, renderTime: number) {
    this.reportMetric('component_render_time', renderTime, {
      component: componentName
    });
  },

  // 发送指标
  reportMetric(name: string, value: number, tags?: Record<string, string>) {
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        tags,
        timestamp: Date.now()
      })
    });
  }
};
```

#### 2.2 性能优化Hook
```typescript
// 性能优化Hook
const usePerformanceOptimization = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  // 可见性检测
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    const element = document.getElementById('component-root');
    if (element) {
      observer.observe(element);
    }
    
    return () => observer.disconnect();
  }, []);
  
  // 延迟渲染
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);
  
  return { shouldRender, isVisible };
};
```

### 3. 国际化支持

#### 3.1 国际化配置
```typescript
// i18n配置
const i18nConfig = {
  defaultLocale: 'zh-CN',
  locales: ['zh-CN', 'en-US', 'ja-JP'],
  messages: {
    'zh-CN': {
      'common.save': '保存',
      'common.cancel': '取消',
      'component.title': '我的组件'
    },
    'en-US': {
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'component.title': 'My Component'
    }
  }
};

// 国际化Hook
const useI18n = () => {
  const [locale, setLocale] = useState(i18nConfig.defaultLocale);
  
  const t = (key: string, params?: Record<string, any>) => {
    let message = i18nConfig.messages[locale]?.[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        message = message.replace(`{${param}}`, value);
      });
    }
    
    return message;
  };
  
  return { t, locale, setLocale };
};
```

---

**需要更多示例？** 查看 [API文档](API.md) 或 [提交Issue](https://github.com/your-username/Long_screenshot_splitting_tool/issues) 获取帮助。