import React, { useState, useEffect } from 'react';
import type { ImageSlice } from '../types';
import { useI18n } from '../hooks/useI18n';

interface ImagePreviewProps {
  imageSlices: ImageSlice[];
  selectedSlices: Set<number>;
  onToggleSelection: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function ImagePreview({
  imageSlices,
  selectedSlices,
  onToggleSelection,
  onSelectAll,
  onDeselectAll
}: ImagePreviewProps) {
  const { t } = useI18n();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // 调试：组件渲染时输出props
  console.log('[ImagePreview] 组件渲染，props:', {
    imageSlicesLength: imageSlices.length,
    imageSlices,
    selectedSlicesSize: selectedSlices.size
  });

  // 自动选择第一个图片切片进行预览
  useEffect(() => {
    if (imageSlices.length > 0 && !previewImage) {
      setPreviewImage(imageSlices[0].url);
      setPreviewIndex(imageSlices[0].index);
    }
  }, [imageSlices, previewImage]);

  const handleThumbnailClick = (slice: ImageSlice) => {
    setPreviewImage(slice.url);
    setPreviewIndex(slice.index);
  };

  const handleCheckboxChange = (index: number) => {
    onToggleSelection(index);
  };

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
    <div className="image-preview">
      {/* 预览头部 */}
      <div className="preview-header">
        <div className="preview-title">
          <h2>{t('preview.title') || '选择需要导出的片段'}</h2>
          <span className="selected-count">
            {t('preview.selectedCount') || `已选择 ${selectedSlices.size} 个片段`}
          </span>
        </div>
        
        <div className="selection-controls">
          <button 
            className="control-button select-all"
            onClick={onSelectAll}
            disabled={imageSlices.length === 0}
          >
            {t('preview.selectAll') || '全选'}
          </button>
          <button 
            className="control-button deselect-all"
            onClick={onDeselectAll}
            disabled={selectedSlices.size === 0}
          >
            {t('preview.deselectAll') || '取消选择'}
          </button>
        </div>
      </div>

      <div className="preview-content">
        {/* 左侧缩略图列表 */}
        <div className="thumbnail-sidebar">
          <div className="thumbnail-list">
            {imageSlices.map((slice) => (
              <div
                key={slice.index}
                className={`thumbnail-item ${
                  selectedSlices.has(slice.index) ? 'selected' : ''
                }`}
                data-index={slice.index}
              >
                <input
                  type="checkbox"
                  className="thumbnail-checkbox"
                  checked={selectedSlices.has(slice.index)}
                  onChange={() => handleCheckboxChange(slice.index)}
                />
                
                <img
                  src={slice.url}
                  alt={t('preview.sliceAlt') || `切片 ${slice.index + 1}`}
                  className="thumbnail-img"
                  onClick={() => handleThumbnailClick(slice)}
                  loading="lazy"
                />
                
                <div className="thumbnail-info">
                  <div className="thumbnail-label">
                    {t('preview.sliceLabel') || `切片 ${slice.index + 1}`}
                  </div>
                  <div className="thumbnail-hint">
                    {t('preview.dimensions') || `${slice.width} × ${slice.height}`}
                  </div>
                  <div className="thumbnail-hint">
                    {t('preview.size') || `${Math.round(slice.blob.size / 1024)} KB`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧大图预览 */}
        <div className="preview-main">
          {previewImage ? (
            <div className="preview-image-container">
              <img
                src={previewImage}
                alt={t('preview.largeImageAlt') || `切片 ${(previewIndex ?? 0) + 1} 预览`}
                className="preview-image"
              />
              <div className="preview-info">
                <h3>
                  {t('preview.currentSlice') || `切片 ${(previewIndex ?? 0) + 1}`}
                </h3>
                <p>{t('preview.clickToSelect') || '点击左侧缩略图选择其他片段'}</p>
              </div>
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="placeholder-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </div>
              <h3>{t('preview.noPreview') || '点击左侧缩略图查看大图'}</h3>
              <p>{t('preview.previewHint') || '选择需要导出的图片片段'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};