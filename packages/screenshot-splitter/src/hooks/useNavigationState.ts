/**
 * 导航状态Hook - 优化版本
 * 使用React性能优化技术，减少不必要的重渲染
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// 临时AppState接口定义，直到正确导入
interface AppState {
  originalImage: HTMLImageElement | null;
  imageSlices: any[];
  selectedSlices: Set<number>;
  [key: string]: any;
}

// 导航状态接口
export interface NavigationState {
  currentStep: string;
  availableSteps: string[];
  completedSteps: string[];
  blockedSteps: string[];
}

// 导航项接口
export interface NavigationItem {
  path: string;
  name: string;
  icon?: string;
  disabled?: boolean;
  active?: boolean;
}

// 导航指标接口
export interface NavigationMetrics {
  totalSteps: number;
  completedSteps: number;
  currentStepIndex: number;
  progressPercentage: number;
}

// 默认导航项
const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/upload', name: '上传', icon: '📤' },
  { path: '/split', name: '分割', icon: '✂️' },
  { path: '/export', name: '导出', icon: '💾' }
];

/**
 * 优化的导航状态Hook
 */
export function useNavigationState(appState: AppState, currentPath: string) {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentStep: currentPath,
    availableSteps: ['/'],
    completedSteps: [],
    blockedSteps: ['/split', '/export']
  });

  // 使用ref来存储上一次的依赖值，避免不必要的计算
  // 使用ref来存储上一次的依赖值，避免不必要的计算
  const prevDepsRef = useRef<{
    hasOriginalImage: boolean;
    imageSlicesLength: number;
    selectedSlicesSize: number;
    currentPath: string;
  } | undefined>(undefined);

  // 计算关键状态，使用useMemo优化
  const keyStates = useMemo(() => {
    const hasOriginalImage = !!appState.originalImage;
    const imageSlicesLength = appState.imageSlices.length;
    const selectedSlicesSize = appState.selectedSlices.size;

    return {
      hasOriginalImage,
      hasImageSlices: imageSlicesLength > 0,
      hasSelectedSlices: selectedSlicesSize > 0,
      imageSlicesLength,
      selectedSlicesSize
    };
  }, [
    appState.originalImage,
    appState.imageSlices.length,
    appState.selectedSlices.size
  ]);

  // 计算导航项状态，使用useMemo优化
  const navigationItems = useMemo(() => {
    const { hasOriginalImage, hasSelectedSlices } = keyStates;

    return DEFAULT_NAVIGATION_ITEMS.map(item => {
      let disabled = false;
      const active = currentPath === item.path;

      // 根据路径和应用状态确定是否禁用
      switch (item.path) {
        case '/':
        case '/upload':
          disabled = false;
          break;
        case '/split':
          disabled = !hasOriginalImage;
          break;
        case '/export':
          disabled = !hasSelectedSlices;
          break;
        default:
          disabled = false;
      }

      return {
        ...item,
        disabled,
        active
      };
    });
  }, [keyStates, currentPath]);

  // 计算导航状态，使用useMemo优化
  const computedNavigationState = useMemo(() => {
    const { hasOriginalImage, hasImageSlices, hasSelectedSlices } = keyStates;
    
    const completedSteps: string[] = [];
    const availableSteps: string[] = [];
    const blockedSteps: string[] = [];

    DEFAULT_NAVIGATION_ITEMS.forEach(item => {
      const navItem = navigationItems.find(ni => ni.path === item.path);
      
      if (navItem?.disabled) {
        blockedSteps.push(item.path);
      } else if (navItem?.active) {
        availableSteps.push(item.path);
      } else {
        // 判断是否为已完成步骤
        switch (item.path) {
          case '/':
            completedSteps.push(item.path);
            break;
          case '/upload':
            if (hasOriginalImage) {
              completedSteps.push(item.path);
            } else {
              availableSteps.push(item.path);
            }
            break;
          case '/split':
            if (hasImageSlices) {
              completedSteps.push(item.path);
            } else if (hasOriginalImage) {
              availableSteps.push(item.path);
            }
            break;
          case '/export':
            if (hasSelectedSlices) {
              availableSteps.push(item.path);
            }
            break;
        }
      }
    });

    return {
      currentStep: currentPath,
      availableSteps,
      completedSteps,
      blockedSteps
    };
  }, [keyStates, navigationItems, currentPath]);

  // 只在关键依赖变化时更新状态
  useEffect(() => {
    const currentDeps = {
      hasOriginalImage: keyStates.hasOriginalImage,
      imageSlicesLength: keyStates.imageSlicesLength,
      selectedSlicesSize: keyStates.selectedSlicesSize,
      currentPath
    };

    // 浅比较，避免不必要的更新
    const prevDeps = prevDepsRef.current;
    if (!prevDeps || 
        prevDeps.hasOriginalImage !== currentDeps.hasOriginalImage ||
        prevDeps.imageSlicesLength !== currentDeps.imageSlicesLength ||
        prevDeps.selectedSlicesSize !== currentDeps.selectedSlicesSize ||
        prevDeps.currentPath !== currentDeps.currentPath) {
      
      setNavigationState(computedNavigationState);
      prevDepsRef.current = currentDeps;
    }
  }, [computedNavigationState, keyStates, currentPath]);

  // 计算导航指标，使用useMemo优化
  const navigationMetrics = useMemo((): NavigationMetrics => {
    const totalSteps = DEFAULT_NAVIGATION_ITEMS.length;
    const completedSteps = computedNavigationState.completedSteps.length;
    const currentStepIndex = DEFAULT_NAVIGATION_ITEMS.findIndex(
      item => item.path === currentPath
    );
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      totalSteps,
      completedSteps,
      currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : 0,
      progressPercentage
    };
  }, [computedNavigationState, currentPath]);

  // 获取下一个可用步骤
  const getNextAvailableStep = useCallback((): string | null => {
    const currentIndex = DEFAULT_NAVIGATION_ITEMS.findIndex(
      item => item.path === currentPath
    );
    
    for (let i = currentIndex + 1; i < DEFAULT_NAVIGATION_ITEMS.length; i++) {
      const item = DEFAULT_NAVIGATION_ITEMS[i];
      const navItem = navigationItems.find(ni => ni.path === item.path);
      if (navItem && !navItem.disabled) {
        return item.path;
      }
    }
    
    return null;
  }, [currentPath, navigationItems]);

  // 获取上一个可用步骤
  const getPreviousAvailableStep = useCallback((): string | null => {
    const currentIndex = DEFAULT_NAVIGATION_ITEMS.findIndex(
      item => item.path === currentPath
    );
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      const item = DEFAULT_NAVIGATION_ITEMS[i];
      const navItem = navigationItems.find(ni => ni.path === item.path);
      if (navItem && !navItem.disabled) {
        return item.path;
      }
    }
    
    return null;
  }, [currentPath, navigationItems]);

  // 检查步骤是否可访问
  const isStepAccessible = useCallback((path: string): boolean => {
    const navItem = navigationItems.find(item => item.path === path);
    return navItem ? !navItem.disabled : false;
  }, [navigationItems]);

  // 获取步骤状态
  const getStepStatus = useCallback((path: string): 'active' | 'completed' | 'available' | 'blocked' => {
    if (computedNavigationState.currentStep === path) return 'active';
    if (computedNavigationState.completedSteps.includes(path)) return 'completed';
    if (computedNavigationState.availableSteps.includes(path)) return 'available';
    return 'blocked';
  }, [computedNavigationState]);

  return {
    // 状态
    navigationState,
    navigationItems,
    navigationMetrics,
    
    // 工具方法
    getNextAvailableStep,
    getPreviousAvailableStep,
    isStepAccessible,
    getStepStatus,
    
    // 便捷属性
    canGoNext: getNextAvailableStep() !== null,
    canGoPrevious: getPreviousAvailableStep() !== null,
    isFirstStep: currentPath === DEFAULT_NAVIGATION_ITEMS[0].path,
    isLastStep: currentPath === DEFAULT_NAVIGATION_ITEMS[DEFAULT_NAVIGATION_ITEMS.length - 1].path
  };
}

/**
 * 轻量级导航状态Hook，仅返回基本状态
 * 用于不需要完整功能的组件，减少性能开销
 */
export function useNavigationStateLight(appState: AppState, currentPath: string) {
  const keyStates = useMemo(() => ({
    hasOriginalImage: !!appState.originalImage,
    hasImageSlices: appState.imageSlices.length > 0,
    hasSelectedSlices: appState.selectedSlices.size > 0
  }), [
    appState.originalImage,
    appState.imageSlices.length,
    appState.selectedSlices.size
  ]);

  const navigationItems = useMemo(() => {
    return DEFAULT_NAVIGATION_ITEMS.map(item => ({
      ...item,
      disabled: item.path === '/split' ? !keyStates.hasOriginalImage :
                item.path === '/export' ? !keyStates.hasSelectedSlices : false,
      active: currentPath === item.path
    }));
  }, [keyStates, currentPath]);

  return { navigationItems };
}

export default useNavigationState;