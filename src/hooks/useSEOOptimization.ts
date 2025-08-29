/**
 * SEO性能优化钩子
 * 提供SEO相关的性能优化功能
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { 
  PerformanceMetrics, 
  SEOPerformanceReport,
  ViewportInfo,
  DeviceType 
} from '../types/seo.types';

/**
 * Core Web Vitals 监控钩子
 */
export const useCoreWebVitals = () => {
  const [vitals, setVitals] = useState<PerformanceMetrics | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    let fcp = 0, lcp = 0, fid = 0, cls = 0, ttfb = 0;

    // 监控 First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          fcp = entry.startTime;
          setVitals(prev => prev ? { ...prev, fcp } : { fcp, lcp, fid, cls, ttfb });
        }
      });
    });

    // 监控 Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        lcp = entry.startTime;
        setVitals(prev => prev ? { ...prev, lcp } : { fcp, lcp, fid, cls, ttfb });
      });
    });

    // 监控 First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        fid = (entry as any).processingStart - entry.startTime;
        setVitals(prev => prev ? { ...prev, fid } : { fcp, lcp, fid, cls, ttfb });
      });
    });

    // 监控 Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        cls += (entry as any).value || 0;
        setVitals(prev => prev ? { ...prev, cls } : { fcp, lcp, fid, cls, ttfb });
      });
    });

    // 监控 Time to First Byte
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const navEntry = entry as PerformanceNavigationTiming;
        ttfb = navEntry.responseStart - navEntry.requestStart;
        setVitals(prev => prev ? { ...prev, ttfb } : { fcp, lcp, fid, cls, ttfb });
      });
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }

    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      navigationObserver.disconnect();
    };
  }, []);

  return vitals;
};

/**
 * 响应式断点检测钩子
 */
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<{
    current: DeviceType;
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  }>({
    current: 'desktop',
    width: 0,
    height: 0,
    orientation: 'landscape'
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      let current: DeviceType = 'desktop';
      if (width < 768) {
        current = 'mobile';
      } else if (width < 1024) {
        current = 'tablet';
      }

      setBreakpoint({ current, width, height, orientation });
    };

    updateBreakpoint();
    
    const mediaQueries = [
      window.matchMedia('(max-width: 767px)'), // mobile
      window.matchMedia('(min-width: 768px) and (max-width: 1023px)'), // tablet
      window.matchMedia('(min-width: 1024px)'), // desktop
    ];

    const handleChange = () => updateBreakpoint();

    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, []);

  return breakpoint;
};

/**
 * 关键资源预加载钩子
 */
export const useResourcePreloading = () => {
  const [preloadedResources, setPreloadedResources] = useState<Set<string>>(new Set());
  
  const preloadResource = useCallback((href: string, as: string, type?: string) => {
    if (typeof window === 'undefined' || preloadedResources.has(href)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
    setPreloadedResources(prev => new Set([...prev, href]));
  }, [preloadedResources]);

  const preconnectDomain = useCallback((domain: string, crossOrigin = false) => {
    if (typeof window === 'undefined' || document.querySelector(`link[href="${domain}"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    if (crossOrigin) link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  }, []);

  const prefetchResource = useCallback((href: string) => {
    if (typeof window === 'undefined' || document.querySelector(`link[href="${href}"][rel="prefetch"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    document.head.appendChild(link);
  }, []);

  return { preloadResource, preconnectDomain, prefetchResource };
};

/**
 * 元数据缓存钩子
 */
export const useMetadataCache = () => {
  const cacheRef = useRef<Map<string, any>>(new Map());
  
  const getCachedMetadata = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const setCachedMetadata = useCallback((key: string, data: any, ttl: number = 300000) => { // 5分钟默认TTL
    const expiry = Date.now() + ttl;
    cacheRef.current.set(key, { data, expiry });
    
    // 清理过期缓存
    setTimeout(() => {
      const cached = cacheRef.current.get(key);
      if (cached && Date.now() > cached.expiry) {
        cacheRef.current.delete(key);
      }
    }, ttl);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const allEntries = Array.from(cacheRef.current.entries());
    const validEntries = allEntries.filter(([, value]) => now < value.expiry);
    
    return {
      totalEntries: allEntries.length,
      validEntries: validEntries.length,
      expiredEntries: allEntries.length - validEntries.length,
      cacheSize: JSON.stringify(Array.from(cacheRef.current.entries())).length,
    };
  }, []);

  return { getCachedMetadata, setCachedMetadata, clearCache, getCacheStats };
};

/**
 * SEO性能报告生成钩子
 */
export const useSEOPerformanceReport = () => {
  const vitals = useCoreWebVitals();
  const { current: deviceType } = useResponsiveBreakpoint();
  
  const generateReport = useCallback((): SEOPerformanceReport | null => {
    if (!vitals) return null;

    const seoScore = calculateSEOScore(vitals, deviceType);
    const issues = identifyPerformanceIssues(vitals);
    const recommendations = generateRecommendations(vitals, issues);

    return {
      url: window.location.href,
      timestamp: new Date(),
      metrics: vitals,
      seoScore,
      issues,
      recommendations,
    };
  }, [vitals, deviceType]);

  return { generateReport, vitals, deviceType };
};

// 辅助函数
const calculateSEOScore = (vitals: PerformanceMetrics, deviceType: DeviceType): number => {
  let score = 100;
  
  // LCP评分 (Largest Contentful Paint)
  if (vitals.lcp > 4000) score -= 30;
  else if (vitals.lcp > 2500) score -= 15;
  
  // FID评分 (First Input Delay)
  if (vitals.fid > 300) score -= 25;
  else if (vitals.fid > 100) score -= 10;
  
  // CLS评分 (Cumulative Layout Shift)
  if (vitals.cls > 0.25) score -= 20;
  else if (vitals.cls > 0.1) score -= 10;
  
  // FCP评分 (First Contentful Paint)
  if (vitals.fcp > 3000) score -= 15;
  else if (vitals.fcp > 1800) score -= 5;
  
  // TTFB评分 (Time to First Byte)
  if (vitals.ttfb > 800) score -= 10;
  else if (vitals.ttfb > 600) score -= 5;
  
  // 移动端额外惩罚
  if (deviceType === 'mobile') {
    if (vitals.lcp > 3000) score -= 10;
    if (vitals.fcp > 2000) score -= 5;
  }
  
  return Math.max(0, Math.round(score));
};

const identifyPerformanceIssues = (vitals: PerformanceMetrics) => {
  const issues: any[] = [];
  
  if (vitals.lcp > 2500) {
    issues.push({
      type: 'warning',
      category: 'performance',
      message: `Largest Contentful Paint is ${Math.round(vitals.lcp)}ms (should be < 2.5s)`,
      severity: vitals.lcp > 4000 ? 'high' : 'medium',
      fix: 'Optimize images, reduce server response time, enable browser caching'
    });
  }
  
  if (vitals.fid > 100) {
    issues.push({
      type: 'warning',
      category: 'performance',
      message: `First Input Delay is ${Math.round(vitals.fid)}ms (should be < 100ms)`,
      severity: vitals.fid > 300 ? 'high' : 'medium',
      fix: 'Reduce JavaScript execution time, break up long tasks'
    });
  }
  
  if (vitals.cls > 0.1) {
    issues.push({
      type: 'warning',
      category: 'performance',
      message: `Cumulative Layout Shift is ${vitals.cls.toFixed(3)} (should be < 0.1)`,
      severity: vitals.cls > 0.25 ? 'high' : 'medium',
      fix: 'Add size attributes to images and videos, avoid inserting content above existing content'
    });
  }
  
  return issues;
};

const generateRecommendations = (vitals: PerformanceMetrics, issues: any[]): string[] => {
  const recommendations: string[] = [];
  
  if (vitals.lcp > 2500) {
    recommendations.push('Optimize Largest Contentful Paint: compress images, use WebP format, implement lazy loading');
  }
  
  if (vitals.fid > 100) {
    recommendations.push('Improve First Input Delay: minimize main thread blocking, defer non-critical JavaScript');
  }
  
  if (vitals.cls > 0.1) {
    recommendations.push('Reduce Cumulative Layout Shift: specify image dimensions, avoid dynamic content insertion');
  }
  
  if (vitals.fcp > 1800) {
    recommendations.push('Improve First Contentful Paint: optimize critical rendering path, inline critical CSS');
  }
  
  if (issues.length === 0) {
    recommendations.push('Great performance! Consider implementing advanced optimizations like service workers and resource hints');
  }
  
  return recommendations;
};