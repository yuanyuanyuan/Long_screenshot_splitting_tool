# 项目概述

**项目名称**: Long_screenshot_splitting_tool (双模式构建Monorepo系统)
**项目类型**: 现代化前端项目架构
**核心功能**: SPA多文件构建和组件独立部署

## 技术栈
- **构建工具**: Vite + TypeScript
- **包管理**: pnpm workspace
- **UI框架**: React 18
- **样式**: CSS Modules + 原生CSS
- **测试**: Jest + Testing Library + Playwright
- **部署**: GitHub Actions + GitHub Pages

## 项目结构
- `packages/`: 组件包目录
  - `screenshot-splitter/`: 长截图分割工具
  - `shared-components/`: 共享组件库
  - `ui-library/`: 统一UI组件库
- `tools/build-scripts/`: 构建和部署工具
- `tests/`: 测试目录
- `.github/workflows/`: GitHub Actions

## 构建模式
- **SPA模式**: 多文件结构，支持代码分割和懒加载
- **资源配置化**: 支持配置化的资源基础URL，便于CDN部署

## 组件特性
- 每个组件可独立构建、运行和部署
- 组件间通过标准化接口通信
- 共享逻辑抽取到 shared-components