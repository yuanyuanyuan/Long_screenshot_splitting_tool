/**
 * 懒加载图片组件
 * 支持Intersection Observer API和fallback机制
 * 优化移动端性能和网络使用
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useViewport } from '../hooks/useViewport';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  enableBlur?: boolean;
  quality?: number;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface LazyImageState {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  isInView: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  blurDataURL,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  enableBlur = true,
  quality = 75,
  priority = false,
  className = '',
  style = {},
  ...imgProps
}) => {
  const [state, setState] = useState<LazyImageState>({
    isLoaded: false,
    isLoading: false,
    hasError: false,
    isInView: priority, // 优先级图片默认在视口内
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const viewport = useViewport();

  // 图片加载处理
  const handleImageLoad = useCallback(() => {
    setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
    onLoad?.();
  }, [onLoad]);

  // 图片错误处理
  const handleImageError = useCallback(() => {
    setState(prev => ({ ...prev, hasError: true, isLoading: false }));
    onError?.();
  }, [onError]);

  // 开始加载图片
  const startImageLoad = useCallback(() => {
    if (state.isLoading || state.isLoaded || state.hasError) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    // 预加载图片
    const img = new Image();
    img.onload = handleImageLoad;
    img.onerror = handleImageError;
    img.src = src;
  }, [src, state.isLoading, state.isLoaded, state.hasError, handleImageLoad, handleImageError]);

  // 设置Intersection Observer
  useEffect(() => {
    if (priority || !imgRef.current) {
      if (priority) {
        startImageLoad();
      }
      return;
    }

    const supportsIntersectionObserver = 'IntersectionObserver' in window;

    if (supportsIntersectionObserver) {
      observerRef.current = new IntersectionObserver(
        entries => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setState(prev => ({ ...prev, isInView: true }));
            startImageLoad();
            observerRef.current?.unobserve(entry.target);
          }
        },
        {
          threshold,
          rootMargin,
        }
      );

      observerRef.current.observe(imgRef.current);
    } else {
      // Fallback for older browsers
      setState(prev => ({ ...prev, isInView: true }));
      startImageLoad();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, threshold, rootMargin, startImageLoad]);

  // 生成占位符样式
  const getPlaceholderStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: '#f3f4f6',
      backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: enableBlur && blurDataURL ? 'blur(5px)' : undefined,
      transform: enableBlur && blurDataURL ? 'scale(1.1)' : undefined,
      transition: 'opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease',
    };

    return baseStyle;
  };

  // 生成加载动画
  const LoadingSpinner = () => (
    <div
      className="absolute inset-0 flex items-center justify-center bg-gray-100"
      style={{
        minHeight: viewport.isMobile ? '120px' : '80px',
      }}
    >
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 ${
          viewport.isMobile ? 'h-8 w-8' : 'h-6 w-6'
        }`}
      ></div>
    </div>
  );

  // 生成错误状态
  const ErrorState = () => (
    <div
      className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500"
      style={{
        minHeight: viewport.isMobile ? '120px' : '80px',
      }}
    >
      <div className="text-center">
        <div className={`${viewport.isMobile ? 'text-2xl mb-2' : 'text-xl mb-1'}`}>📷</div>
        <div className={`${viewport.isMobile ? 'text-sm' : 'text-xs'}`}>图片加载失败</div>
      </div>
    </div>
  );

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const imageStyle: React.CSSProperties = {
    opacity: state.isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease',
    filter: state.isLoaded && enableBlur ? 'none' : undefined,
    transform: state.isLoaded && enableBlur ? 'scale(1)' : undefined,
    width: '100%',
    height: 'auto',
    display: 'block',
  };

  return (
    <div className={`lazy-image-container ${className}`} style={containerStyle} ref={imgRef}>
      {/* 占位符背景 */}
      {!state.isLoaded && !state.hasError && (
        <div className="absolute inset-0" style={getPlaceholderStyle()} />
      )}

      {/* 加载状态 */}
      {state.isLoading && !state.isLoaded && !state.hasError && <LoadingSpinner />}

      {/* 错误状态 */}
      {state.hasError && <ErrorState />}

      {/* 实际图片 */}
      {(state.isInView || state.isLoaded) && !state.hasError && (
        <img
          {...imgProps}
          src={state.isLoaded || state.isLoading ? src : placeholder}
          alt={alt}
          style={imageStyle}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* 移动端优化：显示图片信息 */}
      {viewport.isMobile && state.isLoaded && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {quality && quality < 100 && `${quality}%`}
        </div>
      )}
    </div>
  );
};

export default LazyImage;
