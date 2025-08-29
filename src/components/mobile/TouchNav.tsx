import React, { useState, useRef, useEffect } from 'react';
import { useViewport } from '../../hooks/useViewport';
import styles from './TouchNav.module.css';

/**
 * 触摸友好的导航组件属性
 */
interface TouchNavProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
  }>;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  hapticFeedback?: boolean;
  swipeEnabled?: boolean;
  className?: string;
}

/**
 * 触摸优化的导航组件
 * 符合移动端最佳实践，最小触摸目标 44px
 */
export const TouchNav: React.FC<TouchNavProps> = ({
  items,
  orientation = 'horizontal',
  showLabels = true,
  hapticFeedback = true,
  swipeEnabled = false,
  className = ''
}) => {
  const viewport = useViewport();
  const navRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isPressed, setIsPressed] = useState<string | null>(null);
  
  // 处理触摸反馈
  const handleTouchFeedback = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // 短暂振动反馈
    }
  };
  
  // 处理滑动手势
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeEnabled) return;
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeEnabled) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!swipeEnabled || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && activeIndex < items.length - 1) {
      setActiveIndex(activeIndex + 1);
      handleTouchFeedback();
    }
    
    if (isRightSwipe && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      handleTouchFeedback();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };
  
  // 处理项目点击
  const handleItemClick = (item: typeof items[0], index: number) => {
    if (item.disabled) return;
    
    setActiveIndex(index);
    handleTouchFeedback();
    
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      window.location.href = item.href;
    }
  };
  
  // 处理按压状态
  const handlePressStart = (itemId: string) => {
    setIsPressed(itemId);
    handleTouchFeedback();
  };
  
  const handlePressEnd = () => {
    setIsPressed(null);
  };
  
  // 键盘导航支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      } else if (e.key === 'ArrowRight' && activeIndex < items.length - 1) {
        setActiveIndex(activeIndex + 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        const activeItem = items[activeIndex];
        if (activeItem) {
          handleItemClick(activeItem, activeIndex);
        }
      }
    };
    
    if (navRef.current) {
      navRef.current.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (navRef.current) {
        navRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [activeIndex, items]);
  
  // 导航样式
  const navStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: viewport.isMobile ? '8px' : '12px',
    padding: viewport.isMobile ? '8px' : '12px',
    overflowX: orientation === 'horizontal' ? 'auto' : 'visible',
    WebkitOverflowScrolling: 'touch', // iOS 平滑滚动
    scrollSnapType: orientation === 'horizontal' ? 'x mandatory' : 'none',
  };
  
  // 项目样式
  const getItemStyles = (item: typeof items[0], index: number): React.CSSProperties => ({
    minWidth: viewport.isMobile ? '44px' : '48px',
    minHeight: viewport.isMobile ? '44px' : '48px',
    padding: viewport.isMobile ? '12px 16px' : '14px 20px',
    display: 'flex',
    flexDirection: showLabels ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '12px',
    backgroundColor: activeIndex === index 
      ? 'var(--primary-color, #007AFF)' 
      : 'transparent',
    color: activeIndex === index 
      ? 'white' 
      : 'var(--text-color, #333)',
    opacity: item.disabled ? 0.5 : 1,
    cursor: item.disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isPressed === item.id ? 'scale(0.95)' : 'scale(1)',
    scrollSnapAlign: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation', // 防止双击缩放
  });
  
  return (
    <nav
      ref={navRef}
      className={`${styles.touchNav} ${className}`}
      style={navStyles}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="navigation"
      aria-label="主导航"
      tabIndex={0}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          className={styles.navItem}
          style={getItemStyles(item, index)}
          onClick={() => handleItemClick(item, index)}
          onTouchStart={() => handlePressStart(item.id)}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart(item.id)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={item.disabled}
          aria-label={item.label}
          aria-current={activeIndex === index ? 'page' : undefined}
          role="menuitem"
        >
          {item.icon && (
            <span className={styles.navIcon}>
              {item.icon}
            </span>
          )}
          {showLabels && (
            <span className={styles.navLabel}>
              {item.label}
            </span>
          )}
        </button>
      ))}
      
      {/* 活动指示器（可选） */}
      {orientation === 'horizontal' && (
        <div 
          className={styles.activeIndicator}
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
            width: `${100 / items.length}%`,
          }}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

/**
 * 底部标签栏组件（移动端常用）
 */
export const TabBar: React.FC<{
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  const viewport = useViewport();
  
  return (
    <div 
      className={styles.tabBar}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-color, white)',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        paddingBottom: viewport.isMobile 
          ? 'env(safe-area-inset-bottom, 0px)' 
          : '0',
        zIndex: 1000,
      }}
    >
      <TouchNav
        items={tabs.map(tab => ({
          ...tab,
          active: tab.id === activeTab,
          onClick: () => onTabChange(tab.id),
        }))}
        orientation="horizontal"
        showLabels={true}
        hapticFeedback={true}
      />
      
      {/* 徽章显示 */}
      {tabs.map(tab => 
        tab.badge && tab.badge > 0 ? (
          <span
            key={`badge-${tab.id}`}
            className={styles.badge}
            style={{
              position: 'absolute',
              top: '4px',
              right: `${(tabs.length - tabs.indexOf(tab) - 1) * (100 / tabs.length) + 20}%`,
              backgroundColor: '#FF3B30',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            {tab.badge > 99 ? '99+' : tab.badge}
          </span>
        ) : null
      )}
    </div>
  );
};

export default TouchNav;