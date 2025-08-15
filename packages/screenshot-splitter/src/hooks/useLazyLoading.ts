import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 懒加载配置选项
 */
export interface LazyLoadingOptions {
  /** 根边距，用于提前触发加载 */
  rootMargin?: string;
  /** 交叉比例阈值 */
  threshold?: number | number[];
  /** 是否只触发一次 */
  triggerOnce?: boolean;
  /** 是否启用懒加载 */
  enabled?: boolean;
  /** 加载占位符 */
  placeholder?: string;
  /** 错误占位符 */
  fallback?: string;
  /** 加载延迟（毫秒） */
  delay?: number;
  /** 自定义加载条件 */
  shouldLoad?: () => boolean;
}

/**
 * 懒加载状态
 */
export interface LazyLoadingState {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否已加载 */
  isLoaded: boolean;
  /** 是否在视口中 */
  isIntersecting: boolean;
  /** 是否加载失败 */
  hasError: boolean;
  /** 错误信息 */
  error?: Error;
}

/**
 * 懒加载返回值
 */
export interface LazyLoadingResult extends LazyLoadingState {
  /** 目标元素引用 */
  ref: React.RefObject<HTMLElement | null>;
  /** 当前源地址 */
  src: string | undefined;
  /** 手动触发加载 */
  load: () => void;
  /** 重置状态 */
  reset: () => void;
  /** 重试加载 */
  retry: () => void;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<LazyLoadingOptions> = {
  rootMargin: '50px',
  threshold: 0.1,
  triggerOnce: true,
  enabled: true,
  placeholder: '',
  fallback: '',
  delay: 0,
  shouldLoad: () => true,
};

/**
 * 图片懒加载Hook
 * 使用Intersection Observer API实现高性能的懒加载功能
 * 
 * @param src 图片源地址
 * @param options 懒加载配置选项
 * @returns 懒加载状态和控制方法
 * 
 * @example
 * ```tsx
 * const { ref, src, isLoading, isLoaded, hasError, retry } = useLazyLoading(
 *   'https://example.com/image.jpg',
 *   {
 *     rootMargin: '100px',
 *     placeholder: '/placeholder.jpg',
 *     fallback: '/error.jpg'
 *   }
 * );
 * 
 * return (
 *   <div ref={ref}>
 *     <img 
 *       src={src} 
 *       alt="Lazy loaded image"
 *       onError={retry}
 *     />
 *     {isLoading && <div>Loading...</div>}
 *     {hasError && <button onClick={retry}>Retry</button>}
 *   </div>
 * );
 * ```
 */
export const useLazyLoading = (
  originalSrc: string,
  options: LazyLoadingOptions = {}
): LazyLoadingResult => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 状态管理
  const [state, setState] = useState<LazyLoadingState>({
    isLoading: false,
    isLoaded: false,
    isIntersecting: false,
    hasError: false,
    error: undefined,
  });

  // 当前显示的源地址
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(
    config.enabled ? config.placeholder : originalSrc
  );

  /**
   * 预加载图片
   */
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve();
      };
      
      img.onerror = (event) => {
        const error = new Error(`Failed to load image: ${src}`);
        reject(error);
      };
      
      img.src = src;
    });
  }, []);

  /**
   * 执行加载
   */
  const executeLoad = useCallback(async () => {
    if (!config.enabled || !config.shouldLoad()) {
      setCurrentSrc(originalSrc);
      setState(prev => ({ ...prev, isLoaded: true }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      hasError: false, 
      error: undefined 
    }));

    try {
      // 延迟加载
      if (config.delay > 0) {
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, config.delay);
        });
      }

      // 预加载图片
      await preloadImage(originalSrc);
      
      // 加载成功
      setCurrentSrc(originalSrc);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isLoaded: true 
      }));
    } catch (error) {
      // 加载失败
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      setCurrentSrc(config.fallback || config.placeholder);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        hasError: true, 
        error: errorObj 
      }));
    }
  }, [originalSrc, config, preloadImage]);

  /**
   * 手动触发加载
   */
  const load = useCallback(() => {
    if (!state.isLoaded && !state.isLoading) {
      executeLoad();
    }
  }, [state.isLoaded, state.isLoading, executeLoad]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    // 清理定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 重置状态
    setState({
      isLoading: false,
      isLoaded: false,
      isIntersecting: false,
      hasError: false,
      error: undefined,
    });

    // 重置源地址
    setCurrentSrc(config.enabled ? config.placeholder : originalSrc);
  }, [config.enabled, config.placeholder, originalSrc]);

  /**
   * 重试加载
   */
  const retry = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      hasError: false, 
      error: undefined 
    }));
    executeLoad();
  }, [executeLoad]);

  /**
   * Intersection Observer 回调
   */
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isIntersecting = entry.isIntersecting;

    setState(prev => ({ ...prev, isIntersecting }));

    if (isIntersecting && !state.isLoaded && !state.isLoading) {
      executeLoad();

      // 如果只触发一次，则断开观察
      if (config.triggerOnce && observerRef.current) {
        observerRef.current.disconnect();
      }
    }
  }, [state.isLoaded, state.isLoading, executeLoad, config.triggerOnce]);

  /**
   * 设置 Intersection Observer
   */
  useEffect(() => {
    if (!config.enabled) {
      return;
    }

    // 检查浏览器支持
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver not supported, loading image immediately');
      executeLoad();
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    // 创建观察者
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: config.rootMargin,
      threshold: config.threshold,
    });

    // 开始观察
    observerRef.current.observe(element);

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [config.enabled, config.rootMargin, config.threshold, handleIntersection, executeLoad]);

  /**
   * 源地址变化时重置状态
   */
  useEffect(() => {
    reset();
  }, [originalSrc, reset]);

  /**
   * 配置变化时更新状态
   */
  useEffect(() => {
    if (!config.enabled && !state.isLoaded) {
      setCurrentSrc(originalSrc);
      setState(prev => ({ ...prev, isLoaded: true }));
    }
  }, [config.enabled, originalSrc, state.isLoaded]);

  return {
    ...state,
    ref,
    src: currentSrc,
    load,
    reset,
    retry,
  };
};

/**
 * 批量懒加载Hook
 * 用于管理多个图片的懒加载
 * 
 * @param sources 图片源地址数组
 * @param options 懒加载配置选项
 * @returns 懒加载状态数组和控制方法
 * 
 * @example
 * ```tsx
 * const { items, loadAll, resetAll } = useBatchLazyLoading([
 *   'image1.jpg',
 *   'image2.jpg',
 *   'image3.jpg'
 * ], { rootMargin: '100px' });
 * 
 * return (
 *   <div>
 *     {items.map((item, index) => (
 *       <div key={index} ref={item.ref}>
 *         <img src={item.src} alt={`Image ${index}`} />
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useBatchLazyLoading = (
  sources: string[],
  options: LazyLoadingOptions = {}
) => {
  const items = sources.map(src => useLazyLoading(src, options));

  const loadAll = useCallback(() => {
    items.forEach(item => item.load());
  }, [items]);

  const resetAll = useCallback(() => {
    items.forEach(item => item.reset());
  }, [items]);

  const retryAll = useCallback(() => {
    items.forEach(item => {
      if (item.hasError) {
        item.retry();
      }
    });
  }, [items]);

  const stats = {
    total: items.length,
    loaded: items.filter(item => item.isLoaded).length,
    loading: items.filter(item => item.isLoading).length,
    failed: items.filter(item => item.hasError).length,
    pending: items.filter(item => !item.isLoaded && !item.isLoading && !item.hasError).length,
  };

  return {
    items,
    loadAll,
    resetAll,
    retryAll,
    stats,
    isAllLoaded: stats.loaded === stats.total,
    hasAnyError: stats.failed > 0,
    isAnyLoading: stats.loading > 0,
  };
};

/**
 * 懒加载图片组件Hook
 * 提供完整的图片懒加载组件逻辑
 * 
 * @param src 图片源地址
 * @param options 懒加载配置选项
 * @returns 图片组件属性和状态
 * 
 * @example
 * ```tsx
 * const LazyImage = ({ src, alt, ...props }) => {
 *   const { imgProps, containerRef, isLoading, hasError, retry } = useLazyImage(src, {
 *     placeholder: '/placeholder.jpg',
 *     fallback: '/error.jpg'
 *   });
 * 
 *   return (
 *     <div ref={containerRef} className="lazy-image-container">
 *       <img {...imgProps} alt={alt} {...props} />
 *       {isLoading && <div className="loading">Loading...</div>}
 *       {hasError && <button onClick={retry}>Retry</button>}
 *     </div>
 *   );
 * };
 * ```
 */
export const useLazyImage = (
  src: string,
  options: LazyLoadingOptions = {}
) => {
  const lazyLoading = useLazyLoading(src, options);

  const imgProps = {
    src: lazyLoading.src,
    loading: 'lazy' as const,
    onError: lazyLoading.retry,
    style: {
      opacity: lazyLoading.isLoaded ? 1 : 0.5,
      transition: 'opacity 0.3s ease-in-out',
    },
  };

  return {
    ...lazyLoading,
    imgProps,
    containerRef: lazyLoading.ref,
  };
};

/**
 * 懒加载性能监控Hook
 * 监控懒加载的性能指标
 * 
 * @returns 性能监控数据和方法
 */
export const useLazyLoadingPerformance = () => {
  const [metrics, setMetrics] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0,
    totalLoadTime: 0,
    loadTimes: [] as number[],
  });

  const recordLoadStart = useCallback((id: string) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      setMetrics(prev => {
        const newLoadTimes = [...prev.loadTimes, loadTime];
        const newTotalLoadTime = prev.totalLoadTime + loadTime;
        const newLoadedImages = prev.loadedImages + 1;
        
        return {
          ...prev,
          loadedImages: newLoadedImages,
          totalLoadTime: newTotalLoadTime,
          averageLoadTime: newTotalLoadTime / newLoadedImages,
          loadTimes: newLoadTimes,
        };
      });
    };
  }, []);

  const recordLoadError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      failedImages: prev.failedImages + 1,
    }));
  }, []);

  const recordImageCount = useCallback((count: number) => {
    setMetrics(prev => ({
      ...prev,
      totalImages: count,
    }));
  }, []);

  const reset = useCallback(() => {
    setMetrics({
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      averageLoadTime: 0,
      totalLoadTime: 0,
      loadTimes: [],
    });
  }, []);

  const getPerformanceReport = useCallback(() => {
    const { loadTimes, totalImages, loadedImages, failedImages } = metrics;
    
    return {
      ...metrics,
      successRate: totalImages > 0 ? (loadedImages / totalImages) * 100 : 0,
      failureRate: totalImages > 0 ? (failedImages / totalImages) * 100 : 0,
      medianLoadTime: loadTimes.length > 0 
        ? loadTimes.sort((a, b) => a - b)[Math.floor(loadTimes.length / 2)]
        : 0,
      minLoadTime: loadTimes.length > 0 ? Math.min(...loadTimes) : 0,
      maxLoadTime: loadTimes.length > 0 ? Math.max(...loadTimes) : 0,
    };
  }, [metrics]);

  return {
    metrics,
    recordLoadStart,
    recordLoadError,
    recordImageCount,
    reset,
    getPerformanceReport,
  };
};

export default useLazyLoading;