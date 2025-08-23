
# 文档 04: 数据层架构 (Data Layer Architecture)

## 1. 概述

本文档详细描述 `dual-build-monorepo-system` 项目的数据层架构。数据层是应用的核心，负责管理状态、处理数据持久化以及协调不同部分之间的数据流。本项目采用了一种分层、职责清晰的数据管理策略，结合了本地状态管理和全局共享状态，以适应不同场景的需求。

数据层架构主要由三部分构成：
1.  **应用本地状态 (Local State)**: 管理特定应用（如 `screenshot-splitter`）内部的 UI 和业务状态。
2.  **跨包共享状态 (Shared State)**: 提供一个全局机制，用于在 Monorepo 内的不同包之间共享和同步状态。
3.  **数据持久化 (Persistence)**: 负责将用户的设置和偏好保存到浏览器，以改善用户体验。

## 2. 架构图

数据层的整体工作流程和分层关系如下图所示：

```mermaid
graph TD
    subgraph Browser
        D[LocalStorage API];
    end

    subgraph Application Layer (screenshot-splitter)
        A[React Components];
        B[useAppState Hook (useReducer)];
        C[Persistence Module];
    end

    subgraph Shared Layer (shared-components)
        E[SharedStateManager (Singleton)];
    end

    A -- "Dispatches Actions" --> B;
    B -- "Provides State" --> A;
    B -- "Saves State" --> C;
    C -- "Writes/Reads" --> D;
    
    A -- "Reads/Writes Global State" --> E;
    
    subgraph Other Packages
        F[Another Component/App];
    end
    
    F -- "Reads/Writes Global State" --> E;

    style B fill:#cde,stroke:#333,stroke-width:2px
    style E fill:#fcd,stroke:#333,stroke-width:2px
    style C fill:#ddc,stroke:#333,stroke-width:2px
```
该图清晰地展示了两种主要的状态管理模式：
*   **蓝色路径**: 代表 `screenshot-splitter` 应用内部的状态流，通过 `useReducer` 实现单向数据流，并通过 `Persistence` 模块与 `LocalStorage` 交互。
*   **红色路径**: 代表全局共享状态流，任何包内的组件都可以通过 `SharedStateManager` 单例进行读写，实现跨包通信。

## 3. 代码示例

**应用本地状态** 的核心是 `useAppState` hook，它使用 `useReducer` 来集中管理状态逻辑。

**文件路径**: `packages/screenshot-splitter/src/hooks/useAppState.ts`
```typescript
// (Simplified Example)
import { useReducer, useEffect } from 'react';
import { loadState, createDebouncedSave } from '../utils/persistence';

const debouncedSave = createDebouncedSave(500);

function appStateReducer(state, action) {
  // ... switch statement for all actions
}

export function useAppState() {
  const [state, dispatch] = useReducer(appStateReducer, loadState() || initialState);

  useEffect(() => {
    // 当可持久化的状态变更时，自动进行防抖保存
    const persistableState = {
      splitHeight: state.splitHeight,
      fileName: state.fileName,
    };
    debouncedSave(persistableState);
  }, [state.splitHeight, state.fileName]);

  // ... action creators wrapped in useCallback
  return { state, actions };
}
```
这种模式将状态逻辑、持久化和action创建封装在一个独立的、可测试的 Hook 中，是 React 应用状态管理的最佳实践。

## 4. 配置示例

**跨包共享状态** 是通过一个自定义的、基于观察者模式的 `SharedStateManager` 实现的。它作为一个全局单例存在。

**文件路径**: `packages/shared-components/src/managers/SharedStateManager.ts`
```typescript
// (Simplified Example)
export class SharedStateManager {
  private state = {};
  private watchers = new Map();

  get<T>(key: string): T | undefined { /* ... */ }
  set<T>(key: string, value: T): void { /* ... */ }
  watch(key: string, handler: (event) => void): void { /* ... */ }
  // ... other methods
}

// 创建全局单例实例
export const sharedStateManager = new SharedStateManager();
```
使用这个管理器非常简单，任何组件都可以直接导入并使用它：
```typescript
import { sharedStateManager } from 'shared-components/src/managers/SharedStateManager';

// 设置一个全局主题
sharedStateManager.set('theme', 'dark');

// 在另一个组件或包中监听主题变化
sharedStateManager.watch('theme', (event) => {
  console.log(`Theme changed to: ${event.newValue}`);
});
```
这个设计为需要跨应用通信的场景（如微前端架构）提供了一个轻量级且强大的解决方案。

## 5. 最佳实践

*   **优先使用本地状态**: 只有当状态确实需要被多个独立的包共享时，才使用 `SharedStateManager`。对于应用内部的状态，应优先使用 `useReducer` 或 `useState`，以避免不必要的全局耦合。
*   **持久化应谨慎**: 只持久化用户的明确设置（如偏好、草稿），避免持久化整个应用状态，这会使应用版本迭代变得脆弱。`PersistableState` 接口明确定义了哪些状态是可持久化的，这是一个很好的实践。
*   **使用 Reducer 进行复杂状态变更**: 当多个状态值之间存在复杂的依赖关系时，`useReducer` 比多个 `useState` 更具优势，因为它能将更新逻辑聚合在一起，使状态变更更可预测。
*   **为共享状态定义清晰的契约**: 在使用 `SharedStateManager` 时，应该在文档或类型定义中明确每个 `key` 的用途、数据结构和允许的值，以避免不同包之间的误用。

## 6. 案例分析

**场景**: 用户在 `screenshot-splitter` 应用中设置了一个自定义的分割高度 `1500px`，并希望下次访问时这个设置依然有效。

这个流程完美地展示了数据层各部分的协同工作：
1.  **用户操作**: 用户在 UI 上操作 `Slider` 组件，触发 `onChange` 事件。
2.  **Action Dispatched**: `Slider` 组件调用从 `useAppState` hook 中获取的 `actions.setSplitHeight(1500)` 方法。
3.  **State Update**: `appStateReducer` 接收到 `SET_SPLIT_HEIGHT` action，更新 state，返回一个新的 state 对象。
4.  **UI Re-render**: `useAppState` hook 返回的 `state` 对象发生变化，导致使用该 hook 的组件重新渲染，UI 上显示新的分割高度。
5.  **Debounced Persistence**: `useAppState` 中的 `useEffect` 监测到 `state.splitHeight` 发生变化，调用 `debouncedSave` 函数。在用户停止操作 500ms 后，该函数会将 `{ splitHeight: 1500, ... }` 对象序列化并写入 `LocalStorage`。
6.  **Next Visit**: 用户下次访问页面时，`useAppState` 在初始化时调用 `loadState()`，从 `LocalStorage` 中读取到 `{ splitHeight: 1500, ... }`，并将其作为 `useReducer` 的初始状态，从而恢复了用户的设置。
