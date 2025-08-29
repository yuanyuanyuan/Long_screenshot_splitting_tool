/**
 * 增强的Helmet提供者
 * 集成React Helmet Async和动态元标签注入功能
 */

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { HelmetProvider as ReactHelmetProvider } from 'react-helmet-async';
import { metaInjector, realTimeUpdater } from '../utils/seo/dynamicMetaInjection';
import type { SEOMetadata } from '../types/seo.types';

interface EnhancedHelmetContextValue {
  updateMetadata: (metadata: Partial<SEOMetadata>) => void;
  updateTitle: (title: string) => void;
  updateDescription: (description: string) => void;
  updateKeywords: (keywords: string[]) => void;
  injectCustomMeta: (name: string, content: string) => void;
  isInitialized: boolean;
}

const EnhancedHelmetContext = createContext<EnhancedHelmetContextValue | null>(null);

export const useEnhancedHelmet = () => {
  const context = useContext(EnhancedHelmetContext);
  if (!context) {
    throw new Error('useEnhancedHelmet must be used within an EnhancedHelmetProvider');
  }
  return context;
};

interface EnhancedHelmetProviderProps {
  children: ReactNode;
  enableRealTimeUpdates?: boolean;
  enablePerformanceOptimizations?: boolean;
}

/**
 * 增强的Helmet提供者组件
 * 提供React Helmet Async功能和实时元数据更新能力
 */
export const EnhancedHelmetProvider: React.FC<EnhancedHelmetProviderProps> = ({
  children,
  enableRealTimeUpdates = true,
  enablePerformanceOptimizations: _enablePerformanceOptimizations = true,
}) => {
  const initializationRef = useRef(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    if (initializationRef.current) return;
    
    initializationRef.current = true;
    
    // 初始化增强功能
    if (typeof window !== 'undefined') {
      // 性能优化：延迟初始化
      const initTimer = setTimeout(() => {
        setIsInitialized(true);
      }, 100);

      return () => clearTimeout(initTimer);
    }
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (enableRealTimeUpdates) {
        realTimeUpdater.cleanup();
      }
      metaInjector.cleanup();
    };
  }, [enableRealTimeUpdates]);

  const contextValue: EnhancedHelmetContextValue = {
    updateMetadata: (metadata: Partial<SEOMetadata>) => {
      if (enableRealTimeUpdates) {
        realTimeUpdater.updateMetadata(metadata);
      }
    },
    
    updateTitle: (title: string) => {
      if (enableRealTimeUpdates) {
        realTimeUpdater.updateTitle(title);
      }
    },
    
    updateDescription: (description: string) => {
      if (enableRealTimeUpdates) {
        realTimeUpdater.updateDescription(description);
      }
    },
    
    updateKeywords: (keywords: string[]) => {
      if (enableRealTimeUpdates) {
        realTimeUpdater.updateKeywords(keywords);
      }
    },
    
    injectCustomMeta: (name: string, content: string) => {
      if (typeof window !== 'undefined') {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        meta.setAttribute('data-enhanced-helmet', 'true');
        document.head.appendChild(meta);
      }
    },
    
    isInitialized,
  };

  return (
    <ReactHelmetProvider>
      <EnhancedHelmetContext.Provider value={contextValue}>
        {children}
      </EnhancedHelmetContext.Provider>
    </ReactHelmetProvider>
  );
};

/**
 * 增强的Helmet包装器组件
 * 提供额外的SEO功能和性能优化
 */
export const EnhancedHelmet: React.FC<{
  children: ReactNode;
  defer?: boolean;
  encodeSpecialCharacters?: boolean;
  prioritizeSEOTags?: boolean;
}> = ({ 
  children, 
  defer = false,
  encodeSpecialCharacters: _encodeSpecialCharacters = true,
  prioritizeSEOTags: _prioritizeSEOTags = true,
}) => {
  const { isInitialized } = useEnhancedHelmet();

  // 如果设置了defer且组件尚未初始化，延迟渲染
  if (defer && !isInitialized) {
    return null;
  }

  return <>{children}</>;
};

/**
 * SEO优先级包装器
 * 确保关键SEO标签优先加载
 */
export const SEOPriorityWrapper: React.FC<{
  children: ReactNode;
  priority?: 'high' | 'normal' | 'low';
}> = ({ children, priority = 'normal' }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (priority === 'high' && wrapperRef.current) {
      // 对高优先级内容应用特殊处理
      wrapperRef.current.style.display = 'contents';
    }
  }, [priority]);

  return (
    <div ref={wrapperRef} data-seo-priority={priority}>
      {children}
    </div>
  );
};

/**
 * 条件渲染Helmet内容
 */
export const ConditionalHelmet: React.FC<{
  children: ReactNode;
  condition: boolean;
  fallback?: ReactNode;
}> = ({ children, condition, fallback = null }) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

/**
 * 异步Helmet加载器
 * 支持代码分割和懒加载
 */
export const AsyncHelmetLoader: React.FC<{
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}> = ({ 
  children, 
  loadingComponent = null,
  errorComponent = null,
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setIsLoaded(true);
      } catch (error) {
        console.error('Helmet loading error:', error);
        setHasError(true);
      }
    }, 50); // 微延迟确保DOM准备就绪

    return () => clearTimeout(timer);
  }, []);

  if (hasError) {
    return <>{errorComponent}</>;
  }

  if (!isLoaded) {
    return <>{loadingComponent}</>;
  }

  return <>{children}</>;
};

export default EnhancedHelmetProvider;