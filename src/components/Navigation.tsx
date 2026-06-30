/**
 * 导航组件 - 性能优化版本
 * 使用React.memo、useCallback等优化技术减少不必要的重渲染
 */

import React, { memo, useCallback, useMemo, useEffect, useState } from 'react';
import { useNavigationState } from '../hooks/useNavigationState';
import { usePerformanceMonitor } from '../utils/navigationPerformanceMonitor';
import { CompactLanguageSwitcher } from './LanguageSwitcher';
import { useI18nContext } from '../hooks/useI18nContext';
import { useViewport } from '../hooks/useViewport';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { TouchNav } from './mobile/TouchNav';
import './Navigation.css';

// 导航项接口
interface NavigationItem {
  path: string;
  name: string;
  icon?: string;
  disabled?: boolean;
  active?: boolean;
}

// 导航组件Props接口
interface NavigationProps {
  appState: any;
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
  showProgress?: boolean;
  showTooltips?: boolean;
  mobileOptimized?: boolean;
  enableSwipeNavigation?: boolean;
  hapticFeedback?: boolean;
}

// 单个导航按钮组件 - 使用memo优化，添加触摸优化
const NavigationButton = memo<{
  item: NavigationItem;
  onNavigate: (path: string) => void;
  showTooltips?: boolean;
  isMobile?: boolean;
  hapticFeedback?: boolean;
}>(({ item, onNavigate, showTooltips = true, isMobile = false, hapticFeedback = true }) => {
  const { t } = useI18nContext();
  // 性能监控
  const performanceMonitor = usePerformanceMonitor('NavigationButton');

  // 触摸反馈功能
  const triggerHapticFeedback = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  // 优化点击处理函数，使用useCallback避免重新创建
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      if (item.disabled) {
        return;
      }

      // 触摸反馈
      triggerHapticFeedback();

      // 记录交互性能
      performanceMonitor.recordInteraction('button-click', 0);

      onNavigate(item.path);
    },
    [item.disabled, item.path, onNavigate, performanceMonitor, triggerHapticFeedback]
  );

  // 优化键盘处理函数
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e as any);
      }
    },
    [handleClick]
  );

  // 计算按钮类名，使用useMemo优化
  const buttonClassName = useMemo(() => {
    const classes = ['nav-button'];

    if (item.active) classes.push('active');
    if (item.disabled) classes.push('disabled');
    if (isMobile) classes.push('mobile-optimized');

    return classes.join(' ');
  }, [item.active, item.disabled, isMobile]);

  // 计算按钮样式 - 移动端优化
  const buttonStyle = useMemo(() => {
    if (!isMobile) return undefined;

    return {
      minWidth: '44px',
      minHeight: '44px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '12px',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    } as React.CSSProperties;
  }, [isMobile]);

  // 计算按钮状态文本，用于无障碍访问
  const ariaLabel = useMemo(() => {
    let label = item.name;
    if (item.active) label += ` (${t('navigation.accessibility.current')})`;
    if (item.disabled) label += ` (${t('navigation.accessibility.disabled')})`;
    return label;
  }, [item.name, item.active, item.disabled, t]);

  return (
    <button
      className={buttonClassName}
      style={buttonStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={item.disabled}
      aria-label={ariaLabel}
      title={showTooltips ? ariaLabel : undefined}
      tabIndex={item.disabled ? -1 : 0}
    >
      {item.icon && (
        <span className="nav-icon" aria-hidden="true">
          {item.icon}
        </span>
      )}
      <span className="nav-text">{item.name}</span>
    </button>
  );
});

NavigationButton.displayName = 'NavigationButton';

// 进度条组件 - 使用memo优化
const ProgressBar = memo<{
  percentage: number;
  totalSteps: number;
  completedSteps: number;
}>(({ percentage, totalSteps, completedSteps }) => {
  const { t } = useI18nContext();
  const progressStyle = useMemo(
    () => ({
      width: `${percentage}%`,
    }),
    [percentage]
  );

  return (
    <div
      className="nav-progress"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="nav-progress-bar" style={progressStyle} />
      <span className="nav-progress-text" aria-live="polite">
        {t('navigation.progress.completed', {
          completed: completedSteps,
          total: totalSteps,
          percentage,
        })}
      </span>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// 主导航组件 - 使用memo优化，添加移动端支持
const Navigation = memo<NavigationProps>(
  ({
    appState,
    currentPath,
    onNavigate,
    className = '',
    showProgress = true,
    showTooltips = true,
    mobileOptimized = true,
    enableSwipeNavigation = true,
    hapticFeedback = true,
  }) => {
    const { t } = useI18nContext();
    const viewport = useViewport();
    // 性能监控
    const performanceMonitor = usePerformanceMonitor('Navigation');

    // 移动端自适应状态
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
      setIsMobileView(mobileOptimized && viewport.isMobile);
    }, [mobileOptimized, viewport.isMobile]);

    // 使用优化的导航状态Hook
    const {
      navigationItems,
      navigationMetrics,
      canGoNext,
      canGoPrevious,
      getNextAvailableStep,
      getPreviousAvailableStep,
    } = useNavigationState(appState, currentPath);

    // 优化导航处理函数，使用useCallback
    const handleNavigate = useCallback(
      (path: string) => {
        performanceMonitor.recordInteraction('navigation', 1);
        onNavigate(path);
      },
      [onNavigate, performanceMonitor]
    );

    // 快捷导航函数
    const handleNext = useCallback(() => {
      const nextStep = getNextAvailableStep();
      if (nextStep) {
        handleNavigate(nextStep);
      }
    }, [getNextAvailableStep, handleNavigate]);

    const handlePrevious = useCallback(() => {
      const prevStep = getPreviousAvailableStep();
      if (prevStep) {
        handleNavigate(prevStep);
      }
    }, [getPreviousAvailableStep, handleNavigate]);

    // 滑动手势处理（移动端）
    const swipeHandlers = useSwipeGestures(
      {
        onSwipeLeft: useCallback(() => {
          if (enableSwipeNavigation && canGoNext) {
            handleNext();
          }
        }, [enableSwipeNavigation, canGoNext, handleNext]),

        onSwipeRight: useCallback(() => {
          if (enableSwipeNavigation && canGoPrevious) {
            handlePrevious();
          }
        }, [enableSwipeNavigation, canGoPrevious, handlePrevious]),
      },
      {
        minDistance: 50,
        maxDuration: 500,
        preventDefault: true,
      }
    );

    // 键盘快捷键处理
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              if (canGoPrevious) handlePrevious();
              break;
            case 'ArrowRight':
              e.preventDefault();
              if (canGoNext) handleNext();
              break;
          }
        }
      },
      [canGoNext, canGoPrevious, handleNext, handlePrevious]
    );

    // 计算容器类名
    const containerClassName = useMemo(() => {
      const classes = ['navigation-container'];
      if (className) classes.push(className);
      if (isMobileView) classes.push('mobile-navigation');
      return classes.join(' ');
    }, [className, isMobileView]);

    // 渲染导航按钮列表，使用useMemo优化
    const navigationButtons = useMemo(() => {
      // 移动端使用TouchNav组件
      if (isMobileView) {
        const touchNavItems = navigationItems.map(item => ({
          id: item.path,
          label: t(item.name),
          icon: item.icon ? <span>{item.icon}</span> : undefined,
          onClick: () => handleNavigate(item.path),
          active: item.active,
          disabled: item.disabled,
        }));

        return (
          <TouchNav
            items={touchNavItems}
            orientation="horizontal"
            showLabels={true}
            hapticFeedback={hapticFeedback}
            swipeEnabled={enableSwipeNavigation}
          />
        );
      }

      // 桌面端使用传统按钮
      return navigationItems.map(item => (
        <NavigationButton
          key={item.path}
          item={{
            ...item,
            name: t(item.name), // 翻译导航项名称
          }}
          onNavigate={handleNavigate}
          showTooltips={showTooltips}
          isMobile={isMobileView}
          hapticFeedback={hapticFeedback}
        />
      ));
    }, [
      navigationItems,
      handleNavigate,
      showTooltips,
      t,
      isMobileView,
      hapticFeedback,
      enableSwipeNavigation,
    ]);

    return (
      <nav
        className={containerClassName}
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label={t('navigation.accessibility.mainNav')}
        {...(isMobileView && enableSwipeNavigation ? swipeHandlers : {})}
      >
        {/* 进度条 */}
        {showProgress && (
          <ProgressBar
            percentage={navigationMetrics.progressPercentage}
            totalSteps={navigationMetrics.totalSteps}
            completedSteps={navigationMetrics.completedSteps}
          />
        )}

        {/* 导航按钮组 */}
        <div
          className={`nav-buttons ${isMobileView ? 'mobile-nav-buttons' : ''}`}
          role="group"
          aria-label={t('navigation.accessibility.navButtons')}
          style={
            isMobileView
              ? {
                  display: 'flex',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                  gap: '8px',
                  padding: '8px',
                }
              : undefined
          }
        >
          {navigationButtons}
        </div>

        {/* 快捷导航按钮和语言切换器 */}
        <div
          className={`nav-shortcuts ${isMobileView ? 'mobile-shortcuts' : ''}`}
          role="group"
          aria-label={t('navigation.accessibility.shortcuts')}
          style={
            isMobileView
              ? {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '8px',
                }
              : undefined
          }
        >
          <button
            className={`nav-shortcut prev ${isMobileView ? 'mobile-shortcut' : ''}`}
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            aria-label={t('navigation.shortcuts.previous')}
            title={showTooltips ? t('navigation.shortcuts.previousTooltip') : undefined}
            style={
              isMobileView
                ? {
                    minWidth: '44px',
                    minHeight: '44px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    touchAction: 'manipulation',
                  }
                : undefined
            }
          >
            ← {isMobileView ? '' : t('navigation.shortcuts.previous')}
          </button>

          <button
            className={`nav-shortcut next ${isMobileView ? 'mobile-shortcut' : ''}`}
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label={t('navigation.shortcuts.next')}
            title={showTooltips ? t('navigation.shortcuts.nextTooltip') : undefined}
            style={
              isMobileView
                ? {
                    minWidth: '44px',
                    minHeight: '44px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    touchAction: 'manipulation',
                  }
                : undefined
            }
          >
            {isMobileView ? '' : t('navigation.shortcuts.next')} →
          </button>

          {/* 语言切换器 */}
          <div
            className={`nav-language-switcher ${isMobileView ? 'mobile-language-switcher' : 'ml-4'}`}
          >
            <CompactLanguageSwitcher />
          </div>
        </div>

        {/* 移动端滑动提示 */}
        {isMobileView && enableSwipeNavigation && (
          <div
            className="swipe-hint"
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '11px',
              color: '#999',
              textAlign: 'center',
            }}
          >
            👈 {t('navigation.swipe.hint')} 👉
          </div>
        )}

        {/* 调试信息（仅开发环境） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="nav-debug" style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            {t('navigation.debug.currentStep')}: {navigationMetrics.currentStepIndex + 1}/
            {navigationMetrics.totalSteps}
            {' | '}
            {t('navigation.debug.progress')}: {navigationMetrics.progressPercentage}%
          </div>
        )}
      </nav>
    );
  }
);

Navigation.displayName = 'Navigation';

// 导出优化的组件
export default Navigation;

// 导出子组件供测试使用
export { NavigationButton, ProgressBar };

// 导出类型
export type { NavigationProps, NavigationItem };
