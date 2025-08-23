
# 文档 12: 部署架构 (Deployment Architecture)

## 1. 概述

本文档详细描述了 `dual-build-monorepo-system` 项目的部署架构。本项目采用了一套高度自动化和可配置的部署流程，该流程通过位于 `tools/build-scripts/` 目录下的自定义 Node.js 脚本来驱动。

该部署架构的核心特点是：
*   **流程自动化**: 从代码检查到最终产物打包，整个流程可通过单条命令完成。
*   **双模式构建**: 支持为 `screenshot-splitter` 组件生成 **SPA (单页应用)** 和 **Single File (单一HTML文件)** 两种不同形态的产物，以适应不同部署场景。
*   **配置驱动**: 每个包可以通过 `component.config.js` 文件自定义其元数据和部署行为。
*   **全生命周期支持**: 脚本集覆盖了构建、准备、预览、监控、回滚和通知等 CI/CD 全生命周期的需求。

## 2. 架构图

整个部署流程可以分为三个主要阶段：**构建 (Build)** -> **准备 (Prepare)** -> **部署 (Deploy)**。

```mermaid
graph TD
    subgraph Local/CI Environment
        A[Developer/CI Trigger] --> B(pnpm run build:full);
    end

    subgraph Build Phase (build-manager.js)
        B --> C{1. Clean Dirs};
        C --> D{2. Type Check & Lint};
        D --> E{3. Build Packages};
        E -- "Generates" --> F1[dist/ (SPA)];
        E -- "Generates" --> F2[dist-single/ (Single File)];
    end

    subgraph Prepare Phase (deploy-prepare.js)
        F1 & F2 --> G{4. Prepare Artifacts};
        G -- "Reads" --> H[component.config.js];
        G -- "Generates" --> I[deploy/deploy.json];
    end

    subgraph Deploy Phase (Conceptual)
        I --> J{5. Deploy to Hosting};
        J -- "SPA Version" --> K[Static Host (e.g., Vercel, Netlify)];
        J -- "Single File Version" --> L[Embedded in other sites];
    end
    
    style B fill:#f9f,stroke:#333,stroke-width:2px
    style J fill:#cde,stroke:#333,stroke-width:2px
```
该图清晰地展示了从开发者触发命令开始，到最终产物被部署到不同环境的完整流水线。每个阶段都由一个或多个专用脚本负责，职责清晰。

## 3. 代码示例

**构建流程的编排**由 `build-manager.js` 负责，它定义了“完整构建”的各个步骤。

**文件路径**: `tools/build-scripts/build-manager.js`
```javascript
// (Simplified main function)
async function main() {
  const command = process.argv.slice(2)[0] || 'build';
  
  switch (command) {
    case 'full':
      // 完整构建流程
      cleanBuildDirs();
      if (!typeCheck()) process.exit(1);
      lintCheck();
      const fullResults = buildAll();
      generateBuildReport(fullResults);
      // ... (error handling) ...
      break;
    // ... other cases
  }
}
```
这个脚本将多个独立的任务（清理、检查、构建）串联成一个可靠的、可重复的流程，是自动化部署的基础。

## 4. 配置示例

**部署产物的准备**由 `deploy-prepare.js` 脚本处理，它会生成一个部署清单 `deploy.json`。

**文件路径**: `tools/build-scripts/deploy-prepare.js`
```javascript
// (Simplified config generation)
function generateDeployConfig(componentName, config) {
  const deployConfig = {
    name: componentName,
    version: config?.version || '1.0.0',
    buildTime: new Date().toISOString(),
    build: {
      spa: { path: `packages/${componentName}/dist`, entry: 'index.html' },
      single: { path: `packages/${componentName}/dist-single`, entry: 'index.html' }
    },
    deploy: config?.deploy || {
      paths: { spa: '/', single: `/components/${componentName}/` }
    }
  };
  return deployConfig;
}
```
生成的 `deploy.json` 文件成为了部署阶段的“路书”，它告诉部署工具（无论是自定义脚本还是第三方服务）需要上传哪些文件，以及它们应该被部署到哪个路径。这种元数据驱动的部署方式极大地增强了灵活性。

## 5. 最佳实践

*   **分离构建与部署**: 项目明确地将“构建”（生成静态文件）和“部署”（将文件上传到服务器）分离。`build-manager.js` 和 `deploy-prepare.js` 只负责生成干净、可部署的产物，而不关心具体的部署目标，这使得项目可以轻松地对接到任何静态托管平台。
*   **本地预览构建产物**: 在执行实际部署之前，应始终使用 `deploy-preview.js` 脚本在本地启动一个服务器来预览**最终的构建产物**。这有助于在上线前发现 SPA 路由、资源路径等在开发环境中不易察觉的问题。
*   **脚本化所有流程**: 将所有与构建、部署相关的操作都编写成脚本，并添加到 `package.json` 中。这可以消除手动操作带来的错误，并为持续集成（CI）提供了坚实的基础。
*   **为不同环境使用不同产物**:
    *   **SPA 产物 (`dist/`)**: 最适合作为独立网站部署到 Vercel, Netlify, GitHub Pages 等静态托管平台。
    *   **Single File 产物 (`dist-single/`)**: 非常适合需要将工具嵌入到现有网站、CMS 或作为邮件附件分发的场景。

## 6. 案例分析

**场景**: 需要将 `screenshot-splitter` 应用部署到一个新的静态托管平台，并希望部署过程完全自动化。

基于当前的部署架构，这个任务的流程如下：
1.  **CI 配置**: 在 CI/CD 平台（如 GitHub Actions）的配置文件中，添加一个部署步骤。
2.  **构建命令**: 该步骤首先执行 `pnpm run build:full`。`build-manager.js` 会自动完成清理、检查和构建，生成 `dist/` 和 `dist-single/` 目录。
3.  **准备命令**: 接着，执行 `node tools/build-scripts/deploy-prepare.js screenshot-splitter`。`deploy-prepare.js` 会生成包含所有元信息的 `deploy/deploy.json` 文件。
4.  **部署命令**: 最后，CI/CD 平台使用其提供的部署工具（如 Vercel CLI, Netlify CLI）来上传 `packages/screenshot-splitter/dist` 目录。部署工具可以被配置为读取 `deploy/deploy.json` 文件来获取部署路径等信息。
5.  **（可选）集成通知**: 在 `deploy-notification.js` 中配置一个 Webhook，在部署成功或失败后自动向团队的 Slack 或 Teams 频道发送通知。

这个案例展示了该部署架构如何通过其自定义脚本和清晰的流程分阶段，轻松地与任何现代 CI/CD 系统集成，实现完全自动化的“代码提交即部署”。
