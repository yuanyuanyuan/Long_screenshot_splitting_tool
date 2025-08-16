/**
 * ImagePreview包装组件
 * 解决状态更新时序问题，确保切片数据正确传递
 */

import React, { useEffect, useState } from 'react';
import { ImagePreview } from './ImagePreview';

interface ImageSlice {
  blob: Blob;
  url: string;
  index: number;
  width: number;
  height: number;
}

interface ImagePreviewWrapperProps {
  originalImage: HTMLImageElement | null;
  slices: ImageSlice[];
  selectedSlices: number[];
  onSelectionChange: (selectedIndices: number[]) => void;
  className?: string;
}

export const ImagePreviewWrapper: React.FC<ImagePreviewWrapperProps> = ({
  originalImage,
  slices,
  selectedSlices,
  onSelectionChange,
  className = '',
}) => {
  const [renderKey, setRenderKey] = useState(0);
  const [lastSlicesLength, setLastSlicesLength] = useState(0);

  // 监听切片数据变化，强制重新渲染
  useEffect(() => {
    if (slices.length !== lastSlicesLength) {
      console.log('🔄 ImagePreviewWrapper: 切片数据变化，强制重新渲染', {
        oldLength: lastSlicesLength,
        newLength: slices.length,
        slicesData: slices.map(s => ({ hasUrl: Boolean(s.url), hasBlob: Boolean(s.blob) })),
      });

      setLastSlicesLength(slices.length);
      setRenderKey(prev => prev + 1);
    }
  }, [slices.length, lastSlicesLength]);

  // 额外的状态验证
  useEffect(() => {
    console.log('🎯 ImagePreviewWrapper: 状态验证', {
      hasOriginalImage: Boolean(originalImage),
      slicesCount: slices.length,
      selectedSlicesCount: selectedSlices.length,
      renderKey,
      slicesValid: slices.every(s => s.url && s.blob),
    });
  }, [originalImage, slices, selectedSlices, renderKey]);

  return (
    <ImagePreview
      key={renderKey}
      originalImage={originalImage}
      slices={slices}
      selectedSlices={selectedSlices}
      onSelectionChange={onSelectionChange}
      className={className}
    />
  );
};

export default ImagePreviewWrapper;
