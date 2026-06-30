/**
 * 图片预览组件
 * 显示分割后的切片，支持选择切片
 * 已移除原图预览tab，简化为单一切片预览界面
 */

import React, { useState, useCallback, useRef } from 'react';
import { useI18nContext } from '../hooks/useI18nContext';
import { useViewport } from '../hooks/useViewport';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { LazyImage } from './LazyImage';

interface ImageSlice {
  blob: Blob;
  url: string;
  index: number;
  width: number;
  height: number;
}

interface ImagePreviewProps {
  originalImage: HTMLImageElement | null;
  slices: ImageSlice[];
  selectedSlices: number[];
  onSelectionChange: (selectedIndices: number[]) => void;
  className?: string;
  enableTouchOptimization?: boolean;
  showImageInfo?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalImage,
  slices,
  selectedSlices,
  onSelectionChange,
  className = '',
  enableTouchOptimization = true,
  showImageInfo = true,
}) => {
  const { t } = useI18nContext();
  const viewport = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);

  // 移除tab切换，直接显示切片预览
  const [selectAll, setSelectAll] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // 触摸反馈
  const triggerHapticFeedback = useCallback(() => {
    if (enableTouchOptimization && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [enableTouchOptimization]);

  // 处理切片选择
  const handleSliceSelect = useCallback(
    (sliceIndex: number, event?: React.MouseEvent | React.TouchEvent) => {
      if (event) {
        event.stopPropagation();
      }

      const isSelected = selectedSlices.includes(sliceIndex);
      let newSelection: number[];

      if (isSelected) {
        newSelection = selectedSlices.filter(index => index !== sliceIndex);
      } else {
        newSelection = [...selectedSlices, sliceIndex];
      }

      triggerHapticFeedback();
      onSelectionChange(newSelection);
    },
    [selectedSlices, onSelectionChange, triggerHapticFeedback]
  );

  // 处理图片查看
  const handleImageView = useCallback((sliceIndex: number) => {
    setCurrentImageIndex(sliceIndex);
    setIsImageModalOpen(true);
  }, []);

  // 关闭图片模态框
  const handleCloseImageModal = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  // 图片导航
  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : slices.length - 1));
  }, [slices.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev < slices.length - 1 ? prev + 1 : 0));
  }, [slices.length]);

  // 滑动手势支持（移动端）
  const swipeHandlers = useSwipeGestures(
    {
      onSwipeLeft: handleNextImage,
      onSwipeRight: handlePrevImage,
    },
    {
      minDistance: 50,
      preventDefault: false,
    }
  );

  // 处理全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      onSelectionChange([]);
      setSelectAll(false);
    } else {
      if (slices && slices.length > 0) {
        onSelectionChange(slices.map((_slice, index) => index));
        setSelectAll(true);
      }
    }
    triggerHapticFeedback();
  }, [selectAll, slices, onSelectionChange, triggerHapticFeedback]);

  // 更新全选状态
  React.useEffect(() => {
    const slicesLength = slices?.length || 0;
    setSelectAll(selectedSlices.length === slicesLength && slicesLength > 0);
  }, [selectedSlices.length, slices?.length]);

  // 调试信息输出（仅开发环境）
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 ImagePreview渲染状态:', {
        hasOriginalImage: Boolean(originalImage),
        slicesCount: slices?.length || 0,
        slicesData: slices?.map(s => ({ hasUrl: Boolean(s.url), hasBlob: Boolean(s.blob) })) || [],
        selectedSlicesCount: selectedSlices?.length || 0,
      });
    }
  }, [originalImage, slices, selectedSlices]);

  // 只有在没有切片时才显示"暂无图片预览"
  if (!slices || slices.length === 0) {
    return (
      <div className={`image-preview ${className}`}>
        <div className="no-content text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🖼️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('preview.noPreview')}</h3>
          <p className="text-gray-600">{t('preview.uploadFirst')}</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded">
              调试: 原图={originalImage ? '有' : '无'}, 切片={slices?.length || 0}个
              <br />
              slices类型: {typeof slices}, 是否为数组: {Array.isArray(slices) ? '是' : '否'}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 计算网格列数
  const gridColumns = viewport.isMobile
    ? 'grid-cols-1'
    : viewport.isTablet
      ? 'grid-cols-2'
      : 'grid-cols-3';

  // 移动端样式
  const mobileOptimizedClass = viewport.isMobile ? 'mobile-image-preview' : '';

  return (
    <div ref={containerRef} className={`image-preview ${className} ${mobileOptimizedClass}`}>
      {/* 响应式控制栏 */}
      <div
        className={`preview-controls ${
          viewport.isMobile ? 'flex-col space-y-3 p-3' : 'flex justify-between items-center p-4'
        } bg-gray-50 rounded mb-4`}
      >
        <div className="preview-title">
          <h3 className="text-lg font-semibold text-gray-800">
            {t('preview.slicePreview', { count: slices.length })}
          </h3>
          <p className="text-sm text-gray-600">{t('preview.selectInstruction')}</p>
        </div>

        <div className={`selection-controls ${viewport.isMobile ? 'w-full' : ''}`}>
          <button
            onClick={handleSelectAll}
            className={`${
              viewport.isMobile
                ? 'w-full min-h-[44px] px-4 py-3 text-base font-medium'
                : 'px-4 py-2'
            } bg-green-500 text-white rounded hover:bg-green-600 active:bg-green-700 transition-colors touch-action-manipulation`}
            style={{
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {selectAll ? t('preview.deselectAll') : t('preview.selectAll')} ({selectedSlices.length}
            /{slices.length})
          </button>
        </div>
      </div>

      {/* 切片预览内容 */}
      <div className="slices-preview">
        <div className={`slices-grid grid ${gridColumns} ${viewport.isMobile ? 'gap-3' : 'gap-4'}`}>
          {slices.map((slice, index) => (
            <div
              key={slice.index}
              className={`
                slice-item border-2 rounded-lg transition-all cursor-pointer
                ${viewport.isMobile ? 'p-3 min-h-[120px]' : 'p-2'}
                ${
                  selectedSlices.includes(index)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 active:border-blue-300'
                }
              `}
              onClick={e => handleSliceSelect(index, e)}
              onDoubleClick={() => handleImageView(index)}
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              <div
                className={`slice-header flex justify-between items-center ${viewport.isMobile ? 'mb-3' : 'mb-2'}`}
              >
                <span
                  className={`slice-number font-medium ${
                    viewport.isMobile ? 'text-base' : 'text-sm'
                  }`}
                >
                  {t('preview.sliceNumber', { number: index + 1 })}
                </span>
                <div className="selection-indicator flex items-center space-x-2">
                  {selectedSlices.includes(index) ? (
                    <span className={`text-blue-500 ${viewport.isMobile ? 'text-xl' : 'text-lg'}`}>
                      ✓
                    </span>
                  ) : (
                    <span className={`text-gray-400 ${viewport.isMobile ? 'text-xl' : 'text-lg'}`}>
                      ○
                    </span>
                  )}
                  {viewport.isMobile && <span className="text-xs text-gray-500">👆</span>}
                </div>
              </div>

              <div
                className={`slice-image-container relative ${viewport.isMobile ? 'mb-3' : 'mb-2'}`}
              >
                <LazyImage
                  src={slice.url}
                  alt={t('preview.sliceNumber', { number: index + 1 })}
                  className={`w-full h-auto border rounded transition-transform ${
                    viewport.isMobile ? 'min-h-[80px] active:scale-[0.98]' : 'hover:scale-[1.02]'
                  }`}
                  priority={index < 3} // 前3张图片优先加载
                  quality={viewport.isMobile ? 65 : 80} // 移动端降低质量
                  threshold={0.1}
                  rootMargin="100px"
                  onError={() => {
                    console.error(`${t('preview.imageLoadError')}: ${slice.url}`);
                  }}
                  style={{
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                />

                {/* 移动端查看提示 */}
                {viewport.isMobile && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded">
                    <span className="bg-white text-gray-800 px-2 py-1 rounded text-xs font-medium">
                      双击查看
                    </span>
                  </div>
                )}
              </div>

              {showImageInfo && (
                <div
                  className={`slice-info text-gray-500 ${
                    viewport.isMobile ? 'text-sm flex justify-between items-center' : 'text-xs'
                  }`}
                >
                  <span>
                    {slice.width} × {slice.height}
                  </span>
                  {viewport.isMobile && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {Math.round(slice.blob.size / 1024)}KB
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedSlices.length > 0 && (
          <div
            className={`selection-summary ${
              viewport.isMobile ? 'mt-3 p-4' : 'mt-4 p-3'
            } bg-blue-50 border border-blue-200 rounded`}
          >
            <p
              className={`${viewport.isMobile ? 'text-base' : 'text-sm'} text-blue-700 font-medium`}
            >
              {t('preview.selectionSummary', { count: selectedSlices.length })}
            </p>
            {viewport.isMobile && selectedSlices.length > 1 && (
              <p className="text-sm text-blue-600 mt-1">
                💡 已选择 {selectedSlices.length} 个切片，可以导出了
              </p>
            )}
          </div>
        )}
      </div>

      {/* 移动端图片查看模态框 */}
      {isImageModalOpen && viewport.isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={handleCloseImageModal}
          {...swipeHandlers}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* 关闭按钮 */}
            <button
              className="absolute top-4 right-4 z-60 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm"
              onClick={handleCloseImageModal}
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ×
            </button>

            {/* 图片导航 */}
            {slices.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-60 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm"
                  onClick={e => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  style={{
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  ‹
                </button>

                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-60 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  style={{
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  ›
                </button>
              </>
            )}

            {/* 当前图片 */}
            <div className="w-full h-full flex items-center justify-center">
              <LazyImage
                src={slices[currentImageIndex]?.url || ''}
                alt={t('preview.sliceNumber', { number: currentImageIndex + 1 })}
                className="max-w-full max-h-full object-contain"
                priority={true} // 模态框中的图片优先加载
                quality={90} // 模态框中使用高质量
                threshold={0}
                style={{
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              />
            </div>

            {/* 图片信息 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-center">
                {currentImageIndex + 1} / {slices.length}
              </p>
              {showImageInfo && (
                <p className="text-xs text-center mt-1 text-gray-300">
                  {slices[currentImageIndex]?.width} × {slices[currentImageIndex]?.height}
                </p>
              )}
            </div>

            {/* 滑动提示 */}
            {slices.length > 1 && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-70">
                👈 滑动切换图片 👉
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
