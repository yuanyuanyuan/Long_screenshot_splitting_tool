# 项目架构文档 (Architecture Document)

**版本:** 1.0.0
**最后更新:** 2025-01-19

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
│   └── split.worker.js     # 图片分割 Worker [新增]
├── components/
│   ├── Feedback.astro      # 反馈组件
│   └── Previewer.astro     # 预览组件 [待添加]
├── layouts/                # 页面布局
├── pages/                  # 页面文件
└── styles/                 # 样式文件
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

### 4.2 Worker 职责

- **图片解码:** 使用 `createImageBitmap()` 高效解码 ✅ (task-1.3)
- **Canvas 绘制:** 在 `OffscreenCanvas` 上进行渲染操作 ✅ (task-1.3)
- **图片切割:** 按指定高度分割图片 ✅ (task-1.4)
- **Blob 生成:** 将切片转换为 Blob 对象 ✅ (task-1.4)
- **进度上报:** 实时报告处理进度 ✅ (task-1.3, task-1.4)
- **错误处理:** 捕获并报告处理异常 ✅ (task-1.3)

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

### 6.1 应用状态结构

```javascript
appState = {
  blobs: [],        // 存储所有切片的 Blob 对象
  objectUrls: []    // 存储用于预览的临时 URL
}
```

### 6.2 资源管理

- **Object URL 清理:** 在新操作开始前释放之前的 URL
- **内存管理:** 及时清空 blobs 数组避免内存泄漏
- **错误恢复:** 异常情况下的资源清理机制

---

## 7. 变更历史

### v1.0.0 (2025-01-19)
- **[task-1.1]** 新增 `src/scripts/split.worker.js` 文件
- **[task-1.1]** 定义 Web Worker 消息传递契约 v1.1
- **[task-1.1]** 确立 Web Worker 架构设计模式
- **[task-1.2]** 实现 Worker 消息监听器与参数验证
- **[task-1.2]** 修复 Astro SSR 问题，确保脚本正确在客户端执行
- **[task-1.2]** 建立主线程与 Worker 双向通信机制
- **[task-1.3]** 实现 Worker 中的图片解码与 OffscreenCanvas 绘制逻辑
- **[task-1.3]** 集成 `createImageBitmap` 高效图片解码API
- **[task-1.3]** 建立 OffscreenCanvas 绘制与尺寸验证机制
- **[task-1.3]** 添加资源管理与内存清理功能
- **[task-1.4]** 实现图片切割循环与区域复制逻辑
- **[task-1.4]** 集成 JPEG Blob 生成（质量 0.9）与 `convertToBlob` 工具函数
- **[task-1.4]** 建立切片数据传输机制（chunk 消息）
- **[task-1.4]** 完善进度上报系统（25%-95% 覆盖切割阶段） 