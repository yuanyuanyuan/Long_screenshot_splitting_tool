import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ImageSlice } from '../types';
import { useI18n } from '../hooks/useI18n';
import { styleMapping, cn } from '../utils/styleMapping';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { formatImageSliceInfo } from '../utils/textFormatter';
import { TextDisplayConfig, useTextDisplayConfig } from './TextDisplayConfig';

interface ImagePreviewProps {
  imageSlices: ImageSlice[];
  selectedSlices: Set<number>;
  onToggleSelection: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  /** 是否显示文字显示配置面板 */
  showTextDisplayConfig?: boolean;
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
  onDeselectAll,
  showTextDisplayConfig = false
}: ImagePreviewProps) {
  const { t } = useI18n();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  
  // 图片缩放状态
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // 文字显示配置状态
  const { options: textDisplayOptions, updateOptions: updateTextDisplayOptions } = useTextDisplayConfig();
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  // 使用响应式布局hook
  const {
    layoutStrategy,
    isMobile,
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

  // 图片缩放处理函数
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
    console.log('[ImagePreview] 放大图片，缩放比例:', Math.min(scale + 0.25, 3));
  }, [scale]);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
    console.log('[ImagePreview] 缩小图片，缩放比例:', Math.max(scale - 0.25, 0.5));
  }, [scale]);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    console.log('[ImagePreview] 重置图片缩放');
  }, []);

  // 拖动处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      console.log('[ImagePreview] 开始拖动图片');
    }
  }, [scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      console.log('[ImagePreview] 结束拖动图片');
    }
  }, [isDragging]);

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
    if (textDisplayOptions.showDebugInfo) {
      console.log('[ImagePreview] 组件返回null - 没有图片切片');
    }
    return (
      <div style={{padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px', margin: '20px 0'}}>
        <h3 style={{color: '#856404'}}>⚠️ ImagePreview组件: 没有图片切片数据</h3>
        {textDisplayOptions.showDebugInfo && (
          <p>imageSlices.length = {imageSlices.length}</p>
        )}
      </div>
    );
  }

  if (textDisplayOptions.showDebugInfo) {
    console.log('[ImagePreview] 组件正常渲染 - 切片数量:', imageSlices.length);
  }

  return (
    <div className="w-full max-w-full">
      {/* 预览头部 */}
      <div className={cn(
        styleMapping['preview-header']
      )}>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
            {t('preview.title') || '选择需要导出的片段'}
          </h2>
          <span className="text-sm lg:text-base text-gray-600 font-medium">
            {t('preview.selectedCount') || `已选择 ${selectedSlices.size} 个片段`}
          </span>
        </div>
        
        {/* 控制按钮组 */}
        <div className="flex flex-col gap-3">
          {/* 显著放大的全选/取消按钮 */}
          <div className={styleMapping['selection-controls']}>
            <button 
              className={cn(
                styleMapping['btn'], 
                styleMapping['btn-primary'],
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
                isMobile ? 'flex-1' : ''
              )}
              onClick={onDeselectAll}
              disabled={selectedSlices.size === 0}
            >
              {t('preview.deselectAll') || '取消选择'}
            </button>
          </div>

          {/* 文字显示配置按钮 */}
          {showTextDisplayConfig && (
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition-colors',
                  showConfigPanel 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                )}
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                title="文字显示设置"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="inline mr-1">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                </svg>
                显示设置
              </button>
              
              {/* 快速模式切换按钮 */}
              <div className="flex items-center gap-1">
                <button
                  className={cn(
                    'px-2 py-1 text-xs rounded-full transition-colors',
                    !textDisplayOptions.showDebugInfo && !textDisplayOptions.showPreloadStatus && !textDisplayOptions.showKeyboardHints
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  onClick={() => updateTextDisplayOptions({
                    ...textDisplayOptions,
                    showDebugInfo: false,
                    showPreloadStatus: false,
                    showKeyboardHints: false,
                    showFullText: false
                  })}
                  title="简洁模式"
                >
                  简洁
                </button>
                <button
                  className={cn(
                    'px-2 py-1 text-xs rounded-full transition-colors',
                    textDisplayOptions.showDebugInfo
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  onClick={() => updateTextDisplayOptions({
                    ...textDisplayOptions,
                    showDebugInfo: true,
                    showPreloadStatus: true,
                    showKeyboardHints: true,
                    showFullText: true
                  })}
                  title="详细模式"
                >
                  详细
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 键盘导航提示 - 根据布局策略和文字显示配置显示/隐藏 */}
      {layoutStrategy.showKeyboardHints && textDisplayOptions.showKeyboardHints && (
        <div className={styleMapping['keyboard-navigation-hint']}>
          <span className={styleMapping['hint-text']}>
            💡 键盘快捷键：↑↓←→ 切换图片 | 空格键切换选择 | Enter确认选择 | Home/End跳转首尾 | Ctrl+A全选 | Esc取消选择 | Ctrl+I反选
          </span>
        </div>
      )}

      <div className={styleMapping['preview-content']}>
        {/* 左侧缩略图选择栏 */}
        <div className={styleMapping['thumbnail-sidebar']}>
          <div className={styleMapping['thumbnail-list']}>
            {imageSlices.map((slice) => (
              <div
                key={slice.index}
                className={cn(
                  styleMapping['thumbnail-item'],
                  selectedSlices.has(slice.index) ? styleMapping['thumbnail-item-selected'] : '',
                  selectedImageIndex === slice.index ? styleMapping['thumbnail-item-active'] : ''
                )}
                data-index={slice.index}
              >
                {/* 图片序号 - 根据配置显示/隐藏 */}
                {textDisplayOptions.showThumbnailNumber && (
                  <div className={styleMapping['thumbnail-number']}>
                    #{slice.index + 1}
                  </div>
                )}
                
                {/* 醒目的选择按钮 */}
                <button
                  className={cn(
                    styleMapping['thumbnail-select-btn'],
                    selectedSlices.has(slice.index) ? styleMapping['thumbnail-select-btn-selected'] : ''
                  )}
                  onClick={() => handleCheckboxChange(slice.index)}
                  aria-label={`选择切片 ${slice.index + 1}`}
                >
                  {selectedSlices.has(slice.index) ? '✓' : '+'}
                </button>
                
                <img
                  src={slice.url}
                  alt={t('preview.sliceAlt') || `切片 ${slice.index + 1}`}
                  className={styleMapping['thumbnail-img']}
                  onClick={() => handleThumbnailClick(slice)}
                  loading="lazy"
                />
                
                <div className={styleMapping['thumbnail-info']}>
                  {(() => {
                    const formattedInfo = formatImageSliceInfo(slice);
                    return (
                      <>
                        {textDisplayOptions.showSliceTitle && (
                          <div className={styleMapping['thumbnail-label']}>
                            {formattedInfo.title}
                          </div>
                        )}
                        {textDisplayOptions.showDimensions && (
                          <div className={styleMapping['thumbnail-hint']}>
                            {formattedInfo.dimensions}
                          </div>
                        )}
                        {textDisplayOptions.showFileSize && (
                          <div className={styleMapping['thumbnail-hint']}>
                            {formattedInfo.fileSize}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧大图预览区 */}
        <div className={styleMapping['preview-main']}>
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
                <>
                  <div 
                    className="relative overflow-hidden w-full max-w-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={imageSlices[selectedImageIndex].url}
                      alt={t('preview.largeImageAlt') || `切片 ${imageSlices[selectedImageIndex].index + 1} 预览`}
                      className="max-w-full max-h-[50vh] md:max-h-[60vh] rounded-lg shadow-md mx-auto object-contain"
                      style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s',
                        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        transformOrigin: 'center'
                      }}
                      onError={() => {
                        console.error('[ImagePreview] 大图加载失败:', imageSlices[selectedImageIndex].url);
                      }}
                    />
                  </div>
                  
                  {/* 缩放控件 */}
                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    <button
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      onClick={handleZoomOut}
                      disabled={scale <= 0.5}
                      title={t('preview.zoomOut') || '缩小'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </button>
                    
                    <button
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      onClick={handleResetZoom}
                      title={t('preview.resetZoom') || '重置缩放'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" />
                        <path d="M12 8v4l3 3" />
                      </svg>
                    </button>
                    
                    <button
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      onClick={handleZoomIn}
                      disabled={scale >= 3}
                      title={t('preview.zoomIn') || '放大'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </button>
                    
                    <span className="text-sm text-gray-600 ml-2">{Math.round(scale * 100)}%</span>
                  </div>
                </>
              )}
              
              <div className="mt-4 text-center w-full">
                {(() => {
                  const formattedInfo = formatImageSliceInfo(imageSlices[selectedImageIndex]);
                  return (
                    <>
                      {textDisplayOptions.showSliceTitle && (
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {t('preview.currentSlice') || formattedInfo.title}
                        </h3>
                      )}
                      
                      {(textDisplayOptions.showDimensions || textDisplayOptions.showFileSize) && (
                        <div className="flex flex-wrap justify-center items-center gap-2 mb-2">
                          {textDisplayOptions.showDimensions && (
                            <span className="text-gray-600">{formattedInfo.dimensions}</span>
                          )}
                          {textDisplayOptions.showDimensions && textDisplayOptions.showFileSize && (
                            <span className="text-gray-600">|</span>
                          )}
                          {textDisplayOptions.showFileSize && (
                            <span className="text-gray-600">{formattedInfo.fileSize}</span>
                          )}
                        </div>
                      )}
                      
                      {textDisplayOptions.showFullText && (
                        <div className="text-sm text-gray-500 mb-2">
                          {formattedInfo.fullText}
                        </div>
                      )}
                      
                      <p className="text-gray-600 mb-2">{t('preview.clickToSelect') || '点击左侧缩略图选择其他片段'}</p>
                      
                      {textDisplayOptions.showKeyboardHints && (
                        <p className={styleMapping['keyboard-hint']}>
                          使用键盘 ↑↓ 键快速切换图片
                        </p>
                      )}
                      
                      {textDisplayOptions.showPreloadStatus && loadingImages.size > 0 && (
                        <p className={styleMapping['preload-status']}>
                          正在预加载 {loadingImages.size} 张图片...
                        </p>
                      )}
                    </>
                  );
                })()}
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

      {/* 文字显示配置面板 */}
      {showTextDisplayConfig && showConfigPanel && (
        <div className="mt-4">
          <TextDisplayConfig
            options={textDisplayOptions}
            onChange={updateTextDisplayOptions}
            compact={isMobile}
            showPresets={true}
            className="max-w-4xl mx-auto"
          />
        </div>
      )}
    </div>
  );
}
