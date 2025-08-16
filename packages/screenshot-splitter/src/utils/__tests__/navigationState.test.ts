/**
 * 导航状态计算函数的单元测试
 */

import { describe, it, expect } from 'vitest';
import type { AppState, NavigationItem } from '../../types';
import {
  determineNavigationState,
  calculateNavigationMetrics,
  checkPathAccess,
  getNavigationItemTooltip,
  validateNavigationState,
  defaultNavigationItems,
} from '../navigationState';

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

describe('determineNavigationState', () => {
  it('应该正确处理初始状态（无图片）', () => {
    const appState = createMockAppState();
    const result = determineNavigationState(defaultNavigationItems, '/', appState);

    expect(result.items).toHaveLength(4);

    // 首页应该激活
    const homeItem = result.items.find(item => item.path === '/');
    expect(homeItem?.active).toBe(true);
    expect(homeItem?.disabled).toBe(false);

    // 上传应该可用
    const uploadItem = result.items.find(item => item.path === '/upload');
    expect(uploadItem?.disabled).toBe(false);

    // 分割应该禁用（没有图片）
    const splitItem = result.items.find(item => item.path === '/split');
    expect(splitItem?.disabled).toBe(true);

    // 导出应该禁用（没有选中切片）
    const exportItem = result.items.find(item => item.path === '/export');
    expect(exportItem?.disabled).toBe(true);
  });

  it('应该正确处理有原始图片的状态', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
    });
    const result = determineNavigationState(defaultNavigationItems, '/upload', appState);

    // 上传应该激活
    const uploadItem = result.items.find(item => item.path === '/upload');
    expect(uploadItem?.active).toBe(true);

    // 分割应该可用（有原始图片）
    const splitItem = result.items.find(item => item.path === '/split');
    expect(splitItem?.disabled).toBe(false);

    // 导出仍应禁用（没有选中切片）
    const exportItem = result.items.find(item => item.path === '/export');
    expect(exportItem?.disabled).toBe(true);
  });

  it('应该正确处理有选中切片的状态', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [
        { blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 },
        { blob: new Blob(), url: 'blob:test2', index: 1, width: 800, height: 600 },
      ],
      selectedSlices: new Set([0, 1]),
    });
    const result = determineNavigationState(defaultNavigationItems, '/split', appState);

    // 分割应该激活
    const splitItem = result.items.find(item => item.path === '/split');
    expect(splitItem?.active).toBe(true);

    // 导出应该可用（有选中切片）
    const exportItem = result.items.find(item => item.path === '/export');
    expect(exportItem?.disabled).toBe(false);
  });

  it('应该正确处理处理中状态', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      isProcessing: true,
    });
    const result = determineNavigationState(defaultNavigationItems, '/upload', appState);

    // 处理中时，分割和导出都应该禁用
    const splitItem = result.items.find(item => item.path === '/split');
    expect(splitItem?.disabled).toBe(true);

    const exportItem = result.items.find(item => item.path === '/export');
    expect(exportItem?.disabled).toBe(true);
  });

  it('应该正确计算导航状态分类', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [{ blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 }],
    });
    const result = determineNavigationState(defaultNavigationItems, '/split', appState);

    expect(result.navigationState.currentStep).toBe('/split');
    expect(result.navigationState.completedSteps).toContain('/');
    expect(result.navigationState.completedSteps).toContain('/upload');
    expect(result.navigationState.availableSteps).toContain('/split');
    expect(result.navigationState.blockedSteps).toContain('/export');
  });
});

describe('calculateNavigationMetrics', () => {
  it('应该正确计算进度指标', () => {
    const navigationState = {
      currentStep: '/split',
      availableSteps: ['/split'],
      completedSteps: ['/', '/upload'],
      blockedSteps: ['/export'],
    };

    const metrics = calculateNavigationMetrics(navigationState);

    expect(metrics.totalSteps).toBe(4);
    expect(metrics.completedSteps).toBe(2);
    expect(metrics.currentStepIndex).toBe(2); // /split 是第3个步骤（索引2）
    expect(metrics.progressPercentage).toBe(63); // (2 + 0.5) / 4 * 100 = 62.5 -> 63
  });

  it('应该处理边界情况', () => {
    const navigationState = {
      currentStep: '/',
      availableSteps: ['/'],
      completedSteps: [],
      blockedSteps: ['/upload', '/split', '/export'],
    };

    const metrics = calculateNavigationMetrics(navigationState);

    expect(metrics.progressPercentage).toBe(13); // 0.5 / 4 * 100 = 12.5 -> 13
  });
});

describe('checkPathAccess', () => {
  it('应该允许访问首页和上传页', () => {
    const appState = createMockAppState();

    expect(checkPathAccess('/', appState).allowed).toBe(true);
    expect(checkPathAccess('/upload', appState).allowed).toBe(true);
  });

  it('应该阻止访问分割页（无图片）', () => {
    const appState = createMockAppState();
    const result = checkPathAccess('/split', appState);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('请先上传图片');
    expect(result.suggestedPath).toBe('/upload');
  });

  it('应该允许访问分割页（有图片）', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
    });
    const result = checkPathAccess('/split', appState);

    expect(result.allowed).toBe(true);
  });

  it('应该阻止访问导出页（无选中切片）', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [{ blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 }],
    });
    const result = checkPathAccess('/export', appState);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('请先选择要导出的图片切片');
    expect(result.suggestedPath).toBe('/split');
  });

  it('应该阻止处理中时的访问', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      isProcessing: true,
    });

    const splitResult = checkPathAccess('/split', appState);
    expect(splitResult.allowed).toBe(false);
    expect(splitResult.reason).toBe('图片正在处理中，请稍候');
  });
});

describe('getNavigationItemTooltip', () => {
  it('应该为可用按钮返回undefined', () => {
    const appState = createMockAppState();
    const homeItem: NavigationItem = { path: '/', name: '首页', disabled: false };

    expect(getNavigationItemTooltip(homeItem, appState)).toBeUndefined();
  });

  it('应该为禁用的分割按钮返回正确提示', () => {
    const appState = createMockAppState();
    const splitItem: NavigationItem = { path: '/split', name: '分割', disabled: true };

    expect(getNavigationItemTooltip(splitItem, appState)).toBe('请先上传图片');
  });

  it('应该为禁用的导出按钮返回正确提示', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
    });
    const exportItem: NavigationItem = { path: '/export', name: '导出', disabled: true };

    expect(getNavigationItemTooltip(exportItem, appState)).toBe('请先选择要导出的图片切片');
  });

  it('应该为处理中状态返回正确提示', () => {
    const appState = createMockAppState({
      originalImage: createMockImage(),
      isProcessing: true,
    });
    const splitItem: NavigationItem = { path: '/split', name: '分割', disabled: true };

    expect(getNavigationItemTooltip(splitItem, appState)).toBe('图片正在处理中，请稍候');
  });
});

describe('validateNavigationState', () => {
  it('应该验证有效的导航状态', () => {
    const navigationState = {
      currentStep: '/split',
      availableSteps: ['/split'],
      completedSteps: ['/', '/upload'],
      blockedSteps: ['/export'],
    };
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [{ blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 }],
    });

    const result = validateNavigationState(navigationState, appState);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('应该检测状态不一致', () => {
    const navigationState = {
      currentStep: '/split',
      availableSteps: ['/split'],
      completedSteps: ['/', '/upload'],
      blockedSteps: ['/export'],
    };
    const appState = createMockAppState(); // 没有原始图片

    const result = validateNavigationState(navigationState, appState);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('分割步骤可用但没有原始图片');
  });

  it('应该检测导出状态不一致', () => {
    const navigationState = {
      currentStep: '/export',
      availableSteps: ['/export'],
      completedSteps: ['/', '/upload', '/split'],
      blockedSteps: [],
    };
    const appState = createMockAppState({
      originalImage: createMockImage(),
      imageSlices: [{ blob: new Blob(), url: 'blob:test1', index: 0, width: 800, height: 600 }],
      // 没有选中切片
    });

    const result = validateNavigationState(navigationState, appState);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('导出步骤可用但没有选中的切片');
  });
});
