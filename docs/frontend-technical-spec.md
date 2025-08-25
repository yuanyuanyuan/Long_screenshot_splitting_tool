# 前端技术方案设计文档

## 文档信息
- **项目名称**: Awesome Tools
- **技术栈**: React + TypeScript
- **文档版本**: v1.0
- **创建日期**: 2025年8月25日
- **相关文档**: PRD-awesome-tools.md

## 1. 技术架构概述

### 1.1 设计原则
- **组件化**: 基于React函数组件和Hooks
- **类型安全**: 全面使用TypeScript
- **模块化**: 清晰的模块边界和依赖管理
- **可维护性**: 统一的代码规范和文档标准
- **性能优化**: 代码分割和懒加载策略

### 1.2 技术选型
| 技术领域 | 技术方案 | 版本 | 选择理由 |
|----------|----------|------|----------|
| UI框架 | React | 18+ | 生态成熟，团队熟悉 |
| 语言 | TypeScript | 5+ | 类型安全，开发体验好 |
| 状态管理 | React Context + useReducer | 内置 | 轻量级，适合中等复杂度 |
| 路由 | React Router | 6+ | 功能完善，社区支持好 |
| 样式方案 | CSS Modules + Sass | 最新 | 模块化，避免样式冲突 |
| 构建工具 | Vite | 5+ | 开发体验好，构建速度快 |
| 测试框架 | Jest + React Testing Library | 最新 | 社区标准，功能全面 |
| 文档工具 | Storybook | 6.5+ | 组件文档和交互演示 |

## 2. 组件架构设计

### 2.1 组件分层架构
```
组件层级 → 职责范围 → 示例组件
---------------------------------------------------
基础组件 → 无状态UI组件 → Button, Input, Modal
业务组件 → 领域特定组件 → ScreenshotUploader, ToolCard
布局组件 → 页面结构组件 → Header, Sidebar, Footer
容器组件 → 状态管理组件 → ToolContainer, UserProvider
页面组件 → 路由级别组件 → HomePage, ToolDetailPage
```

### 2.2 共享组件设计 (shared-components)

#### 组件结构规范
```typescript
// shared-components/components/Button/
Button/
├── index.tsx           // 组件主文件
├── Button.tsx          // 组件实现
├── Button.module.scss  // 组件样式
├── Button.stories.tsx  // Storybook文档
├── Button.test.tsx     // 单元测试
├── types.ts           // TypeScript类型定义
└── index.md           // 组件文档
```

#### 基础组件接口设计
```typescript
// Button组件Props接口
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  className?: string;
}
```

### 2.3 业务包组件设计 (screenshot-splitter)

#### 工具组件结构
```typescript
// packages/screenshot-splitter/components/ScreenshotUploader/
ScreenshotUploader/
├── index.tsx
├── ScreenshotUploader.tsx
├── useScreenshotUpload.ts  // 自定义Hook
├── utils/                  // 组件专用工具
│   └── imageProcessor.ts
├── types.ts
└── __tests__/             // 测试文件
    └── ScreenshotUploader.test.tsx
```

## 3. 状态管理设计

### 3.1 状态管理策略
| 状态类型 | 管理方案 | 使用场景 |
|----------|----------|----------|
| 本地状态 | useState | 组件内部状态 |
| 组件间状态 | useContext | 跨组件状态共享 |
| 复杂状态 | useReducer | 多个相关联的状态 |
| 全局状态 | 状态管理库 | 跨页面状态共享 |
| 服务端状态 | React Query | 数据获取和缓存 |

### 3.2 Context设计示例
```typescript
// shared-components/contexts/ThemeContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface ThemeState {
  mode: 'light' | 'dark';
  primaryColor: string;
}

interface ThemeActions {
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<
  { state: ThemeState } & ThemeActions
>({} as any);

// Provider组件和Reducer实现...
```

## 4. 路由架构设计

### 4.1 路由结构
```typescript
// 主应用路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'tools',
        children: [
          {
            index: true,
            element: <ToolsListPage />,
          },
          {
            path: ':toolId',
            element: <ToolDetailPage />,
          },
        ],
      },
    ],
  },
]);
```

### 4.2 懒加载策略
```typescript
// 使用React.lazy实现路由懒加载
const ToolDetailPage = lazy(() => 
  import('../pages/ToolDetailPage').then(module => ({
    default: module.ToolDetailPage,
  }))
);

// 使用Suspense处理加载状态
<Suspense fallback={<LoadingSpinner />}>
  <ToolDetailPage />
</Suspense>
```

## 5. 样式架构设计

### 5.1 CSS架构
```scss
// 样式变量体系
:root {
  // 颜色系统
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  
  // 间距系统
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  
  // 字体系统
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
}

// CSS Modules使用示例
.button {
  composes: base-button from global; // 全局样式组合
  background-color: var(--color-primary);
  padding: var(--spacing-md) var(--spacing-lg);
  
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
```

### 5.2 设计令牌系统
```typescript
// design-tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      // ...梯度颜色
      900: '#0d47a1',
    },
    // 其他颜色...
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.25rem',
    },
  },
} as const;
```

## 6. 性能优化策略

### 6.1 代码分割
```typescript
// 动态导入实现代码分割
const HeavyComponent = lazy(() => 
  import('./HeavyComponent').then(module => ({
    default: module.HeavyComponent,
  }))
);

// 路由级别代码分割
const ToolsRoute = lazy(() =>
  import('../routes/ToolsRoute').then(module => ({
    default: module.ToolsRoute,
  }))
);
```

### 6.2 渲染优化
```typescript
// React.memo优化组件重渲染
const ExpensiveComponent = memo(({ data }: { data: DataType }) => {
  // 组件实现
}, arePropsEqual);

// useMemo优化计算开销
const processedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);

// useCallback优化函数引用
const handleSubmit = useCallback((values: FormValues) => {
  submitData(values);
}, []);
```

## 7. 测试策略

### 7.1 测试金字塔
```
测试类型 → 工具选择 → 覆盖目标
-------------------------------------------
单元测试 → Jest + React Testing Library → 组件逻辑
集成测试 → Jest + Testing Library → 组件交互
E2E测试 → Playwright → 用户流程
快照测试 → Jest → UI一致性
```

### 7.2 测试文件结构
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── __tests__/
│   │       └── Button.test.tsx
│   └── __tests__/          # 集成测试
│       └── component-integration.test.tsx
├── utils/
│   └── __tests__/
│       └── utils.test.ts   # 纯函数测试
└── e2e/
    └── user-flows.spec.ts  # E2E测试
```

## 8. 开发规范

### 8.1 代码规范
```typescript
// 组件命名规范
// 使用PascalCase命名组件
interface UserProfileProps {}
const UserProfile: React.FC<UserProfileProps> = () => {};

// 文件命名规范
// 组件文件: PascalCase
// 工具文件: camelCase
// 类型文件: .types.ts
// 样式文件: .module.scss

// 导入顺序规范
import React from 'react';
import { useSelector } from 'react-redux';

import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/user';

import styles from './UserProfile.module.scss';
```

### 8.2 Git提交规范
```bash
# 提交类型规范
feat:    新功能
fix:     修复bug
docs:    文档更新
style:   代码格式调整
refactor:代码重构
test:    测试相关
chore:   构建过程或辅助工具变动

# 示例
feat(components): add new Button component with variants
fix(auth): resolve login token expiration issue
docs(readme): update installation instructions
```

## 9. 部署和构建

### 9.1 环境配置
```typescript
// config/environment.ts
export interface Environment {
  apiUrl: string;
  cdnUrl: string;
  enableAnalytics: boolean;
}

// 环境特定配置
export const development: Environment = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  cdnUrl: process.env.REACT_APP_CDN_URL || '',
  enableAnalytics: false,
};

export const production: Environment = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.awesome-tools.com',
  cdnUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.awesome-tools.com',
  enableAnalytics: true,
};
```

### 9.2 构建优化
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns'],
          ui: ['@shared-components/*'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    // 压缩和优化插件
  ],
});
```

## 10. 监控和错误处理

### 10.1 错误边界
```typescript
// ErrorBoundary组件
class ErrorBoundary extends React.Component<{
  fallback: React.ReactNode;
}, { hasError: boolean }> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 上报错误到监控系统
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```



---
*技术方案设计完成时间: 2025年8月25日*  
*下次评审时间: 2025年8月28日*