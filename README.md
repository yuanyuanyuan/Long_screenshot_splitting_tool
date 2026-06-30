# 长截图分割器

一个基于 React + TypeScript + Vite 的长截图分割工具，支持将长截图按指定高度分割成多个部分，并支持导出为 PDF 或 ZIP 格式。

## ✨ 特性

- 📸 支持多种图片格式（PNG、JPG、JPEG、WebP、GIF）
- ✂️ 智能分割：按指定高度分割长截图
- 📄 多种导出格式：PDF、ZIP
- 🎨 现代化 UI 设计
- 📱 响应式布局，支持移动端
- 🚀 高性能处理
- 🌐 支持多语言（中文/英文）
- 🔧 可配置的分割参数

## 🏗️ 架构特点

本项目采用**扁平化单仓库架构**，具有以下优势：

- 🎯 **简洁明了**：统一的项目结构，降低认知负担
- 🔧 **易于维护**：单一构建配置，减少维护成本
- 🚀 **开发高效**：统一的开发流程，提升开发体验
- 📦 **依赖清晰**：简化的依赖管理，避免版本冲突

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 📁 项目结构

```
long-screenshot-splitter/
├── src/                    # 主应用源代码
│   ├── components/         # React 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript 类型定义
│   └── assets/            # 静态资源
├── shared-components/      # 共享组件库
│   ├── components/         # 可复用组件
│   ├── managers/          # 状态管理
│   ├── types/             # 共享类型
│   └── utils/             # 共享工具
├── config/                # 配置文件
│   ├── app/               # 应用配置
│   ├── build/             # 构建配置
│   └── constants/         # 常量定义
├── tests/                 # 测试文件
├── docs/                  # 项目文档
│   ├── PROJECT-INDEX.md   # 📚 项目文档索引
│   ├── API-REFERENCE.md   # 🔌 API 参考文档
│   ├── ARCHITECTURE.md    # 🏗️ 系统架构文档
│   └── DEVELOPMENT-GUIDE.md # 🛠️ 开发指南
└── dist/                  # 构建输出
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试UI界面
npm run test:ui
```

### 测试策略

- **单元测试**：测试单个组件和函数
- **集成测试**：测试组件间的交互
- **端到端测试**：测试完整的用户流程

## 🔧 开发指南

### 代码规范

```bash
# 代码检查
npm run lint

# 自动修复代码问题
npm run lint:fix

# 代码格式化
npm run format

# 检查代码格式
npm run format:check
```

### 类型检查

```bash
# TypeScript类型检查
npm run type-check
```

## 🚀 部署

### SPA模式构建

```bash
# 构建SPA版本
npm run build:spa

# 预览SPA版本
npm run preview:spa
```

### 独立运行

```bash
# 构建并启动独立版本
npm run standalone
```

## 📊 性能优化

项目包含多种性能优化策略：

- **代码分割**：按需加载组件
- **资源优化**：图片压缩和懒加载
- **构建优化**：Tree-shaking和压缩
- **缓存策略**：合理的缓存配置

## 🔍 故障排除

### 常见问题

#### 构建失败

```bash
# 清理构建缓存
npm run clean

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

#### 内存不足

```bash
# 使用轻量级测试模式
npm run test:light

# 使用超轻量级模式
npm run test:low-memory
```

#### 测试问题

```bash
# 运行智能测试
npm run test:smart

# 监控测试性能
npm run test:monitor
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 提交规范

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 📝 更新日志

### v1.0.0

- ✨ 完成架构迁移到扁平化单仓库结构
- 🏗️ 优化构建配置和依赖管理
- 🧪 完善测试覆盖和错误处理
- 📚 更新项目文档和开发指南

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📚 文档导航

- **[📖 项目文档索引](docs/PROJECT-INDEX.md)** - 完整的项目文档导航和结构说明
- **[🔌 API 参考文档](docs/API-REFERENCE.md)** - 详细的组件、Hook 和工具函数 API
- **[🏗️ 系统架构文档](docs/ARCHITECTURE.md)** - 架构设计决策和技术选型说明
- **[🛠️ 开发指南](docs/DEVELOPMENT-GUIDE.md)** - 开发环境设置和工作流程
- **[⚙️ 配置管理](docs/configuration.md)** - 环境配置和部署指南
- **[📋 前端技术规范](docs/frontend-spec-new.md)** - 编码规范和最佳实践

## 🆘 获取帮助

- 查看 [项目文档索引](docs/PROJECT-INDEX.md) 获取完整文档导航
- 提交 [Issue](https://github.com/your-username/long-screenshot-splitter/issues)
- 参考 [开发指南](docs/DEVELOPMENT-GUIDE.md) 解决开发问题

---

**Made with ❤️ by [Your Name]**
