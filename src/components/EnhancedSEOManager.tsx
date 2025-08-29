import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { generatePageMetadata } from '../utils/seo/metadataGenerator';
import '../config/seo.config';
import '../utils/seo/SEOConfigManager';
// import { useSEOConfig } from '../hooks/useSEOConfig';
import { useViewport } from '../hooks/useViewport';
import type { 
  SEOManagerProps, 
  SEOMetadata, 
 
  Language, 
  PageType,
  ViewportInfo,
  PerformanceMetrics,
  StructuredDataType
} from '../types/seo.types';

// Lazy load structured data generator for performance
const StructuredDataProvider = lazy(() => 
  import('./seo/StructuredDataProvider').then(module => ({
    default: module.StructuredDataProvider
  }))
);

/**
 * Enhanced Performance Hook with Core Web Vitals
 */
const useEnhancedSEOPerformance = (enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const observersRef = useRef<PerformanceObserver[]>([]);
  const metricsBufferRef = useRef<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Import web-vitals dynamically for better performance
    import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      if (!isMounted) return;

      // Track Core Web Vitals with buffering
      const updateMetric = (name: keyof PerformanceMetrics, value: number) => {
        metricsBufferRef.current[name] = value;
        
        // Batch updates using requestIdleCallback for better performance
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            if (isMounted) {
              setMetrics(prev => ({
                ...prev,
                ...metricsBufferRef.current
              }));
              metricsBufferRef.current = {};
            }
          });
        } else {
          setMetrics(prev => ({ ...prev, [name]: value }));
        }
      };

      onCLS((metric: any) => updateMetric('cls', metric.value));
      onFCP((metric: any) => updateMetric('fcp', metric.value));
      onINP((metric: any) => updateMetric('fid', metric.value));
      onLCP((metric: any) => updateMetric('lcp', metric.value));
      onTTFB((metric: any) => updateMetric('ttfb', metric.value));

      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      observersRef.current.forEach(observer => observer.disconnect());
      observersRef.current = [];
    };
  }, [enabled]);

  return { metrics, isLoading };
};

/**
 * Dynamic Meta Tag Injection Hook
 */
const useDynamicMetaTags = (
  metadata: SEOMetadata,
  language: Language,
  viewport: ViewportInfo | null
) => {
  const [dynamicTags, setDynamicTags] = useState<Record<string, string>>({});
  const previousMetadataRef = useRef<SEOMetadata | null>(null);

  useEffect(() => {
    // Skip if metadata hasn't changed
    if (previousMetadataRef.current === metadata) {
      return;
    }
    previousMetadataRef.current = metadata;

    // Generate dynamic tags based on context
    const tags: Record<string, string> = {
      'og:locale': language === 'zh-CN' ? 'zh_CN' : 'en_US',
      'og:locale:alternate': language === 'zh-CN' ? 'en_US' : 'zh_CN',
      'twitter:card': viewport?.isMobile ? 'summary' : 'summary_large_image',
    };

    // Add mobile-specific tags
    if (viewport?.isMobile) {
      tags['mobile-web-app-capable'] = 'yes';
      tags['apple-mobile-web-app-capable'] = 'yes';
      tags['apple-mobile-web-app-status-bar-style'] = 'default';
    }

    // Add performance hints
    if ((viewport as any)?.connection) {
      const { effectiveType } = (viewport as any).connection;
      if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        tags['x-performance-mode'] = 'lite';
      }
    }

    setDynamicTags(tags);
  }, [metadata, language, viewport]);

  return dynamicTags;
};

/**
 * Enhanced SEO Manager Component
 */
export const EnhancedSEOManager: React.FC<SEOManagerProps> = ({
  page = 'home',
  language = 'zh-CN',
  customMetadata,
  enablePerformanceTracking = true,
  enableStructuredData = true,
  structuredDataTypes = ['WebApplication', 'BreadcrumbList'],
  onMetadataGenerated,
  onPerformanceUpdate
}) => {
  // Use enhanced hooks (暂时注释避免未使用错误)
  // const { isLoading } = useSEOConfig();
  const viewport = useViewport();
  const { metrics, isLoading: metricsLoading } = useEnhancedSEOPerformance(enablePerformanceTracking);
  
  // State for real-time updates
  const [isHydrated, setIsHydrated] = useState(false);
  const [structuredDataLoaded, setStructuredDataLoaded] = useState(false);
  
  // Memoize metadata generation with dependency tracking
  const metadata = useMemo(() => {
    try {
      const context = {
        viewport,
        performance: metrics,
        language,
        page,
        isHydrated
      };
      
      const generated = generatePageMetadata(page as PageType, context, language);
      const merged = customMetadata ? { ...generated, ...customMetadata } : generated;
      
      // Notify parent component
      onMetadataGenerated?.(merged);
      
      return merged;
    } catch (error) {
      console.error('[EnhancedSEOManager] Metadata generation failed:', error);
      return generatePageMetadata('home', {}, language);
    }
  }, [page, language, customMetadata, viewport, metrics, isHydrated, onMetadataGenerated]);

  // Convert ViewportState to ViewportInfo
  const viewportInfo = viewport ? {
    ...viewport,
    deviceType: viewport.isMobile ? 'mobile' as const : viewport.isTablet ? 'tablet' as const : 'desktop' as const,
    orientation: viewport.isPortrait ? 'portrait' as const : 'landscape' as const
  } : null;

  // Generate dynamic tags
  const dynamicTags = useDynamicMetaTags(metadata, language, viewportInfo);

  // Handle performance updates
  useEffect(() => {
    if (enablePerformanceTracking && !metricsLoading && onPerformanceUpdate) {
      onPerformanceUpdate(metrics);
    }
  }, [metrics, metricsLoading, enablePerformanceTracking, onPerformanceUpdate]);

  // Hydration detection
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Generate canonical URL with locale
  const canonicalUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    const path = window.location.pathname;
    const locale = language === 'en' ? '/en' : '';
    return `${baseUrl}${locale}${path}`;
  }, [language]);

  // Generate alternate language URLs
  const alternateUrls = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const baseUrl = window.location.origin;
    const path = window.location.pathname;
    
    return [
      { lang: 'zh-CN', href: `${baseUrl}${path}` },
      { lang: 'en', href: `${baseUrl}/en${path}` }
    ];
  }, []);

  // Structured data generation with lazy loading
  const structuredDataScripts = useMemo(() => {
    if (!enableStructuredData || !structuredDataLoaded) return [];
    
    return structuredDataTypes.map(type => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': type,
        // This will be populated by the StructuredDataGenerator component
        placeholder: true
      })
    }));
  }, [enableStructuredData, structuredDataLoaded, structuredDataTypes]);

  // Preconnect hints for performance
  const preconnectHints = useMemo(() => [
    { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: 'https://www.googletagmanager.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: "anonymous" as const }
  ], []);

  return (
    <HelmetProvider>
      <Helmet>
        {/* Core Meta Tags with Real-time Updates */}
        <html lang={language} data-hydrated={isHydrated} />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords?.join(', ')} />
        
        {/* Canonical and Alternate URLs */}
        <link rel="canonical" href={canonicalUrl} />
        {alternateUrls.map(alt => (
          <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.href} />
        ))}
        
        {/* Open Graph Tags with Dynamic Updates */}
        <meta property="og:title" content={metadata.ogTitle || metadata.title} />
        <meta property="og:description" content={metadata.ogDescription || metadata.description} />
        <meta property="og:type" content={metadata.ogType || 'website'} />
        <meta property="og:url" content={canonicalUrl} />
        {metadata.ogImage && <meta property="og:image" content={metadata.ogImage} />}
        {metadata.ogImageAlt && <meta property="og:image:alt" content={metadata.ogImageAlt} />}
        
        {/* Twitter Cards with Mobile Optimization */}
        <meta name="twitter:title" content={metadata.twitterTitle || metadata.title} />
        <meta name="twitter:description" content={metadata.twitterDescription || metadata.description} />
        {metadata.twitterImage && <meta name="twitter:image" content={metadata.twitterImage} />}
        {metadata.twitterCreator && <meta name="twitter:creator" content={metadata.twitterCreator} />}
        
        {/* Dynamic Tags Based on Context */}
        {Object.entries(dynamicTags).map(([name, content]) => (
          <meta key={name} property={name} content={content} />
        ))}
        
        {/* Performance Hints */}
        {preconnectHints.map((hint, index) => (
          <link key={index} {...hint} />
        ))}
        
        {/* Viewport Optimization */}
        {viewport?.isMobile && (
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        )}
        
        {/* Performance Mode Indicators */}
        {enablePerformanceTracking && metrics.lcp > 0 && (
          <meta name="performance-lcp" content={metrics.lcp.toString()} />
        )}
        
        {/* Structured Data Scripts */}
        {structuredDataScripts.map((script, index) => (
          <script key={index} {...script} />
        ))}
      </Helmet>
      
      {/* Structured Data Provider */}
      {enableStructuredData && (
        <Suspense fallback={null}>
          <StructuredDataProvider
            page={page as PageType}
            language={language}
            types={structuredDataTypes as StructuredDataType[]}
            onLoad={() => setStructuredDataLoaded(true)}
          />
        </Suspense>
      )}
    </HelmetProvider>
  );
};

// Performance optimized memo wrapper
export const SEOManager = React.memo(EnhancedSEOManager, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.page === nextProps.page &&
    prevProps.language === nextProps.language &&
    JSON.stringify(prevProps.customMetadata) === JSON.stringify(nextProps.customMetadata) &&
    prevProps.enablePerformanceTracking === nextProps.enablePerformanceTracking &&
    prevProps.enableStructuredData === nextProps.enableStructuredData
  );
});

SEOManager.displayName = 'SEOManager';

// Export enhanced features
export {
  useEnhancedSEOPerformance,
  useDynamicMetaTags
};

// Default export for backward compatibility
export default SEOManager;