/**
 * useNavigationState Hook的单元测试
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AppState } from '../../types';
import {
  useNavigationState,
  useNavigationStateSimple,
  useNavigationProgress,
} from '../useNavigationState';

// 创建测试用的应用状态
function createMockAppState(overrides: Partial<AppState> = {}): AppState {
  return {
    worker: null,
    blobs: [],
    objectUrls: [],
    originalImage: null,
    imageSlices: [],
    selectedSlices: new Set<number>(),
    isProcessing: false,
    splitHeight: 1200,
    fileName: '测试文件',
    ...overrides,
  };
}

// 创建测试用的图片元素
function createMockImage(): HTMLImageElement {
  const img = new Image();
  img.width = 800;
  img.height = 2400;
  return img;
}

describe('useNavigationState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该返回正确的初始导航状态', () => {
    const appState = createMockAppState();
    const { result } = renderHook(() => useNavigationState(appState, '/'));

    expect(result.current.navigationItems).toHaveLength(4);
    expect(result.current.navigationState.currentStep).toBe('/');
    expect(result.current.isValid).toBe(true);
    expect(result.current.validationErrors).toHaveLength(0);

    // 检查按钮状态
    const homeItem = result.current.navigationItems.find(item => item.path === '/');
    const splitItem = result.current.navigationItems.find(item => item.path === '/split');
    const exportItem = result.current.navigationItems.find(item => item.path === '/export');

    expect(homeItem?.active).toBe(true);
    expect(homeItem?.disabled).toBe(false);
    expect(splitItem?.disabled).toBe(true);
    expect(exportItem?.disabled).toBe(true);
  });

  it('应该在应用状态变化时更新导航状态', () => {
    let appState = createMockAppState();
    const { result, rerender } = renderHook(
      ({ appState, currentPath }) => useNavigationState(appState, currentPath),
      { initialProps: { appState, currentPath: '/' } }
    );

    // 初始状态：分割按钮应该禁用
    expect(result.current.navigationItems.find(item => item.path === '/split')?.disabled).toBe(
      true
    );

    // 更新状态：添加原始图片
    appState = createMockAppState({ originalImage: createMockImage() });
    rerender({ appState, currentPath: '/' });

    // 分割按钮应该可用
    expect(result.current.navigationItems.find(item => item.path === '/split')?.disabled).toBe(
      false
    );
  });

  it('应该正确处理状态变化回调', () => {
    const onStateChange = vi.fn();
    let appState = createMockAppState();

    const { rerender } = renderHook(
      ({ appState }) =>
        useNavigationState(appState, '/', {
          onStateChange,
        }),
      { initialProps: { appState } }
    );

    // 更新状态
    appState = createMockAppState({ originalImage: createMockImage() });
    rerender({ appState });

    // 等待防抖
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  it('应该支持手动刷新', () => {
    const appState = createMockAppState();
    const { result } = renderHook(() => useNavigationState(appState, '/'));

    const initialItems = result.current.navigationItems;

    act(() => {
      result.current.refresh();
    });

    // 刷新后应该重新计算状态
    expect(result.current.navigationItems).not.toBe(initialItems);
    expect(result.current.navigationItems).toEqual(initialItems);
  });

  it('应该支持禁用验证', () => {
    // 创建一个不一致的状态（有分割步骤但没有原始图片）
    const appState = createMockAppState();
    const { result } = renderHook(() =>
      useNavigationState(appState, '/split', { enableValidation: false })
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.validationErrors).toHaveLength(0);
  });

  it('应该检测状态验证错误', () => {
    const appState = createMockAppState();
    const { result } = renderHook(() =>
      useNavigationState(appState, '/', { enableValidation: true })
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.validationErrors).toHaveLength(0);
  });

  it('应该正确计算导航指标', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [{ blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 }],
    });

    const { result } = renderHook(() => useNavigationState(appState, '/split'));

    expect(result.current.navigationMetrics.totalSteps).toBe(4);
    expect(result.current.navigationMetrics.completedSteps).toBe(2); // 首页和上传
    expect(result.current.navigationMetrics.currentStepIndex).toBe(2); // 分割页面
    expect(result.current.navigationMetrics.progressPercentage).toBeGreaterThanOrEqual(50);
  });
});

describe('useNavigationStateSimple', () => {
  it('应该返回简化的导航状态', () => {
    const appState = createMockAppState();
    const { result } = renderHook(() => useNavigationStateSimple(appState, '/'));

    expect(result.current.canAccessSplit).toBe(false);
    expect(result.current.canAccessExport).toBe(false);
    expect(result.current.isCurrentPathActive('/')).toBe(true);
    expect(result.current.isCurrentPathActive('/upload')).toBe(false);
  });

  it('应该在有原始图片时允许访问分割', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
    });
    const { result } = renderHook(() => useNavigationStateSimple(appState, '/'));

    expect(result.current.canAccessSplit).toBe(true);
    expect(result.current.canAccessExport).toBe(false);
  });

  it('应该在有选中切片时允许访问导出', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [{ blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 }],
      selectedSlices: new Set([0]),
    });
    const { result } = renderHook(() => useNavigationStateSimple(appState, '/'));

    expect(result.current.canAccessSplit).toBe(true);
    expect(result.current.canAccessExport).toBe(true);
  });

  it('应该在处理中时禁用访问', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      selectedSlices: new Set([0]),
      isProcessing: true,
    });
    const { result } = renderHook(() => useNavigationStateSimple(appState, '/'));

    expect(result.current.canAccessSplit).toBe(false);
    expect(result.current.canAccessExport).toBe(false);
  });
});

describe('useNavigationProgress', () => {
  it('应该返回正确的进度信息', () => {
    const appState = createMockAppState();
    const { result } = renderHook(() => useNavigationProgress(appState, '/'));

    expect(result.current.totalSteps).toBe(4);
    expect(result.current.progressText).toBe('0/4 步骤已完成');
    expect(result.current.nextStep).toBe('/upload');
  });

  it('应该在有进度时显示正确信息', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [{ blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 }],
    });
    const { result } = renderHook(() => useNavigationProgress(appState, '/split'));

    expect(result.current.completedSteps).toBe(2);
    expect(result.current.progressText).toBe('2/4 步骤已完成');
    expect(result.current.progressPercentage).toBeGreaterThan(50);
  });

  it('应该在最后一步时返回null作为下一步', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [{ blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 }],
      selectedSlices: new Set([0]),
    });
    const { result } = renderHook(() => useNavigationProgress(appState, '/export'));

    expect(result.current.nextStep).toBe(null);
  });

  it('应该在下一步不可用时返回null', () => {
    const appState = createMockAppState(); // 没有图片，分割不可用
    const { result } = renderHook(() => useNavigationProgress(appState, '/upload'));

    expect(result.current.nextStep).toBe(null);
  });
});
