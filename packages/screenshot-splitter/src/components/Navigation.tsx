/**
 * 导航组件 - 性能优化版本
 * 使用React.memo、useCallback等优化技术减少不必要的重渲染
 */

import React, { memo, useCallback, useMemo } from 'react';
import { useNavigationState } from '../hooks/useNavigationState';
import { usePerformanceMonitor } from '../utils/navigationPerformanceMonitor';
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
}

// 单个导航按钮组件 - 使用memo优化
const NavigationButton = memo<{
  item: NavigationItem;
  onNavigate: (path: string) => void;
  showTooltips?: boolean;
}>(({ item, onNavigate, showTooltips = true }) => {
  // 性能监控
  const performanceMonitor = usePerformanceMonitor('NavigationButton');

  // 优化点击处理函数，使用useCallback避免重新创建
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      if (item.disabled) {
        return;
      }

      // 记录交互性能
      performanceMonitor.recordInteraction('button-click', 0);

      onNavigate(item.path);
    },
    [item.disabled, item.path, onNavigate, performanceMonitor]
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

    return classes.join(' ');
  }, [item.active, item.disabled]);

  // 计算按钮状态文本，用于无障碍访问
  const ariaLabel = useMemo(() => {
    let label = item.name;
    if (item.active) label += ' (当前页面)';
    if (item.disabled) label += ' (不可用)';
    return label;
  }, [item.name, item.active, item.disabled]);

  return (
    <button
      className={buttonClassName}
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
        {completedSteps}/{totalSteps} 步骤完成 ({percentage}%)
      </span>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// 主导航组件 - 使用memo优化
const Navigation = memo<NavigationProps>(
  ({
    appState,
    currentPath,
    onNavigate,
    className = '',
    showProgress = true,
    showTooltips = true,
  }) => {
    // 性能监控
    const performanceMonitor = usePerformanceMonitor('Navigation');

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
      return classes.join(' ');
    }, [className]);

    // 渲染导航按钮列表，使用useMemo优化
    const navigationButtons = useMemo(() => {
      return navigationItems.map(item => (
        <NavigationButton
          key={item.path}
          item={item}
          onNavigate={handleNavigate}
          showTooltips={showTooltips}
        />
      ));
    }, [navigationItems, handleNavigate, showTooltips]);

    return (
      <nav
        className={containerClassName}
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label="主导航"
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
        <div className="nav-buttons" role="group" aria-label="导航按钮">
          {navigationButtons}
        </div>

        {/* 快捷导航按钮 */}
        <div className="nav-shortcuts" role="group" aria-label="快捷导航">
          <button
            className="nav-shortcut prev"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            aria-label="上一步"
            title={showTooltips ? '上一步 (Ctrl+←)' : undefined}
          >
            ← 上一步
          </button>

          <button
            className="nav-shortcut next"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="下一步"
            title={showTooltips ? '下一步 (Ctrl+→)' : undefined}
          >
            下一步 →
          </button>
        </div>

        {/* 调试信息（仅开发环境） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="nav-debug" style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            当前步骤: {navigationMetrics.currentStepIndex + 1}/{navigationMetrics.totalSteps}
            {' | '}
            进度: {navigationMetrics.progressPercentage}%
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
