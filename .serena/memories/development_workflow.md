# 开发工作流程

## 环境要求
- Node.js >= 18
- pnpm >= 8.0

## 常用命令

### 依赖管理
```bash
pnpm install          # 安装所有依赖
pnpm clean:all       # 清理所有依赖和构建产物
```

### 开发模式
```bash
pnpm dev              # 启动所有组件的开发服务器
pnpm dev:screenshot-splitter  # 启动特定组件开发服务器
```

### 构建命令
```bash
pnpm build            # 构建所有组件
pnpm build:screenshot-splitter  # 构建特定组件
pnpm build:clean      # 清理构建目录
pnpm build:check      # 类型和代码检查
pnpm build:full       # 完整构建流程
```

### 代码质量
```bash
pnpm lint             # ESLint代码检查
pnpm lint:fix         # ESLint自动修复
pnpm format           # Prettier代码格式化
pnpm format:check     # Prettier检查
pnpm type-check       # TypeScript类型检查
```

### 测试
```bash
pnpm test             # 运行所有测试
pnpm test:unit        # 运行单元测试
pnpm test:integration # 运行集成测试
pnpm test:e2e         # 运行端到端测试
pnpm test:coverage    # 生成测试覆盖率报告
```

### 预览和部署
```bash
pnpm preview          # 预览构建结果
pnpm deploy           # 部署到GitHub Pages
```

## 构建配置
- **环境变量**: 
  - `BUILD_MODE`: 构建模式 (固定值: `spa`)
  - `COMPONENT`: 指定构建的组件名称
  - `VITE_ASSETS_BASE_URL`: 资源基础URL (用于CDN部署)

## 组件开发流程
1. 在 `packages/` 目录下创建新组件
2. 复制现有组件结构作为模板
3. 更新 `package.json` 和 `component.config.js`
4. 在根目录 `package.json` 中添加相应脚本