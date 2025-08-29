import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useViewport } from '../../hooks/useViewport';
import styles from './TouchImageSlicer.module.css';

/**
 * 触摸手势类型
 */
interface TouchGesture {
  type: 'tap' | 'drag' | 'pinch' | 'swipe';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  scale?: number;
  velocity?: number;
}

/**
 * 图片切片区域
 */
interface SliceArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  selected: boolean;
}

/**
 * 触摸图片切片组件属性
 */
interface TouchImageSlicerProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  minSliceHeight?: number;
  maxSliceHeight?: number;
  snapToContent?: boolean;
  autoDetectSlices?: boolean;
  onSlicesChange?: (slices: SliceArea[]) => void;
  onSliceSelect?: (slice: SliceArea) => void;
  className?: string;
}

/**
 * 触摸优化的图片切片选择组件
 * 支持手势操作和精确的触摸选择
 */
export const TouchImageSlicer: React.FC<TouchImageSlicerProps> = ({
  imageUrl,
  imageWidth,
  imageHeight,
  minSliceHeight = 50,
  maxSliceHeight = 2000,
  snapToContent = true,
  autoDetectSlices = false,
  onSlicesChange,
  onSliceSelect,
  className = ''
}) => {
  const viewport = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 状态管理
  const [slices, setSlices] = useState<SliceArea[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentGesture, setCurrentGesture] = useState<TouchGesture | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [activeSliceId, setActiveSliceId] = useState<string | null>(null);
  const [feedbackPosition, setFeedbackPosition] = useState<{ x: number; y: number } | null>(null);
  
  // 触摸反馈
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: [20, 10, 20]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);
  
  // 显示视觉反馈
  const showTouchFeedback = useCallback((x: number, y: number) => {
    setFeedbackPosition({ x, y });
    setTimeout(() => setFeedbackPosition(null), 200);
  }, []);
  
  // 计算图片在容器中的实际尺寸和位置
  const imageMetrics = useMemo(() => {
    if (!containerRef.current || !imageWidth || !imageHeight) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0, scale: 1 };
    }
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = imageWidth / imageHeight;
    
    let displayWidth, displayHeight, offsetX, offsetY;
    
    if (imageRatio > containerRatio) {
      // 图片更宽，以宽度为准
      displayWidth = containerRect.width * imageScale;
      displayHeight = (displayWidth / imageRatio);
      offsetX = imageOffset.x;
      offsetY = imageOffset.y + (containerRect.height - displayHeight) / 2;
    } else {
      // 图片更高，以高度为准
      displayHeight = containerRect.height * imageScale;
      displayWidth = displayHeight * imageRatio;
      offsetX = imageOffset.x + (containerRect.width - displayWidth) / 2;
      offsetY = imageOffset.y;
    }
    
    return {
      width: displayWidth,
      height: displayHeight,
      offsetX,
      offsetY,
      scale: displayWidth / imageWidth
    };
  }, [imageWidth, imageHeight, imageScale, imageOffset]);
  
  // 坐标转换：屏幕坐标转图片坐标
  const screenToImage = useCallback((screenX: number, screenY: number) => {
    const imageX = (screenX - imageMetrics.offsetX) / imageMetrics.scale;
    const imageY = (screenY - imageMetrics.offsetY) / imageMetrics.scale;
    return { x: imageX, y: imageY };
  }, [imageMetrics]);
  
  // 坐标转换：图片坐标转屏幕坐标
  const imageToScreen = useCallback((imageX: number, imageY: number) => {
    const screenX = imageX * imageMetrics.scale + imageMetrics.offsetX;
    const screenY = imageY * imageMetrics.scale + imageMetrics.offsetY;
    return { x: screenX, y: screenY };
  }, [imageMetrics]);
  
  // 处理触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setDragStart({ x, y });
    setIsDragging(true);
    
    // 检查是否点击了现有切片
    const imageCoord = screenToImage(x, y);
    const clickedSlice = slices.find(slice => 
      imageCoord.x >= slice.x && 
      imageCoord.x <= slice.x + slice.width &&
      imageCoord.y >= slice.y && 
      imageCoord.y <= slice.y + slice.height
    );
    
    if (clickedSlice) {
      setActiveSliceId(clickedSlice.id);
      triggerHapticFeedback('medium');
      onSliceSelect?.(clickedSlice);
    } else {
      setActiveSliceId(null);
    }
    
    showTouchFeedback(x, y);
  }, [slices, screenToImage, triggerHapticFeedback, showTouchFeedback, onSliceSelect]);
  
  // 处理触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging || !dragStart) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // 如果是选择区域操作
    if (!activeSliceId) {
      const startImage = screenToImage(dragStart.x, dragStart.y);
      const endImage = screenToImage(x, y);
      
      const newSlice: SliceArea = {
        id: `slice-${Date.now()}`,
        x: Math.min(startImage.x, endImage.x),
        y: Math.min(startImage.y, endImage.y),
        width: Math.abs(endImage.x - startImage.x),
        height: Math.abs(endImage.y - startImage.y),
        active: true,
        selected: false
      };
      
      // 限制最小和最大高度
      if (newSlice.height >= minSliceHeight && newSlice.height <= maxSliceHeight) {
        setSlices(prevSlices => {
          const filtered = prevSlices.filter(s => !s.active);
          return [...filtered, newSlice];
        });
      }
    }
  }, [isDragging, dragStart, activeSliceId, screenToImage, minSliceHeight, maxSliceHeight]);
  
  // 处理触摸结束
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setDragStart(null);
    
    // 确认活动切片
    setSlices(prevSlices => 
      prevSlices.map(slice => ({ ...slice, active: false, selected: slice.id === activeSliceId }))
    );
    
    triggerHapticFeedback('light');
  }, [activeSliceId, triggerHapticFeedback]);
  
  // 处理双击缩放
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const newScale = imageScale === 1 ? 2 : 1;
    setImageScale(newScale);
    
    if (newScale > 1) {
      // 缩放到点击位置
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setImageOffset({
          x: -(x * (newScale - 1)),
          y: -(y * (newScale - 1))
        });
      }
    } else {
      setImageOffset({ x: 0, y: 0 });
    }
    
    triggerHapticFeedback('medium');
  }, [imageScale, triggerHapticFeedback]);
  
  // 删除切片
  const deleteSlice = useCallback((sliceId: string) => {
    setSlices(prevSlices => prevSlices.filter(s => s.id !== sliceId));
    setActiveSliceId(null);
    triggerHapticFeedback('heavy');
  }, [triggerHapticFeedback]);
  
  // 清空所有切片
  const clearAllSlices = useCallback(() => {
    setSlices([]);
    setActiveSliceId(null);
    triggerHapticFeedback('heavy');
  }, [triggerHapticFeedback]);
  
  // 监听切片变化
  useEffect(() => {
    onSlicesChange?.(slices);
  }, [slices, onSlicesChange]);
  
  // 渲染切片覆盖层
  const renderSliceOverlays = () => {
    return slices.map(slice => {
      const screenPos = imageToScreen(slice.x, slice.y);
      const screenSize = {
        width: slice.width * imageMetrics.scale,
        height: slice.height * imageMetrics.scale
      };
      
      return (
        <div
          key={slice.id}
          className={`${styles.sliceOverlay} ${slice.selected ? styles.selected : ''} ${slice.active ? styles.active : ''}`}
          style={{
            left: screenPos.x,
            top: screenPos.y,
            width: screenSize.width,
            height: screenSize.height,
          }}
        >
          {/* 切片控制按钮 */}
          {slice.selected && (
            <div className={styles.sliceControls}>
              <button
                className={styles.deleteButton}
                onClick={() => deleteSlice(slice.id)}
                aria-label="删除切片"
              >
                ×
              </button>
            </div>
          )}
          
          {/* 切片信息显示 */}
          <div className={styles.sliceInfo}>
            {Math.round(slice.height)}px
          </div>
        </div>
      );
    });
  };
  
  return (
    <div 
      className={`${styles.touchImageSlicer} ${className}`}
      ref={containerRef}
    >
      {/* 图片容器 */}
      <div 
        className={styles.imageContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        style={{
          transform: `scale(${imageScale}) translate(${imageOffset.x}px, ${imageOffset.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="待切片图片"
          className={styles.slicerImage}
          draggable={false}
        />
        
        {/* 切片覆盖层 */}
        {renderSliceOverlays()}
      </div>
      
      {/* 触摸反馈指示器 */}
      {feedbackPosition && (
        <div
          className={styles.touchFeedback}
          style={{
            left: feedbackPosition.x,
            top: feedbackPosition.y,
          }}
        />
      )}
      
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <button
          className={styles.toolButton}
          onClick={() => setImageScale(imageScale === 1 ? 2 : 1)}
          aria-label={imageScale === 1 ? "放大" : "缩小"}
        >
          {imageScale === 1 ? "🔍" : "🔍-"}
        </button>
        
        <button
          className={styles.toolButton}
          onClick={clearAllSlices}
          disabled={slices.length === 0}
          aria-label="清空切片"
        >
          🗑️
        </button>
        
        <div className={styles.sliceCounter}>
          {slices.length} 个切片
        </div>
      </div>
      
      {/* 使用提示 */}
      {slices.length === 0 && (
        <div className={styles.helpText}>
          <p>📱 触摸并拖拽选择切片区域</p>
          <p>👆 双击缩放图片</p>
          <p>✨ 点击切片进行编辑</p>
        </div>
      )}
    </div>
  );
};

export default TouchImageSlicer;