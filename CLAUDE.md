# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

**长截图分割器**（long-screenshot-splitter）：纯前端（React 19 + TypeScript + Vite）SPA，无后端。用户上传长截图 → Web Worker 在后台按高度切片 → 预览/选择 → 导出 PDF 或 ZIP。全部计算在浏览器内完成（OffscreenCanvas + createImageBitmap）。

## 常用命令

```bash
# 安装（必须加 --legacy-peer-deps，CI 也这样）
npm install --legacy-peer-deps

# 开发（Vite dev server，端口 3000）
npm run dev

# 构建 = tsc 类型构建 + vite build + 生成 SEO 文件（三步缺一不可）
npm run build

# 预览构建产物（端口 4173）
npm run preview

# 类型检查（不产出）
npm run type-check

# Lint / 格式化
npm run lint
npm run lint:fix
npm run format
npm run format:check

# 测试（Vitest + jsdom）
npm test                 # watch 模式
npm run test:run         # 单次跑全部
npm run test:coverage    # 带覆盖率

# 跑单个测试文件 / 按名过滤
npx vitest run src/utils/__tests__/splitAnalyzer.test.ts
npx vitest run -t "should handle file upload"

# 内存吃紧时（本项目测试对内存敏感）
npm run test:light          # 单 fork，--max-old-space-size=1024
npm run test:low-memory     # 超轻量模式

# 按特性域并行跑（CI 用 paths-filter 做选择性触发）
npm run test:seo            # src/utils/seo/**
npm run test:mobile         # src/components/responsive/** + useViewport*
npm run test:integration    # tests/integration/**
```

> ⚠️ 路径别名在 `vite.config.ts`、`vitest.config.ts`、`tsconfig.json` 三处都需保持一致：`@`→`src`、`@shared` / `shared-components`→`shared-components`。

## 核心架构（以代码为准）

### 分层与编排
- **`src/App.tsx`** 是唯一编排入口（~700 行单组件）。它在 `AppContent` 内同时装配所有 hook 并通过 `switch(currentPath)` 手动渲染各页内容。新增页面逻辑几乎都要动这里。
- **状态管理 = `useReducer`**（非 Redux、非全局 Context）。核心在 `src/hooks/useAppState.ts`：`AppState`（worker/blobs/objectUrls/originalImage/imageSlices/selectedSlices/isProcessing/splitHeight/fileName）+ 一组 `AppAction`。只有 I18n 和 SEO 用 Context。
- **路由是自定义 hash 路由**（非 React Router）：`src/hooks/useRouter.ts`（运行时）+ `src/router/index.ts`（配置与匹配工具）。路径为 `/`、`/upload`、`/split`、`/export`。singlefile 构建模式切到 history 模式（`__BUILD_MODE__ === 'singlefile'`）。

### 切割流水线（最核心）
```
File → useImageProcessor → useWorker → postMessage({file, splitHeight})
                                                 ↓
                            src/workers/split.worker.js（独立线程）
                            decode(createImageBitmap) → 绘全图 OffscreenCanvas
                            → for 每段高度: drawImage 子区域 → convertToBlob(JPEG) → postMessage
                                                 ↓
              onChunk → 创建 ObjectURL + 量尺寸 → dispatch ADD_IMAGE_SLICE
```

**Worker 消息契约 v1.1**（`split.worker.js` 顶部注释，改动 worker 必须同步）：
- Main → Worker：`{ file: File, splitHeight: number }`
- Worker → Main：
  - `{ type: 'progress', progress: 0..100 }`
  - `{ type: 'chunk', blob, index }`
  - `{ type: 'done' }`
  - `{ type: 'error', message }`

类型见 `src/types/index.ts` 的 `WorkerMessage` / `AppAction` / `ImageSlice`。

### 导出
- `src/utils/pdfExporter.ts`（jszip+ jspdf）与 `src/utils/zipExporter.ts` 接收 `imageSlices` + `selectedSlices: Set<number>`，按 `index` 过滤排序后产出。选中为空时 App 层拦截。

### 资源生命周期（易踩坑）
- 每个 chunk 会 `URL.createObjectURL`，URL 记录在 `state.objectUrls`。**必须**经 `CLEANUP_SESSION` action 统一 `revokeObjectURL` + `worker.terminate()`。新会话前 `processImage` 会先 `cleanupSession`。
- Worker 卸载时由 `useWorker` 的 cleanup `terminate`。

### 配置与部署
- **统一配置入口** `config/index.ts`，聚合 `app/routing/deployment/environment/constants` 五块。部署相关全部从 `VITE_*` 环境变量读取，无硬编码（见 `config/build/deployment.config.ts`）。
- **构建产物 base 路径**由部署配置动态决定：GitHub Pages 时根据仓库名算 `/<repo>/`，否则用 `VITE_BASE_PATH`。`getAssetUrl()` / `getRouteUrl()` 统一拼资源 URL。
- **部署走 GitHub Pages**：`.github/workflows/deploy.yml` 在 push main 时构建并部署，注入 `GITHUB_PAGES=true` / `VITE_USE_ABSOLUTE_URLS=true` / `VITE_BASE_PATH=<repo>`。
- **版权信息**由 `shared-components/components/CopyrightInfo` 渲染，配置来自 `VITE_COPYRIGHT_*` 环境变量（见 `.env.example`）。
- **CI**（`.github/workflows/ci.yml`）用 `dorny/paths-filter` 区分 seo / mobile / core 变更，按域选择性跑测试。

### 国际化
- 自定义实现：`src/hooks/useI18n.ts` + `useI18nContext.tsx`，文案在 `src/locales/{zh-CN,en}.json`。所有展示文案走 `t('key', params)`，新增 UI 文案需同步两个 locale 文件并保证 key 覆盖（有 `I18nTestPanel` 仅开发环境显示）。

## 当前工作方向：内容感知切割

最近一次提交引入设计 spec：**`docs/superpowers/specs/2026-06-25-content-aware-split-design.md`**（状态：已获批，待实现）。

目标是用「内容感知」替代当前 `split.worker.js` 的固定高度等分硬切（痛点：切口劈裂文字行/气泡）。关键设计原则：
- **算法与 I/O 分离**：新增 `src/utils/splitAnalyzer.ts`（纯 TS 函数，无 DOM/canvas，可单测），worker 仅作 decode/getImageData/drawImage 胶水并调用它。
- 信号选「行级低变化率」（水平投影方差），页高驱动选点，无解时**安全回退到固定高度等分**（绝不切得比现状差）。
- 顺带修两个问题：`imageSlices` 按 index 写入（当前按异步到达顺序追加，潜在乱序）、JPEG 质量 0.9→0.92。
- 改动应 surgical：不动 UI、pdfExporter、zipExporter。详见 spec 的「改动文件清单」。

涉及本方向时，先读该 spec。

## 重要约定与陷阱

- **`docs/ARCHITECTURE.md` 是理想化文档，与真实代码多处不符**（称 React 18 实为 19、提 Redux/Web Workers 并行/PWA/微服务均为规划而非现状）。**以源码为准**，不要据该文档推断实现。
- **大量 `console.log` 调试日志**散布在 `useImageProcessor` / `useAppState` 等中；`App.tsx` 内的调试输出由 `shouldShowDebugInfo`（仅 DEV 且用户开启）门控，调试面板/`DebugInfoControl`/`I18nTestPanel` 均只开发环境渲染。
- **覆盖率阈值**（`vitest.config.ts`）：全局 70%；`src/utils/seo/**` 85%；`src/components/responsive/**` 80%。
- **ESLint flat config** 忽略 `tests/**`、`scripts/**`、`tools/**`、worker、所有 `*.test.*` —— 这些目录的 JS 不被 lint 覆盖。
- 注释与文档语言：本项目代码注释中英混用，新增注释沿用所在文件既有风格即可。
