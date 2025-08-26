# 开发指南

## 📋 开发环境设置

### 系统要求

| 工具 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | 16.x | 18.x+ | JavaScript 运行环境 |
| npm | 8.x | 9.x+ | 包管理器 |
| Git | 2.30+ | 最新版 | 版本控制 |
| VS Code | 1.70+ | 最新版 | 推荐编辑器 |

### 环境安装

#### 1. 克隆项目
```bash
git clone <repository-url>
cd long-screenshot-splitter
```

#### 2. 安装依赖
```bash
# 安装项目依赖
npm install

# 验证安装
npm run type-check
```

#### 3. 启动开发服务器
```bash
# 启动开发模式
npm run dev

# 服务器将在 http://localhost:5173 启动
```

#### 4. 验证环境
```bash
# 运行测试确认环境正常
npm run test:run

# 代码质量检查
npm run lint
```

### VS Code 扩展推荐

创建 `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "vitest.explorer",
    "ms-vscode.vscode-json"
  ]
}
```

---

## 🛠️ 开发工作流

### 分支策略

```mermaid
gitgraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "Setup dev environment"
    
    branch feature/image-processing
    checkout feature/image-processing
    commit id: "Add image upload"
    commit id: "Implement splitting logic"
    
    checkout develop
    merge feature/image-processing
    commit id: "Merge image processing"
    
    branch hotfix/critical-bug
    checkout hotfix/critical-bug
    commit id: "Fix critical bug"
    
    checkout main
    merge hotfix/critical-bug
    checkout develop
    merge main
```

#### 分支命名规范
- `main` - 生产环境分支
- `develop` - 开发主分支
- `feature/功能名称` - 功能开发分支
- `bugfix/问题描述` - 问题修复分支
- `hotfix/紧急修复` - 紧急修复分支

### 开发流程

#### 1. 功能开发流程
```bash
# 1. 从develop创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/new-export-format

# 2. 开发和测试
npm run dev          # 启动开发服务器
npm run test         # 运行测试
npm run lint         # 代码检查

# 3. 提交代码
git add .
git commit -m "feat: add new export format support"

# 4. 推送和创建PR
git push origin feature/new-export-format
# 在GitHub上创建Pull Request
```

#### 2. 问题修复流程
```bash
# 1. 创建修复分支
git checkout -b bugfix/fix-memory-leak

# 2. 修复问题
# ... 编写修复代码 ...

# 3. 验证修复
npm run test
npm run test:e2e     # 如果是关键问题

# 4. 提交修复
git commit -m "fix: resolve memory leak in image processing"
git push origin bugfix/fix-memory-leak
```

### 代码提交规范

#### Commit Message 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具或辅助工具变动

#### 示例
```bash
feat(image-processor): add WebP format support

- Add WebP format validation
- Update file type detection logic
- Add tests for WebP processing

Closes #123
```

---

## 🧪 测试开发

### 测试策略

#### 1. 单元测试 (90%+ 覆盖率)
**位置**: 与源文件同目录  
**命名**: `*.test.ts` 或 `*.test.tsx`

```typescript
// 示例: src/utils/textFormatter.test.ts
import { describe, it, expect } from 'vitest';
import { TextFormatter } from './textFormatter';

describe('TextFormatter', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(TextFormatter.formatFileSize(1024)).toBe('1.00 KB');
      expect(TextFormatter.formatFileSize(1048576)).toBe('1.00 MB');
    });

    it('should handle zero and negative values', () => {
      expect(TextFormatter.formatFileSize(0)).toBe('0 B');
      expect(TextFormatter.formatFileSize(-1)).toBe('0 B');
    });
  });
});
```

#### 2. 组件测试
```typescript
// 示例: src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Loading Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### 3. Hook 测试
```typescript
// 示例: src/hooks/useImageProcessor.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useImageProcessor } from './useImageProcessor';

describe('useImageProcessor', () => {
  it('should process image correctly', async () => {
    const { result } = renderHook(() => useImageProcessor());
    
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    
    await act(async () => {
      const segments = await result.current.processImage(mockFile, 800);
      expect(segments).toHaveLength(2); // 假设分割成2段
    });
    
    expect(result.current.processing).toBe(false);
  });
});
```

### 测试命令

```bash
# 运行所有测试
npm run test

# 监视模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm run test -- src/utils/textFormatter.test.ts

# 运行测试UI界面
npm run test:ui
```

---

## 🎨 样式开发

### CSS 架构

#### 1. 样式组织结构
```
src/
├── index.css                    # 全局样式
├── App.css                      # 应用级样式
└── components/
    ├── Button/
    │   ├── Button.tsx
    │   └── Button.module.css     # 组件样式
    └── Navigation/
        ├── Navigation.tsx
        └── Navigation.css        # 全局组件样式
```

#### 2. CSS Modules 使用
```typescript
// Button.tsx
import styles from './Button.module.css';

const Button: React.FC<ButtonProps> = ({ variant, children }) => {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
};
```

```css
/* Button.module.css */
.button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.secondary {
  background-color: #6b7280;
  color: white;
}
```

#### 3. Tailwind CSS 集成
```typescript
// 使用 Tailwind 类
const Component = () => (
  <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
    <h2 className="text-lg font-semibold text-gray-900">标题</h2>
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      按钮
    </button>
  </div>
);
```

### 响应式设计

#### 断点定义 (Tailwind)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
};
```

#### 响应式组件示例
```typescript
const ResponsiveLayout = () => (
  <div className="
    grid 
    grid-cols-1 
    md:grid-cols-2 
    lg:grid-cols-3 
    gap-4 
    p-4
  ">
    <div className="bg-white rounded-lg p-6">内容1</div>
    <div className="bg-white rounded-lg p-6">内容2</div>
    <div className="bg-white rounded-lg p-6">内容3</div>
  </div>
);
```

---

## 🚀 性能优化

### 性能优化检查清单

#### 1. 组件性能
```typescript
// ✅ 使用 React.memo 优化渲染
const OptimizedComponent = React.memo(({ data }: Props) => {
  return <div>{data.name}</div>;
});

// ✅ 使用 useMemo 缓存计算结果
const ExpensiveComponent = ({ items }: Props) => {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return <div>{sortedItems.map(item => <Item key={item.id} {...item} />)}</div>;
};

// ✅ 使用 useCallback 缓存回调函数
const ParentComponent = () => {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return <ChildComponent onClick={handleClick} />;
};
```

#### 2. 资源优化
```typescript
// ✅ 图片懒加载
const LazyImage = ({ src, alt }: Props) => {
  const [imageRef, inView] = useIntersectionObserver();
  
  return (
    <div ref={imageRef}>
      {inView ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className="placeholder">加载中...</div>
      )}
    </div>
  );
};

// ✅ 代码分割
const HeavyComponent = React.lazy(() => 
  import('./HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);
```

#### 3. Web Worker 优化
```typescript
// ✅ Web Worker 处理重计算
class ImageWorkerManager {
  private worker: Worker | null = null;
  
  async processImage(imageData: ImageData): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.worker = new Worker('/src/workers/image-processor.js');
      }
      
      this.worker.postMessage(imageData);
      this.worker.onmessage = (e) => resolve(e.data);
      this.worker.onerror = (e) => reject(e);
    });
  }
  
  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
```

### 性能测试

```bash
# 构建分析
npm run build
npm run analyze

# 性能测试
npm run test:performance

# Lighthouse 审计
npx lighthouse http://localhost:5173 --output=html --output-path=./lighthouse-report.html
```

---

## 🔧 调试技巧

### 开发工具

#### 1. React DevTools
```typescript
// 组件调试标识
const DebugComponent = () => {
  // 仅在开发环境显示调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('Component rendered with props:', props);
  }
  
  return <div>Component Content</div>;
};
```

#### 2. 自定义调试 Hook
```typescript
const useDebugValue = (value: any, label: string) => {
  React.useDebugValue(value, (val) => `${label}: ${JSON.stringify(val)}`);
  return value;
};

// 使用示例
const useCustomHook = () => {
  const [state, setState] = useState(initialState);
  useDebugValue(state, 'CustomHook State');
  return [state, setState];
};
```

#### 3. 错误边界
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('错误边界捕获:', error, errorInfo);
    // 发送错误报告到监控服务
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 常见问题解决

#### 1. 内存泄漏调试
```typescript
// 使用 useEffect 清理资源
const Component = () => {
  useEffect(() => {
    const worker = new Worker('/worker.js');
    const timerId = setInterval(() => {}, 1000);
    
    return () => {
      worker.terminate(); // 清理 Worker
      clearInterval(timerId); // 清理定时器
    };
  }, []);
};
```

#### 2. 异步错误处理
```typescript
const useAsyncOperation = () => {
  const [state, setState] = useState({ data: null, error: null, loading: false });
  
  const execute = async (operation: () => Promise<any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await operation();
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '未知错误', 
        loading: false 
      }));
    }
  };
  
  return { ...state, execute };
};
```

---

## 🌐 国际化开发

### 多语言支持架构

#### 1. 语言文件结构
```
src/locales/
├── en.json              # 英文
├── zh-CN.json          # 简体中文
└── index.ts            # 导出配置
```

#### 2. 国际化 Hook
```typescript
// useI18n.ts
import { useContext } from 'react';
import { I18nContext } from './I18nContext';

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  
  const t = (key: string, params?: Record<string, any>) => {
    const message = getNestedValue(context.messages, key);
    if (!message) return key;
    
    return params ? interpolateMessage(message, params) : message;
  };
  
  return {
    ...context,
    t
  };
};
```

#### 3. 使用示例
```typescript
// 组件中使用
const Component = () => {
  const { t, language, setLanguage } = useI18n();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.description', { count: 5 })}</p>
      <button onClick={() => setLanguage('en')}>
        {t('common.english')}
      </button>
    </div>
  );
};
```

#### 4. 语言文件示例
```json
// zh-CN.json
{
  "app": {
    "title": "长截图分割器",
    "description": "已处理 {{count}} 张图片"
  },
  "common": {
    "english": "English",
    "chinese": "中文"
  }
}
```

---

## 📦 构建和部署

### 构建配置

#### 1. Vite 配置优化
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './shared-components')
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'utility-vendor': ['jspdf', 'jszip']
        }
      }
    }
  }
});
```

#### 2. 环境配置
```bash
# 开发环境构建
npm run build:dev

# 生产环境构建  
npm run build

# 分析构建结果
npm run analyze
```

#### 3. 部署脚本
```javascript
// deploy.js
const { execSync } = require('child_process');

const deploy = async () => {
  console.log('🚀 开始部署...');
  
  // 构建项目
  execSync('npm run build', { stdio: 'inherit' });
  
  // 运行测试
  execSync('npm run test:run', { stdio: 'inherit' });
  
  // 部署到GitHub Pages
  execSync('npm run deploy:gh-pages', { stdio: 'inherit' });
  
  console.log('✅ 部署完成!');
};

deploy().catch(console.error);
```

---

## 🔍 故障排除

### 常见问题及解决方案

#### 1. 构建问题

**问题**: 构建失败，TypeScript 错误
```bash
# 解决方案
npm run type-check          # 检查类型错误
npm run lint:fix            # 自动修复代码问题
```

**问题**: 内存不足错误
```bash
# 解决方案
export NODE_OPTIONS="--max_old_space_size=4096"
npm run build
```

#### 2. 测试问题

**问题**: 测试超时
```javascript
// vitest.config.ts 增加超时时间
export default defineConfig({
  test: {
    testTimeout: 10000,  // 10秒超时
  }
});
```

**问题**: DOM 测试错误
```javascript
// 确保测试环境配置正确
// test-setup.ts
import '@testing-library/jest-dom';
```

#### 3. 性能问题

**问题**: 开发服务器启动慢
```javascript
// vite.config.ts 优化
export default defineConfig({
  optimizeDeps: {
    include: ['react', 'react-dom', 'jspdf', 'jszip']
  }
});
```

### 调试命令

```bash
# 详细构建信息
npm run build -- --mode development

# 测试调试模式
npm run test -- --reporter=verbose

# 类型检查详细信息
npx tsc --noEmit --pretty

# 依赖分析
npm ls --depth=0
```

---

## 📚 学习资源

### 技术文档
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Vite**: https://vitejs.dev/
- **Vitest**: https://vitest.dev/
- **Tailwind CSS**: https://tailwindcss.com/

### 项目特定资源
- **[架构文档](./ARCHITECTURE.md)** - 系统设计和架构决策
- **[API 参考](./API-REFERENCE.md)** - 完整 API 文档
- **[前端规范](./frontend-spec-new.md)** - 编码规范和最佳实践

### 开发工具
- **VS Code 配置**: `.vscode/settings.json`
- **ESLint 规则**: `eslint.config.js`
- **Prettier 配置**: `.prettierrc`
- **Git Hooks**: `.husky/` 目录

---

## 🤝 贡献指南

### 代码贡献流程

1. **Fork 项目** → 创建个人副本
2. **创建分支** → `git checkout -b feature/your-feature`
3. **编写代码** → 遵循项目规范
4. **编写测试** → 确保测试覆盖率
5. **提交代码** → 遵循提交规范
6. **创建 PR** → 详细描述变更内容
7. **代码审查** → 响应审查意见
8. **合并代码** → 完成贡献

### Code Review 检查清单

- [ ] 代码遵循项目规范
- [ ] 有完整的单元测试
- [ ] 测试覆盖率 ≥ 90%
- [ ] 性能影响评估
- [ ] 文档更新完整
- [ ] 无 TypeScript 错误
- [ ] 通过所有 CI 检查

---

*📝 最后更新: 2025-08-26*  
*🛠️ 开发指南版本: v1.0.0*  
*💡 如有问题，请查看 [故障排除](#🔍-故障排除) 或提交 Issue*