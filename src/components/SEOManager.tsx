import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { generatePageMetadata } from '../utils/seo/metadataGenerator';
import { SEO_CONFIG, getCurrentSEOConfig } from '../config/seo.config';
import { seoConfigManager } from '../utils/seo/SEOConfigManager';
import type { 
  SEOManagerProps, 
  SEOMetadata, 
  SEOConfig, 
  Language, 
  PageType,
  ViewportInfo,
  PerformanceMetrics
} from '../types/seo.types';

/**
 * 性能优化钩子
 * 监控页面性能并优化SEO元数据加载
 */
const useSEOPerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    // 创建性能观察器
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        observerRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          let fcp = 0, lcp = 0, fid = 0, cls = 0, ttfb = 0;

          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              fcp = entry.startTime;
            } else if (entry.entryType === 'largest-contentful-paint') {
              lcp = entry.startTime;
            } else if (entry.entryType === 'first-input') {
              fid = (entry as any).processingStart - entry.startTime;
            } else if (entry.entryType === 'layout-shift') {
              cls += (entry as any).value;
            } else if (entry.entryType === 'navigation') {
              ttfb = (entry as any).responseStart;
            }
          });

          setMetrics({ fcp, lcp, fid, cls, ttfb });
        });

        // 观察多种性能指标
        observerRef.current.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
      } catch (error) {
        console.warn('Performance observation not supported:', error);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return metrics;
};

/**
 * 视窗检测钩子
 * 检测设备类型和视窗信息以优化元数据
 */
const useViewportDetection = (): ViewportInfo => {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    width: 0,
    height: 0,
    deviceType: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape'
  });

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      setViewportInfo({
        width,
        height,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        isMobile,
        isTablet,
        isDesktop,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    if (typeof window !== 'undefined') {
      updateViewport();
      window.addEventListener('resize', updateViewport);
      window.addEventListener('orientationchange', updateViewport);
      
      return () => {
        window.removeEventListener('resize', updateViewport);
        window.removeEventListener('orientationchange', updateViewport);
      };
    }
  }, []);

  return viewportInfo;
};

/**
 * 动态元数据钩子
 * 根据用户上下文实时更新元数据
 */
const useDynamicMetadata = (
  page: PageType,
  language: Language,
  context: Record<string, any>,
  customMetadata: Partial<SEOMetadata>
) => {
  const [dynamicMetadata, setDynamicMetadata] = useState<SEOMetadata | null>(null);
  const [config, setConfig] = useState<SEOConfig | null>(null);
  const previousContext = useRef<string>('');
  const viewportInfo = useViewportDetection();

  // 加载SEO配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const result = await seoConfigManager.loadConfig();
        if (result.success && result.config) {
          setConfig(result.config);
        } else {
          // 回退到传统配置
          setConfig(getCurrentSEOConfig() as any);
        }
      } catch (error) {
        console.warn('Failed to load SEO config, using fallback:', error);
        setConfig(getCurrentSEOConfig() as any);
      }
    };

    loadConfig();
  }, []);

  // 生成动态元数据
  useEffect(() => {
    if (!config) return;

    const contextKey = JSON.stringify({ page, language, context, customMetadata, viewport: viewportInfo.deviceType });
    
    // 避免不必要的重新计算
    if (previousContext.current === contextKey) return;
    previousContext.current = contextKey;

    try {
      // 使用新配置管理器或回退到传统方法
      let metadata: SEOMetadata;
      
      if (seoConfigManager.getStats().loaded) {
        // 使用新配置系统
        const pageConfig = seoConfigManager.getPageConfig(page, language);
        const structuredData = seoConfigManager.getStructuredData(page, language);
        
        // 生成基础元数据
        const baseTitle = pageConfig.title;
        const baseDescription = pageConfig.description;
        
        // 添加上下文信息
        const dynamicTitle = addContextToTitle(baseTitle, context, language);
        const dynamicDescription = addContextToDescription(baseDescription, context, language);
        
        // 设备优化
        const deviceOptimized = optimizeForDevice({ title: dynamicTitle, description: dynamicDescription }, viewportInfo.deviceType);
        
        metadata = {
          title: deviceOptimized.title,
          description: deviceOptimized.description,
          keywords: pageConfig.keywords,
          ogTitle: deviceOptimized.title,
          ogDescription: deviceOptimized.description,
          ogImage: config.defaultImages?.ogImage || `${config.site?.url || SEO_CONFIG.siteUrl}/og-image.png`,
          ogType: 'website' as const,
          ogUrl: `${config.site?.url || SEO_CONFIG.siteUrl}${getPagePath(page, language)}`,
          twitterCard: 'summary_large_image' as const,
          twitterTitle: deviceOptimized.title,
          twitterDescription: deviceOptimized.description,
          twitterImage: config.defaultImages?.twitterImage || `${config.site?.url || SEO_CONFIG.siteUrl}/twitter-card.png`,
          canonicalUrl: `${config.site?.url || SEO_CONFIG.siteUrl}${getPagePath(page, language)}`,
          hreflang: generateHreflangForPage(page, config.site?.url || SEO_CONFIG.siteUrl),
          robots: 'index,follow',
          author: config.structuredData?.organization?.name || SEO_CONFIG.structuredData.organization.name,
          publishedTime: customMetadata.publishedTime,
          modifiedTime: customMetadata.modifiedTime || new Date().toISOString(),
          ...customMetadata
        };
      } else {
        // 回退到传统方法
        metadata = generatePageMetadata(page, context, language, customMetadata);
        
        // 应用设备优化
        const deviceOptimized = optimizeForDevice(
          { title: metadata.title, description: metadata.description }, 
          viewportInfo.deviceType
        );
        
        metadata.title = deviceOptimized.title;
        metadata.description = deviceOptimized.description;
        metadata.ogTitle = deviceOptimized.title;
        metadata.ogDescription = deviceOptimized.description;
        metadata.twitterTitle = deviceOptimized.title;
        metadata.twitterDescription = deviceOptimized.description;
      }
      
      setDynamicMetadata(metadata);
    } catch (error) {
      console.error('Failed to generate dynamic metadata:', error);
      // 回退到基础元数据
      setDynamicMetadata(generatePageMetadata(page, context, language, customMetadata));
    }
  }, [config, page, language, context, customMetadata, viewportInfo.deviceType]);

  return dynamicMetadata;
};

// 辅助函数
const addContextToTitle = (baseTitle: string, context: Record<string, any>, language: Language): string => {
  let title = baseTitle;
  
  if (context.sliceCount) {
    const sliceText = language === 'zh-CN' 
      ? ` (${context.sliceCount}张)` 
      : ` (${context.sliceCount} pieces)`;
    title = title.replace(/ - .*$/, sliceText + title.match(/ - .*$/)?.[0] || '');
  }
  
  if (context.selectedCount) {
    const selectedText = language === 'zh-CN' 
      ? ` (已选${context.selectedCount}张)` 
      : ` (${context.selectedCount} selected)`;
    title = title.replace(/ - .*$/, selectedText + title.match(/ - .*$/)?.[0] || '');
  }
  
  return title;
};

const addContextToDescription = (baseDescription: string, context: Record<string, any>, language: Language): string => {
  let description = baseDescription;
  
  if (context.sliceCount) {
    const sliceText = language === 'zh-CN' 
      ? `，已生成${context.sliceCount}张图片` 
      : `, generated ${context.sliceCount} images`;
    description = description.replace(/[。.]/, sliceText + '。');
  }
  
  if (context.selectedCount) {
    const selectedText = language === 'zh-CN' 
      ? `，已选择${context.selectedCount}张图片` 
      : `, ${context.selectedCount} images selected`;
    description = description.replace(/[。.]/, selectedText + '。');
  }
  
  return description;
};

const optimizeForDevice = (
  metadata: { title: string; description: string }, 
  deviceType: 'mobile' | 'tablet' | 'desktop'
): { title: string; description: string } => {
  let { title, description } = metadata;
  
  switch (deviceType) {
    case 'mobile':
      // 移动端标题限制50字符
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      // 移动端描述限制120字符
      if (description.length > 120) {
        description = description.substring(0, 117) + '...';
      }
      break;
    case 'tablet':
      // 平板端标题限制60字符
      if (title.length > 60) {
        title = title.substring(0, 57) + '...';
      }
      // 平板端描述限制140字符
      if (description.length > 140) {
        description = description.substring(0, 137) + '...';
      }
      break;
    case 'desktop':
    default:
      // 桌面端保持原长度
      break;
  }
  
  return { title, description };
};

const getPagePath = (page: PageType, language: Language): string => {
  const langPrefix = language === 'zh-CN' ? '' : `/${language}`;
  const pagePath = page === 'home' ? '' : `/${page}`;
  return `${langPrefix}${pagePath}`;
};

const generateHreflangForPage = (page: PageType, baseUrl: string): Record<string, string> => {
  const pagePath = page === 'home' ? '' : `/${page}`;
  return {
    'zh-CN': `${baseUrl}${pagePath}`,
    'en': `${baseUrl}/en${pagePath}`,
    'x-default': `${baseUrl}${pagePath}`,
  };
};

/**
 * 增强的SEO管理器组件
 * 集成性能优化、动态元标签注入和React Helmet Async
 * 支持实时元数据更新和结构化数据注入
 */
export const SEOManager: React.FC<SEOManagerProps> = ({
  page,
  language = 'zh-CN',
  context = {},
  customMetadata = {},
  enableStructuredData = true,
  enableOpenGraph = true,
  enableTwitterCard = true,
  enableCanonical = true,
}) => {
  // 性能监控
  const performanceMetrics = useSEOPerformance();
  const viewportInfo = useViewportDetection();
  
  // 动态元数据生成
  const dynamicMetadata = useDynamicMetadata(page, language, context, customMetadata);
  
  // 回退到传统元数据生成
  const fallbackMetadata: SEOMetadata = useMemo(() => {
    try {
      const baseMetadata = generatePageMetadata(page, context, language);
      
      // 应用设备优化
      const deviceOptimized = optimizeForDevice(
        { title: baseMetadata.title, description: baseMetadata.description },
        viewportInfo.deviceType
      );
      
      return {
        ...baseMetadata,
        ...customMetadata,
        title: customMetadata.title || deviceOptimized.title,
        description: customMetadata.description || deviceOptimized.description,
        keywords: customMetadata.keywords?.length ? customMetadata.keywords : baseMetadata.keywords,
        ogTitle: customMetadata.ogTitle || deviceOptimized.title,
        ogDescription: customMetadata.ogDescription || deviceOptimized.description,
        twitterTitle: customMetadata.twitterTitle || deviceOptimized.title,
        twitterDescription: customMetadata.twitterDescription || deviceOptimized.description,
      };
    } catch (error) {
      console.error('SEO metadata generation failed:', error);
      // 返回设备优化的默认元数据
      const siteName = (typeof SEO_CONFIG.siteName === 'string' 
        ? SEO_CONFIG.siteName 
        : (SEO_CONFIG.siteName as any)[language]) || 'Long Screenshot Splitter';
      
      const defaultTitle = language === 'zh-CN' 
        ? `${siteName} - 长截图分割工具` 
        : `${siteName} - Long Screenshot Splitter`;
      
      const defaultDescription = language === 'zh-CN' 
        ? '长截图分割工具 - 快速、免费、在线处理' 
        : 'Free online long screenshot splitter tool';
      
      const deviceOptimized = optimizeForDevice(
        { title: defaultTitle, description: defaultDescription },
        viewportInfo.deviceType
      );
      
      return {
        title: deviceOptimized.title,
        description: deviceOptimized.description,
        keywords: language === 'zh-CN' ? ['截图分割', '长截图', '图片处理'] : ['screenshot', 'splitter', 'image'],
        ogTitle: deviceOptimized.title,
        ogDescription: deviceOptimized.description,
        ogImage: `${SEO_CONFIG.siteUrl}/images/og-image.jpg`,
        ogType: 'website' as const,
        ogUrl: SEO_CONFIG.siteUrl,
        twitterCard: 'summary_large_image' as const,
        twitterTitle: deviceOptimized.title,
        twitterDescription: deviceOptimized.description,
        twitterImage: `${SEO_CONFIG.siteUrl}/images/twitter-image.jpg`,
        canonicalUrl: SEO_CONFIG.siteUrl,
        hreflang: generateHreflangForPage(page, SEO_CONFIG.siteUrl),
        robots: 'index,follow',
        author: SEO_CONFIG.structuredData.organization.name,
      };
    }
  }, [page, context, language, customMetadata, viewportInfo.deviceType]);
  
  // 使用动态元数据或回退方案
  const metadata = dynamicMetadata || fallbackMetadata;

  // 增强的结构化数据生成
  const structuredData = useMemo(() => {
    if (!enableStructuredData) return null;

    try {
      // 尝试使用新配置管理器
      if (seoConfigManager.getStats().loaded) {
        const configStructuredData = seoConfigManager.getStructuredData(page, language);
        
        // 添加性能指标到结构化数据（开发环境）
        if (process.env.NODE_ENV === 'development' && performanceMetrics) {
          return {
            ...configStructuredData,
            '@context': 'https://schema.org',
            performance: {
              fcp: performanceMetrics.fcp,
              lcp: performanceMetrics.lcp,
              cls: performanceMetrics.cls,
            }
          };
        }
        
        return configStructuredData;
      }
    } catch (error) {
      console.warn('Failed to get structured data from config manager, using fallback:', error);
    }

    // 回退到传统结构化数据
    const siteName = (typeof SEO_CONFIG.siteName === 'string' 
      ? SEO_CONFIG.siteName 
      : (SEO_CONFIG.siteName as any)[language]) || 'Long Screenshot Splitter';
    
    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: siteName,
      description: metadata.description,
      url: SEO_CONFIG.siteUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: {
        '@type': 'Organization',
        name: SEO_CONFIG.structuredData.organization.name,
        url: SEO_CONFIG.structuredData.organization.url,
      },
      inLanguage: language,
      isAccessibleForFree: true,
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      // 添加设备支持信息
      device: viewportInfo.deviceType,
      viewport: {
        width: viewportInfo.width,
        height: viewportInfo.height,
        orientation: viewportInfo.orientation,
      },
    };

    // 根据页面添加特定的结构化数据
    if (page === 'home') {
      const featureList = language === 'zh-CN' 
        ? ['长截图自动分割', '多格式支持', '批量导出', '在线处理', '免费使用']
        : ['Auto long screenshot splitting', 'Multi-format support', 'Batch export', 'Online processing', 'Free to use'];
        
      return {
        ...baseStructuredData,
        '@type': 'SoftwareApplication',
        featureList,
      };
    }

    return baseStructuredData;
  }, [page, language, metadata.description, enableStructuredData, viewportInfo, performanceMetrics]);

  // 性能监控和调试信息（开发环境）
  const debugInfoRef = useRef<any>(null);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const debugInfo = {
        page,
        language,
        context,
        metadata,
        structuredData,
        viewportInfo,
        performanceMetrics,
        configLoaded: seoConfigManager.getStats().loaded,
        timestamp: new Date().toISOString()
      };
      
      // 避免重复日志
      if (JSON.stringify(debugInfo) !== JSON.stringify(debugInfoRef.current)) {
        debugInfoRef.current = debugInfo;
        
        console.group('🚀 Enhanced SEO Manager Debug Info');
        console.log('📄 Page:', page);
        console.log('🌐 Language:', language);
        console.log('📝 Context:', context);
        console.log('🎯 Generated Metadata:', metadata);
        console.log('📊 Structured Data:', structuredData);
        console.log('📱 Viewport Info:', viewportInfo);
        console.log('⚡ Performance Metrics:', performanceMetrics);
        console.log('⚙️ Config Manager Stats:', seoConfigManager.getStats());
        console.groupEnd();
      }
    }
  }, [page, language, context, metadata, structuredData, viewportInfo, performanceMetrics]);
  
  // 预加载关键资源的优化钩子
  const preloadResources = useCallback(() => {
    if (typeof window !== 'undefined') {
      // 预加载关键图片
      if (metadata.ogImage) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = metadata.ogImage;
        document.head.appendChild(link);
      }
      
      // 预连接到外部域名
      const preconnectDomains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com'
      ];
      
      preconnectDomains.forEach(domain => {
        if (!document.querySelector(`link[href="${domain}"]`)) {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = domain;
          if (domain.includes('gstatic')) {
            link.crossOrigin = 'anonymous';
          }
          document.head.appendChild(link);
        }
      });
    }
  }, [metadata.ogImage]);
  
  useEffect(() => {
    preloadResources();
  }, [preloadResources]);

  return (
    <Helmet>
      {/* 基础元数据 */}
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="keywords" content={metadata.keywords.join(', ')} />
      <meta name="author" content={metadata.author || SEO_CONFIG.structuredData.organization.name} />
      <meta name="robots" content={metadata.robots || 'index,follow'} />
      <meta name="language" content={language} />
      
      {/* 增强的元数据 */}
      <meta name="generator" content="Long Screenshot Splitter" />
      <meta name="referrer" content="origin-when-cross-origin" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#1976d2" />
      {metadata.publishedTime && <meta property="article:published_time" content={metadata.publishedTime} />}
      {metadata.modifiedTime && <meta property="article:modified_time" content={metadata.modifiedTime} />}

      {/* 视口和移动端优化 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={metadata.title} />
      <meta name="application-name" content={metadata.title} />
      
      {/* PWA 支持 */}
      <link rel="manifest" href="/manifest.json" />
      <meta name="msapplication-TileColor" content="#1976d2" />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* 规范URL */}
      {enableCanonical && metadata.canonicalUrl && (
        <link rel="canonical" href={metadata.canonicalUrl} />
      )}

      {/* 多语言支持 */}
      {metadata.hreflang &&
        Object.entries(metadata.hreflang).map(([lang, url]) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={url} />
        ))}

      {/* Enhanced Open Graph 标签 */}
      {enableOpenGraph && (
        <>
          <meta property="og:title" content={metadata.ogTitle || metadata.title} />
          <meta property="og:description" content={metadata.ogDescription || metadata.description} />
          <meta property="og:type" content={metadata.ogType || 'website'} />
          <meta property="og:url" content={metadata.ogUrl || metadata.canonicalUrl || SEO_CONFIG.siteUrl} />
          <meta property="og:site_name" content={(typeof SEO_CONFIG.siteName === 'string' ? SEO_CONFIG.siteName : (SEO_CONFIG.siteName as any)[language]) || 'Long Screenshot Splitter'} />
          <meta property="og:locale" content={language === 'zh-CN' ? 'zh_CN' : 'en_US'} />
          {/* 备用语言 */}
          {language === 'zh-CN' && <meta property="og:locale:alternate" content="en_US" />}
          {language === 'en' && <meta property="og:locale:alternate" content="zh_CN" />}
          
          {/* 图片信息 */}
          {metadata.ogImage && (
            <>
              <meta property="og:image" content={metadata.ogImage} />
              <meta property="og:image:alt" content={metadata.title} />
              <meta property="og:image:width" content="1200" />
              <meta property="og:image:height" content="630" />
              <meta property="og:image:type" content="image/png" />
            </>
          )}
          
          {/* 应用程序特定信息 */}
          <meta property="og:app_id" content="long-screenshot-splitter" />
          <meta property="fb:app_id" content="" />
          
          {/* 文章/内容特定信息 */}
          {metadata.publishedTime && <meta property="article:published_time" content={metadata.publishedTime} />}
          {metadata.modifiedTime && <meta property="article:modified_time" content={metadata.modifiedTime} />}
        </>
      )}

      {/* Enhanced Twitter Card 标签 */}
      {enableTwitterCard && (
        <>
          <meta name="twitter:card" content={metadata.twitterCard || 'summary_large_image'} />
          <meta name="twitter:title" content={metadata.twitterTitle || metadata.title} />
          <meta name="twitter:description" content={metadata.twitterDescription || metadata.description} />
          
          {/* 社交媒体账号 */}
          {SEO_CONFIG.socialMedia?.twitter && <meta name="twitter:site" content={SEO_CONFIG.socialMedia.twitter} />}
          {SEO_CONFIG.socialMedia?.twitter && <meta name="twitter:creator" content={SEO_CONFIG.socialMedia.twitter} />}
          
          {/* 图片信息 */}
          {metadata.twitterImage && (
            <>
              <meta name="twitter:image" content={metadata.twitterImage} />
              <meta name="twitter:image:alt" content={metadata.title} />
              <meta name="twitter:image:width" content="1200" />
              <meta name="twitter:image:height" content="600" />
            </>
          )}
          
          {/* 应用信息 */}
          <meta name="twitter:app:name:iphone" content={metadata.title} />
          <meta name="twitter:app:name:googleplay" content={metadata.title} />
        </>
      )}

      {/* 结构化数据 */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData, null, 2)}</script>
      )}

      {/* 性能优化 - 预加载和DNS预解析 */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS预解析 */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      
      {/* 预加载关键资源 */}
      {metadata.ogImage && <link rel="preload" href={metadata.ogImage} as="image" />}
      <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* 资源提示 */}
      <link rel="prefetch" href="/api/health" />
      
      {/* Favicon 和图标 */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
      {/* Service Worker 注册提示 */}
      {process.env.NODE_ENV === 'production' && (
        <link rel="preload" href="/sw.js" as="script" />
      )}
    </Helmet>
  );
};

/**
 * SEO管理器提供者组件
 * 为整个应用提供SEO上下文，集成增强的Helmet功能
 */
export const SEOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelmetProvider>
      {children}
    </HelmetProvider>
  );
};

export default SEOManager;
