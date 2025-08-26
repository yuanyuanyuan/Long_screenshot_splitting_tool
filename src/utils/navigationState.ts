/**
 * 导航状态计算工具函数
 * 根据应用状态计算导航按钮的状态（激活、可点击、禁用）
 */

import type { AppState, NavigationItem, NavigationState, NavigationMetrics } from '../types';

// 默认导航项配置
export const defaultNavigationItems: NavigationItem[] = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/upload', name: '上传', icon: '📤' },
  { path: '/split', name: '分割', icon: '✂️' },
  { path: '/export', name: '导出', icon: '💾' },
];

/**
 * 根据应用状态和当前路径确定导航状态
 * @param items 导航项列表
 * @param currentPath 当前路径
 * @param appState 应用状态
 * @returns 更新后的导航项和导航状态
 */
export function determineNavigationState(
  items: NavigationItem[],
  currentPath: string,
  appState: AppState
): {
  items: NavigationItem[];
  navigationState: NavigationState;
} {
  // 提取应用状态中的关键信息
  const hasOriginalImage = !!appState.originalImage;
  const hasImageSlices = appState.imageSlices.length > 0;
  const hasSelectedSlices = appState.selectedSlices.size > 0;
  const isProcessing = appState.isProcessing;

  // 计算每个导航项的状态
  const updatedItems = items.map(item => {
    let disabled = false;
    const active = currentPath === item.path;

    // 根据路径和应用状态确定是否禁用
    switch (item.path) {
      case '/':
        // 首页始终可用
        disabled = false;
        break;
      case '/upload':
        // 上传页面始终可用
        disabled = false;
        break;
      case '/split':
        // 如果没有上传图片或正在处理中，则禁用分割按钮
        disabled = !hasOriginalImage || isProcessing;
        break;
      case '/export':
        // 如果没有选择任何切片或正在处理中，则禁用导出按钮
        disabled = !hasSelectedSlices || isProcessing;
        break;
      default:
        disabled = false;
    }

    return {
      ...item,
      disabled,
      active,
    };
  });

  // 计算导航状态分类
  const completedSteps: string[] = [];
  const availableSteps: string[] = [];
  const blockedSteps: string[] = [];

  items.forEach(item => {
    const updatedItem = updatedItems.find(ui => ui.path === item.path);
    if (!updatedItem) return;

    if (updatedItem.disabled) {
      blockedSteps.push(item.path);
    } else if (updatedItem.active) {
      availableSteps.push(item.path);
    } else {
      // 判断是否为已完成步骤
      switch (item.path) {
        case '/':
          // 首页总是被认为是可用的起点
          if (currentPath !== '/') {
            completedSteps.push(item.path);
          } else {
            availableSteps.push(item.path);
          }
          break;
        case '/upload':
          if (hasOriginalImage && currentPath !== '/upload') {
            completedSteps.push(item.path);
          } else if (!updatedItem.active) {
            availableSteps.push(item.path);
          }
          break;
        case '/split':
          if (hasImageSlices && currentPath !== '/split') {
            completedSteps.push(item.path);
          } else if (hasOriginalImage && !updatedItem.active) {
            availableSteps.push(item.path);
          }
          break;
        case '/export':
          if (hasSelectedSlices && !updatedItem.active) {
            availableSteps.push(item.path);
          }
          break;
      }
    }
  });

  const navigationState: NavigationState = {
    currentStep: currentPath,
    availableSteps,
    completedSteps,
    blockedSteps,
  };

  return { items: updatedItems, navigationState };
}

/**
 * 计算导航进度指标
 * @param navigationState 导航状态
 * @param totalSteps 总步骤数
 * @returns 导航指标
 */
export function calculateNavigationMetrics(
  navigationState: NavigationState,
  totalSteps: number = 4
): NavigationMetrics {
  const completedCount = navigationState.completedSteps.length;
  const currentStepIndex = defaultNavigationItems.findIndex(
    item => item.path === navigationState.currentStep
  );

  // 计算进度百分比：已完成步骤 + 当前步骤的权重
  const progressPercentage = Math.round(
    ((completedCount + (currentStepIndex >= 0 ? 0.5 : 0)) / totalSteps) * 100
  );

  return {
    totalSteps,
    completedSteps: completedCount,
    currentStepIndex: Math.max(0, currentStepIndex),
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}

/**
 * 检查路径访问权限
 * @param path 目标路径
 * @param appState 应用状态
 * @returns 访问权限检查结果
 */
export function checkPathAccess(
  path: string,
  appState: AppState
): {
  allowed: boolean;
  reason?: string;
  suggestedPath?: string;
} {
  const hasOriginalImage = !!appState.originalImage;
  const hasSelectedSlices = appState.selectedSlices.size > 0;
  const isProcessing = appState.isProcessing;

  switch (path) {
    case '/':
    case '/upload':
      return { allowed: true };

    case '/split':
      if (isProcessing) {
        return {
          allowed: false,
          reason: '图片正在处理中，请稍候',
          suggestedPath: '/upload',
        };
      }
      if (!hasOriginalImage) {
        return {
          allowed: false,
          reason: '请先上传图片',
          suggestedPath: '/upload',
        };
      }
      return { allowed: true };

    case '/export':
      if (isProcessing) {
        return {
          allowed: false,
          reason: '图片正在处理中，请稍候',
          suggestedPath: '/split',
        };
      }
      if (!hasSelectedSlices) {
        return {
          allowed: false,
          reason: '请先选择要导出的图片切片',
          suggestedPath: '/split',
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * 获取导航项的提示文本（用于禁用状态）
 * 支持国际化
 */
export function getNavigationItemTooltip(
  item: NavigationItem,
  appState: AppState,
  t?: (key: string, params?: Record<string, any>) => string
): string | undefined {
  if (!item.disabled) {
    return undefined;
  }

  // 如果没有提供翻译函数，使用默认中文文本
  const translate =
    t ||
    ((key: string) => {
      const fallbackTexts: Record<string, string> = {
        'navigation.tooltip.split.disabled': '请先上传图片',
        'navigation.tooltip.export.disabled': '请先选择要导出的切片',
        'navigation.tooltip.processing': '正在处理中，请稍候...',
      };
      return fallbackTexts[key] || key;
    });

  switch (item.path) {
    case '/split':
      if (!appState.originalImage) {
        return translate('navigation.tooltip.split.disabled');
      }
      if (appState.isProcessing) {
        return translate('navigation.tooltip.processing');
      }
      break;
    case '/export':
      if (appState.selectedSlices.size === 0) {
        return translate('navigation.tooltip.export.disabled');
      }
      if (appState.isProcessing) {
        return translate('navigation.tooltip.processing');
      }
      break;
  }

  return undefined;
}

/**
 * 验证导航状态的一致性
 * @param navigationState 导航状态
 * @param appState 应用状态
 * @returns 验证结果
 */
export function validateNavigationState(
  navigationState: NavigationState,
  appState: AppState
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 检查当前步骤是否在可用步骤或已完成步骤中
  const isCurrentStepValid =
    navigationState.availableSteps.includes(navigationState.currentStep) ||
    navigationState.completedSteps.includes(navigationState.currentStep);

  if (!isCurrentStepValid && navigationState.blockedSteps.includes(navigationState.currentStep)) {
    errors.push(`当前步骤 ${navigationState.currentStep} 被阻塞但仍处于激活状态`);
  }

  // 检查状态逻辑一致性
  const hasOriginalImage = !!appState.originalImage;
  const hasSelectedSlices = appState.selectedSlices.size > 0;

  if (navigationState.availableSteps.includes('/split') && !hasOriginalImage) {
    errors.push('分割步骤可用但没有原始图片');
  }

  if (navigationState.availableSteps.includes('/export') && !hasSelectedSlices) {
    errors.push('导出步骤可用但没有选中的切片');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
