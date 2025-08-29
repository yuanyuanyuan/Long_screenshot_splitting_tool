/**
 * 懒加载Hook
 * 提供图片和内容的懒加载功能
 * 支持Intersection Observer和性能优化
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useViewport } from './useViewport';

export interface LazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
  fallbackInView?: boolean;
}

export interface LazyLoadingResult {
  ref: React.RefObject<HTMLElement | null>;
  inView: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * 基础懒加载Hook
 * 使用Intersection Observer API检测元素是否在视口内
 */
export function useLazyLoading({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  enabled = true,
  fallbackInView = false,
}: LazyLoadingOptions = {}): LazyLoadingResult {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(fallbackInView);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }

    const element = ref.current;
    const supportsIntersectionObserver = 'IntersectionObserver' in window;

    if (!supportsIntersectionObserver) {
      // Fallback for browsers that don't support Intersection Observer
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [observerEntry] = entries;
        setEntry(observerEntry);
        
        const isInView = observerEntry.isIntersecting;
        setInView(isInView);

        if (isInView && triggerOnce && !hasTriggered) {
          setHasTriggered(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref, inView: triggerOnce ? (hasTriggered || inView) : inView, entry };
}

/**
 * 图片懒加载Hook
 * 专门用于图片的懒加载，包含预加载和错误处理
 */
export interface ImageLazyLoadingOptions extends LazyLoadingOptions {
  src: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  quality?: number;
}

export interface ImageLazyLoadingResult extends LazyLoadingResult {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  currentSrc: string;
  loadImage: () => void;
}

export function useImageLazyLoading({
  src,
  placeholder = '',
  onLoad,
  onError,
  quality = 75,
  ...options
}: ImageLazyLoadingOptions): ImageLazyLoadingResult {
  const lazyResult = useLazyLoading(options);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  const loadImage = useCallback(() => {
    if (isLoading || isLoaded || hasError) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
      setCurrentSrc(src);
      onLoad?.();
    };

    img.onerror = () => {
      const error = new Error(`Failed to load image: ${src}`);
      setHasError(true);
      setIsLoading(false);
      setCurrentSrc(placeholder);
      onError?.(error);
    };

    // 根据质量参数调整图片URL（如果支持）
    const optimizedSrc = quality < 100 ? `${src}?quality=${quality}` : src;
    img.src = optimizedSrc;
  }, [src, placeholder, quality, isLoading, isLoaded, hasError, onLoad, onError]);

  // 当元素进入视口时开始加载图片
  useEffect(() => {
    if (lazyResult.inView && !isLoaded && !isLoading && !hasError) {
      loadImage();
    }
  }, [lazyResult.inView, isLoaded, isLoading, hasError, loadImage]);

  return {
    ...lazyResult,
    isLoaded,
    isLoading,
    hasError,
    currentSrc,
    loadImage,
  };
}

/**
 * 批量图片懒加载Hook
 * 用于管理多个图片的懒加载，支持优先级和批量处理
 */
export interface BatchImageItem {
  id: string;
  src: string;
  placeholder?: string;
  priority?: boolean;
  quality?: number;
}

export interface BatchImageLazyLoadingOptions extends Omit<LazyLoadingOptions, 'enabled'> {
  images: BatchImageItem[];
  batchSize?: number;
  loadDelay?: number;
  onBatchLoad?: (loadedIds: string[]) => void;
  onAllLoaded?: () => void;
}

export interface BatchImageState {
  [id: string]: {
    isLoaded: boolean;
    isLoading: boolean;
    hasError: boolean;
    currentSrc: string;
  };
}

export function useBatchImageLazyLoading({
  images,
  batchSize = 3,
  loadDelay = 100,
  onBatchLoad,
  onAllLoaded,
  ..._options
}: BatchImageLazyLoadingOptions) {
  const [imageStates, setImageStates] = useState<BatchImageState>({});
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const viewport = useViewport();
  
  // 初始化图片状态
  useEffect(() => {
    const initialStates: BatchImageState = {};
    images.forEach(image => {
      initialStates[image.id] = {
        isLoaded: false,
        isLoading: false,
        hasError: false,
        currentSrc: image.placeholder || '',
      };
    });
    setImageStates(initialStates);
    setCurrentBatchIndex(0);
  }, [images]);

  // 加载单个图片
  const loadSingleImage = useCallback((image: BatchImageItem): Promise<void> => {
    return new Promise((resolve, reject) => {
      setImageStates(prev => ({
        ...prev,
        [image.id]: { ...prev[image.id], isLoading: true, hasError: false }
      }));

      const img = new Image();
      
      img.onload = () => {
        setImageStates(prev => ({
          ...prev,
          [image.id]: {
            ...prev[image.id],
            isLoaded: true,
            isLoading: false,
            currentSrc: image.src
          }
        }));
        resolve();
      };

      img.onerror = () => {
        setImageStates(prev => ({
          ...prev,
          [image.id]: {
            ...prev[image.id],
            hasError: true,
            isLoading: false,
            currentSrc: image.placeholder || ''
          }
        }));
        reject(new Error(`Failed to load image: ${image.src}`));
      };

      // 移动端质量优化
      const quality = image.quality || (viewport.isMobile ? 60 : 80);
      const optimizedSrc = quality < 100 ? `${image.src}?quality=${quality}` : image.src;
      img.src = optimizedSrc;
    });
  }, [viewport.isMobile]);

  // 批量加载图片
  const loadBatch = useCallback(async (startIndex: number) => {
    const batch = images.slice(startIndex, startIndex + batchSize);
    const priorityImages = batch.filter(img => img.priority);
    const normalImages = batch.filter(img => !img.priority);

    // 优先加载高优先级图片
    if (priorityImages.length > 0) {
      try {
        await Promise.all(priorityImages.map(loadSingleImage));
      } catch (error) {
        console.warn('Priority images loading failed:', error);
      }
    }

    // 延迟加载普通图片
    if (normalImages.length > 0) {
      await new Promise(resolve => setTimeout(resolve, loadDelay));
      
      const loadPromises = normalImages.map(image => 
        loadSingleImage(image).catch(() => {
          // 忽略个别图片加载失败，继续加载其他图片
        })
      );

      await Promise.allSettled(loadPromises);
    }

    const loadedIds = batch.map(img => img.id);
    onBatchLoad?.(loadedIds);

    // 检查是否所有图片都已处理
    if (startIndex + batchSize >= images.length) {
      onAllLoaded?.();
    }
  }, [images, batchSize, loadDelay, loadSingleImage, onBatchLoad, onAllLoaded]);

  // 加载下一批图片
  const loadNextBatch = useCallback(() => {
    const nextIndex = currentBatchIndex * batchSize;
    if (nextIndex < images.length) {
      loadBatch(nextIndex);
      setCurrentBatchIndex(prev => prev + 1);
    }
  }, [currentBatchIndex, batchSize, images.length, loadBatch]);

  // 统计信息
  const stats = {
    total: images.length,
    loaded: Object.values(imageStates).filter(state => state.isLoaded).length,
    loading: Object.values(imageStates).filter(state => state.isLoading).length,
    errors: Object.values(imageStates).filter(state => state.hasError).length,
    progress: images.length > 0 ? (Object.values(imageStates).filter(state => state.isLoaded).length / images.length) * 100 : 0,
  };

  return {
    imageStates,
    loadNextBatch,
    loadBatch: (index: number) => loadBatch(index * batchSize),
    stats,
    isAllLoaded: stats.loaded === stats.total,
    hasErrors: stats.errors > 0,
  };
}

/**
 * 内容懒加载Hook
 * 用于懒加载非图片内容，如组件、文本等
 */
export interface ContentLazyLoadingOptions extends LazyLoadingOptions {
  loader?: () => Promise<any>;
  fallbackContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  errorContent?: React.ReactNode;
}

export function useContentLazyLoading({
  loader,
  fallbackContent,
  loadingContent,
  errorContent,
  ...options
}: ContentLazyLoadingOptions = {}) {
  const lazyResult = useLazyLoading(options);
  const [content, setContent] = useState<any>(fallbackContent);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (lazyResult.inView && loader && !isLoading && !content && !hasError) {
      setIsLoading(true);
      
      loader()
        .then(result => {
          setContent(result);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Content lazy loading failed:', error);
          setHasError(true);
          setIsLoading(false);
          setContent(errorContent);
        });
    }
  }, [lazyResult.inView, loader, isLoading, content, hasError, errorContent]);

  return {
    ...lazyResult,
    content: isLoading ? loadingContent : content,
    isLoading,
    hasError,
  };
}