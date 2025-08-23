
# 文档 10: 性能优化 (Performance Optimization)

## 1. 概述

本文档详细阐述了 `screenshot-splitter` 项目中采用的各项性能优化策略。对于一个计算密集型的前端应用，性能是决定用户体验的关键。本项目从架构设计到代码实现，贯穿了性能优化的思想，旨在为用户提供流畅、快速的交互体验。

优化策略可以分为两大类：
1.  **宏观架构优化**: 在系统层面解决性能瓶颈，如使用 Web Workers 处理密集计算。
2.  **微观代码优化**: 在代码实现层面减少不必要的计算和渲染，如使用 React 的 `useMemo` 和 `useCallback`。

## 2. 架构图

项目的性能优化策略可以围绕“主线程减负”这一核心思想来展开，如下图所示：

```mermaid
graph TD
    subgraph Main Thread (UI)
        A[User Interaction] --> B{React Component};
        B -- "Memoized Callbacks" --> D[State Updates];
        D -- "Triggers Re-render" --> B;
        B -- "Memoized Values" --> E[DOM Updates];
    end

    subgraph Background Thread (Worker)
        F[Heavy Image Processing];
    end

    B -- "Offloads Task" --> F;
    F -- "Returns Result" --> B;

    subgraph Build & Load
        G[Vite Build System] --> H{Code Splitting};
        H -- "Vendor Chunks" --> I[Browser Caching];
        H -- "Dynamic Imports" --> J[On-demand Loading];
    end

    style F fill:#fcd,stroke:#333,stroke-width:2px
    style H fill:#cde,stroke:#333,stroke-width:2px
```
该图展示了三大性能优化支柱：
*   **主线程 (蓝色)**: 通过 `useMemo` 和 `useCallback` 等 React 优化手段，最小化渲染和计算开销。
*   **后台线程 (红色)**: 将最耗时的图片处理任务完全从主线程剥离，是保证 UI 流畅的**核心策略**。
*   **构建与加载 (绿色)**: 通过代码分割和按需加载，加快应用的初始加载速度。

## 3. 代码示例

**Web Worker** 是本项目最重要的性能优化。它将图片分割的计算密集型任务放到了一个独立的后台线程中。

**文件路径**: `packages/screenshot-splitter/src/hooks/useImageProcessor.ts`
```typescript
// (Simplified)
export function useImageProcessor({ state, actions }) {
  // ...
  const { createWorker, startProcessing } = useWorker({
    // ... callbacks
  });

  const processImage = useCallback(async (file: File) => {
    // ...
    // 创建 Worker 实例
    createWorker();
    // 将文件和配置发送到 Worker，而不是在主线程处理
    startProcessing(file, state.splitHeight);
  }, [/*...*/]);

  return { processImage, progress };
}
```
通过这种方式，即使用户上传了一张超大图片，主线程也只是发送了一条消息，几乎没有性能开销，UI 因而能保持完全的响应性。

## 4. 配置示例

**按需加载语言文件** 是一个重要的加载性能优化。Vite 的动态 `import()` 支持使得实现这一点非常简单。

**文件路径**: `packages/screenshot-splitter/src/hooks/useI18n.ts`
```typescript
async function loadLanguageResource(language: SupportedLanguage) {
  // ...
  // Vite 会自动将这个动态导入的模块分割成一个独立的文件
  // 只有在需要时，浏览器才会通过网络请求加载它
  const module = await import(`../locales/${language}.json`);
  // ...
}
```
这意味着用户永远不会下载他们用不到的语言的翻译文本，这对于拥有多种语言支持的应用来说，可以显著减小初始包体积。

## 5. 最佳实践

*   **`useMemo` 用于昂贵计算**: 在组件中，对于任何复杂的计算（如数据过滤、排序、转换），都应该使用 `useMemo` 来缓存结果。如 `useNavigationState.ts` 中对 `navigationItems` 的计算。
*   **`useCallback` 用于事件处理器**: 将传递给子组件的事件处理器函数用 `useCallback` 包裹。这可以防止在父组件重渲染时创建新的函数实例，从而允许子组件通过 `React.memo` 进行有效的渲染优化。
*   **`React.memo` 用于纯组件**: 对于那些 props 不变时渲染结果也不变的组件（如 `Navigation.tsx`），使用 `React.memo` (或 `memo`) 将其包裹起来。这可以有效避免因父组件状态变化而引起的“瀑布式”重渲染。
*   **对 I/O 操作进行防抖/节流**: 对于频繁触发的 I/O 操作，如向 `localStorage` 写入数据，应使用**防抖 (Debounce)** 来合并多次操作，减少磁盘 I/O。`persistence.ts` 中的 `createDebouncedSave` 是这一实践的典范。
*   **虚拟化长列表**: 虽然本项目当前未使用，但如果图片切片数量可能达到数百上千个，应考虑使用“虚拟列表”（Virtual List）技术来渲染 `ImagePreview` 组件，即只渲染视口内可见的列表项。

## 6. 案例分析

**场景**: 用户在 `Navigation` 组件上快速点击，或者应用状态的细微变化导致 `App.tsx` 频繁重渲染。

如果没有性能优化，每次 `App.tsx` 重渲染都会导致整个 `Navigation` 组件及其所有子按钮全部重新渲染，即使导航项本身没有任何变化，这会造成不必要的性能浪费。

得益于当前的优化策略，实际发生的情况是：
1.  **`useMemo` 的作用**: 在 `App.tsx` 中，传递给 `Navigation` 的 props (例如从 `useNavigationState` 中计算出的导航项列表) 是经过 `useMemo` 缓存的。只要导航状态不变，这个列表对象的引用就不会变。
2.  **`React.memo` 的作用**: `Navigation` 组件被 `memo` 包裹。在 `App.tsx` 重渲染时，React 会检查传递给 `Navigation` 的 props。由于这些 props 的引用没有变化，React 会**跳过 `Navigation` 组件的整个渲染过程**。
3.  **`useCallback` 的作用**: 传递给导航按钮的 `onClick` 事件处理器也是经过 `useCallback` 缓存的，进一步保证了子组件 props 的稳定性。

这个案例完美展示了 React 的性能优化工具链（`memo`, `useMemo`, `useCallback`）如何协同工作，将渲染更新限制在真正需要变化的组件上，从而保证了应用的流畅性。
