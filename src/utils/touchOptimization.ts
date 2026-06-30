/**
 * 移动端触摸优化工具类
 * 处理触摸延迟、点击事件优化和性能提升
 */

// 触摸事件类型定义
export interface TouchOptimizationOptions {
  fastClick?: boolean;
  preventGhostClick?: boolean;
  touchFeedback?: boolean;
  scrollOptimization?: boolean;
}

// 触摸反馈类型
export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'impact';

/**
 * 触摸优化管理器
 */
export class TouchOptimizationManager {
  private static instance: TouchOptimizationManager | null = null;
  private isEnabled: boolean = false;
  private options: TouchOptimizationOptions;
  private fastClickElements: Set<Element> = new Set();
  private lastTouchTime: number = 0;
  private touchMoveThreshold: number = 10;

  private constructor(options: TouchOptimizationOptions = {}) {
    this.options = {
      fastClick: true,
      preventGhostClick: true,
      touchFeedback: true,
      scrollOptimization: true,
      ...options,
    };
  }

  /**
   * 获取单例实例
   */
  public static getInstance(options?: TouchOptimizationOptions): TouchOptimizationManager {
    if (!TouchOptimizationManager.instance) {
      TouchOptimizationManager.instance = new TouchOptimizationManager(options);
    }
    return TouchOptimizationManager.instance;
  }

  /**
   * 初始化触摸优化
   */
  public initialize(): void {
    if (this.isEnabled || !this.isMobileDevice()) {
      return;
    }

    this.isEnabled = true;

    // 添加全局CSS优化
    this.addGlobalTouchStyles();

    // 设置事件监听器
    if (this.options.fastClick) {
      this.setupFastClick();
    }

    if (this.options.preventGhostClick) {
      this.setupGhostClickPrevention();
    }

    if (this.options.scrollOptimization) {
      this.setupScrollOptimization();
    }

    console.log('✅ 触摸优化已初始化');
  }

  /**
   * 检测是否为移动设备
   */
  private isMobileDevice(): boolean {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }

  /**
   * 添加全局触摸优化样式
   */
  private addGlobalTouchStyles(): void {
    const styleId = 'touch-optimization-styles';

    // 避免重复添加
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 触摸优化全局样式 */
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      /* 可选择文本的元素 */
      input, textarea, [contenteditable], .selectable-text {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }

      /* 触摸元素优化 */
      button, [role="button"], .touchable {
        touch-action: manipulation;
        cursor: pointer;
        min-height: 44px;
        min-width: 44px;
        position: relative;
      }

      /* 滚动优化 */
      .scroll-optimized {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }

      /* 触摸反馈动画 */
      .touch-feedback {
        transition: transform 0.1s ease, opacity 0.1s ease;
      }

      .touch-feedback:active {
        transform: scale(0.98);
        opacity: 0.8;
      }

      /* 防止双击缩放 */
      @media (hover: none) {
        * {
          touch-action: manipulation;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 设置快速点击
   */
  private setupFastClick(): void {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
      },
      { passive: true }
    );

    document.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const touchEndTime = Date.now();

        // 检查是否为有效点击（时间短且移动距离小）
        const timeDiff = touchEndTime - touchStartTime;
        const distanceX = Math.abs(touchEndX - touchStartX);
        const distanceY = Math.abs(touchEndY - touchStartY);
        const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (timeDiff < 500 && totalDistance < this.touchMoveThreshold) {
          const target = e.target as Element;

          // 检查目标元素是否需要快速点击
          if (this.shouldUseFastClick(target)) {
            e.preventDefault();
            this.triggerFastClick(target, touch);
          }
        }
      },
      { passive: false }
    );
  }

  /**
   * 判断元素是否需要快速点击
   */
  private shouldUseFastClick(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const clickableElements = ['button', 'a', 'input', 'select', 'textarea'];

    return (
      clickableElements.includes(tagName) ||
      (element.hasAttribute('role') && element.getAttribute('role') === 'button') ||
      element.classList.contains('touchable') ||
      this.fastClickElements.has(element)
    );
  }

  /**
   * 触发快速点击
   */
  private triggerFastClick(element: Element, touch: Touch): void {
    // 创建合成点击事件
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
    });

    // 延迟触发以避免与原生点击冲突
    setTimeout(() => {
      element.dispatchEvent(clickEvent);
    }, 10);
  }

  /**
   * 设置幽灵点击防护
   */
  private setupGhostClickPrevention(): void {
    let lastTouchEndTime = 0;
    let lastTouchEndX = 0;
    let lastTouchEndY = 0;

    document.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        const touch = e.changedTouches[0];
        lastTouchEndTime = Date.now();
        lastTouchEndX = touch.clientX;
        lastTouchEndY = touch.clientY;
      },
      { passive: true }
    );

    document.addEventListener(
      'click',
      (e: MouseEvent) => {
        const timeDiff = Date.now() - lastTouchEndTime;
        const distanceX = Math.abs(e.clientX - lastTouchEndX);
        const distanceY = Math.abs(e.clientY - lastTouchEndY);
        const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // 如果点击事件紧跟触摸事件且位置相近，可能是幽灵点击
        if (timeDiff < 350 && totalDistance < 25) {
          e.preventDefault();
          e.stopPropagation();
          console.debug('🚫 防止幽灵点击');
        }
      },
      { passive: false }
    );
  }

  /**
   * 设置滚动优化
   */
  private setupScrollOptimization(): void {
    // 为滚动容器添加优化类
    const scrollableElements = document.querySelectorAll(
      '[data-scrollable], .scrollable, .scroll-container'
    );

    scrollableElements.forEach(element => {
      element.classList.add('scroll-optimized');
    });

    // 动态监听新增的滚动容器
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.matches('[data-scrollable], .scrollable, .scroll-container')) {
                element.classList.add('scroll-optimized');
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 触发触觉反馈
   */
  public triggerHapticFeedback(type: HapticFeedbackType = 'light'): void {
    if (!this.options.touchFeedback || !('vibrate' in navigator)) {
      return;
    }

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      selection: [10, 50, 10],
      impact: [15, 25, 15],
    };

    const pattern = patterns[type] || patterns.light;
    navigator.vibrate(pattern);
  }

  /**
   * 为元素添加触摸反馈
   */
  public addTouchFeedback(element: Element): void {
    element.classList.add('touch-feedback');

    const handleTouchStart = () => {
      this.triggerHapticFeedback('light');
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
  }

  /**
   * 注册快速点击元素
   */
  public registerFastClickElement(element: Element): void {
    this.fastClickElements.add(element);
    this.addTouchFeedback(element);
  }

  /**
   * 移除快速点击元素
   */
  public unregisterFastClickElement(element: Element): void {
    this.fastClickElements.delete(element);
  }

  /**
   * 销毁优化器
   */
  public destroy(): void {
    this.isEnabled = false;
    this.fastClickElements.clear();

    // 移除样式
    const styleElement = document.getElementById('touch-optimization-styles');
    if (styleElement) {
      styleElement.remove();
    }

    TouchOptimizationManager.instance = null;
    console.log('🗑️ 触摸优化器已销毁');
  }
}

/**
 * 便捷函数：初始化触摸优化
 */
export function initializeTouchOptimization(
  options?: TouchOptimizationOptions
): TouchOptimizationManager {
  const manager = TouchOptimizationManager.getInstance(options);
  manager.initialize();
  return manager;
}

/**
 * 便捷函数：触发触觉反馈
 */
export function hapticFeedback(type: HapticFeedbackType = 'light'): void {
  const manager = TouchOptimizationManager.getInstance();
  manager.triggerHapticFeedback(type);
}

/**
 * React Hook: 使用触摸优化
 */
import React from 'react';

export function useTouchOptimization(options?: TouchOptimizationOptions) {
  const manager = TouchOptimizationManager.getInstance(options);

  // Initialize manager
  manager.initialize();

  return {
    hapticFeedback: (type?: HapticFeedbackType) => manager.triggerHapticFeedback(type),
    addTouchFeedback: (element: Element) => manager.addTouchFeedback(element),
    registerFastClick: (element: Element) => manager.registerFastClickElement(element),
    unregisterFastClick: (element: Element) => manager.unregisterFastClickElement(element),
  };
}

/**
 * 触摸延迟优化装饰器（用于类组件）
 */
export function withTouchOptimization<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return class TouchOptimizedComponent extends React.Component<P> {
    private manager: TouchOptimizationManager;

    constructor(props: P) {
      super(props);
      this.manager = TouchOptimizationManager.getInstance();
    }

    componentDidMount() {
      this.manager.initialize();
    }

    render() {
      return React.createElement(WrappedComponent, this.props);
    }
  };
}

// 导入React类型（如果需要）
// TypeScript全局类型扩展
declare global {
  interface HTMLElement {
    readonly 'data-scrollable'?: boolean;
  }
}
