import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ImageSlice } from '../types';
import { useI18n } from '../hooks/useI18n';
import { styleMapping, cn } from '../utils/styleMapping';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

interface ImagePreviewProps {
  imageSlices: ImageSlice[];
  selectedSlices: Set<number>;
  onToggleSelection: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

// 图片错误处理自定义hook
function useImageErrorHandling() {
  const [imageErrors, setImageErrors] = useState<Map<number, string>>(new Map());
  const [retryAttempts, setRetryAttempts] = useState<Map<number, number>>(new Map());
  const maxRetryAttempts = 3;

  const addError = useCallback((index: number, error: string) => {
    setImageErrors(prev => new Map(prev.set(index, error)));
    console.error('[ImageErrorHandling] 图片加载错误:', { index, error });
  }, []);

  const clearError = useCallback((index: number) => {
    setImageErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
    setRetryAttempts(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  }, []);

  const canRetry = useCallback((index: number) => {
    const attempts = retryAttempts.get(index) || 0;
    return attempts < maxRetryAttempts;
  }, [retryAttempts, maxRetryAttempts]);

  const incrementRetry = useCallback((index: number) => {
    setRetryAttempts(prev => {
      const attempts = prev.get(index) || 0;
      return new Map(prev.set(index, attempts + 1));
    });
  }, []);

  const retryImage = useCallback((imageSlice: ImageSlice, index: number, onSuccess: () => void) => {
    if (!canRetry(index)) {
      addError(index, `图片加载失败，已重试 ${maxRetryAttempts} 次`);
      return;
    }

    incrementRetry(index);
    const attempts = (retryAttempts.get(index) || 0) + 1;
    console.log(`[ImageErrorHandling] 重试加载图片 ${index}，第 ${attempts} 次尝试`);

    const img = new Image();
    img.onload = () => {
      clearError(index);
      onSuccess();
      console.log('[ImageErrorHandling] 图片重试加载成功:', imageSlice.url);
    };
    img.onerror = () => {
      if (attempts >= maxRetryAttempts) {
        addError(index, `图片加载失败，已重试 ${maxRetryAttempts} 次`);
      } else {
        // 延迟重试
        setTimeout(() => {
          retryImage(imageSlice, index, onSuccess);
        }, 1000 * attempts); // 递增延迟
      }
    };
    img.src = imageSlice.url;
  }, [canRetry, addError, incrementRetry, clearError, retryAttempts, maxRetryAttempts]);

  return {
    imageErrors,
    addError,
    clearError,
    retryImage,
    canRetry,
    getRetryAttempts: (index: number) => retryAttempts.get(index) || 0,
    maxRetryAttempts
  };
}

// 图片预加载自定义hook
function useImagePreloader(imageSlices: ImageSlice[], selectedImageIndex: number, errorHandler: ReturnType<typeof useImageErrorHandling>) {
  const preloadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (imageSlices.length === 0) return;

    // 预加载当前图片的前后各2张
    const preloadRange = [-2, -1, 0, 1, 2];
    const indicesToPreload = preloadRange
      .map(offset => selectedImageIndex + offset)
      .filter(index => index >= 0 && index < imageSlices.length);

    indicesToPreload.forEach(index => {
      const slice = imageSlices[index];
      if (!slice || preloadedImages.current.has(slice.url)) return;

      setLoadingImages(prev => new Set([...prev, index]));
      
      const img = new Image();
      img.onload = () => {
        preloadedImages.current.set(slice.url, img);
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
        errorHandler.clearError(index);
        console.log('[ImagePreloader] 图片预加载成功:', slice.url, '索引:', index);
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
        errorHandler.addError(index, '图片预加载失败');
        console.error('[ImagePreloader] 图片预加载失败:', slice.url, '索引:', index);
      };
      img.src = slice.url;
    });
  }, [imageSlices, selectedImageIndex, errorHandler]);

  return { loadingImages, preloadedImages: preloadedImages.current };
}

export function ImagePreview({
  imageSlices,
  selectedSlices,
  onToggleSelection,
  onSelectAll,
  onDeselectAll
}: ImagePreviewProps) {
  const { t } = useI18n();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  
  // 使用响应式布局hook
  const {
    layoutMode,
    layoutStrategy,
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveClasses
  } = useResponsiveLayout();
  
  // 使用图片错误处理hook
  const errorHandler = useImageErrorHandling();
  
  // 使用图片预加载hook
  const { loadingImages } = useImagePreloader(imageSlices, selectedImageIndex, errorHandler);
  
  // 获取响应式类名
  const responsiveClasses = getResponsiveClasses();
  
  // 触摸手势状态
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  const touchThreshold = 50; // 最小滑动距离
  const timeThreshold = 500; // 最大滑动时间（毫秒）

  // 触摸手势处理函数
  const handleTouchStart = useCallback((event: Event) => {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setTouchEnd(null);
  }, []);

  const handleTouchMove = useCallback((event: Event) => {
    const touchEvent = event as TouchEvent;
    // 防止页面滚动
    if (isMobile && touchStart) {
      touchEvent.preventDefault();
    }
  }, [isMobile, touchStart]);

  const handleTouchEnd = useCallback((event: Event) => {
    const touchEvent = event as TouchEvent;
    if (!touchStart) return;
    
    const touch = touchEvent.changedTouches[0];
    const touchEndData = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setTouchEnd(touchEndData);
    
    // 计算滑动距离和时间
    const deltaX = touchEndData.x - touchStart.x;
    const deltaY = touchEndData.y - touchStart.y;
    const deltaTime = touchEndData.time - touchStart.time;
    
    // 检查是否为有效的水平滑动
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > touchThreshold;
    const isValidTime = deltaTime < timeThreshold;
    
    if (isHorizontalSwipe && isValidTime && imageSlices.length > 0) {
      if (deltaX > 0) {
        // 向右滑动 - 上一张图片
        setSelectedImageIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : imageSlices.length - 1;
          console.log('[TouchGesture] 向右滑动，切换到上一张图片:', newIndex);
          return newIndex;
        });
      } else {
        // 向左滑动 - 下一张图片
        setSelectedImageIndex(prev => {
          const newIndex = prev < imageSlices.length - 1 ? prev + 1 : 0;
          console.log('[TouchGesture] 向左滑动，切换到下一张图片:', newIndex);
          return newIndex;
        });
      }
    }
    
    // 重置触摸状态
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchThreshold, timeThreshold, imageSlices.length]);

  // 键盘导航处理函数 - 统一的键盘事件处理
  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (imageSlices.length === 0) return;

    // 检查是否在输入框或其他表单元素中
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        setSelectedImageIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : imageSlices.length - 1;
          console.log('[KeyNavigation] 切换到上一张图片:', newIndex);
          return newIndex;
        });
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        setSelectedImageIndex(prev => {
          const newIndex = prev < imageSlices.length - 1 ? prev + 1 : 0;
          console.log('[KeyNavigation] 切换到下一张图片:', newIndex);
          return newIndex;
        });
        break;
      case 'Home':
        event.preventDefault();
        setSelectedImageIndex(0);
        console.log('[KeyNavigation] 跳转到第一张图片');
        break;
      case 'End':
        event.preventDefault();
        setSelectedImageIndex(imageSlices.length - 1);
        console.log('[KeyNavigation] 跳转到最后一张图片');
        break;
      case ' ': // 空格键
        event.preventDefault();
        // 切换当前图片的选择状态
        if (imageSlices[selectedImageIndex]) {
          onToggleSelection(imageSlices[selectedImageIndex].index);
          console.log('[KeyNavigation] 切换图片选择状态:', selectedImageIndex);
        }
        break;
      case 'Enter':
        event.preventDefault();
        // Enter键确认选择当前图片
        if (imageSlices[selectedImageIndex] && !selectedSlices.has(imageSlices[selectedImageIndex].index)) {
          onToggleSelection(imageSlices[selectedImageIndex].index);
          console.log('[KeyNavigation] Enter键确认选择图片:', selectedImageIndex);
        }
        break;
      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onSelectAll();
          console.log('[KeyNavigation] Ctrl+A 全选');
        }
        break;
      case 'Escape':
        event.preventDefault();
        onDeselectAll();
        console.log('[KeyNavigation] Escape 取消所有选择');
        break;
      case 'i':
      case 'I':
        // 反选功能
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // 先取消所有选择，然后选择未选中的
          const allIndices = imageSlices.map(slice => slice.index);
          const unselectedIndices = allIndices.filter(index => !selectedSlices.has(index));
          onDeselectAll();
          unselectedIndices.forEach(index => onToggleSelection(index));
          console.log('[KeyNavigation] Ctrl+I 反选');
        }
        break;
    }
  }, [imageSlices, selectedImageIndex, onToggleSelection, onSelectAll, onDeselectAll, selectedSlices]);

  // 添加键盘事件监听器
  useEffect(() => {
    // 只在桌面端或显示键盘提示时启用键盘导航
    if (layoutStrategy.showKeyboardHints) {
      document.addEventListener('keydown', handleKeyNavigation);
      return () => {
        document.removeEventListener('keydown', handleKeyNavigation);
      };
    }
  }, [handleKeyNavigation, layoutStrategy.showKeyboardHints]);

  // 添加触摸事件监听器（仅在移动端）
  useEffect(() => {
    if (!isMobile) return;

    const previewElement = document.querySelector('.preview-main');
    if (!previewElement) return;

    previewElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    previewElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    previewElement.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      previewElement.removeEventListener('touchstart', handleTouchStart);
      previewElement.removeEventListener('touchmove', handleTouchMove);
      previewElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // 移动端性能优化
  useEffect(() => {
    if (!isMobile) return;

    // 优化移动端滚动性能
     const thumbnailContainer = document.querySelector('.thumbnail-list');
     if (thumbnailContainer) {
       const element = thumbnailContainer as HTMLElement;
       // 启用硬件加速
       element.style.transform = 'translateZ(0)';
       // 优化滚动性能
       (element.style as any).webkitOverflowScrolling = 'touch';
     }

    // 优化图片容器的触摸性能
    const imageContainer = document.querySelector('.preview-image-container');
    if (imageContainer) {
      (imageContainer as HTMLElement).style.transform = 'translateZ(0)';
    }
  }, [isMobile, imageSlices.length]);

  // 重复的键盘导航代码已移除，统一使用上面的 handleKeyNavigation 函数

  // 调试：组件渲染时输出props
  console.log('[ImagePreview] 组件渲染，props:', {
    imageSlicesLength: imageSlices.length,
    imageSlices,
    selectedSlicesSize: selectedSlices.size,
    selectedImageIndex
  });

  // 自动选择第一个图片切片进行预览
  useEffect(() => {
    if (imageSlices.length > 0) {
      setSelectedImageIndex(0);
      console.log('[ImagePreview] 自动选择第一个图片，索引:', 0);
    }
  }, [imageSlices.length]);

  // 使用useCallback优化缩略图点击事件处理
  const handleThumbnailClick = useCallback((slice: ImageSlice) => {
    const targetIndex = imageSlices.findIndex(s => s.index === slice.index);
    if (targetIndex !== -1) {
      setSelectedImageIndex(targetIndex);
      console.log('[ImagePreview] 缩略图点击 - 切片索引:', slice.index, '数组索引:', targetIndex);
    }
  }, [imageSlices]);

  // 使用useCallback优化复选框变化事件处理
  const handleCheckboxChange = useCallback((index: number) => {
    onToggleSelection(index);
    console.log('[ImagePreview] 复选框变化 - 索引:', index);
  }, [onToggleSelection]);

  if (imageSlices.length === 0) {
    console.log('[ImagePreview] 组件返回null - 没有图片切片');
    return (
      <div style={{padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px', margin: '20px 0'}}>
        <h3 style={{color: '#856404'}}>⚠️ ImagePreview组件: 没有图片切片数据</h3>
        <p>imageSlices.length = {imageSlices.length}</p>
      </div>
    );
  }

  console.log('[ImagePreview] 组件正常渲染 - 切片数量:', imageSlices.length);

  return (
    <div className={responsiveClasses.container}>
      {/* 预览头部 */}
      <div className={cn(
        styleMapping['preview-header'],
        isMobile ? 'flex-col gap-3' : 'flex-row items-center gap-4'
      )}>
        <div className="flex flex-col gap-2">
          <h2 className={cn(
            "font-bold text-gray-800",
            isMobile ? "text-lg" : "text-xl"
          )}>{t('preview.title') || '选择需要导出的片段'}</h2>
          <span className="text-sm text-gray-600">
            {t('preview.selectedCount') || `已选择 ${selectedSlices.size} 个片段`}
          </span>
        </div>
        
        <div className={cn(
          styleMapping['selection-controls'],
          isMobile ? 'w-full justify-center' : ''
        )}>
          <button 
            className={cn(
              styleMapping['btn'], 
              styleMapping['btn-primary'],
              responsiveClasses.button,
              isMobile ? 'flex-1' : ''
            )}
            onClick={onSelectAll}
            disabled={imageSlices.length === 0}
          >
            {t('preview.selectAll') || '全选'}
          </button>
          <button 
            className={cn(
              styleMapping['btn'], 
              styleMapping['btn-secondary'],
              responsiveClasses.button,
              isMobile ? 'flex-1' : ''
            )}
            onClick={onDeselectAll}
            disabled={selectedSlices.size === 0}
          >
            {t('preview.deselectAll') || '取消选择'}
          </button>
        </div>
      </div>

      {/* 键盘导航提示 - 根据布局策略显示/隐藏 */}
      {layoutStrategy.showKeyboardHints && (
        <div className={styleMapping['keyboard-navigation-hint']}>
          <span className={styleMapping['hint-text']}>
            💡 键盘快捷键：↑↓←→ 切换图片 | 空格键切换选择 | Enter确认选择 | Home/End跳转首尾 | Ctrl+A全选 | Esc取消选择 | Ctrl+I反选
          </span>
        </div>
      )}

      <div className={responsiveClasses.container}>
        {/* 左侧缩略图列表 */}
        <div className={responsiveClasses.sidebar}>
          <div className={responsiveClasses.thumbnailList}>
            {imageSlices.map((slice) => (
              <div
                key={slice.index}
                className={cn(
                  responsiveClasses.thumbnailItem,
                  selectedSlices.has(slice.index) ? styleMapping['thumbnail-item-selected'] : ''
                )}
                data-index={slice.index}
              >
                <input
                  type="checkbox"
                  className={styleMapping['thumbnail-checkbox']}
                  checked={selectedSlices.has(slice.index)}
                  onChange={() => handleCheckboxChange(slice.index)}
                />
                
                <img
                  src={slice.url}
                  alt={t('preview.sliceAlt') || `切片 ${slice.index + 1}`}
                  className={styleMapping['thumbnail-img']}
                  onClick={() => handleThumbnailClick(slice)}
                  loading="lazy"
                />
                
                <div className={styleMapping['thumbnail-info']}>
                  <div className={styleMapping['thumbnail-label']}>
                    {t('preview.sliceLabel') || `切片 ${slice.index + 1}`}
                  </div>
                  <div className={styleMapping['thumbnail-hint']}>
                    {t('preview.dimensions') || `${slice.width} × ${slice.height}`}
                  </div>
                  <div className={styleMapping['thumbnail-hint']}>
                    {t('preview.size') || `${Math.round(slice.blob.size / 1024)} KB`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧大图预览 */}
        <div className={responsiveClasses.main}>
          {imageSlices.length > 0 && imageSlices[selectedImageIndex] ? (
            <div className={responsiveClasses.imageContainer}>
              {/* 显示加载状态 */}
              {loadingImages.has(selectedImageIndex) && (
                <div className={styleMapping['image-loading-overlay']}>
                  <div className={`${styleMapping['loading-spinner']} ${isMobile ? 'text-lg py-4' : ''}`}>
                    {isMobile ? '正在加载图片...' : '加载中...'}
                  </div>
                </div>
              )}
              
              {/* 显示错误状态 */}
              {errorHandler.imageErrors.has(selectedImageIndex) ? (
                <div className={styleMapping['image-error-container']}>
                  <div className={styleMapping['error-icon']}>⚠️</div>
                  <h3 className="text-lg font-semibold text-error-700 mb-2">图片加载失败</h3>
                  <p className="text-error-600 mb-4">{errorHandler.imageErrors.get(selectedImageIndex)}</p>
                  <div className={styleMapping['error-details']}>
                    <p className={styleMapping['retry-info']}>
                      重试次数: {errorHandler.getRetryAttempts(selectedImageIndex)} / {errorHandler.maxRetryAttempts}
                    </p>
                  </div>
                  {errorHandler.canRetry(selectedImageIndex) ? (
                    <button 
                      className={cn(styleMapping['btn'], styleMapping['retry-button'])}
                      onClick={() => {
                        errorHandler.retryImage(
                          imageSlices[selectedImageIndex],
                          selectedImageIndex,
                          () => {
                            // 重试成功后重新触发预加载
                            setSelectedImageIndex(prev => prev);
                          }
                        );
                      }}
                    >
                      重试加载
                    </button>
                  ) : (
                    <div className={styleMapping['error-final']}>
                      <p className="text-error-700 mb-3">已达到最大重试次数</p>
                      <button 
                        className={cn(styleMapping['btn'], styleMapping['reset-button'])}
                        onClick={() => {
                          errorHandler.clearError(selectedImageIndex);
                          setSelectedImageIndex(prev => prev);
                        }}
                      >
                        重置
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={imageSlices[selectedImageIndex].url}
                  alt={t('preview.largeImageAlt') || `切片 ${imageSlices[selectedImageIndex].index + 1} 预览`}
                  className={styleMapping['preview-image']}
                  onError={() => {
                    console.error('[ImagePreview] 大图加载失败:', imageSlices[selectedImageIndex].url);
                  }}
                />
              )}
              
              <div className={styleMapping['preview-info']}>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {t('preview.currentSlice') || `切片 ${imageSlices[selectedImageIndex].index + 1}`}
                </h3>
                <p className="text-gray-600 mb-2">{t('preview.clickToSelect') || '点击左侧缩略图选择其他片段'}</p>
                <p className={styleMapping['keyboard-hint']}>
                  使用键盘 ↑↓ 键快速切换图片
                </p>
                {loadingImages.size > 0 && (
                  <p className={styleMapping['preload-status']}>
                    正在预加载 {loadingImages.size} 张图片...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className={styleMapping['preview-placeholder']}>
              <div className="text-gray-400 mb-4">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">{t('preview.noPreview') || '点击左侧缩略图查看大图'}</h3>
              <p className="text-gray-500">{t('preview.previewHint') || '选择需要导出的图片片段'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};