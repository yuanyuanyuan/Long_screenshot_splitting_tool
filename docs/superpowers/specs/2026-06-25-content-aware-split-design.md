# 内容感知切割（Content-Aware Splitting）设计

- **日期**: 2026-06-25
- **状态**: 已获批，待实现
- **作者**: StarkYuan（设计），AI 协助
- **相关代码**: `src/workers/split.worker.js`, `src/hooks/useImageProcessor.ts`, `src/hooks/useAppState.ts`

---

## 1. 背景与根因

当前长截图切割采用**固定高度等分硬切**：`src/workers/split.worker.js` 从 y=0 起每 `splitHeight`（默认 1200px）无脑切一刀，刀口位置完全由 `i * splitHeight` 决定，不感知图片内容。

**导致的痛点**：刀口落在文字行、对话气泡、头像、内嵌图片的正中间，使一个完整语义单元被物理割裂——表现为「内容不完整」（文字/气泡被切半）与「不连续」（语义跨页断裂）。

**像素级澄清**：固定等分在像素层面严格衔接（`[0,H)、[H,2H)、…`，不丢不重），所以不存在字面意义的像素丢失/重复。痛点是**语义级**的切割断裂。

**加重因素**：每一切片被强制 JPEG 0.9 重编码（`split.worker.js:152`），截图多为 PNG 锐利文字，重编码使切口附近文字边缘产生振铃伪影，进一步损害「完整性」观感；`imageSlices` 在 reducer 中按异步到达顺序追加（`useAppState.ts:51`），存在潜在乱序。

## 2. 目标与非目标

### 目标
- 切割线落在内容空白带（文字行间、段落间隙），保证每页内容完整、连续。
- 对**聊天记录**（A 场景，主力）追求最佳效果；对**网页长截图**（B 场景）做到尽力而为 + 安全回退。
- 保持「目标页高驱动」——用户对每页大致高度有预期（不同于「按所有间隙细碎切割」）。
- 纯自动一键分割，无需用户手动调整切割线。
- 全程在 Web Worker 内完成，主线程零阻塞，无后端、无外部引擎依赖。

### 非目标（明确排除，守 YAGNI）
- ❌ 不引入 OCR（Tesseract/tesseract.js）：浏览器成本过高，且 OCR 路线与「页高驱动」产品逻辑错位。
- ❌ 不做手动切割线微调（现有 `TouchImageSlicer` 空壳不落地）。
- ❌ 不做多语言/多模型适配。
- ❌ 不改动 UI 组件、PDF/ZIP 导出器（纯自动，UI 零改动）。

## 3. 方案概览与 Research 依据

在「解码」与「切片」之间插入「分析」阶段：先用纯像素计算生成切割点列表，再按列表切。

**信号选择：行级「低变化率」**（而非「非背景像素计数」）。依据 [Ryaang/Web-page-Screenshot-Segmentation](https://github.com/Ryaang/Web-page-Screenshot-Segmentation) 实战验证：变化率不依赖背景色检测，白底/灰底/彩色底只要平坦则变化率≈0，对 B 场景（网页多背景）更鲁棒。

**明确不采用 OCR 路线**（[Jacobinwwey/Intelligent-Screenshot-Splitter](https://github.com/Jacobinwwey/Intelligent-Screenshot-Splitter)）：源码确认其在所有合格文字间隙下刀（碎页）、必须半自动（需用户点初始线）、依赖 Tesseract 本地引擎——与本项目「页高驱动 + 纯自动 + Web」定位错位，非「仅缺 Web」。

**借鉴点**：Jacobinwwey 的 `line_height_estimate`（用相邻内容块间距动态估算行高）思想，用于动态设定最小切割间距，使切割粒度自适应内容密度。

## 4. 详细设计

### 4.1 架构与数据流

```
File → [Worker: split.worker.js]
  ├─ decode         createImageBitmap(file) → 绘制到全图 OffscreenCanvas
  ├─ getImageData   读取全图像素（大图分块，防爆内存）
  ├─ analyze ◀──── 新增：调用纯函数 splitAnalyzer，返回 splitPoints[]
  └─ slice          for each [startY,endY]: drawImage → blob → postMessage
```

**核心设计原则：算法与 I/O 分离。**
- `src/utils/splitAnalyzer.ts`（纯 TS，可单测）：接收像素数据 + 参数，返回切割点 `number[]`。无 DOM/canvas 依赖。
- `src/workers/split.worker.js`（I/O 胶水）：decode / getImageData / drawImage / convertToBlob + 调用 splitAnalyzer。

### 4.2 算法核心（4 步纯函数）

```typescript
// splitAnalyzer.ts —— 全部纯函数，无 DOM/canvas 依赖

computeVariationProfile(pixels, width, height, columnStep): number[]
// 对每行 y：累加 sampled 列上水平相邻像素的【灰度差绝对值】。
// 灰度 = 0.299R + 0.587G + 0.114B；行变化率 profile[y] = Σ|x 灰度 - (x-1) 灰度|。
// 选灰度差而非 RGB 距离：计算快、对文字边缘足够敏感、单值易定阈值。
// columnStep 控制列降采样（默认 4，每行算 1/4 列，计算量降 75%）。

smooth(profile, windowSize): number[]
// 滑动平均，windowSize ≈ 估算行高，消除单行噪声。

findLowVariationBands(profile, threshold, minBandHeight): Band[]
// 找连续 variation < threshold 且宽度 ≥ minBandHeight 的水平带，返回 {top, bottom, center}。

chooseSplitPoints(bands, targetHeight, searchWindow, mergeThreshold, minPageHeight, imageHeight): number[]
// 从 0 起，每推进 ~targetHeight，在 ±searchWindow 内选最近 band.center；
// 找不到合格 band → 该刀回退精确 targetHeight；
// 相邻切割点间距 < mergeThreshold → 合并；
// 末页剩余高度 < minPageHeight → 末点删除（并入上页）。
```

**不变量**（抽象原则，非照搬外部代码）：压成行信号 → 去噪 → 找空白带 → 页高驱动选点 → 最小间距保护 → 无解安全回退。

### 4.3 参数与默认值

| 参数 | 含义 | 起始默认值 | 说明 |
|---|---|---|---|
| `targetHeight` | 目标页高 | 1200 | 复用现有 `splitHeight` 语义 |
| `variationThreshold` | 低变化判定 | `0.3 × mean(profile)` | **相对值**：阈值 = 行变化率均值的 30%，低于此值视为「低变化」。相对值适配不同图，见 §4.4 |
| `minBandHeight` | 空白带最小高度 | 8 px | 约一行文字行距 |
| `searchWindow` | 目标页高附近搜索范围 | ±20% × targetHeight | 平衡精度与页高可控性 |
| `mergeThreshold` | 最小切割间距 | 0.5 × targetHeight | 防碎页 |
| `minPageHeight` | 单页最小高度 | 0.5 × targetHeight | 末页合并依据 |
| `columnStep` | 列降采样步长 | 4 | 性能与精度平衡 |

### 4.4 待校准项（诚实风险标注）

`variationThreshold` 与 `minBandHeight` 是起始经验值，**必须用真实长截图调试校准**——变化率绝对值高度依赖计算方式（RGB 差之和 vs 灰度差 vs 归一化）与图片特征，不能拍脑袋定死。

**校准方法**（实现阶段执行）：
1. 取 3~5 张代表性长截图（含聊天记录、网页）。
2. 用 worker 导出 `variationProfile` 原始曲线（临时调试输出）。
3. 人工标注「真实可切的空白带」位置，反推合理 threshold / minBandHeight。
4. 回归测试断言切割点落在标注带内。

### 4.5 Fallback 与边界

| 场景 | 行为 |
|---|---|
| 整图无合格空白带（纯图片/密集表格） | 回退当前固定高度等分（保证不比现状差） |
| 某搜索窗口内无合格带 | 该刀回退精确 `targetHeight` |
| 末页剩余 < `minPageHeight` | 并入上一页 |
| 图片高度 < `targetHeight` | 不切，整图作为唯一切片 |
| `OffscreenCanvas`/`createImageBitmap` 不支持 | 走现有 error 路径 |

**安全原则**：任何不确定情况回退固定高度等分。内容感知是「尽力切更好」，绝不切得比现状差。

### 4.6 性能策略
- 列降采样（`columnStep=4`）：计算量降 75%，行级信号精度无损。
- 大图分块 `getImageData`：高度 > 4000px 时分段读取，避免单次数十 MB 像素数组。
- 全程 Worker：主线程零阻塞；`progress` 上报分「解码 25% / 分析 / 切片」三段。

## 5. 顺手修掉的加重因素

| 问题 | 修法 | 文件 |
|---|---|---|
| `imageSlices` 按到达顺序追加（潜在乱序） | reducer 改为按 `index` 写入 | `useAppState.ts` |
| JPEG 0.9 文字伪影 | 切片编码质量提到 0.92 | `split.worker.js` |

两者均低成本且与切割质量强相关，纳入本次改动。

## 6. 测试策略（TDD）

按 systematic-debugging：先写失败测试，再实现。

- **`splitAnalyzer.test.ts`（纯函数单测，重点）**：用程序生成的合成图 fixture（白底 + 模拟文字行 + 已知位置空白带），断言：
  - 切割点落在空白带内
  - 无空白带时回退等分
  - 末页过短时合并
  - 间距过密时合并
  - 图片短于 targetHeight 时返回空（不切）
- **worker 集成测试**：端到端合成长图 → 断言切片数与边界（需评估 jsdom 对 OffscreenCanvas 支持情况，必要时用 Playwright 浏览器环境）。
- **边界用例**：纯白图、纯噪声图、超短图、超长图。

## 7. 改动文件清单（Surgical）

| 文件 | 动作 | 说明 |
|---|---|---|
| `src/utils/splitAnalyzer.ts` | 新增 | 算法纯函数（单测核心） |
| `src/utils/__tests__/splitAnalyzer.test.ts` | 新增 | 单元测试 |
| `src/workers/split.worker.js` | 改 | 插入 analyze 阶段，调 splitAnalyzer；JPEG 质量 0.9→0.92 |
| `src/hooks/useAppState.ts` | 小改 | `imageSlices` 按 index 写入 |
| `src/hooks/useImageProcessor.ts` | 小改 | 可选透传灵敏度参数 |
| `src/types/index.ts` | 小改 | 新增分析参数类型 |
| UI 组件 / pdfExporter / zipExporter | 不动 | 纯自动，UI 零改动 |

## 8. 成功标准

- 合成图测试：切割点 100% 落在预设空白带内。
- 真实聊天记录长截图：肉眼检查无文字行被切半、无气泡断裂。
- 真实网页长截图：密集内容区安全回退等分，不产生劣化。
- 性能：1080×10000 长图分析阶段在主流移动设备 < 1s。
- 回归：现有 `ScreenshotSplitter.test.tsx` 等测试全绿。

## 9. 参考资料

- [Ryaang/Web-page-Screenshot-Segmentation](https://github.com/Ryaang/Web-page-Screenshot-Segmentation) / [原理解读](https://www.zair.top/post/web-page-screenshot-segmentation/)
- [Jacobinwwey/Intelligent-Screenshot-Splitter 源码](https://github.com/Jacobinwwey/Intelligent-Screenshot-Splitter/blob/main/long_screenshot_splitter.py)
- [Seam carving & Horizontal Projection Profile（ScienceDirect）](https://www.sciencedirect.com/science/article/pii/S2590123023002372)
- [Projection Profile method（GeeksforGeeks）](https://www.geeksforgeeks.org/python/projection-profile-method/)
- [OffscreenCanvas 性能（web.dev）](https://web.dev/articles/offscreen-canvas)
