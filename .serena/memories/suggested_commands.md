# 建议的开发命令

## 🚀 开发工作流

```bash
# 安装和设置
pnpm install              # 安装所有依赖
pnpm clean:all           # 彻底清理

# 开发服务器
pnpm dev                 # 启动所有组件开发服务器
pnpm dev:screenshot-splitter  # 启动截图工具开发

# 代码质量
pnpm lint                # ESLint检查
pnpm lint:fix            # ESLint自动修复
pnpm format              # Prettier格式化
pnpm type-check          # TypeScript类型检查

# 构建
pnpm build               # 构建所有组件
pnpm build:screenshot-splitter  # 构建特定组件
pnpm build:clean         # 清理构建目录
pnpm build:check         # 构建前检查
pnpm build:full          # 完整构建流程

# 测试
pnpm test                # 运行所有测试
pnpm test:unit           # 单元测试
pnpm test:integration    # 集成测试
pnpm test:e2e            # 端到端测试
pnpm test:coverage       # 覆盖率报告

# 预览和部署
pnpm preview             # 预览构建结果
pnpm deploy              # 部署到GitHub Pages
```

## 🔧 工具命令

```bash
# 构建分析
node tools/build-scripts/bundle-analyzer.js      # 构建产物分析
node tools/build-scripts/code-splitting-optimizer.js  # 代码分割优化
node tools/build-scripts/cdn-optimizer.js        # CDN优化

# 部署工具
node tools/build-scripts/deploy-monitor.js       # 部署监控
node tools/build-scripts/health-check-generator.js  # 健康检查生成
node tools/build-scripts/deploy-rollback.js      # 部署回滚
```

## 📊 监控和优化

```bash
# 性能监控
node tools/build-scripts/build-cache-optimizer.js    # 构建缓存优化
node tools/build-scripts/tree-shaking-optimizer.js   # Tree-shaking优化

# 内存分析
NODE_OPTIONS='--max-old-space-size=2048' pnpm test  # 增加内存运行测试
node scripts/detect-memory-leaks.js                 # 内存泄漏检测
```

## 🐛 调试命令

```bash
# 测试调试
pnpm test:file <测试文件>    # 运行特定测试文件
pnpm test:light             # 低内存模式测试
pnpm test:monitor           # 测试监控模式

# 构建调试
pnpm build:check           # 构建前检查
VITE_ASSETS_BASE_URL=https://cdn.example.com/ pnpm build  # 带CDN配置构建
```

## 🔄 组件开发

```bash
# 组件独立运行
cd packages/screenshot-splitter
pnpm dev                  # 独立开发模式
pnpm build                # 独立构建
pnpm preview              # 独立预览

# 组件测试
pnpm test                 # 组件单元测试
pnpm test:coverage        # 组件测试覆盖率
```

## 📦 包管理

```bash
# Workspace操作
pnpm --filter screenshot-splitter <command>  # 对特定包执行命令
pnpm --filter "./packages/*" <command>       # 对所有包执行命令

# 依赖管理
pnpm add <package>        # 添加依赖
pnpm remove <package>     # 移除依赖
pnpm update               # 更新依赖
```

## 🗑️ 清理命令

```bash
pnpm clean                # 清理构建产物
pnpm clean:all           # 彻底清理（包括node_modules）
rm -rf node_modules packages/*/node_modules  # 手动清理依赖
```
