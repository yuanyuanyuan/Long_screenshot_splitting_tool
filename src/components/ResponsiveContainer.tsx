import React, { ElementType } from 'react';
import { useViewport, createResponsiveClasses } from '../hooks/useViewport';

/**
 * Props for ResponsiveContainer component
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClass?: string;
  tabletClass?: string;
  desktopClass?: string;
  as?: ElementType;
  enableTouchOptimization?: boolean;
}

/**
 * Responsive container component that adapts layout based on viewport
 * Provides mobile-first responsive behavior with touch optimizations
 * 
 * @example
 * ```tsx
 * <ResponsiveContainer 
 *   mobileClass="flex-col space-y-4"
 *   tabletClass="flex-row space-x-6" 
 *   desktopClass="grid grid-cols-3 gap-8"
 *   enableTouchOptimization
 * >
 *   <div>Content</div>
 * </ResponsiveContainer>
 * ```
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  mobileClass = '',
  tabletClass = '',
  desktopClass = '',
  as: Component = 'div',
  enableTouchOptimization = false,
}) => {
  const viewport = useViewport();
  
  // Build responsive classes
  const baseClasses = createResponsiveClasses('responsive-container', viewport);
  
  // Apply breakpoint-specific classes
  const breakpointClasses = [
    viewport.isMobile && mobileClass,
    viewport.isTablet && tabletClass, 
    viewport.isDesktop && desktopClass,
  ].filter(Boolean).join(' ');
  
  // Touch optimization classes
  const touchClasses = enableTouchOptimization && viewport.isTouch 
    ? 'touch-manipulation tap-highlight-none' 
    : '';
  
  // Combine all classes
  const finalClasses = [
    baseClasses,
    breakpointClasses,
    touchClasses,
    className
  ].filter(Boolean).join(' ');
  
  const ElementComponent = Component as ElementType;
  
  return (
    <ElementComponent className={finalClasses}>
      {children}
    </ElementComponent>
  );
};

/**
 * Mobile-first flex container
 */
export const ResponsiveFlexContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'column' | 'row' | 'responsive';
}> = ({ 
  children, 
  className = '', 
  direction = 'responsive' 
}) => {
  const viewport = useViewport();
  
  const directionClasses = {
    column: 'flex flex-col',
    row: 'flex flex-row',
    responsive: viewport.isMobile ? 'flex flex-col' : 'flex flex-row',
  };
  
  const gapClasses = viewport.isMobile 
    ? 'gap-3' 
    : viewport.isTablet 
    ? 'gap-4' 
    : 'gap-6';
  
  return (
    <div className={`${directionClasses[direction]} ${gapClasses} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Mobile-first grid container
 */
export const ResponsiveGridContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}> = ({ 
  children, 
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}) => {
  const viewport = useViewport();
  
  const gridClasses = viewport.isMobile
    ? `grid grid-cols-${cols.mobile || 1}`
    : viewport.isTablet
    ? `grid grid-cols-${cols.tablet || 2}`
    : `grid grid-cols-${cols.desktop || 3}`;
  
  const gapClasses = viewport.isMobile 
    ? 'gap-3' 
    : viewport.isTablet 
    ? 'gap-4' 
    : 'gap-6';
  
  return (
    <div className={`${gridClasses} ${gapClasses} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Mobile-optimized button container
 */
export const ResponsiveButtonContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  layout?: 'stack' | 'inline' | 'responsive';
}> = ({ 
  children, 
  className = '',
  layout = 'responsive'
}) => {
  const viewport = useViewport();
  
  const layoutClasses = {
    stack: 'flex flex-col',
    inline: 'flex flex-row',
    responsive: viewport.isMobile ? 'flex flex-col' : 'flex flex-row',
  };
  
  const spacingClasses = viewport.isMobile 
    ? 'space-y-3' 
    : layout === 'inline' || (layout === 'responsive' && !viewport.isMobile)
    ? 'space-x-3 space-y-0'
    : 'space-y-3';
  
  return (
    <div className={`${layoutClasses[layout]} ${spacingClasses} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Mobile-first content container with safe areas
 */
export const SafeAreaContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  includePadding?: boolean;
}> = ({ 
  children, 
  className = '',
  includePadding = true 
}) => {
  const viewport = useViewport();
  
  const paddingClasses = includePadding 
    ? viewport.isMobile 
      ? 'px-4 py-2' 
      : 'px-6 py-4'
    : '';
  
  const safeAreaClasses = 'safe-area-inset-top safe-area-inset-bottom';
  
  return (
    <div className={`${paddingClasses} ${safeAreaClasses} ${className}`}>
      {children}
    </div>
  );
};