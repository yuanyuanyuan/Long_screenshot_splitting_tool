import { useCallback, useRef, useState } from 'react';

/**
 * 手势方向类型
 */
type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * 手势事件接口
 */
interface SwipeEvent {
  direction: SwipeDirection;
  distance: number;
  velocity: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * 手势识别配置
 */
interface SwipeConfig {
  minDistance?: number;      // 最小滑动距离
  maxDuration?: number;      // 最大持续时间
  minVelocity?: number;      // 最小速度
  directionalThreshold?: number; // 方向阈值
  preventDefault?: boolean;   // 是否阻止默认行为
  passive?: boolean;         // 是否被动监听
}

/**
 * 手势回调函数
 */
interface SwipeHandlers {
  onSwipeLeft?: (event: SwipeEvent) => void;
  onSwipeRight?: (event: SwipeEvent) => void;
  onSwipeUp?: (event: SwipeEvent) => void;
  onSwipeDown?: (event: SwipeEvent) => void;
  onSwipeStart?: (startX: number, startY: number) => void;
  onSwipeMove?: (currentX: number, currentY: number, deltaX: number, deltaY: number) => void;
  onSwipeEnd?: (event: SwipeEvent | null) => void;
}

/**
 * 触摸状态
 */
interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  isActive: boolean;
}

/**
 * 手势识别 Hook
 * 提供完整的触摸手势识别和处理功能
 */
export const useSwipeGestures = (
  handlers: SwipeHandlers = {},
  config: SwipeConfig = {}
) => {
  const {
    minDistance = 50,
    maxDuration = 1000,
    minVelocity = 0.1,
    directionalThreshold = 0.3,
    preventDefault = true,
    passive = false
  } = config;
  
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    isActive: false
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState({ x: 0, y: 0 });
  
  // 触摸开始处理
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault && !passive) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    const now = Date.now();
    
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isActive: true
    };
    
    setIsDragging(true);
    setDragDistance({ x: 0, y: 0 });
    
    handlers.onSwipeStart?.(touch.clientX, touch.clientY);
  }, [handlers, preventDefault, passive]);
  
  // 触摸移动处理
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchState.current.isActive) return;
    
    if (preventDefault && !passive) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    touchState.current.currentX = touch.clientX;
    touchState.current.currentY = touch.clientY;
    
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    
    setDragDistance({ x: deltaX, y: deltaY });
    
    handlers.onSwipeMove?.(
      touch.clientX,
      touch.clientY,
      deltaX,
      deltaY
    );
  }, [handlers, preventDefault, passive]);
  
  // 触摸结束处理
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchState.current.isActive) return;
    
    if (preventDefault && !passive) {
      e.preventDefault();
    }
    
    const endTime = Date.now();
    const duration = endTime - touchState.current.startTime;
    const deltaX = touchState.current.currentX - touchState.current.startX;
    const deltaY = touchState.current.currentY - touchState.current.startY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;
    
    touchState.current.isActive = false;
    setIsDragging(false);
    setDragDistance({ x: 0, y: 0 });
    
    // 检查是否符合滑动条件
    if (distance >= minDistance && 
        duration <= maxDuration && 
        velocity >= minVelocity) {
      
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // 确定主要方向
      let direction: SwipeDirection;
      if (absX > absY) {
        // 水平滑动
        if (absY / absX > directionalThreshold) {
          // 对角线滑动，不触发事件
          handlers.onSwipeEnd?.(null);
          return;
        }
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        // 垂直滑动
        if (absX / absY > directionalThreshold) {
          // 对角线滑动，不触发事件
          handlers.onSwipeEnd?.(null);
          return;
        }
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      const swipeEvent: SwipeEvent = {
        direction,
        distance,
        velocity,
        duration,
        startX: touchState.current.startX,
        startY: touchState.current.startY,
        endX: touchState.current.currentX,
        endY: touchState.current.currentY
      };
      
      // 触发相应的处理函数
      switch (direction) {
        case 'left':
          handlers.onSwipeLeft?.(swipeEvent);
          break;
        case 'right':
          handlers.onSwipeRight?.(swipeEvent);
          break;
        case 'up':
          handlers.onSwipeUp?.(swipeEvent);
          break;
        case 'down':
          handlers.onSwipeDown?.(swipeEvent);
          break;
      }
      
      handlers.onSwipeEnd?.(swipeEvent);
    } else {
      handlers.onSwipeEnd?.(null);
    }
  }, [handlers, minDistance, maxDuration, minVelocity, directionalThreshold, preventDefault, passive]);
  
  // React 事件处理器（用于 JSX）
  const reactHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      const nativeEvent = e.nativeEvent;
      handleTouchStart(nativeEvent);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const nativeEvent = e.nativeEvent;
      handleTouchMove(nativeEvent);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const nativeEvent = e.nativeEvent;
      handleTouchEnd(nativeEvent);
    }
  };
  
  // 绑定到元素的函数
  const bindToElement = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};
    
    const options = { passive };
    
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchEnd, options);
    
    // 清理函数
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, passive]);
  
  return {
    // React 事件处理器
    ...reactHandlers,
    
    // 绑定函数
    bindToElement,
    
    // 状态
    isDragging,
    dragDistance,
    
    // 工具函数
    isActive: touchState.current.isActive,
    getCurrentDelta: () => ({
      x: touchState.current.currentX - touchState.current.startX,
      y: touchState.current.currentY - touchState.current.startY
    })
  };
};

/**
 * 简化的滑动手势 Hook（仅支持四个基本方向）
 */
export const useSimpleSwipe = (
  onSwipe: (direction: SwipeDirection) => void,
  minDistance: number = 50
) => {
  return useSwipeGestures({
    onSwipeLeft: () => onSwipe('left'),
    onSwipeRight: () => onSwipe('right'),
    onSwipeUp: () => onSwipe('up'),
    onSwipeDown: () => onSwipe('down')
  }, {
    minDistance,
    preventDefault: true
  });
};

/**
 * 拖拽手势 Hook（用于拖拽操作）
 */
export const useDragGestures = (
  onDragStart?: (x: number, y: number) => void,
  onDragMove?: (x: number, y: number, deltaX: number, deltaY: number) => void,
  onDragEnd?: (deltaX: number, deltaY: number) => void
) => {
  return useSwipeGestures({
    onSwipeStart: onDragStart,
    onSwipeMove: onDragMove,
    onSwipeEnd: (event) => {
      if (event) {
        const deltaX = event.endX - event.startX;
        const deltaY = event.endY - event.startY;
        onDragEnd?.(deltaX, deltaY);
      }
    }
  }, {
    minDistance: 0, // 拖拽不需要最小距离
    preventDefault: false,
    passive: true
  });
};