/**
 * 图片预览组件
 * 显示分割后的切片，支持选择切片
 * 已移除原图预览tab，简化为单一切片预览界面
 */

import React, { useState, useCallback } from 'react';
import { useI18nContext } from '../hooks/useI18nContext';

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
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalImage,
  slices,
  selectedSlices,
  onSelectionChange,
  className = '',
}) => {
  const { t } = useI18nContext();
  
  // 移除tab切换，直接显示切片预览
  const [selectAll, setSelectAll] = useState(false);

  // 处理切片选择
  const handleSliceSelect = useCallback(
    (sliceIndex: number) => {
      const isSelected = selectedSlices.includes(sliceIndex);
      let newSelection: number[];

      if (isSelected) {
        newSelection = selectedSlices.filter(index => index !== sliceIndex);
      } else {
        newSelection = [...selectedSlices, sliceIndex];
      }

      onSelectionChange(newSelection);
    },
    [selectedSlices, onSelectionChange]
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
  }, [selectAll, slices, onSelectionChange]);

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

  return (
    <div className={`image-preview ${className}`}>
      {/* 简化的控制栏 - 只保留全选功能 */}
      <div className="preview-controls flex justify-between items-center mb-4 p-4 bg-gray-50 rounded">
        <div className="preview-title">
          <h3 className="text-lg font-semibold text-gray-800">{t('preview.slicePreview', { count: slices.length })}</h3>
          <p className="text-sm text-gray-600">{t('preview.selectInstruction')}</p>
        </div>

        <div className="selection-controls">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            {selectAll ? t('preview.deselectAll') : t('preview.selectAll')} ({selectedSlices.length}/{slices.length})
          </button>
        </div>
      </div>

      {/* 切片预览内容 */}
      <div className="slices-preview">
        <div className="slices-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slices.map((slice, index) => (
            <div
              key={slice.index}
              className={`
                slice-item border-2 rounded-lg p-2 cursor-pointer transition-all
                ${
                  selectedSlices.includes(index)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => handleSliceSelect(index)}
            >
              <div className="slice-header flex justify-between items-center mb-2">
                <span className="slice-number text-sm font-medium">{t('preview.sliceNumber', { number: index + 1 })}</span>
                <div className="selection-indicator">
                  {selectedSlices.includes(index) ? (
                    <span className="text-blue-500">✓</span>
                  ) : (
                    <span className="text-gray-400">○</span>
                  )}
                </div>
              </div>

              <div className="slice-image-container">
                <img
                  src={slice.url}
                  alt={t('preview.sliceNumber', { number: index + 1 })}
                  className="w-full h-auto border rounded"
                  onError={e => {
                    console.error(`${t('preview.imageLoadError')}: ${slice.url}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="slice-info mt-2 text-xs text-gray-500">
                {slice.width} × {slice.height}
              </div>
            </div>
          ))}
        </div>

        {selectedSlices.length > 0 && (
          <div className="selection-summary mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              {t('preview.selectionSummary', { count: selectedSlices.length })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
