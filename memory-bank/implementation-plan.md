# 实施计划 (Implementation Plan) - v1.1 (Final)

**版本:** 1.1.0
**关联 PRD 版本:** 2.0.0
**日期:** 2025-07-19

---

## 1. 总体目标

本次实施的核心目标是重构应用，以支持高达 50MB 的大文件处理，并引入一个全新的、交互式的预览界面。我们将遵循 `tech-stack.md` 中定义的技术方案，核心是引入 Web Worker 来处理计算密集型任务，确保主线程（UI）的流畅性。

## 2. 实施阶段与原子任务

我们将整个实施过程分为三个主要阶段：**后端逻辑 (Worker)**、**前端界面 (UI)** 和 **集成与收尾**。

---

### **阶段一：核心后端逻辑 —— Web Worker 实现**

**目标:** 创建一个可以独立运行的 Web Worker，负责接收图片文件、进行切割，并将结果发送回主线程。

*   **`task-1.1`**: **创建 Worker 文件与最终版消息契约**
    *   **描述:** 在 `src/scripts/` 目录下创建一个新的 `split.worker.js` 文件。
    *   **动作:** 在文件顶部用注释形式定义清晰的消息传递契约 (Data Contract)。
        ```javascript
        // Message Contract (v1.1):
        // From Main to Worker: { file: File, splitHeight: number }
        // From Worker to Main:
        // - Progress: { type: 'progress', progress: number } // 0-100 percentage
        // - Chunk:    { type: 'chunk', blob: Blob, index: number }
        // - Done:     { type: 'done' } // Simplified completion signal
        // - Error:    { type: 'error', message: string }
        ```
    *   **验证:** 文件被创建，且注释已按 v1.1 版本更新。

*   **`task-1.2`**: **实现 Worker 的消息监听与初始化**
    *   **描述:** 在 `split.worker.js` 中设置 `self.onmessage` 监听器。
    *   **动作:** 编写代码以解析传入的 `file` 和 `splitHeight`。添加错误处理。
    *   **验证:** 在 `main.js` 中发送测试消息，确认 Worker 能接收到数据。

*   **`task-1.3`**: **实现图片解码与 OffscreenCanvas 绘制**
    *   **描述:** 在 Worker 中，使用 `createImageBitmap` 解码图片。
    *   **动作:** 创建一个 `OffscreenCanvas`，设置其尺寸，并将图片位图绘制上去。
    *   **验证:** `console.log()` OffscreenCanvas 的尺寸，确认与原图一致。

*   **`task-1.4`**: **实现图片切割、Blob 生成与进度上报**
    *   **描述:** 编写循环逻辑，根据 `splitHeight` 进行切割，并在循环中上报进度。
    *   **动作:**
        1.  在循环外部，计算出切片总数 `totalChunks`。
        2.  在循环内部，每处理完一个切片：
            a.  创建临时 `OffscreenCanvas` 并使用 `drawImage` 复制区域。
            b.  调用 `convertToBlob()` 转换为 Blob 对象。
            c.  通过 `postMessage` 发送 `{ type: 'chunk', ... }` 消息。
            d.  计算 `progress = Math.round(((index + 1) / totalChunks) * 100)` 并发送 `{ type: 'progress', progress }` 消息。
    *   **验证:** 在主线程能接收到 `chunk` 消息和 `progress` 消息，且进度值从 0 到 100 增长。

*   **`task-1.5`**: **实现完成与错误消息发送**
    *   **描述:** 在所有切片处理完成后，发送简化的 `'done'` 消息。
    *   **动作:** 在循环结束后 `postMessage({ type: 'done' })`。将所有操作包裹在 `try...catch` 块中，在 `catch` 中 `postMessage({ type: 'error', ... })`。
    *   **验证:** 确认在成功处理后能收到 `done` 消息，在错误场景下能收到 `error` 消息。

---

### **阶段二：前端界面 —— 预览与进度组件开发**

**目标:** 使用 Astro 和 Tailwind CSS 构建新的 UI 组件，初始状态下均隐藏。

*   **`task-2.1`**: **创建预览界面 Astro 组件**
    *   **描述:** 创建 `src/components/Previewer.astro`。
    *   **动作:** 包含一个隐藏的根 `div` (`id="preview-section"`)，内部分为左右两栏 (`#thumbnail-list`, `#preview-image`)。
    *   **验证:** 组件引入后，页面不可见，但 DOM 结构存在。

*   **`task-2.2`**: **创建进度条 UI 组件**
    *   **描述:** 在 `pages/index.astro` 或 `MainLayout.astro` 的合适位置，添加一个进度条组件。
    *   **动作:** 添加一个外层 `div` (`id="progress-container"`)，初始 `hidden`。内部包含一个用于显示进度的条形 `div` (`id="progress-bar"`)。
    *   **验证:** 页面加载时不可见，但 DOM 结构存在。

*   **`task-2.3`**: **实现缩略图动态添加**
    *   **描述:** 编写一个函数，用于将 Worker 发来的 `chunk` 渲染为缩略图。
    *   **动作:** 函数接收 `{ blob, index }`，创建 `<img>` 元素（`src` 来自 `URL.createObjectURL(blob)`），并追加到 `#thumbnail-list`。
    *   **验证:** 手动调用此函数，缩略图能被正确添加。

*   **`task-2.4`**: **实现大图预览与交互**
    *   **描述:** 实现点击缩略图后更新大图预览的逻辑。
    *   **动作:** 在 `#thumbnail-list` 上添加事件委托，点击时更新 `#preview-image` 的 `src`，并处理高亮样式。
    *   **验证:** 点击不同缩略图，大图和高亮样式均正确更新。

*   **`task-2.5`**: **添加导出按钮**
    *   **描述:** 在 `Previewer.astro` 中添加“导出为 ZIP”和“导出为 PDF”两个按钮。
    *   **动作:** 确保按钮有明确的 ID，初始状态为禁用。
    *   **验证:** 页面上能看到这两个按钮。

---

### **阶段三：集成与状态管理**

**目标:** 将 Worker 逻辑与 UI 组件连接起来，引入状态管理，完成整个工作流程。

*   **`task-3.1`**: **初始化应用状态管理器**
    *   **描述:** 在 `src/scripts/main.js` 的顶部，初始化一个全局状态对象。
    *   **动作:** 创建 `let appState = { blobs: [], objectUrls: [] }`。
    *   **验证:** `appState` 对象存在且结构正确。

*   **`task-3.2`**: **改造主上传逻辑与资源清理**
    *   **描述:** 修改处理文件上传的函数，在开始时执行清理，并启动 Worker。
    *   **动作:**
        1.  当用户点击“开始分割”时，首先执行清理函数：遍历 `appState.objectUrls` 并调用 `URL.revokeObjectURL()`，然后清空 `appState.blobs` 和 `appState.objectUrls`。
        2.  显示进度条容器 (`#progress-container`)。
        3.  实例化 `Worker` 并发送初始化消息。
    *   **验证:** 第二次上传时，前一次的 Object URL 被释放，`appState` 被重置。

*   **`task-3.3`**: **连接 Worker 消息与 UI**
    *   **描述:** 在 `main.js` 中完整实现 Worker 的 `onmessage` 监听器。
    *   **动作:**
        -   收到 `'progress'` 消息时，更新 `#progress-bar` 的宽度样式。
        -   收到 `'chunk'` 消息时，将 `blob` 存入 `appState.blobs`，调用 `task-2.3` 的函数创建缩略图并将其 URL 存入 `appState.objectUrls`。
        -   收到 `'done'` 消息时，隐藏进度条，显示预览界面 (`#preview-section`)，并启用导出按钮。
        -   收到 `'error'` 消息时，隐藏进度条，`alert` 错误信息。
    *   **验证:** 完成一次完整流程，进度条、缩略图、预览界面按预期工作。

*   **`task-3.4`**: **实现导出功能**
    *   **描述:** 为“导出”按钮绑定事件监听器。
    *   **动作:** 点击导出按钮时，从 `appState.blobs` 中读取所有 Blob 数据，并使用 `JSZip` 或 `jsPDF` 生成文件。
    *   **验证:** 成功导出包含所有预览图片的 ZIP 和 PDF 文件。

*   **`task-3.5`**: **最终清理**
    *   **描述:** 清理所有临时添加的测试代码和 `console.log`。
    *   **动作:** 审查代码，移除不再需要的旧逻辑和调试信息。
    *   **验证:** 代码库整洁，没有遗留的调试代码。 