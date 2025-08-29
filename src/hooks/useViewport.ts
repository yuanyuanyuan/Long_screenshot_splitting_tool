import { useState, useEffect, useCallback } from 'react';

/**
 * Responsive breakpoint configuration
 * Mobile-first approach with standard breakpoints
 */
export const BREAKPOINTS = {
  xs: 0,     // Extra small devices (mobile phones)
  sm: 640,   // Small tablets
  md: 768,   // Medium tablets
  lg: 1024,  // Laptops
  xl: 1280,  // Desktop
  '2xl': 1536, // Large desktop
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Viewport state interface
 */
export interface ViewportState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  currentBreakpoint: Breakpoint;
  isPortrait: boolean;
  isLandscape: boolean;
  devicePixelRatio: number;
  isTouch: boolean;
}

/**
 * Debounce utility for resize events
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Detect if device supports touch
 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - legacy support for IE
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get current breakpoint based on width
 */
function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Get viewport state from window dimensions
 */
function getViewportState(): ViewportState {
  if (typeof window === 'undefined') {
    // SSR fallback - assume mobile
    return {
      width: 320,
      height: 568,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLarge: false,
      currentBreakpoint: 'xs',
      isPortrait: true,
      isLandscape: false,
      devicePixelRatio: 1,
      isTouch: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const currentBreakpoint = getCurrentBreakpoint(width);
  const devicePixelRatio = window.devicePixelRatio || 1;
  const isTouch = isTouchDevice();

  return {
    width,
    height,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isLarge: width >= BREAKPOINTS.xl,
    currentBreakpoint,
    isPortrait: height > width,
    isLandscape: width > height,
    devicePixelRatio,
    isTouch,
  };
}

/**
 * Custom hook for responsive viewport detection
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isTablet, currentBreakpoint } = useViewport();
 *   
 *   return (
 *     <div>
 *       {isMobile && <MobileLayout />}
 *       {isTablet && <TabletLayout />}
 *       Current breakpoint: {currentBreakpoint}
 *     </div>
 *   );
 * }
 * ```
 */
export function useViewport(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>(getViewportState);

  const updateViewport = useCallback(() => {
    setViewport(getViewportState());
  }, []);

  // Debounce resize events for performance
  const debouncedUpdateViewport = useCallback(
    debounce(updateViewport, 100),
    [updateViewport]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial state
    updateViewport();

    // Listen for resize events
    window.addEventListener('resize', debouncedUpdateViewport);
    window.addEventListener('orientationchange', debouncedUpdateViewport);

    return () => {
      window.removeEventListener('resize', debouncedUpdateViewport);
      window.removeEventListener('orientationchange', debouncedUpdateViewport);
    };
  }, [debouncedUpdateViewport, updateViewport]);

  return viewport;
}

/**
 * Hook to check if current viewport matches specific breakpoint(s)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobileOrTablet = useBreakpoint(['xs', 'sm', 'md']);
 *   const isLargeScreen = useBreakpoint('xl');
 *   
 *   return (
 *     <div>
 *       {isMobileOrTablet && <CompactLayout />}
 *       {isLargeScreen && <WideLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoint(
  breakpoints: Breakpoint | Breakpoint[]
): boolean {
  const { currentBreakpoint } = useViewport();
  
  const targetBreakpoints = Array.isArray(breakpoints) 
    ? breakpoints 
    : [breakpoints];
  
  return targetBreakpoints.includes(currentBreakpoint);
}

/**
 * Hook to check if viewport width is above/below specific breakpoint
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isAboveMd = useMediaQuery('md', 'up');
 *   const isBelowLg = useMediaQuery('lg', 'down');
 *   
 *   return (
 *     <div>
 *       {isAboveMd && <TabletPlusLayout />}
 *       {isBelowLg && <MobileTabletLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(
  breakpoint: Breakpoint,
  direction: 'up' | 'down' = 'up'
): boolean {
  const { width } = useViewport();
  const breakpointValue = BREAKPOINTS[breakpoint];
  
  return direction === 'up' 
    ? width >= breakpointValue
    : width < breakpointValue;
}

/**
 * Hook for mobile-specific detection with enhanced features
 */
export function useMobileDetection() {
  const viewport = useViewport();
  
  return {
    ...viewport,
    // Enhanced mobile detection
    isMobileDevice: viewport.isMobile || viewport.isTouch,
    isSmallMobile: viewport.width < BREAKPOINTS.sm,
    isMobileLandscape: viewport.isMobile && viewport.isLandscape,
    isMobilePortrait: viewport.isMobile && viewport.isPortrait,
    
    // Touch-specific states
    isTouch: viewport.isTouch,
    hasTouchAndMouse: viewport.isTouch && !viewport.isMobile,
    
    // Screen quality indicators
    isRetinaDisplay: viewport.devicePixelRatio >= 2,
    isHighDensity: viewport.devicePixelRatio >= 1.5,
  };
}

/**
 * Helper function to create responsive CSS classes
 */
export function createResponsiveClasses(
  baseClass: string,
  viewport: ViewportState
): string {
  const classes = [baseClass];
  
  if (viewport.isMobile) classes.push(`${baseClass}--mobile`);
  if (viewport.isTablet) classes.push(`${baseClass}--tablet`);
  if (viewport.isDesktop) classes.push(`${baseClass}--desktop`);
  if (viewport.isTouch) classes.push(`${baseClass}--touch`);
  if (viewport.isLandscape) classes.push(`${baseClass}--landscape`);
  if (viewport.isPortrait) classes.push(`${baseClass}--portrait`);
  
  classes.push(`${baseClass}--${viewport.currentBreakpoint}`);
  
  return classes.join(' ');
}