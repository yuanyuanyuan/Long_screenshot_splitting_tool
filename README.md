SuperClaude init# 单模式构建Monorepo系统

一个基于pnpm workspace的现代化前端项目架构，专注于SPA多文件构建和组件独立部署。

## 🚀 项目特性

### 核心功能
- **🏗️ Monorepo架构**: 基于pnpm workspace的多包管理
- **🔄 SPA模式构建**: 专注于SPA多文件构建模式
- **🌐 资源配置化**: 支持配置化的资源基础URL，便于CDN部署
- **🧩 组件独立化**: 每个组件可独立构建、运行和部署
- **⚡ 自动化部署**: GitHub Actions自动化部署到GitHub Pages
- **🔧 性能优化**: 完整的性能优化工具套件
- **🧪 完整测试**: 单元测试、集成测试、端到端测试
- **📊 监控系统**: 部署监控、健康检查、回滚机制

### 技术栈
- **构建工具**: Vite + TypeScript
- **包管理**: pnpm workspace
- **UI框架**: React 18
- **样式**: CSS Modules + 原生CSS
- **测试**: Jest + Testing Library + Playwright
- **部署**: GitHub Actions + GitHub Pages
- **监控**: 自定义健康检查系统

## 📁 项目结构

```
Long_screenshot_splitting_tool/
├── packages/                          # 组件包目录
│   ├── screenshot-splitter/           # 长截图分割工具
│   │   ├── src/                      # 源代码
│   │   ├── dist/                     # 构建产物
│   │   ├── component.config.js       # 组件配置
│   │   ├── vite.config.js           # Vite配置
│   │   └── package.json             # 包配置
│   ├── shared-components/            # 共享组件库
│   │   ├── src/                     # 共享组件和工具
│   │   └── package.json             # 包配置
│   └── ui-library/                  # 统一UI组件库
├── tools/                           # 构建和部署工具
│   └── build-scripts/               # 构建脚本
│       ├── build-manager.js         # 构建管理器
│       ├── multi-target-deploy.js   # 多目标部署
│       ├── bundle-analyzer.js       # 构建产物分析
│       ├── code-splitting-optimizer.js # 代码分割优化
│       ├── cdn-optimizer.js         # CDN优化
│       ├── build-cache-optimizer.js # 构建缓存优化
│       ├── tree-shaking-optimizer.js # Tree-shaking优化
│       ├── deploy-monitor.js        # 部署监控
│       ├── health-check-generator.js # 健康检查生成器
│       ├── deploy-rollback.js       # 部署回滚
│       └── deploy-notification.js   # 部署通知
├── tests/                           # 测试目录
│   ├── integration/                 # 集成测试
│   └── e2e/                        # 端到端测试
├── .github/workflows/               # GitHub Actions
├── .vibedev/specs/                 # 项目规格文档
├── pnpm-workspace.yaml             # pnpm workspace配置
├── vite.config.base.js             # Vite基础配置
├── deploy.config.js                # 部署配置
├── jest.config.js                  # Jest配置
└── package.json                    # 根包配置
```

## 🛠️ 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8.0
- Git

### 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd Long_screenshot_splitting_tool

# 安装依赖
pnpm install
```

### 开发模式
```bash
# 启动所有组件的开发服务器
pnpm dev

# 启动特定组件
pnpm dev:screenshot-splitter

# 启动组件库索引页面
pnpm dev:shared-components
```

### 构建项目
```bash
# 构建所有组件（SPA模式）
pnpm build

# 构建特定组件
pnpm build:screenshot-splitter

# 使用自定义资源基础URL构建
VITE_ASSETS_BASE_URL=https://cdn.example.com/path/ pnpm build
```

### 预览构建结果
```bash
# 预览SPA模式
pnpm preview

# 预览特定组件
pnpm preview:screenshot-splitter
```

## 🔧 配置说明

### 环境变量
- `BUILD_MODE`: 构建模式，固定值：`spa`
- `COMPONENT`: 指定构建的组件名称
- `NODE_ENV`: 环境模式，可选值：`development`、`production`
- `VITE_ASSETS_BASE_URL`: 资源基础URL，用于配置CDN地址（可选）

### 构建模式详解

#### SPA模式（默认）
- 生成多文件结构
- 支持代码分割和懒加载
- 适合现代浏览器和服务器部署
- 文件结构：`index.html` + `assets/` 目录
- **资源配置**: 支持通过 `VITE_ASSETS_BASE_URL` 或 `ASSETS_BASE_URL` 环境变量配置资源基础地址
- 默认使用相对路径，配置后使用绝对路径引用资源
- 支持CDN部署，资源URL自动处理路径分隔符

### 组件配置
每个组件都有独立的 `component.config.js` 配置文件：

```javascript
module.exports = {
  name: 'screenshot-splitter',
  displayName: '长截图分割工具',
  description: '将长截图分割成多个部分的工具',
  version: '1.0.0',
  author: 'Your Name',
  homepage: 'https://your-username.github.io/Long_screenshot_splitting_tool/screenshot-splitter/',
  repository: 'https://github.com/your-username/Long_screenshot_splitting_tool',
  keywords: ['screenshot', 'split', 'image', 'tool'],
  category: 'utility',
  tags: ['图片处理', '工具'],
  // ... 更多配置
};
```

## 🚀 部署指南

### GitHub Pages自动部署

项目配置了GitHub Actions自动部署，推送到main分支时会自动触发：

1. **设置GitHub Pages**
   - 进入仓库设置 → Pages
   - Source选择 "GitHub Actions"

2. **配置完成后**
   - 推送代码到main分支
   - 自动构建和部署
   - 访问 `https://yuanyuanyuan.github.io/Long_screenshot_splitting_tool/`

### 手动部署
```bash
# 构建所有组件
pnpm build

# 部署到GitHub Pages
pnpm deploy

# 部署特定组件
pnpm deploy:screenshot-splitter
```

### 部署监控
项目包含完整的部署监控系统：

- **健康检查**: 自动生成健康检查页面
- **部署监控**: 实时监控部署状态
- **自动回滚**: 部署失败时自动回滚
- **通知系统**: 部署结果通知

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 运行端到端测试
pnpm test:e2e

# 生成测试覆盖率报告
pnpm test:coverage
```

### 测试结构
- **单元测试**: 测试单个组件和函数
- **集成测试**: 测试构建流程和组件交互
- **端到端测试**: 测试完整的用户流程

## ⚡ 性能优化

项目包含完整的性能优化工具套件：

### 构建产物分析
```bash
# 分析构建产物
node tools/build-scripts/bundle-analyzer.js
```

### 代码分割优化
```bash
# 分析代码分割机会
node tools/build-scripts/code-splitting-optimizer.js
```

### CDN资源优化
```bash
# 优化CDN资源加载
node tools/build-scripts/cdn-optimizer.js
```

### 构建缓存优化
```bash
# 优化构建缓存
node tools/build-scripts/build-cache-optimizer.js
```

### Tree-shaking优化
```bash
# 优化无用代码消除
node tools/build-scripts/tree-shaking-optimizer.js
```

## 🔍 组件开发

### 创建新组件
1. 在 `packages/` 目录下创建新的组件目录
2. 复制现有组件的结构作为模板
3. 更新 `package.json` 和 `component.config.js`
4. 在根目录的 `package.json` 中添加相应的脚本

### 组件独立化要求
- 每个组件必须可以独立运行
- 组件间通过标准化接口通信
- 共享逻辑抽取到 `shared-components`
- 遵循统一的目录结构和命名规范

### 组件接口标准
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

## 📊 监控和维护

### 健康检查
每个组件都有独立的健康检查页面：
- 访问 `/health.html` 查看整体健康状态
- 访问 `/组件名/health.html` 查看组件健康状态

### 部署状态
- 访问 `/deploy-status.html` 查看部署状态
- 实时监控部署进度和结果

### 日志和调试
- 构建日志保存在 `.logs/` 目录
- 部署日志通过GitHub Actions查看
- 错误信息会自动收集和报告

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 开发和测试
4. 提交Pull Request

### 代码规范
- 使用TypeScript
- 遵循ESLint规则
- 编写测试用例
- 更新文档

### 提交规范
```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 📝 更新日志

### v1.0.0 (2025-01-13)
- ✨ 初始版本发布
- 🏗️ 完整的Monorepo架构
- 🔄 双模式构建系统
- 🧩 组件独立化
- ⚡ 自动化部署
- 🧪 完整测试覆盖
- 📊 性能优化工具套件

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🆘 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存
pnpm clean

# 重新安装依赖
rm -rf node_modules
pnpm install

# 检查Node.js版本
node --version  # 需要 >= 18
```

#### 2. 部署失败
- 检查GitHub Pages设置
- 确认仓库权限配置
- 查看GitHub Actions日志

#### 3. 组件无法独立运行
- 检查组件配置文件
- 确认依赖关系正确
- 验证路由配置

#### 4. 性能问题
- 运行性能分析工具
- 检查构建产物大小
- 优化代码分割策略

### 获取帮助
- 查看项目文档
- 提交Issue
- 联系维护者

## 🔗 相关链接

- [项目仓库](https://github.com/your-username/Long_screenshot_splitting_tool)
- [在线演示](https://your-username.github.io/Long_screenshot_splitting_tool/)
- [问题反馈](https://github.com/your-username/Long_screenshot_splitting_tool/issues)
- [更新日志](CHANGELOG.md)

---

**Made with ❤️ by [Stark Yuan]**