/**
 * 文字显示优化工具函数
 * 提供响应式文字显示、性能优化和用户体验增强功能
 */

import type { TextDisplayOptions } from '../components/TextDisplayConfig';
import { formatImageSliceInfo } from './textFormatter';
import type { ImageSlice } from '../types';

/**
 * 设备类型
 */
export const DeviceType = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
} as const;

export type DeviceType = typeof DeviceType[keyof typeof DeviceType];

/**
 * 显示模式
 */
export const DisplayMode = {
  MINIMAL: 'minimal',
  COMPACT: 'compact',
  STANDARD: 'standard',
  DETAILED: 'detailed'
} as const;

export type DisplayMode = typeof DisplayMode[keyof typeof DisplayMode];

/**
 * 响应式文字显示配置
 */
export interface ResponsiveTextConfig {
  /** 设备类型 */
  deviceType: DeviceType;
  /** 显示模式 */
  displayMode: DisplayMode;
  /** 可用宽度（像素） */
  availableWidth: number;
  /** 可用高度（像素） */
  availableHeight: number;
  /** 是否为触摸设备 */
  isTouchDevice: boolean;
}

/**
 * 优化后的文字显示结果
 */
export interface OptimizedTextDisplay {
  /** 是否显示切片标题 */
  showTitle: boolean;
  /** 是否显示尺寸信息 */
  showDimensions: boolean;
  /** 是否显示文件大小 */
  showFileSize: boolean;
  /** 是否显示完整文本 */
  showFullText: boolean;
  /** 标题文本（可能被截断或简化） */
  titleText: string;
  /** 尺寸文本（可能被简化） */
  dimensionsText: string;
  /** 文件大小文本（可能被简化） */
  fileSizeText: string;
  /** 完整文本（可能被优化） */
  fullText: string;
  /** 推荐的CSS类名 */
  cssClasses: string[];
  /** 性能提示 */
  performanceHints: string[];
}

/**
 * 文字长度限制配置
 */
interface TextLengthLimits {
  title: number;
  dimensions: number;
  fileSize: number;
  fullText: number;
}

/**
 * 根据设备类型获取文字长度限制
 */
function getTextLengthLimits(deviceType: DeviceType, displayMode: DisplayMode): TextLengthLimits {
  const baseLimits: Record<DeviceType, TextLengthLimits> = {
    [DeviceType.MOBILE]: {
      title: 8,
      dimensions: 12,
      fileSize: 8,
      fullText: 25
    },
    [DeviceType.TABLET]: {
      title: 12,
      dimensions: 16,
      fileSize: 10,
      fullText: 35
    },
    [DeviceType.DESKTOP]: {
      title: 20,
      dimensions: 25,
      fileSize: 15,
      fullText: 50
    }
  };

  const limits = baseLimits[deviceType];

  // 根据显示模式调整限制
  const modeMultiplier = {
    [DisplayMode.MINIMAL]: 0.6,
    [DisplayMode.COMPACT]: 0.8,
    [DisplayMode.STANDARD]: 1.0,
    [DisplayMode.DETAILED]: 1.5
  }[displayMode];

  return {
    title: Math.floor(limits.title * modeMultiplier),
    dimensions: Math.floor(limits.dimensions * modeMultiplier),
    fileSize: Math.floor(limits.fileSize * modeMultiplier),
    fullText: Math.floor(limits.fullText * modeMultiplier)
  };
}

/**
 * 截断文本并添加省略号
 */
function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncateLength = Math.max(1, maxLength - suffix.length);
  return text.substring(0, truncateLength) + suffix;
}

/**
 * 简化尺寸文本显示
 */
function simplifyDimensions(dimensions: string, deviceType: DeviceType): string {
  if (deviceType === DeviceType.MOBILE) {
    // 移动端使用更简洁的格式
    return dimensions.replace(' × ', '×');
  }
  return dimensions;
}

/**
 * 简化文件大小文本显示
 */
function simplifyFileSize(fileSize: string, deviceType: DeviceType): string {
  if (deviceType === DeviceType.MOBILE) {
    // 移动端移除空格
    return fileSize.replace(' ', '');
  }
  return fileSize;
}

/**
 * 根据响应式配置优化文字显示
 */
export function optimizeTextDisplay(
  slice: ImageSlice,
  config: ResponsiveTextConfig,
  options: TextDisplayOptions
): OptimizedTextDisplay {
  const formattedInfo = formatImageSliceInfo(slice);
  const limits = getTextLengthLimits(config.deviceType, config.displayMode);
  const performanceHints: string[] = [];
  const cssClasses: string[] = [];

  // 基础显示控制
  const showTitle = options.showSliceTitle;
  const showDimensions = options.showDimensions;
  const showFileSize = options.showFileSize;
  const showFullText = options.showFullText;

  // 根据设备类型和显示模式优化文本
  let titleText = formattedInfo.title;
  let dimensionsText = formattedInfo.dimensions;
  let fileSizeText = formattedInfo.fileSize;
  let fullText = formattedInfo.fullText;

  // 标题优化
  if (showTitle) {
    titleText = truncateText(titleText, limits.title);
    if (config.deviceType === DeviceType.MOBILE && config.displayMode === DisplayMode.MINIMAL) {
      // 移动端最小模式只显示数字
      titleText = titleText.replace('切片 ', '');
    }
  }

  // 尺寸信息优化
  if (showDimensions) {
    dimensionsText = simplifyDimensions(dimensionsText, config.deviceType);
    dimensionsText = truncateText(dimensionsText, limits.dimensions);
  }

  // 文件大小优化
  if (showFileSize) {
    fileSizeText = simplifyFileSize(fileSizeText, config.deviceType);
    fileSizeText = truncateText(fileSizeText, limits.fileSize);
  }

  // 完整文本优化
  if (showFullText) {
    fullText = truncateText(fullText, limits.fullText);
    
    // 移动端进一步简化
    if (config.deviceType === DeviceType.MOBILE) {
      fullText = fullText
        .replace('切片 ', '')
        .replace(' × ', '×')
        .replace(' | ', '|')
        .replace(' KB', 'KB');
    }
  }

  // 添加响应式CSS类名
  cssClasses.push(`text-display-${config.deviceType}`);
  cssClasses.push(`text-display-${config.displayMode}`);
  
  if (config.isTouchDevice) {
    cssClasses.push('text-display-touch');
  }

  // 性能优化提示
  if (config.deviceType === DeviceType.MOBILE) {
    performanceHints.push('移动端优化：使用简化文本格式');
    if (config.displayMode === DisplayMode.MINIMAL) {
      performanceHints.push('最小模式：减少文本渲染开销');
    }
  }

  if (config.availableWidth < 400) {
    performanceHints.push('窄屏优化：启用文本截断');
  }

  return {
    showTitle,
    showDimensions,
    showFileSize,
    showFullText,
    titleText,
    dimensionsText,
    fileSizeText,
    fullText,
    cssClasses,
    performanceHints
  };
}

/**
 * 批量优化多个切片的文字显示
 */
export function optimizeMultipleTextDisplay(
  slices: ImageSlice[],
  config: ResponsiveTextConfig,
  options: TextDisplayOptions
): OptimizedTextDisplay[] {
  return slices.map(slice => optimizeTextDisplay(slice, config, options));
}

/**
 * 检测设备类型
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return DeviceType.DESKTOP;
  }

  const width = window.innerWidth;
  const userAgent = navigator.userAgent?.toLowerCase() || '';
  
  // 检查是否为移动设备
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  if (isMobile || width < 768) {
    return DeviceType.MOBILE;
  } else if (width < 1024) {
    return DeviceType.TABLET;
  } else {
    return DeviceType.DESKTOP;
  }
}

/**
 * 检测是否为触摸设备
 */
export function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 根据可用空间推荐显示模式
 */
export function recommendDisplayMode(
  availableWidth: number,
  availableHeight: number,
  deviceType: DeviceType
): DisplayMode {
  // 基于设备类型的基础推荐
  const baseRecommendation: Record<DeviceType, DisplayMode> = {
    [DeviceType.MOBILE]: DisplayMode.COMPACT,
    [DeviceType.TABLET]: DisplayMode.STANDARD,
    [DeviceType.DESKTOP]: DisplayMode.DETAILED
  };

  let recommended = baseRecommendation[deviceType];

  // 根据可用空间调整
  if (availableWidth < 300) {
    recommended = DisplayMode.MINIMAL;
  } else if (availableWidth < 500) {
    recommended = DisplayMode.COMPACT;
  } else if (availableWidth > 1200) {
    recommended = DisplayMode.DETAILED;
  }

  // 考虑高度限制
  if (availableHeight < 400) {
    if (recommended === DisplayMode.DETAILED) {
      recommended = DisplayMode.STANDARD;
    } else if (recommended === DisplayMode.STANDARD) {
      recommended = DisplayMode.COMPACT;
    }
  }

  return recommended;
}

/**
 * 创建响应式文字显示配置
 */
export function createResponsiveTextConfig(
  customConfig?: Partial<ResponsiveTextConfig>
): ResponsiveTextConfig {
  const deviceType = detectDeviceType();
  const isTouchDevice = detectTouchDevice();
  const availableWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const availableHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const displayMode = recommendDisplayMode(availableWidth, availableHeight, deviceType);

  return {
    deviceType,
    displayMode,
    availableWidth,
    availableHeight,
    isTouchDevice,
    ...customConfig
  };
}

/**
 * 文字显示性能监控
 */
export class TextDisplayPerformanceMonitor {
  private renderTimes: number[] = [];
  private maxSamples = 100;

  /**
   * 记录渲染时间
   */
  recordRenderTime(startTime: number, endTime: number): void {
    const renderTime = endTime - startTime;
    this.renderTimes.push(renderTime);
    
    // 保持样本数量在限制内
    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }
  }

  /**
   * 获取平均渲染时间
   */
  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    
    const sum = this.renderTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.renderTimes.length;
  }

  /**
   * 获取最大渲染时间
   */
  getMaxRenderTime(): number {
    return this.renderTimes.length > 0 ? Math.max(...this.renderTimes) : 0;
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    averageRenderTime: number;
    maxRenderTime: number;
    sampleCount: number;
    performanceGrade: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const averageRenderTime = this.getAverageRenderTime();
    const maxRenderTime = this.getMaxRenderTime();
    
    let performanceGrade: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageRenderTime < 1) {
      performanceGrade = 'excellent';
    } else if (averageRenderTime < 5) {
      performanceGrade = 'good';
    } else if (averageRenderTime < 10) {
      performanceGrade = 'fair';
    } else {
      performanceGrade = 'poor';
    }

    return {
      averageRenderTime,
      maxRenderTime,
      sampleCount: this.renderTimes.length,
      performanceGrade
    };
  }

  /**
   * 重置监控数据
   */
  reset(): void {
    this.renderTimes = [];
  }
}

/**
 * 全局性能监控实例
 */
export const textDisplayPerformanceMonitor = new TextDisplayPerformanceMonitor();

/**
 * 文字显示优化Hook
 */
export function useTextDisplayOptimizer(
  slices: ImageSlice[],
  options: TextDisplayOptions,
  customConfig?: Partial<ResponsiveTextConfig>
) {
  const config = createResponsiveTextConfig(customConfig);
  
  // 优化文字显示
  const optimizedDisplays = optimizeMultipleTextDisplay(slices, config, options);
  
  // 性能监控
  const startTime = performance.now();
  
  // 在实际使用时记录渲染时间
  const recordRenderTime = () => {
    const endTime = performance.now();
    textDisplayPerformanceMonitor.recordRenderTime(startTime, endTime);
  };

  return {
    optimizedDisplays,
    config,
    recordRenderTime,
    performanceMonitor: textDisplayPerformanceMonitor
  };
}

/**
 * 文字显示缓存管理
 */
class TextDisplayCache {
  private cache = new Map<string, OptimizedTextDisplay>();
  private maxCacheSize = 1000;

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    slice: ImageSlice,
    config: ResponsiveTextConfig,
    options: TextDisplayOptions
  ): string {
    return `${slice.index}-${slice.width}x${slice.height}-${slice.blob.size}-${config.deviceType}-${config.displayMode}-${JSON.stringify(options)}`;
  }

  /**
   * 获取缓存的优化结果
   */
  get(
    slice: ImageSlice,
    config: ResponsiveTextConfig,
    options: TextDisplayOptions
  ): OptimizedTextDisplay | null {
    const key = this.generateCacheKey(slice, config, options);
    return this.cache.get(key) || null;
  }

  /**
   * 设置缓存
   */
  set(
    slice: ImageSlice,
    config: ResponsiveTextConfig,
    options: TextDisplayOptions,
    result: OptimizedTextDisplay
  ): void {
    const key = this.generateCacheKey(slice, config, options);
    
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, result);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    // 简化的统计信息，实际应用中可以添加更详细的统计
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0 // 需要额外的计数器来计算命中率
    };
  }
}

/**
 * 全局文字显示缓存实例
 */
export const textDisplayCache = new TextDisplayCache();

/**
 * 带缓存的文字显示优化函数
 */
export function optimizeTextDisplayWithCache(
  slice: ImageSlice,
  config: ResponsiveTextConfig,
  options: TextDisplayOptions
): OptimizedTextDisplay {
  // 尝试从缓存获取
  const cached = textDisplayCache.get(slice, config, options);
  if (cached) {
    return cached;
  }

  // 计算优化结果
  const result = optimizeTextDisplay(slice, config, options);
  
  // 存入缓存
  textDisplayCache.set(slice, config, options, result);
  
  return result;
}