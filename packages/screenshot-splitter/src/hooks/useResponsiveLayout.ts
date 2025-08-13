/**
 * 响应式布局检测自定义Hook
 * 实现屏幕尺寸检测和布局模式切换
 */

import { useState, useEffect, useCallback } from 'react';

// 布局模式常量
export const LayoutMode = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
} as const;

export type LayoutMode = typeof LayoutMode[keyof typeof LayoutMode];

// 断点配置
const BREAKPOINTS = {
  mobile: 768,   // < 768px
  tablet: 1024,  // 768px - 1024px
  desktop: 1024  // >= 1024px
} as const;

// 布局策略配置
export interface LayoutStrategy {
  mode: LayoutMode;
  containerDirection: 'row' | 'column';
  sidebarPosition: 'left' | 'top';
  sidebarWidth: string;
  thumbnailDisplay: 'vertical' | 'horizontal';
  showKeyboardHints: boolean;
  compactMode: boolean;
}

// 预定义的布局策略
const LAYOUT_STRATEGIES: Record<LayoutMode, LayoutStrategy> = {
  [LayoutMode.MOBILE]: {
    mode: LayoutMode.MOBILE,
    containerDirection: 'column',
    sidebarPosition: 'top',
    sidebarWidth: '100%',
    thumbnailDisplay: 'horizontal',
    showKeyboardHints: false,
    compactMode: true
  },
  [LayoutMode.TABLET]: {
    mode: LayoutMode.TABLET,
    containerDirection: 'column',
    sidebarPosition: 'top',
    sidebarWidth: '100%',
    thumbnailDisplay: 'horizontal',
    showKeyboardHints: true,
    compactMode: false
  },
  [LayoutMode.DESKTOP]: {
    mode: LayoutMode.DESKTOP,
    containerDirection: 'row',
    sidebarPosition: 'left',
    sidebarWidth: '320px',
    thumbnailDisplay: 'vertical',
    showKeyboardHints: true,
    compactMode: false
  }
};

// Hook返回值接口
export interface UseResponsiveLayoutReturn {
  // 当前布局模式
  layoutMode: LayoutMode;
  // 当前布局策略
  layoutStrategy: LayoutStrategy;
  // 屏幕尺寸信息
  screenSize: {
    width: number;
    height: number;
  };
  // 是否为移动端
  isMobile: boolean;
  // 是否为平板
  isTablet: boolean;
  // 是否为桌面端
  isDesktop: boolean;
  // 手动设置布局模式（用于测试）
  setLayoutMode: (mode: LayoutMode) => void;
  // 获取响应式类名
  getResponsiveClasses: () => {
    container: string;
    sidebar: string;
    main: string;
    thumbnailList: string;
    thumbnailItem: string;
    button: string;
    imageContainer: string;
  };
}

/**
 * 响应式布局检测Hook
 */
export function useResponsiveLayout(): UseResponsiveLayoutReturn {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });
  
  const [manualMode, setManualMode] = useState<LayoutMode | null>(null);

  // 根据屏幕宽度确定布局模式
  const getLayoutModeFromWidth = useCallback((width: number): LayoutMode => {
    if (width < BREAKPOINTS.mobile) {
      return LayoutMode.MOBILE;
    } else if (width < BREAKPOINTS.desktop) {
      return LayoutMode.TABLET;
    } else {
      return LayoutMode.DESKTOP;
    }
  }, []);

  // 当前布局模式（手动模式优先）
  const layoutMode = manualMode || getLayoutModeFromWidth(screenSize.width);
  
  // 当前布局策略
  const layoutStrategy = LAYOUT_STRATEGIES[layoutMode];

  // 计算布局状态
  const isMobile = layoutMode === LayoutMode.MOBILE;
  const isTablet = layoutMode === LayoutMode.TABLET;
  const isDesktop = layoutMode === LayoutMode.DESKTOP;

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    const newSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    setScreenSize(newSize);
    
    // 如果是手动模式，检查是否需要自动切换回自动模式
    if (manualMode) {
      const autoMode = getLayoutModeFromWidth(newSize.width);
      // 如果手动模式与自动检测模式差异过大，则切换回自动模式
      if (
        (manualMode === LayoutMode.MOBILE && autoMode === LayoutMode.DESKTOP) ||
        (manualMode === LayoutMode.DESKTOP && autoMode === LayoutMode.MOBILE)
      ) {
        setManualMode(null);
      }
    }
    
    console.log('[useResponsiveLayout] 屏幕尺寸变化:', {
      size: newSize,
      layoutMode: manualMode || getLayoutModeFromWidth(newSize.width),
      isManual: !!manualMode
    });
  }, [manualMode, getLayoutModeFromWidth]);

  // 监听窗口大小变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', handleResize);
    
    // 初始化时触发一次
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // 手动设置布局模式
  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setManualMode(mode);
    console.log('[useResponsiveLayout] 手动设置布局模式:', mode);
  }, []);

  // 获取响应式类名
  const getResponsiveClasses = useCallback(() => {
    const strategy = layoutStrategy;
    
    return {
      container: `flex ${strategy.containerDirection === 'column' ? 'flex-col' : 'flex-row'} gap-4 md:gap-6 p-4 md:p-6 bg-white rounded-lg shadow-sm w-full`,
      sidebar: `${strategy.containerDirection === 'column' ? 'w-full' : 'w-full md:w-1/3 xl:w-1/4'} flex-shrink-0 ${strategy.containerDirection === 'column' ? 'order-first' : ''} ${isMobile ? 'overscroll-contain scroll-smooth' : ''}`,
      main: `flex-1 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] ${isMobile ? 'touch-manipulation select-none w-full' : ''}`,
      thumbnailList: `${strategy.thumbnailDisplay === 'horizontal' ? 'flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory' : 'space-y-3'} ${strategy.thumbnailDisplay === 'vertical' ? 'max-h-96 lg:max-h-[600px] overflow-y-auto' : ''} ${isMobile ? 'overscroll-contain scroll-smooth -mx-4 px-4' : ''}`,
      thumbnailItem: `${strategy.compactMode ? 'p-2 md:p-3' : 'p-3 md:p-4'} ${isMobile ? 'min-h-[60px] touch-manipulation snap-start flex-shrink-0' : ''} border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer relative flex items-center gap-3`,
      button: `${strategy.compactMode ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base'} ${isMobile ? 'min-h-[44px] touch-manipulation' : ''} rounded-md font-medium transition-colors duration-200`,
      imageContainer: `w-full flex flex-col items-center justify-center ${isMobile ? 'touch-manipulation select-none' : ''}`
    };
  }, [layoutStrategy, isMobile]);

  // 调试日志
  useEffect(() => {
    console.log('[useResponsiveLayout] 布局状态更新:', {
      layoutMode,
      layoutStrategy,
      screenSize,
      isMobile,
      isTablet,
      isDesktop,
      isManual: !!manualMode
    });
  }, [layoutMode, layoutStrategy, screenSize, isMobile, isTablet, isDesktop, manualMode]);

  return {
    layoutMode,
    layoutStrategy,
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    setLayoutMode,
    getResponsiveClasses
  };
}

// 导出工具函数
export const getBreakpoint = (width: number): LayoutMode => {
  if (width < BREAKPOINTS.mobile) {
    return LayoutMode.MOBILE;
  } else if (width < BREAKPOINTS.desktop) {
    return LayoutMode.TABLET;
  } else {
    return LayoutMode.DESKTOP;
  }
};

// 导出断点常量
export { BREAKPOINTS, LAYOUT_STRATEGIES };