# 长截图分割器项目文档索引

## 📚 项目概述

**项目名称**: 长截图分割器 (Long Screenshot Splitter)  
**版本**: v1.0.0  
**架构**: 扁平化单仓库架构  
**技术栈**: React 18 + TypeScript + Vite  

一个基于现代前端技术栈的长截图分割工具，支持将长截图按指定高度分割成多个部分，并支持导出为 PDF 或 ZIP 格式。

---

## 📁 项目结构图谱

```
long-screenshot-splitter/
├── 📁 src/                     # 主应用源代码
│   ├── 📁 components/          # React 组件 (14+ 组件)
│   ├── 📁 hooks/              # 自定义 Hooks (8+ hooks)
│   ├── 📁 utils/              # 工具函数 (15+ 工具)
│   ├── 📁 types/              # TypeScript 类型定义
│   ├── 📁 locales/            # 国际化文件 (中文/英文)
│   ├── 📁 assets/             # 静态资源
│   ├── 📁 config/             # 配置文件
│   └── 📁 workers/            # Web Workers
├── 📁 shared-components/       # 共享组件库
│   ├── 📁 components/         # 可复用组件 (Button, CopyrightInfo)
│   ├── 📁 managers/           # 状态管理器
│   ├── 📁 types/              # 共享类型定义
│   └── 📁 utils/              # 共享工具
├── 📁 config/                 # 项目配置
│   ├── 📁 app/                # 应用配置
│   ├── 📁 env/                # 环境配置
│   ├── 📁 build/              # 构建配置
│   └── 📁 constants/          # 常量定义
├── 📁 tools/                  # 构建和部署工具
│   └── 📁 build-scripts/      # 构建脚本 (20+ 脚本)
├── 📁 tests/                  # 测试文件
│   ├── 📁 integration/        # 集成测试
│   └── 📁 e2e/               # 端到端测试
├── 📁 docs/                   # 项目文档
└── 📁 .github/                # GitHub Actions
    └── 📁 workflows/          # CI/CD 工作流
```

---

## 📖 核心文档导航

### 1. 🚀 快速开始
- **[README.md](../README.md)** - 项目概述、安装、使用指南
- **[配置管理](./configuration.md)** - 环境配置、部署配置
- **[前端规范](./frontend-spec-new.md)** - 架构决策、编码规范、测试规范

### 2. 🏗️ 架构设计
- **项目结构**: 扁平化单仓库架构，统一依赖管理
- **技术栈**: React 18, TypeScript, Vite, Vitest
- **设计模式**: SOLID 原则, 组件化设计, Hook 模式

### 3. 🧪 质量保证
- **测试覆盖**: 90%+ 覆盖率要求
- **代码质量**: ESLint + Prettier + TypeScript
- **性能指标**: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## 🔧 开发工具链

### 核心技术
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.1.1 | UI 框架 |
| TypeScript | 5.8.3 | 类型系统 |
| Vite | 4.5.0 | 构建工具 |
| Vitest | 3.2.4 | 测试框架 |

### 开发工具
| 工具 | 配置文件 | 功能 |
|------|----------|------|
| ESLint | `eslint.config.js` | 代码检查 |
| Prettier | `.prettierrc` | 代码格式化 |
| PostCSS | `postcss.config.js` | CSS 处理 |
| Tailwind | `tailwind.config.js` | CSS 框架 |

---

## 📦 关键组件索引

### 主要业务组件
| 组件 | 文件路径 | 功能描述 |
|------|----------|----------|
| `ScreenshotSplitter` | `src/components/ScreenshotSplitter.tsx` | 核心分割功能组件 |
| `FileUploader` | `src/components/FileUploader.tsx` | 文件上传组件 |
| `ImagePreview` | `src/components/ImagePreview.tsx` | 图片预览组件 |
| `ExportControls` | `src/components/ExportControls.tsx` | 导出控制组件 |
| `Navigation` | `src/components/Navigation.tsx` | 导航组件 |

### 共享组件库
| 组件 | 文件路径 | 功能描述 |
|------|----------|----------|
| `Button` | `shared-components/components/Button/` | 通用按钮组件 |
| `CopyrightInfo` | `shared-components/components/CopyrightInfo/` | 版权信息组件 |

### 核心 Hooks
| Hook | 文件路径 | 功能描述 |
|------|----------|----------|
| `useImageProcessor` | `src/hooks/useImageProcessor.ts` | 图片处理逻辑 |
| `useAppState` | `src/hooks/useAppState.ts` | 应用状态管理 |
| `useI18n` | `src/hooks/useI18n.ts` | 国际化管理 |
| `useWorker` | `src/hooks/useWorker.ts` | Web Worker 集成 |

---

## 🛠️ 工具函数库

### 图片处理工具
| 工具 | 文件路径 | 功能 |
|------|----------|------|
| `textFormatter` | `src/utils/textFormatter.ts` | 文本格式化 |
| `pdfExporter` | `src/utils/pdfExporter.ts` | PDF 导出 |
| `zipExporter` | `src/utils/zipExporter.ts` | ZIP 导出 |

### 性能优化工具
| 工具 | 文件路径 | 功能 |
|------|----------|------|
| `performanceMonitor` | `src/utils/analytics/performanceMonitor.ts` | 性能监控 |
| `textDisplayOptimizer` | `src/utils/textDisplayOptimizer.ts` | 文本显示优化 |

### 构建工具
| 脚本 | 文件路径 | 功能 |
|------|----------|------|
| `build-manager` | `tools/build-scripts/build-manager.js` | 构建管理 |
| `deploy-prepare` | `tools/build-scripts/deploy-prepare.js` | 部署准备 |
| `bundle-analyzer` | `tools/build-scripts/bundle-analyzer.js` | 包分析 |

---

## 📊 测试架构

### 测试策略
```
测试金字塔
├── Unit Tests (单元测试) - 90%+ 覆盖率
│   ├── 组件测试 (__tests__/*.test.tsx)
│   ├── Hook 测试 (__tests__/*.test.ts)  
│   └── 工具函数测试 (__tests__/*.test.ts)
├── Integration Tests (集成测试)
│   └── tests/integration/*.test.js
└── E2E Tests (端到端测试)
    └── tests/e2e/*.test.js
```

### 测试文件分布
| 目录 | 测试类型 | 文件数量 |
|------|----------|----------|
| `src/**/__tests__/` | 单元测试 | 15+ 测试文件 |
| `tests/integration/` | 集成测试 | 1 测试文件 |
| `tests/e2e/` | E2E 测试 | 1 测试文件 |

---

## 🚀 部署配置

### 环境配置
| 环境 | 配置文件 | 用途 |
|------|----------|------|
| 开发环境 | `.env.development` | 本地开发 |
| 测试环境 | `.env.test` | 测试部署 |
| 生产环境 | `.env.production` | 生产部署 |

### CI/CD 工作流
| 工作流 | 文件 | 触发条件 |
|--------|------|----------|
| 持续集成 | `.github/workflows/ci.yml` | Push, PR |
| 自动部署 | `.github/workflows/deploy.yml` | 主分支推送 |

---

## 🔍 快速查找指南

### 功能实现查找
- **图片分割逻辑** → `src/components/ScreenshotSplitter.tsx` + `src/hooks/useImageProcessor.ts`
- **导出功能** → `src/utils/pdfExporter.ts` + `src/utils/zipExporter.ts`
- **国际化** → `src/locales/` + `src/hooks/useI18n.ts`
- **性能监控** → `src/utils/analytics/performanceMonitor.ts`

### 配置修改查找
- **构建配置** → `vite.config.ts` + `config/build/`
- **环境变量** → `.env.*` 文件
- **路由配置** → `config/app/routing.config.ts`
- **应用配置** → `config/app/app.config.ts`

### 样式查找
- **全局样式** → `src/index.css` + `src/App.css`
- **组件样式** → `*.module.css` 文件
- **Tailwind 配置** → `tailwind.config.js`

---

## 🆘 故障排除索引

### 常见问题
| 问题类型 | 查找位置 | 相关文档 |
|----------|----------|----------|
| 构建失败 | [README.md 故障排除章节](../README.md#🔍-故障排除) | 构建脚本文档 |
| 测试问题 | 测试配置 + 内存优化脚本 | 前端规范测试章节 |
| 部署问题 | [配置管理文档](./configuration.md) | GitHub Actions 工作流 |
| 性能问题 | 性能监控工具 + 优化脚本 | 性能优化章节 |

### 错误处理器
| 处理器 | 文件路径 | 处理范围 |
|--------|----------|----------|
| `BuildErrorHandler` | `src/utils/BuildErrorHandler.ts` | 构建错误 |
| `navigationErrorHandler` | `src/utils/navigationErrorHandler.ts` | 导航错误 |
| `DependencyResolver` | `src/utils/DependencyResolver.ts` | 依赖解析错误 |

---

## 📚 扩展资源

### 技术文档
- **React 官方文档**: https://react.dev/
- **TypeScript 官方文档**: https://www.typescriptlang.org/
- **Vite 官方文档**: https://vitejs.dev/
- **Vitest 官方文档**: https://vitest.dev/

### 项目特定资源
- **组件文档模板**: `docs/component-docs/Component.README.template.md`
- **架构迁移记录**: `.vibedev/specs/multi-repo-architecture-migration/tasks.md`
- **构建规则**: `.roo/rules/rules.md`

---

## 📅 更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2025-08-26 | 完成架构迁移到扁平化单仓库结构 |
| v1.0.0 | 2025-08-26 | 优化构建配置和依赖管理 |
| v1.0.0 | 2025-08-26 | 完善测试覆盖和错误处理 |
| v1.0.0 | 2025-08-26 | 创建项目文档索引 |

---

## 🤝 贡献指南

### 文档贡献
1. 发现文档问题或需要更新 → 提交 Issue
2. 添加新功能 → 同时更新相关文档
3. 修改架构 → 更新架构文档和索引

### 文档维护
- **责任人**: 开发团队
- **更新频率**: 每个版本发布时
- **检查清单**: 文档完整性、链接有效性、示例正确性

---

*📝 最后更新: 2025-08-26*  
*📋 文档版本: v1.0.0*  
*🔗 项目地址: [GitHub](https://github.com/your-username/long-screenshot-splitter)*