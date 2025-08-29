/**
 * SEO上下文提供者
 * 集成所有SEO相关功能，提供统一的API
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { seoConfigManager } from '../utils/seo/SEOConfigManager';
import { useCoreWebVitals, useResponsiveBreakpoint, useSEOPerformanceReport } from '../hooks/useSEOOptimization';
import { realTimeUpdater } from '../utils/seo/dynamicMetaInjection';
import type { 
  SEOMetadata, 
  SEOConfig, 
  PageType, 
  Language, 
  PerformanceMetrics,
  SEOPerformanceReport,
  ViewportInfo
} from '../types/seo.types';

// SEO状态接口
interface SEOState {
  config: SEOConfig | null;
  currentMetadata: SEOMetadata | null;
  performanceMetrics: PerformanceMetrics | null;
  performanceReport: SEOPerformanceReport | null;
  viewportInfo: ViewportInfo | null;
  isConfigLoaded: boolean;
  error: string | null;
  isOptimized: boolean;
}

// SEO动作类型
type SEOAction =
  | { type: 'SET_CONFIG'; payload: SEOConfig }
  | { type: 'SET_METADATA'; payload: SEOMetadata }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: PerformanceMetrics }
  | { type: 'SET_PERFORMANCE_REPORT'; payload: SEOPerformanceReport }
  | { type: 'SET_VIEWPORT_INFO'; payload: ViewportInfo }
  | { type: 'SET_CONFIG_LOADED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OPTIMIZED'; payload: boolean }
  | { type: 'RESET' };

// SEO上下文值接口
interface SEOContextValue {
  state: SEOState;
  actions: {
    loadConfig: () => Promise<boolean>;
    updateMetadata: (metadata: Partial<SEOMetadata>) => void;
    updatePage: (page: PageType, language?: Language, context?: Record<string, any>) => void;
    generatePerformanceReport: () => void;
    optimizeForDevice: (deviceType: 'mobile' | 'tablet' | 'desktop') => void;
    resetSEO: () => void;
    prefetchPageMetadata: (page: PageType, language?: Language) => Promise<void>;
  };
  utils: {
    getPageTitle: (page: PageType, language?: Language, context?: Record<string, any>) => string;
    getPageDescription: (page: PageType, language?: Language, context?: Record<string, any>) => string;
    getKeywords: (page: PageType, language?: Language) => string[];
    generateCanonicalUrl: (page: PageType, language?: Language) => string;
    isPerformanceOptimal: () => boolean;
  };
}

// 初始状态
const initialState: SEOState = {
  config: null,
  currentMetadata: null,
  performanceMetrics: null,
  performanceReport: null,
  viewportInfo: null,
  isConfigLoaded: false,
  error: null,
  isOptimized: false,
};

// Reducer函数
const seoReducer = (state: SEOState, action: SEOAction): SEOState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.payload, error: null };
    case 'SET_METADATA':
      return { ...state, currentMetadata: action.payload };
    case 'SET_PERFORMANCE_METRICS':
      return { ...state, performanceMetrics: action.payload };
    case 'SET_PERFORMANCE_REPORT':
      return { ...state, performanceReport: action.payload };
    case 'SET_VIEWPORT_INFO':
      return { ...state, viewportInfo: action.payload };
    case 'SET_CONFIG_LOADED':
      return { ...state, isConfigLoaded: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_OPTIMIZED':
      return { ...state, isOptimized: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

// 创建上下文
const SEOContext = createContext<SEOContextValue | null>(null);

// 自定义Hook
export const useSEO = () => {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error('useSEO must be used within a SEOProvider');
  }
  return context;
};

// SEO提供者Props
interface SEOProviderProps {
  children: ReactNode;
  enablePerformanceMonitoring?: boolean;
  enableRealTimeUpdates?: boolean;
  autoLoadConfig?: boolean;
}

/**
 * SEO上下文提供者组件
 */
export const SEOProvider: React.FC<SEOProviderProps> = ({
  children,
  enablePerformanceMonitoring = true,
  enableRealTimeUpdates = true,
  autoLoadConfig = true,
}) => {
  const [state, dispatch] = useReducer(seoReducer, initialState);
  
  // 性能监控Hooks
  const performanceMetrics = useCoreWebVitals();
  const { current: deviceType, width, height, orientation } = useResponsiveBreakpoint();
  const { generateReport } = useSEOPerformanceReport();

  // 更新性能指标
  useEffect(() => {
    if (enablePerformanceMonitoring && performanceMetrics) {
      dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: performanceMetrics });
    }
  }, [performanceMetrics, enablePerformanceMonitoring]);

  // 更新视口信息
  useEffect(() => {
    const viewportInfo: ViewportInfo = {
      width,
      height,
      deviceType,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      orientation,
    };
    
    dispatch({ type: 'SET_VIEWPORT_INFO', payload: viewportInfo });
  }, [deviceType, width, height, orientation]);

  // 自动加载配置
  useEffect(() => {
    if (autoLoadConfig && !state.isConfigLoaded) {
      loadConfig();
    }
  }, [autoLoadConfig, state.isConfigLoaded]);

  // 动作函数
  const loadConfig = useCallback(async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const result = await seoConfigManager.loadConfig();
      
      if (result.success && result.config) {
        dispatch({ type: 'SET_CONFIG', payload: result.config });
        dispatch({ type: 'SET_CONFIG_LOADED', payload: true });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.errors.join(', ') });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  }, []);

  const updateMetadata = useCallback((metadata: Partial<SEOMetadata>) => {
    const updatedMetadata: SEOMetadata = {
      ...state.currentMetadata,
      ...metadata,
    } as SEOMetadata;
    
    dispatch({ type: 'SET_METADATA', payload: updatedMetadata });
    
    if (enableRealTimeUpdates) {
      realTimeUpdater.updateMetadata(metadata);
    }
  }, [state.currentMetadata, enableRealTimeUpdates]);

  const updatePage = useCallback((
    page: PageType, 
    language: Language = 'zh-CN', 
    context: Record<string, any> = {}
  ) => {
    if (!state.config) return;
    
    try {
      const pageConfig = seoConfigManager.getPageConfig(page, language);
      // const structuredData = seoConfigManager.getStructuredData(page, language);
      
      // 生成增强的元数据
      const metadata: SEOMetadata = {
        title: addContextToTitle(pageConfig.title, context, language),
        description: addContextToDescription(pageConfig.description, context, language),
        keywords: pageConfig.keywords,
        ogTitle: addContextToTitle(pageConfig.title, context, language),
        ogDescription: addContextToDescription(pageConfig.description, context, language),
        ogImage: state.config.defaultImages?.ogImage || '/og-image.png',
        ogType: 'website',
        ogUrl: generateCanonicalUrl(page, language),
        twitterCard: 'summary_large_image',
        twitterTitle: addContextToTitle(pageConfig.title, context, language),
        twitterDescription: addContextToDescription(pageConfig.description, context, language),
        twitterImage: state.config.defaultImages?.twitterImage || '/twitter-card.png',
        canonicalUrl: generateCanonicalUrl(page, language),
        hreflang: generateHreflangMapping(page),
        robots: 'index,follow',
        author: state.config.structuredData.organization.name,
        modifiedTime: new Date().toISOString(),
      };
      
      dispatch({ type: 'SET_METADATA', payload: metadata });
      
      if (enableRealTimeUpdates) {
        realTimeUpdater.updateMetadata(metadata);
      }
    } catch (error) {
      console.error('Failed to update page metadata:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update page metadata' });
    }
  }, [state.config, enableRealTimeUpdates]);

  const generatePerformanceReport = useCallback(() => {
    if (enablePerformanceMonitoring) {
      const report = generateReport();
      if (report) {
        dispatch({ type: 'SET_PERFORMANCE_REPORT', payload: report });
      }
    }
  }, [generateReport, enablePerformanceMonitoring]);

  const optimizeForDevice = useCallback((deviceType: 'mobile' | 'tablet' | 'desktop') => {
    if (!state.currentMetadata) return;
    
    const optimizedMetadata = optimizeMetadataForDevice(state.currentMetadata, deviceType);
    dispatch({ type: 'SET_METADATA', payload: optimizedMetadata });
    dispatch({ type: 'SET_OPTIMIZED', payload: true });
    
    if (enableRealTimeUpdates) {
      realTimeUpdater.updateMetadata(optimizedMetadata);
    }
  }, [state.currentMetadata, enableRealTimeUpdates]);

  const resetSEO = useCallback(() => {
    dispatch({ type: 'RESET' });
    if (enableRealTimeUpdates) {
      realTimeUpdater.cleanup();
    }
  }, [enableRealTimeUpdates]);

  const prefetchPageMetadata = useCallback(async (
    page: PageType, 
    language: Language = 'zh-CN'
  ): Promise<void> => {
    try {
      if (state.config || state.isConfigLoaded) {
        // 预生成页面元数据以提高性能
        seoConfigManager.getPageConfig(page, language);
        seoConfigManager.getStructuredData(page, language);
        
        // 可以在这里添加缓存逻辑
        console.log(`Prefetched metadata for ${page} (${language})`);
      }
    } catch (error) {
      console.warn(`Failed to prefetch metadata for ${page}:`, error);
    }
  }, [state.config, state.isConfigLoaded]);

  // 工具函数
  const getPageTitle = useCallback((
    page: PageType,
    language: Language = 'zh-CN',
    context: Record<string, any> = {}
  ): string => {
    if (!state.config) return '';
    
    try {
      const pageConfig = seoConfigManager.getPageConfig(page, language);
      return addContextToTitle(pageConfig.title, context, language);
    } catch {
      return '';
    }
  }, [state.config]);

  const getPageDescription = useCallback((
    page: PageType,
    language: Language = 'zh-CN',
    context: Record<string, any> = {}
  ): string => {
    if (!state.config) return '';
    
    try {
      const pageConfig = seoConfigManager.getPageConfig(page, language);
      return addContextToDescription(pageConfig.description, context, language);
    } catch {
      return '';
    }
  }, [state.config]);

  const getKeywords = useCallback((
    page: PageType,
    language: Language = 'zh-CN'
  ): string[] => {
    if (!state.config) return [];
    
    try {
      return seoConfigManager.getKeywords(page, language, true);
    } catch {
      return [];
    }
  }, [state.config]);

  const generateCanonicalUrl = useCallback((
    page: PageType,
    language: Language = 'zh-CN'
  ): string => {
    const baseUrl = state.config?.site?.url || 'https://screenshot-splitter.com';
    const langPrefix = language === 'zh-CN' ? '' : `/${language}`;
    const pagePath = page === 'home' ? '' : `/${page}`;
    return `${baseUrl}${langPrefix}${pagePath}`;
  }, [state.config]);

  const isPerformanceOptimal = useCallback((): boolean => {
    if (!state.performanceMetrics) return false;
    
    const { lcp, fid, cls, fcp } = state.performanceMetrics;
    return lcp < 2500 && fid < 100 && cls < 0.1 && fcp < 1800;
  }, [state.performanceMetrics]);

  const contextValue: SEOContextValue = {
    state,
    actions: {
      loadConfig,
      updateMetadata,
      updatePage,
      generatePerformanceReport,
      optimizeForDevice,
      resetSEO,
      prefetchPageMetadata,
    },
    utils: {
      getPageTitle,
      getPageDescription,
      getKeywords,
      generateCanonicalUrl,
      isPerformanceOptimal,
    },
  };

  return (
    <SEOContext.Provider value={contextValue}>
      {children}
    </SEOContext.Provider>
  );
};

// 辅助函数
const addContextToTitle = (
  baseTitle: string,
  context: Record<string, any>,
  language: Language
): string => {
  let title = baseTitle;
  
  if (context.sliceCount) {
    const sliceText = language === 'zh-CN' 
      ? ` (${context.sliceCount}张)` 
      : ` (${context.sliceCount} pieces)`;
    title = title.replace(/ - .*$/, sliceText + title.match(/ - .*$/)?.[0] || '');
  }
  
  return title;
};

const addContextToDescription = (
  baseDescription: string,
  context: Record<string, any>,
  language: Language
): string => {
  let description = baseDescription;
  
  if (context.sliceCount) {
    const sliceText = language === 'zh-CN' 
      ? `，已生成${context.sliceCount}张图片` 
      : `, generated ${context.sliceCount} images`;
    description = description.replace(/[。.]/, sliceText + '。');
  }
  
  return description;
};

const generateHreflangMapping = (page: PageType): Record<string, string> => {
  const baseUrl = 'https://screenshot-splitter.com';
  const pagePath = page === 'home' ? '' : `/${page}`;
  
  return {
    'zh-CN': `${baseUrl}${pagePath}`,
    'en': `${baseUrl}/en${pagePath}`,
    'x-default': `${baseUrl}${pagePath}`,
  };
};

const optimizeMetadataForDevice = (
  metadata: SEOMetadata,
  deviceType: 'mobile' | 'tablet' | 'desktop'
): SEOMetadata => {
  let optimizedTitle = metadata.title;
  let optimizedDescription = metadata.description;
  
  switch (deviceType) {
    case 'mobile':
      if (optimizedTitle.length > 50) {
        optimizedTitle = optimizedTitle.substring(0, 47) + '...';
      }
      if (optimizedDescription.length > 120) {
        optimizedDescription = optimizedDescription.substring(0, 117) + '...';
      }
      break;
    case 'tablet':
      if (optimizedTitle.length > 60) {
        optimizedTitle = optimizedTitle.substring(0, 57) + '...';
      }
      if (optimizedDescription.length > 140) {
        optimizedDescription = optimizedDescription.substring(0, 137) + '...';
      }
      break;
  }
  
  return {
    ...metadata,
    title: optimizedTitle,
    description: optimizedDescription,
    ogTitle: optimizedTitle,
    ogDescription: optimizedDescription,
    twitterTitle: optimizedTitle,
    twitterDescription: optimizedDescription,
  };
};

export default SEOProvider;