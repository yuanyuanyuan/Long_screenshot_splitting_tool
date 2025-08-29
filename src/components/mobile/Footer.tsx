import React, { useState, useRef, useEffect } from 'react';
import { CopyrightInfo } from '../../../shared-components/components/CopyrightInfo/CopyrightInfo';
import { useViewport } from '../../hooks/useViewport';
import styles from './Footer.module.css';

/**
 * Footer 组件属性
 */
interface FooterProps {
  className?: string;
  fixed?: boolean;
  hideOnScroll?: boolean;
  transparentOnMobile?: boolean;
  blurBackground?: boolean;
  safeAreaPadding?: boolean;
  children?: React.ReactNode;
}

/**
 * 移动端优化的页脚组件
 * 解决版权信息在移动设备上遮挡内容的问题
 */
export const Footer: React.FC<FooterProps> = ({
  className = '',
  fixed = true,
  hideOnScroll = false,
  transparentOnMobile = true,
  blurBackground = true,
  safeAreaPadding = true,
  children
}) => {
  const viewport = useViewport();
  const [isVisible, setIsVisible] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);
  const footerRef = useRef<HTMLDivElement>(null);
  
  // 处理滚动显示/隐藏逻辑
  useEffect(() => {
    if (!hideOnScroll) return;
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          
          // 检测是否在页面底部
          const atBottom = currentScrollY + windowHeight >= documentHeight - 50;
          setIsAtBottom(atBottom);
          
          // 检测滚动方向
          if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            // 向下滚动且不在顶部
            setScrollDirection('down');
            if (!atBottom && viewport.isMobile) {
              setIsVisible(false);
            }
          } else {
            // 向上滚动或在顶部
            setScrollDirection('up');
            setIsVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初始检查
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hideOnScroll, viewport.isMobile]);
  
  // 计算动态样式
  const footerStyles: React.CSSProperties = {
    position: fixed ? 'fixed' : 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
    opacity: isVisible ? 1 : 0,
    pointerEvents: isVisible ? 'auto' : 'none',
    
    // 移动端特殊处理
    ...(viewport.isMobile && {
      backgroundColor: transparentOnMobile 
        ? 'rgba(255, 255, 255, 0.95)' 
        : 'white',
      backdropFilter: blurBackground ? 'blur(10px)' : 'none',
      WebkitBackdropFilter: blurBackground ? 'blur(10px)' : 'none',
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      
      // iOS 安全区域适配
      paddingBottom: safeAreaPadding 
        ? 'env(safe-area-inset-bottom, 0px)' 
        : '0',
      paddingLeft: safeAreaPadding 
        ? 'env(safe-area-inset-left, 0px)' 
        : '0',
      paddingRight: safeAreaPadding 
        ? 'env(safe-area-inset-right, 0px)' 
        : '0',
    }),
    
    // 桌面端样式
    ...(!viewport.isMobile && {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderTop: '1px solid #e0e0e0',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
    })
  };
  
  // 内容容器样式
  const contentStyles: React.CSSProperties = {
    padding: viewport.isMobile ? '12px 16px' : '16px 24px',
    minHeight: viewport.isMobile ? '44px' : '60px', // 确保触摸目标大小
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: viewport.isMobile ? 'column' : 'row',
    gap: viewport.isMobile ? '8px' : '16px',
  };
  
  // 占位符高度（防止内容被遮挡）
  const placeholderHeight = footerRef.current?.offsetHeight || (viewport.isMobile ? 60 : 80);
  
  return (
    <>
      {/* 占位符，防止固定定位的页脚遮挡内容 */}
      {fixed && (
        <div 
          style={{ 
            height: `${placeholderHeight}px`,
            transition: 'height 0.3s ease'
          }} 
          aria-hidden="true"
        />
      )}
      
      {/* 页脚主体 */}
      <footer
        ref={footerRef}
        className={`${styles.footer} ${className}`}
        style={footerStyles}
        role="contentinfo"
        aria-label="页脚信息"
      >
        <div style={contentStyles}>
          {/* 版权信息 */}
          <CopyrightInfo 
            className={styles.copyright}
            language={viewport.isMobile ? 'zh-CN' : undefined}
          />
          
          {/* 自定义子内容 */}
          {children && (
            <div className={styles.additionalContent}>
              {children}
            </div>
          )}
        </div>
        
        {/* 滚动提示（仅在移动端显示） */}
        {viewport.isMobile && !isVisible && isAtBottom && (
          <div 
            className={styles.scrollHint}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            role="button"
            aria-label="返回顶部"
          >
            <span>↑ 返回顶部</span>
          </div>
        )}
      </footer>
    </>
  );
};

/**
 * 简化版页脚（用于移动端紧凑显示）
 */
export const CompactFooter: React.FC<{ language?: 'zh-CN' | 'en' }> = ({ language }) => {
  const currentYear = new Date().getFullYear();
  const viewport = useViewport();
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: viewport.isMobile ? '8px' : '12px',
        paddingBottom: viewport.isMobile 
          ? 'calc(8px + env(safe-area-inset-bottom, 0px))' 
          : '12px',
        background: 'rgba(0, 0, 0, 0.02)',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center',
        zIndex: 50,
      }}
    >
      © {currentYear} {language === 'zh-CN' ? '长截图分割工具' : 'Long Screenshot Splitter'}
    </div>
  );
};

export default Footer;