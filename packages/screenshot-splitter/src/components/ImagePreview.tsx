/**
 * 图片预览组件
 * 显示原图和分割后的切片，支持选择切片
 */

import React, { useState, useCallback } from 'react';

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
  className = ''
}) => {
  // 如果有切片但没有原图，默认显示切片视图；否则显示原图视图
  const [viewMode, setViewMode] = useState<'original' | 'slices'>(() => {
    if (slices && slices.length > 0 && !originalImage) {
      return 'slices';
    }
    return originalImage ? 'original' : 'slices';
  });
  const [selectAll, setSelectAll] = useState(false);

  // 处理切片选择
  const handleSliceSelect = useCallback((sliceIndex: number) => {
    const isSelected = selectedSlices.includes(sliceIndex);
    let newSelection: number[];

    if (isSelected) {
      newSelection = selectedSlices.filter(index => index !== sliceIndex);
    } else {
      newSelection = [...selectedSlices, sliceIndex];
    }

    onSelectionChange(newSelection);
  }, [selectedSlices, onSelectionChange]);

  // 处理全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      onSelectionChange([]);
      setSelectAll(false);
    } else {
      if (slices && slices.length > 0) {
        onSelectionChange(slices.map((_, index) => index));
        setSelectAll(true);
      }
    }
  }, [selectAll, slices, onSelectionChange]);

  // 更新全选状态
  React.useEffect(() => {
    const slicesLength = slices?.length || 0;
    setSelectAll(selectedSlices.length === slicesLength && slicesLength > 0);
  }, [selectedSlices.length, slices?.length]);


  // 调试信息输出
  React.useEffect(() => {
    console.log('🎯 ImagePreview渲染状态:', {
      hasOriginalImage: !!originalImage,
      slicesCount: slices?.length || 0,
      slicesData: slices?.map(s => ({ hasUrl: !!s.url, hasBlob: !!s.blob })) || [],
      selectedSlicesCount: selectedSlices?.length || 0
    });
  }, [originalImage, slices, selectedSlices]);

  // 只有在既没有原图也没有切片时才显示"暂无图片预览"
  if ((!originalImage) && (!slices || slices.length === 0)) {
    console.log('🚫 显示暂无图片预览 - 原图:', !!originalImage, '切片数量:', slices?.length || 0);
    console.log('🚫 详细调试 - slices对象:', slices);
    console.log('🚫 详细调试 - originalImage对象:', originalImage);
    return (
      <div className={`image-preview ${className}`}>
        <div className="no-content text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🖼️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无图片预览</h3>
          <p className="text-gray-600">请先上传一张图片进行处理</p>
          <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded">
            调试: 原图={!!originalImage ? '有' : '无'}, 切片={slices?.length || 0}个
            <br />
            slices类型: {typeof slices}, 是否为数组: {Array.isArray(slices) ? '是' : '否'}
          </div>
        </div>
      </div>
    );
  }

  // 如果有切片但没有原图，默认显示切片视图
  const shouldShowSlicesFirst = slices && slices.length > 0 && !originalImage;

  return (
    <div className={`image-preview ${className}`}>
      {/* 控制栏 */}
      <div className="preview-controls flex justify-between items-center mb-4 p-4 bg-gray-50 rounded">
        <div className="view-mode-toggle">
          <button
            onClick={() => setViewMode('original')}
            className={`px-4 py-2 rounded-l ${
              viewMode === 'original' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 border'
            }`}
            disabled={!originalImage}
          >
            原图预览
          </button>
          <button
            onClick={() => setViewMode('slices')}
            className={`px-4 py-2 rounded-r ${
              viewMode === 'slices' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 border'
            }`}
            disabled={!slices || slices.length === 0}
          >
            切片预览 ({slices?.length || 0})
          </button>
        </div>

        {viewMode === 'slices' && slices && slices.length > 0 && (
          <div className="selection-controls">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              {selectAll ? '取消全选' : '全选'} ({selectedSlices.length}/{slices.length})
            </button>
          </div>
        )}
      </div>

      {/* 预览内容 */}
      <div className="preview-content">
        {viewMode === 'original' && originalImage && (
          <div className="original-preview">
            <div className="image-container max-w-full overflow-auto">
              <img
                src={originalImage.src}
                alt="原始图片"
                className="max-w-full h-auto border rounded shadow"
              />
            </div>
            <div className="image-info mt-2 text-sm text-gray-600">
              尺寸: {originalImage.naturalWidth} × {originalImage.naturalHeight}
            </div>
          </div>
        )}

        {viewMode === 'slices' && slices && slices.length > 0 && (
          <div className="slices-preview">
            <div className="slices-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slices.map((slice, index) => (
                <div
                  key={slice.index}
                  className={`
                    slice-item border-2 rounded-lg p-2 cursor-pointer transition-all
                    ${selectedSlices.includes(index) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => handleSliceSelect(index)}
                >
                  <div className="slice-header flex justify-between items-center mb-2">
                    <span className="slice-number text-sm font-medium">
                      切片 {index + 1}
                    </span>
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
                      alt={`切片 ${index + 1}`}
                      className="w-full h-auto border rounded"
                      onError={(e) => {
                        console.error('图片加载失败:', slice.url);
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
                  已选择 {selectedSlices.length} 个切片，可以进行导出操作
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 空状态 */}
      {viewMode === 'slices' && (!slices || slices.length === 0) && (
        <div className="empty-slices text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">✂️</div>
          <p>暂无切片，请先上传图片并进行分割</p>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;