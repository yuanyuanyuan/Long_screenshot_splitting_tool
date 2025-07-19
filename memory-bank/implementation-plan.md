# 实施计划 (Implementation Plan)

**版本:** 1.0.0
**关联PRD:** [产品需求文档.md](./memory-bank/产品需求文档.md)
**关联技术栈:** [tech-stack.md](./memory-bank/tech-stack.md)

---

## 1. 总体目标

根据产品需求，完成两大核心功能的开发：
1.  将图片处理上限提升至 20MB。
2.  增加分割后的图片预览功能。

## 2. 任务分解 (Task Breakdown)

### 第一部分：提升单图处理上限 (20MB)

#### 任务 1.1: 修改文件上传逻辑

-   **文件:** `src/pages/index.astro` (或其他处理文件上传的前端组件)
-   **目标:** 调整前端代码，将文件大小限制从 10MB 修改为 20MB。
-   **原子步骤:**
    1.  [ ] 定位处理文件上传的 JavaScript 代码块。
    2.  [ ] 找到 `MAX_FILE_SIZE` 类似的常量或硬编码 `10 * 1024 * 1024`。
    3.  [ ] 将其值修改为 `20 * 1024 * 1024`。
    4.  [ ] 同步修改文件过大时的错误提示信息，将 "10MB" 改为 "20MB"。
-   **验收标准:**
    -   [ ] 尝试上传 15MB 的图片，可以通过验证。
    -   [ ] 尝试上传 25MB 的图片，会显示 "文件不能超过 20MB" 的错误提示。

#### 任务 1.2: (已在技术栈中识别) 引入 Web Worker 优化性能

-   **文件:**
    -   新建 `src/workers/image-processor.js`
    -   修改 `src/pages/index.astro`
-   **目标:** 将耗时的图片切割逻辑从主线程剥离到 Web Worker 中，避免 UI 阻塞。
-   **原子步骤:**
    1.  [ ] 创建 `src/workers/image-processor.js` 文件。
    2.  [ ] 在 `image-processor.js` 中，设置 `onmessage` 监听器，接收主线程传来的图片数据（如 `ImageBitmap` 或 `ImageData`）和切割高度。
    3.  [ ] 在 `image-processor.js` 中，实现核心的图片切割算法，将一张大图切割成多个 `ImageData` 对象。
    4.  [ ] 将切割后的 `ImageData` 数组通过 `postMessage` 回传给主线程。
    5.  [ ] 在 `src/pages/index.astro` 中，修改原有的分割逻辑。
    6.  [ ] 在主线程中，创建 `Worker` 实例。
    7.  [ ] 当用户点击“开始分割”时，通过 `postMessage` 将 `ImageBitmap` 发送给 Worker。（注意：`ImageBitmap` 是可转移对象，可以零成本传递给 Worker）。
    8.  [ ] 设置 `onmessage` 监听器，接收 Worker 处理完返回的 `ImageData` 数组。
-   **验收标准:**
    -   [ ] 处理 15MB-20MB 图片时，页面 UI（如 loading 动画）保持流畅。
    -   [ ] Worker 能成功接收图片数据，并返回切割后的数据。
    -   [ ] 主线程能正确接收 Worker 返回的数据。

---

### 第二部分：增加分割后预览功能

#### 任务 2.1: 构建预览区 UI 组件

-   **文件:** `src/pages/index.astro`
-   **目标:** 在页面上添加一个新的区域，用于展示分割后的图片。
-   **原子步骤:**
    1.  [ ] 在 HTML 结构中，于文件上传区域下方，添加一个新的 `<div>` 作为预览区的容器，例如 `<div id="preview-container" class="hidden ..."></div>`。
    2.  [ ] 为这个容器和其子元素设计 Tailwind CSS 样式，使其成为一个响应式的网格（grid）布局。
    3.  [ ] 初始状态下，该区域应被隐藏。
-   **验收标准:**
    -   [ ] 页面加载后，预览区不可见。

#### 任务 2.2: 实现预览逻辑

-   **文件:** `src/pages/index.astro`
-   **目标:** 将 Web Worker 返回的图片数据显示在预览区。
-   **原子步骤:**
    1.  [ ] 当主线程的 Worker 监听器收到返回的 `ImageData` 数组后，首先清空预览区 `preview-container` 的内容。
    2.  [ ] 遍历 `ImageData` 数组。
    3.  [ ] 对于每一个 `ImageData`，动态创建一个 `<canvas>` 元素。
    4.  [ ] 设置 canvas 的 `width` 和 `height` 属性，使其与 `ImageData` 的尺寸匹配。
    5.  [ ] 使用 `canvas.getContext('2d').putImageData(imageData, 0, 0)` 将图片数据绘制到 canvas 上。
    6.  [ ] 将创建好的 `<canvas>` 元素包裹在一个 `div` 中（便于添加边框、间距等样式），然后追加到 `preview-container` 中。
    7.  [ ] 所有 canvas 创建并追加完成后，移除 `preview-container` 的 `hidden` class，使其可见。
-   **验收标准:**
    -   [ ] 分割完成后，预览区正确显示，并包含所有分割出的小图。
    -   [ ] 图片内容和顺序正确。
    -   [ ] 页面布局在预览区出现后依然保持正常。

---

## 3. 实施顺序

建议按以下顺序进行开发：
1.  **任务 1.1**: 先快速修改文件大小限制，这是最简单的变更。
2.  **任务 2.1**: 构建静态的预览区 UI，确保样式符合预期。
3.  **任务 2.2 (部分) & 1.2**: 这是核心。将原有的切割逻辑（不含 Web Worker）改造为能生成 `ImageData` 并在预览区 `canvas` 中展示。先保证功能跑通。
4.  **任务 1.2 (完善)**: 将跑通的切割逻辑迁移到 Web Worker 中，完成性能优化。

这个顺序遵循了“先功能，后性能”、“先静态，后动态”的原则，便于调试和验证。 