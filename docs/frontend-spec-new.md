# 前端技术规范 - 扁平化单仓库架构

## 📋 规范概述

本规范基于项目架构迁移的实际情况，统一了前端开发的技术标准和最佳实践。项目已成功从复杂的多包结构迁移到**扁平化单仓库结构**，本规范反映了这一架构决策。

## 🏗️ 架构决策与现状

### 当前架构：扁平化单仓库

基于项目规模、团队结构和维护成本的综合考虑，项目采用了**扁平化单仓库架构**：

```
long-screenshot-splitter/
├── src/                    # 主应用代码
│   ├── components/         # 业务组件
│   ├── hooks/             # 自定义Hooks
│   ├── utils/             # 工具函数
│   └── ...
├── shared-components/      # 共享组件库（内部模块）
│   ├── components/        # 通用UI组件
│   ├── hooks/             # 共享Hooks
│   └── utils/             # 共享工具
├── config/                # 配置文件
│   ├── app/               # 应用配置
│   ├── env/               # 环境配置
│   └── constants/         # 常量定义
├── tests/                 # 测试文件
├── docs/                  # 项目文档
└── package.json           # 统一依赖管理
```

### 架构选择理由

1. **项目规模适中**：长截图分割器是功能相对集中的应用
2. **开发效率优先**：减少了复杂的包管理和依赖配置
3. **维护成本优化**：降低了构建配置的复杂度
4. **团队协作简化**：统一了开发流程和部署流程

### 与原多仓库设计的对比

| 维度         | 原多仓库设计    | 当前实现     |
| ------------ | --------------- | ------------ |
| **仓库数量** | 多个独立Git仓库 | 单一Git仓库  |
| **依赖管理** | NPM包发布+安装  | 本地模块引用 |
| **版本控制** | 语义化版本控制  | 统一版本管理 |
| **构建配置** | 多个构建配置    | 单一Vite配置 |
| **开发体验** | 跨仓库协调复杂  | 统一开发环境 |

## 📁 项目结构规范

### 1. 目录结构标准

#### 主应用代码 (`src/`)

```
src/
├── components/          # 业务特定组件
│   ├── auth/           # 认证相关组件
│   ├── image/          # 图片处理组件
│   └── common/         # 通用业务组件
├── hooks/              # 业务相关Hooks
│   ├── useAppState/    # 应用状态管理
│   ├── useImageProcessor/ # 图片处理逻辑
│   └── useNavigation/  # 导航状态
├── utils/              # 业务工具函数
│   ├── image/          # 图片处理工具
│   ├── export/         # 导出功能工具
│   └── validation/     # 数据验证
├── types/              # TypeScript类型定义
├── locales/            # 国际化文件
├── assets/             # 静态资源
└── index.tsx           # 应用入口
```

#### 共享组件库 (`shared-components/`)

```
shared-components/
├── components/         # 通用UI组件
│   ├── Button/        # 按钮组件
│   ├── Input/         # 输入组件
│   ├── Modal/         # 模态框组件
│   └── ...
├── hooks/              # 通用Hooks
│   ├── useDebounce/    # 防抖Hook
│   ├── useLocalStorage/ # 本地存储Hook
│   └── useResponsive/  # 响应式Hook
├── utils/              # 通用工具函数
│   ├── formatters/     # 格式化工具
│   ├── validators/     # 验证工具
│   └── helpers/        # 辅助函数
└── index.ts            # 统一导出入口
```

### 2. 模块导入规范

#### 共享组件导入方式

```typescript
// 正确：从共享组件库导入
import { Button, Input } from '../../shared-components/components';
import { useDebounce } from '../../shared-components/hooks';

// 错误：使用相对路径直接访问（避免）
import Button from '../../shared-components/components/Button/Button';
```

#### 业务模块导入方式

```typescript
// 正确：使用相对路径导入业务模块
import { useAppState } from '../hooks/useAppState';
import { imageProcessor } from '../utils/image';
```

## 🛠️ 开发与构建流程

### 1. 依赖管理

项目使用**单一package.json**进行依赖管理：

```json
{
  "name": "long-screenshot-splitter",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
```

### 2. 构建配置

项目使用**Vite**作为构建工具，配置位于根目录：

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/shared-components',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### 3. 开发工作流

1. **开发启动**: `npm run dev`
2. **代码检查**: `npm run lint`
3. **测试运行**: `npm run test`
4. **构建生产**: `npm run build`

## 🎨 编码与设计原则

### 1. SOLID原则贯彻

#### 单一职责原则 (SRP)

```typescript
// 正确：职责分离
// useUsers.ts - 数据获取逻辑
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  return { users, loading };
};

// UserList.tsx - UI展示组件
const UserList = () => {
  const { users, loading } = useUsers();

  if (loading) return <div>Loading...</div>;
  return <ul>{users.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
};
```

#### 接口隔离原则 (ISP)

```typescript
// 正确：精确的接口定义
interface UserProfileCardProps {
  /** 用户信息 */
  user: UserProfile;
  /** 是否显示状态 */
  showStatus?: boolean;
  /** 删除回调 */
  onDelete: (userId: string) => void;
}
```

### 2. 组件设计规范

#### Props接口设计

```typescript
// 组件Props必须使用Interface明确定义
interface ButtonProps {
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 点击事件处理 */
  onClick?: (event: React.MouseEvent) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子元素 */
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'medium', ...props }) => {
  // 组件实现
};
```

#### 组件文件结构

```
shared-components/
└── components/
    └── Button/
        ├── Button.tsx           # 组件实现
        ├── Button.module.css    # 组件样式
        ├── Button.test.tsx      # 组件测试
        ├── index.ts             # 导出文件
        └── README.md            # 组件文档
```

### 3. 代码整洁度要求

- **函数长度**: 不超过50行
- **组件复杂度**: 单一组件不超过100行
- **命名规范**: 使用驼峰命名法，变量名体现意图
- **注释要求**: 解释"为什么"而不是"做什么"

## 🧪 测试规范

### 1. 测试层次结构

#### 单元测试 (Unit Tests)

- **范围**: 所有工具函数、自定义Hooks、UI组件
- **工具**: Vitest + React Testing Library
- **覆盖率要求**: ≥90%
- **位置**: 与源文件同目录，后缀`.test.ts`或`.test.tsx`

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### 集成测试 (Integration Tests)

- **范围**: 多组件交互、业务逻辑流程
- **工具**: Vitest + React Testing Library
- **重点**: 验证组件协作和数据流

#### 端到端测试 (E2E Tests)

- **范围**: 核心用户流程
- **工具**: Playwright
- **要求**: 覆盖主要功能路径

### 2. 测试实施要求

- **测试先行**: 鼓励TDD开发模式
- **测试位置**: 与源码同目录
- **CI集成**: 提交前自动运行测试
- **失败阻塞**: 测试失败阻止代码合并

## 📝 文档规范

### 1. 组件文档模板

每个共享组件必须包含详细的文档：

````markdown
# Button 组件

## 用途说明

通用按钮组件，支持多种样式变体和交互状态。

## Props API

| 属性       | 类型                                | 描述             | 默认值      | 是否必需 |
| ---------- | ----------------------------------- | ---------------- | ----------- | -------- |
| `variant`  | `'primary'\|'secondary'\|'danger'`  | 按钮样式变体     | `'primary'` | 否       |
| `size`     | `'small'\|'medium'\|'large'`        | 按钮尺寸         | `'medium'`  | 否       |
| `onClick`  | `(event: React.MouseEvent) => void` | 点击事件处理函数 | -           | 否       |
| `disabled` | `boolean`                           | 是否禁用按钮     | `false`     | 否       |

## 使用示例

```tsx
import { Button } from '../../shared-components/components/Button';

const Example = () => {
  const handleClick = () => console.log('Button clicked');

  return (
    <div>
      <Button variant="primary" onClick={handleClick}>
        主要按钮
      </Button>
      <Button variant="secondary" disabled>
        禁用按钮
      </Button>
    </div>
  );
};
```
````

## 注意事项

- 按钮文字应简洁明了
- 禁用状态需要明确的视觉反馈
- 点击事件应进行防抖处理

````

### 2. 项目文档要求

- **README.md**: 项目概述、快速开始、开发指南
- **架构文档**: 系统架构、设计决策、技术选型
- **API文档**: 接口定义、使用示例
- **部署文档**: 构建部署流程、环境配置

## 🚨 错误处理规范

### 1. 错误处理机制

项目实现了统一的错误处理系统：

#### DependencyResolver
```typescript
// 处理依赖解析错误
export class DependencyResolver {
  static resolveError(error: Error): string {
    // 提供详细的错误信息和解决建议
  }
}
````

#### BuildErrorHandler

```typescript
// 处理构建过程错误
export class BuildErrorHandler {
  static handleBuildError(error: BuildError): void {
    // 构建错误处理和恢复机制
  }
}
```

### 2. 错误处理原则

- ** graceful degradation**: 优雅降级
- ** informative errors**: 提供有意义的错误信息
- ** recovery mechanisms**: 实现错误恢复机制
- ** logging**: 完善的错误日志记录

## 🚀 部署与发布

### 1. 构建流程

```bash
# 安装依赖
npm install

# 运行测试
npm run test

# 代码检查
npm run lint

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 2. 部署要求

- **环境变量**: 通过配置文件管理环境变量
- **资源优化**: 图片压缩、代码分割、懒加载
- **性能监控**: 核心Web指标监控
- **错误追踪**: 生产环境错误监控

## 📊 质量保证

### 1. 代码质量指标

- **测试覆盖率**: ≥90%
- **代码重复率**: ≤5%
- **构建时间**: <30秒
- **包大小**: 主包<500KB

### 2. 代码审查清单

- [ ] 遵循SOLID原则
- [ ] 有完整的单元测试
- [ ] 代码注释清晰
- [ ] 性能优化考虑
- [ ] 错误处理完善
- [ ] 文档更新及时

### 3. 性能指标

- **LCP**: <2.5秒
- **FID**: <100毫秒
- **CLS**: <0.1
- **构建时间**: <30秒

## 🔄 更新与维护

### 1. 规范更新流程

1. **提出变更**: 在GitHub Issues中提出规范变更
2. **讨论评审**: 团队讨论和技术评审
3. **更新文档**: 修改本规范文档
4. **通知团队**: 通知所有开发人员
5. **逐步实施**: 制定迁移计划和时间表

### 2. 版本管理

- **规范版本**: 与本文件顶部版本号一致
- **变更记录**: 维护CHANGELOG.md记录重大变更
- **兼容性**: 确保向后兼容，重大变更需要迁移指南

## 📋 附录

### A. 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **测试框架**: Vitest + React Testing Library
- **样式方案**: CSS Modules
- **代码检查**: ESLint + Prettier

### B. 相关文档

- [架构决策文档](./architecture-decision.md)
- [迁移总结文档](./migration-summary.md)
- [组件库文档](../shared-components/README.md)
- [API接口文档](./api-documentation.md)

### C. 常见问题

**Q: 为什么选择扁平化单仓库而不是多仓库？**
A: 基于项目规模、团队结构和维护成本的综合考虑，扁平化单仓库更适合当前需求。

**Q: 如何添加新的共享组件？**
A: 在`shared-components/`目录下创建组件，遵循组件规范，更新导出文件，编写文档和测试。

**Q: 如何处理跨模块的依赖？**
A: 通过清晰的接口设计和依赖注入，避免循环依赖，保持模块间松耦合。

---

_最后更新: 2025-08-25_  
_版本: 2.0.0_  
_状态: 正式发布_
