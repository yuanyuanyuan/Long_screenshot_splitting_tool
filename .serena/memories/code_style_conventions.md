# 代码风格和规范

## TypeScript配置
- **严格模式**: 启用所有严格类型检查
- **模块系统**: ES Module (type: module)
- **目标版本**: ES2020

## 代码格式化 (Prettier)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## ESLint规则
- **基础配置**: @eslint/js recommended + TypeScript recommended
- **React规则**: react-hooks + react-refresh
- **Prettier集成**: eslint-config-prettier
- **自定义规则**:
  - `@typescript-eslint/no-unused-vars`: error (忽略 `_` 前缀参数)
  - `@typescript-eslint/no-explicit-any`: warn
  - `react-refresh/only-export-components`: warn

## 命名规范
- **文件命名**: kebab-case (例如: `my-component.tsx`)
- **组件命名**: PascalCase (例如: `MyComponent`)
- **变量/函数**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **类型/接口**: PascalCase (例如: `UserData`)

## 目录结构规范
- `src/`: 源代码目录
- `dist/`: 构建产物目录
- `__tests__/`: 测试文件目录
- `components/`: React组件
- `hooks/`: 自定义React Hooks
- `utils/`: 工具函数
- `types/`: TypeScript类型定义

## 提交规范
```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 组件接口标准
```typescript
interface ComponentInterface {
  name: string;
  version: string;
  mount(container: HTMLElement): void;
  unmount(): void;
  getState(): any;
  setState(state: any): void;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, data?: any): void;
}
```