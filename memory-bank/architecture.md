# 项目架构文档 (Architecture Document)


**版本:** 1.1.0
**最后更新:** 2025-01-19 (task-1.1 完成后更新)

---

## 1. 架构概述

本项目是一个基于 Astro 的长截图分割工具，采用前端无后端架构。核心特性是支持高达 50MB 的大文件处理，通过 Web Worker 实现异步图片处理，确保 UI 线程的流畅性。

## 2. 技术架构

### 2.1 整体架构模式

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   主线程 (UI)    │───▶│   Web Worker    │───▶│   文件处理       │
│                 │    │                 │    │                 │
│ - 用户交互       │    │ - 图片解码       │    │ - ZIP 导出      │
│ - 进度显示       │    │ - 图片切割       │    │ - PDF 导出      │
│ - 预览界面       │    │ - Blob 生成     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 核心技术栈

- **前端框架:** Astro + Tailwind CSS
- **并发处理:** Web Workers
- **图像处理:** OffscreenCanvas, createImageBitmap
- **文件处理:** JSZip.js, jsPDF.js, FileSaver.js

## 3. 文件结构

```
src/
├── scripts/
│   ├── main.js              # 主线程逻辑
│   ├── i18n.js             # 国际化支持
│   ├── modules/
│   │   └── fileProcessor.js # 文件处理模块 ✅ (task-1.1 更新)
│   └── split.worker.js     # 图片分割 Worker (源文件)
├── components/
│   ├── Feedback.astro      # 反馈组件
│   └── Previewer.astro     # 预览组件 ✅ [新增]
├── layouts/                # 页面布局
├── pages/                  # 页面文件
└── styles/                 # 样式文件

public/
└── split.worker.js         # 部署用 Worker 文件 ✅ (task-1.1 新增)
```

## 4. Web Worker 架构设计

### 4.1 消息传递契约 (v1.1)

**从主线程到 Worker:**
```javascript
{ file: File, splitHeight: number }
```

**从 Worker 到主线程:**
```javascript
// 进度更新
{ type: 'progress', progress: number } // 0-100 百分比

// 切片数据
{ type: 'chunk', blob: Blob, index: number }

// 完成信号
{ type: 'done' }

// 错误信息
{ type: 'error', message: string }
```

## 4. Web Worker 架构设计
### 4.2 Worker 职责

- **图片解码:** 使用 `createImageBitmap()` 高效解码 ✅ (已实现)
- **Canvas 绘制:** 在 `OffscreenCanvas` 上进行渲染操作 ✅ (已实现)
- **图片切割:** 按指定高度分割图片 ✅ (已实现)
- **Blob 生成:** 将切片转换为 Blob 对象 ✅ (已实现)
- **路径管理:** GitHub Pages 兼容的资源路径 ✅ (task-1.1)

### 4.3 Worker 部署架构 (v1.1 - task-1.1 更新)

**开发环境:**
- 源文件位置: `src/scripts/split.worker.js`
- 用于开发和调试

**生产环境:**
- 部署文件位置: `public/split.worker.js`
- 访问路径: `/Long_screenshot_splitting_tool/split.worker.js`
- 自动复制到 `dist/` 目录进行部署

**路径解析策略:**
- 使用绝对路径确保 GitHub Pages 兼容性
- 包含 base 路径避免 404 错误
- 支持本地开发和生产部署的一致性
- **进度上报:** 实时报告处理进度 ✅ (task-1.3, task-1.4)
- **错误处理:** 捕获并报告处理异常 ✅ (task-1.3, task-1.5)
- **完成通知:** 发送处理完成的信号消息 ✅ (task-1.5)

## 5. 设计决策记录

### 5.1 为什么选择 Web Worker？

**问题:** 直接在主线程处理 50MB 大图会导致 UI 冻结，用户体验差。

**决策:** 引入 Web Worker 进行异步处理。

**理由:**
- 将计算密集型任务从主线程剥离
- 保持 UI 响应性
- 支持真正的并发处理
- 浏览器原生支持，无需额外依赖

**权衡:**
- 增加了代码复杂度
- 需要设计消息传递机制
- 但显著提升了用户体验

### 5.2 为什么使用 OffscreenCanvas？

**问题:** Worker 中无法直接操作 DOM Canvas。

**决策:** 使用 OffscreenCanvas 在 Worker 中进行图像处理。

**理由:**
- Worker 中可用的 Canvas 替代方案
- 性能优于主线程 Canvas 操作
- 避免主线程和 Worker 间的大量数据传输
- 现代浏览器广泛支持

## 6. 状态管理

### 6.1 应用状态结构 (v2.0 - 统一状态管理)

```javascript
appState = {
  // Worker 相关状态
  worker: null,           // Web Worker 实例
  blobs: [],             // 存储 Worker 生成的切片 Blob 对象
  objectUrls: [],        // 存储临时 Object URL，用于内存管理
  
  // 现有状态（保持向后兼容）
  originalImage: null,    // 原始图片对象
  imageSlices: [],       // 保留现有的图片数据结构
  selectedSlices: new Set(), // 用户选择的切片索引
  
  // 处理状态
  isProcessing: false,   // 是否正在处理中
  
  // 元数据
  splitHeight: 1200,     // 分割高度
  fileName: "分割结果"    // 导出文件名
}
```

**设计决策:** 采用渐进式集成策略，保持原有变量引用以确保向后兼容性。

### 6.2 资源管理 (v2.0 - 增强版)

- **Object URL 清理:** 通过 `cleanupPreviousSession()` 自动释放所有临时 URL ✅ (task-3.1)
- **内存管理:** 统一清空 `blobs`、`objectUrls`、`imageSlices` 数组避免内存泄漏 ✅ (task-3.1)
- **Worker 生命周期:** 自动终止现有 Worker 实例，防止资源泄漏 ✅ (task-3.1)
- **错误恢复:** 完整的 try-catch 错误处理和状态重置机制 ✅ (task-3.1)
- **调试支持:** 全局暴露状态快照函数，便于开发调试 ✅ (task-3.1)

## 7. UI 组件架构

### 7.1 Previewer 组件设计

**文件位置:** `src/components/Previewer.astro`

**组件职责:**
- 提供分割后图片的交互式预览界面 ✅ (task-2.1, task-2.4, task-2.5)
- 支持左侧缩略图列表和右侧大图预览的双栏布局 ✅ (task-2.4)
- 完整的图片选择功能：复选框、选择计数、批量操作 ✅ (task-2.5)
- 集成导出功能按钮（ZIP/PDF），支持导出选中片段 ✅ (task-2.4, task-2.5)
- 与原有数据结构(`selectedSlices`, `imageSlices`)完全集成 ✅ (task-2.5)
- 响应式设计，适配不同屏幕尺寸 ✅ (task-2.4)
- 实现事件委托和交互逻辑 ✅ (task-2.4)
- 提供全屏覆盖模式和返回功能 ✅ (task-2.4)

### 7.2 进度条 UI 组件设计

**文件位置:** `src/pages/index.astro` (内嵌)

**组件职责:**
- 提供图片处理过程的可视化进度反馈 ✅ (task-2.2)
- 显示实时进度百分比和描述信息
- 初始状态隐藏，处理时显示
- 现代化视觉设计和平滑动画效果

**核心DOM结构:**
```html
<div id="preview-section" class="fullscreen-preview hidden">  <!-- 全屏根容器 -->
  <div class="preview-sidebar">                              <!-- 左侧栏：缩略图 -->
    <div class="preview-sidebar-header">                     <!-- 标题和返回按钮 -->
    <div id="thumbnail-list" class="thumbnail-container">    <!-- 缩略图容器 -->
  </div>
  <div class="preview-main">                                 <!-- 右侧栏：大图预览 -->
    <div class="preview-main-header">                        <!-- 预览标题和导出按钮 -->
    <div class="preview-image-area">                         <!-- 大图显示区域 -->
      <img id="preview-image" class="preview-main-image">    <!-- 预览图片 -->
      <div id="preview-placeholder">                         <!-- 空状态占位符 -->
    </div>
  </div>
</div>
```

**设计决策记录:**
- **问题:** 需要一个专门的预览界面来展示分割结果，同时保持组件化架构
- **决策:** 创建独立的 Astro 组件，使用作用域CSS实现全屏覆盖布局
- **理由:** 
  - 模块化设计，便于维护和测试
  - 样式作用域隔离，不影响全局样式
  - 响应式布局提升用户体验
  - 符合 Astro 组件化开发最佳实践
- **权衡:** 
  - 优点：完全的样式隔离、可复用性强、维护成本低
  - 缺点：需要考虑组件间的通信机制

**核心DOM结构 (v2.0 - 增强版):**
```html
<div id="preview-section" class="fullscreen-preview hidden">
  <div class="preview-sidebar">
    <div class="preview-sidebar-header">
      <h2 class="preview-title">选择需要导出的片段</h2>
      <span id="new-selected-count" class="selected-count">已选择 0 个片段</span>
    </div>
    <div class="selection-controls">                          <!-- 批量操作按钮 -->
      <button id="new-select-all-btn">全选</button>
      <button id="new-deselect-btn">取消选择</button>
    </div>
    <div id="thumbnail-list" class="thumbnail-container">
      <!-- 动态生成的缩略图，每个包含复选框 -->
      <div class="thumbnail-item" data-index="0">
        <input type="checkbox" class="thumbnail-checkbox" checked>
        <img class="thumbnail-img" src="...">
        <div class="thumbnail-info">...</div>
      </div>
    </div>
  </div>
  <div class="preview-main"><!-- 右侧大图预览区 --></div>
</div>
```

**数据流架构:**
```
User Selection → thumbnail-checkbox → selectedSlices (Set) → Export Functions
              ↗                    ↗
Selection Controls             updateNewSelectedCount()
(全选/取消选择)                     ↓
                           UI State Update
```

**设计决策记录 (v2.0 更新):**
- **问题:** 新预览界面缺少原有的图片选择功能，用户无法选择需要导出的片段
- **决策:** 在保持双栏布局的基础上，整合原有预览界面的所有选择功能
- **实现策略:** 
  - 复用原有的 `selectedSlices` Set 数据结构，确保数据一致性
  - 为每个缩略图添加复选框，支持独立选择
  - 添加批量操作按钮（全选/取消选择）
  - 实时更新选择计数显示
  - 保持与导出功能的完整集成
- **关键设计原则:**
  - **数据统一性:** 所有选择操作都操作同一个 `selectedSlices` Set
  - **状态同步:** UI状态与数据状态实时同步
  - **用户体验:** 提供直观的视觉反馈和便捷的批量操作
  - **向前兼容:** 与现有导出逻辑完全兼容，无需修改导出函数

**待解决的设计问题 (发现于 task-2.5 后):**
- **布局不一致问题:** 当前新预览界面使用全屏布局（`position: fixed`），与原有页面内布局不一致
- **设计语言冲突:** 全屏覆盖模式打破了原有的卡片式设计连续性
- **交互模式差异:** 需要专门的关闭按钮，而不是自然的页面流程
- **响应式适配:** 全屏布局在移动端的表现需要改进

**计划解决方案 (将在 task-3.5 中实施):**
- 重构为页面内布局，保持双栏优势
- 融入现有设计 token（颜色、圆角、阴影）
- 移除全屏相关样式，使用网格布局
- 改进移动端响应式表现