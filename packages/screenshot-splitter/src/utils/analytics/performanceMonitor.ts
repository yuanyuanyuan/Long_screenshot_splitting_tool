import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';
import type { CLSMetric, FCPMetric, LCPMetric, TTFBMetric, Metric } from 'web-vitals';

/**
 * Core Web Vitals 指标类型
 * 注意：FID 在 web-vitals v3+ 中已被 INP 替代
 */
export type CoreWebVitalsMetric = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';

/**
 * 性能指标数据
 */
export interface PerformanceMetricData {
  name: CoreWebVitalsMetric;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: number;
  navigationType: string;
  entries: PerformanceEntry[];
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  /** 是否启用监控 */
  enabled?: boolean;
  /** 是否在开发环境启用 */
  enableInDevelopment?: boolean;
  /** 采样率 (0-1) */
  sampleRate?: number;
  /** 是否发送到分析服务 */
  sendToAnalytics?: boolean;
  /** 自定义分析端点 */
  analyticsEndpoint?: string;
  /** 是否记录详细日志 */
  debug?: boolean;
  /** 自定义阈值 */
  thresholds?: {
    CLS?: { good: number; poor: number };
    INP?: { good: number; poor: number };
    FCP?: { good: number; poor: number };
    LCP?: { good: number; poor: number };
    TTFB?: { good: number; poor: number };
  };
}

/**
 * 性能报告数据
 */
export interface PerformanceReport {
  /** 页面URL */
  url: string;
  /** 用户代理 */
  userAgent: string;
  /** 连接类型 */
  connectionType: string;
  /** 设备内存 */
  deviceMemory: number;
  /** 硬件并发数 */
  hardwareConcurrency: number;
  /** 指标数据 */
  metrics: PerformanceMetricData[];
  /** 生成时间 */
  timestamp: number;
  /** 会话ID */
  sessionId: string;
  /** 页面加载类型 */
  navigationType: string;
}

/**
 * 性能监控统计
 */
export interface PerformanceStats {
  /** 总测量次数 */
  totalMeasurements: number;
  /** 各指标统计 */
  metrics: {
    [K in CoreWebVitalsMetric]: {
      count: number;
      average: number;
      min: number;
      max: number;
      good: number;
      needsImprovement: number;
      poor: number;
      latest?: PerformanceMetricData;
    };
  };
  /** 整体评分 */
  overallScore: number;
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<PerformanceMonitorConfig> = {
  enabled: true,
  enableInDevelopment: false,
  sampleRate: 1.0,
  sendToAnalytics: false,
  analyticsEndpoint: '/api/analytics/performance',
  debug: false,
  thresholds: {
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  },
};

/**
 * 性能监控器类
 * 负责监控和收集Core Web Vitals性能指标
 */
export class PerformanceMonitor {
  private config: Required<PerformanceMonitorConfig>;
  private metrics: Map<CoreWebVitalsMetric, PerformanceMetricData[]> = new Map();
  private listeners: Map<CoreWebVitalsMetric, Set<(metric: PerformanceMetricData) => void>> = new Map();
  private sessionId: string;
  private isInitialized = false;

  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    // 初始化指标存储
    (['CLS', 'INP', 'FCP', 'LCP', 'TTFB'] as CoreWebVitalsMetric[]).forEach(metric => {
      this.metrics.set(metric, []);
      this.listeners.set(metric, new Set());
    });

    if (this.shouldInitialize()) {
      this.initialize();
    }
  }

  /**
   * 判断是否应该初始化监控
   */
  private shouldInitialize(): boolean {
    if (!this.config.enabled) {
      return false;
    }

    if (process.env.NODE_ENV === 'development' && !this.config.enableInDevelopment) {
      return false;
    }

    if (Math.random() > this.config.sampleRate) {
      return false;
    }

    return typeof window !== 'undefined' && 'performance' in window;
  }

  /**
   * 初始化性能监控
   */
  private initialize(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // 监控 CLS (Cumulative Layout Shift)
      onCLS((metric: CLSMetric) => {
        this.handleMetric('CLS', metric);
      });

      // 监控 FCP (First Contentful Paint)
      onFCP((metric: FCPMetric) => {
        this.handleMetric('FCP', metric);
      });

      // 监控 LCP (Largest Contentful Paint)
      onLCP((metric: LCPMetric) => {
        this.handleMetric('LCP', metric);
      });

      // 监控 TTFB (Time to First Byte)
      onTTFB((metric: TTFBMetric) => {
        this.handleMetric('TTFB', metric);
      });

      // 尝试监控 INP (Interaction to Next Paint) - 替代 FID
      this.initializeINPMonitoring();

      this.isInitialized = true;

      if (this.config.debug) {
        console.log('PerformanceMonitor initialized', {
          sessionId: this.sessionId,
          config: this.config,
        });
      }
    } catch (error) {
      console.error('Failed to initialize PerformanceMonitor:', error);
    }
  }

  /**
   * 初始化 INP 监控
   */
  private async initializeINPMonitoring(): Promise<void> {
    try {
      // 动态导入 onINP，因为它可能不在所有版本中可用
      const { onINP } = await import('web-vitals');
      if (onINP) {
        onINP((metric: any) => {
          this.handleMetric('INP', metric);
        });
      }
    } catch (error) {
      // INP 不可用，使用自定义的交互延迟监控
      this.initializeCustomInteractionMonitoring();
    }
  }

  /**
   * 自定义交互延迟监控（作为 INP 的后备方案）
   */
  private initializeCustomInteractionMonitoring(): void {
    if (typeof window === 'undefined') {
      return;
    }

    let interactionStart = 0;
    const interactions: number[] = [];

    const measureInteraction = () => {
      if (interactionStart > 0) {
        const delay = performance.now() - interactionStart;
        interactions.push(delay);
        
        // 计算 75th percentile 作为 INP 近似值
        if (interactions.length >= 10) {
          const sorted = [...interactions].sort((a, b) => a - b);
          const p75Index = Math.floor(sorted.length * 0.75);
          const inp = sorted[p75Index];
          
          const rating = inp <= 200 ? 'good' : inp <= 500 ? 'needs-improvement' : 'poor';
          
          this.handleMetric('INP', {
            name: 'INP',
            value: inp,
            rating,
            delta: inp,
            id: `inp-${Date.now()}`,
            entries: [],
          } as any);
          
          // 重置数组，保持最近的测量
          interactions.splice(0, interactions.length - 5);
        }
      }
      interactionStart = 0;
    };

    // 监听各种交互事件
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      window.addEventListener(eventType, () => {
        interactionStart = performance.now();
        requestAnimationFrame(measureInteraction);
      }, { passive: true });
    });
  }

  /**
   * 处理性能指标
   */
  private handleMetric(name: CoreWebVitalsMetric, metric: Metric): void {
    const metricData: PerformanceMetricData = {
      name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      navigationType: this.getNavigationType(),
      entries: metric.entries || [],
    };

    // 存储指标
    const metricList = this.metrics.get(name);
    if (metricList) {
      metricList.push(metricData);
    }

    // 通知监听器
    const listeners = this.listeners.get(name);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(metricData);
        } catch (error) {
          console.error(`Error in ${name} metric listener:`, error);
        }
      });
    }

    // 发送到分析服务
    if (this.config.sendToAnalytics) {
      this.sendToAnalytics(metricData);
    }

    // 调试日志
    if (this.config.debug) {
      console.log(`${name} metric:`, metricData);
    }
  }

  /**
   * 获取导航类型
   */
  private getNavigationType(): string {
    if (typeof window === 'undefined' || !window.performance) {
      return 'unknown';
    }

    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      return navigation.type || 'navigate';
    }

    return 'navigate';
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 发送数据到分析服务
   */
  private async sendToAnalytics(metric: PerformanceMetricData): Promise<void> {
    try {
      const payload = {
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        metric,
        timestamp: Date.now(),
      };

      await fetch(this.config.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to send analytics:', error);
      }
    }
  }

  /**
   * 添加指标监听器
   */
  public onMetric(
    metric: CoreWebVitalsMetric,
    callback: (data: PerformanceMetricData) => void
  ): () => void {
    const listeners = this.listeners.get(metric);
    if (listeners) {
      listeners.add(callback);
      
      // 返回取消监听的函数
      return () => {
        listeners.delete(callback);
      };
    }
    
    return () => {};
  }

  /**
   * 添加所有指标监听器
   */
  public onAllMetrics(callback: (data: PerformanceMetricData) => void): () => void {
    const unsubscribers = (['CLS', 'INP', 'FCP', 'LCP', 'TTFB'] as CoreWebVitalsMetric[])
      .map(metric => this.onMetric(metric, callback));

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * 获取指定指标的数据
   */
  public getMetric(name: CoreWebVitalsMetric): PerformanceMetricData[] {
    return this.metrics.get(name) || [];
  }

  /**
   * 获取所有指标数据
   */
  public getAllMetrics(): Map<CoreWebVitalsMetric, PerformanceMetricData[]> {
    return new Map(this.metrics);
  }

  /**
   * 获取最新的指标值
   */
  public getLatestMetric(name: CoreWebVitalsMetric): PerformanceMetricData | null {
    const metricList = this.metrics.get(name);
    return metricList && metricList.length > 0 ? metricList[metricList.length - 1] : null;
  }

  /**
   * 获取性能统计
   */
  public getStats(): PerformanceStats {
    const stats: PerformanceStats = {
      totalMeasurements: 0,
      metrics: {} as any,
      overallScore: 0,
      lastUpdated: Date.now(),
    };

    let totalScore = 0;
    let metricCount = 0;

    (['CLS', 'INP', 'FCP', 'LCP', 'TTFB'] as CoreWebVitalsMetric[]).forEach(metricName => {
      const metricData = this.metrics.get(metricName) || [];
      const values = metricData.map(m => m.value);
      
      if (values.length > 0) {
        const good = metricData.filter(m => m.rating === 'good').length;
        const needsImprovement = metricData.filter(m => m.rating === 'needs-improvement').length;
        const poor = metricData.filter(m => m.rating === 'poor').length;
        
        stats.metrics[metricName] = {
          count: values.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          good,
          needsImprovement,
          poor,
          latest: metricData[metricData.length - 1],
        };

        // 计算分数 (good=100, needs-improvement=50, poor=0)
        const score = (good * 100 + needsImprovement * 50) / values.length;
        totalScore += score;
        metricCount++;
      } else {
        stats.metrics[metricName] = {
          count: 0,
          average: 0,
          min: 0,
          max: 0,
          good: 0,
          needsImprovement: 0,
          poor: 0,
        };
      }

      stats.totalMeasurements += metricData.length;
    });

    stats.overallScore = metricCount > 0 ? totalScore / metricCount : 0;

    return stats;
  }

  /**
   * 生成性能报告
   */
  public generateReport(): PerformanceReport {
    const allMetrics: PerformanceMetricData[] = [];
    this.metrics.forEach(metricList => {
      allMetrics.push(...metricList);
    });

    return {
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 0 : 0,
      metrics: allMetrics,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      navigationType: this.getNavigationType(),
    };
  }

  /**
   * 获取连接类型
   */
  private getConnectionType(): string {
    if (typeof navigator === 'undefined') {
      return 'unknown';
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || connection.type || 'unknown' : 'unknown';
  }

  /**
   * 获取设备内存
   */
  private getDeviceMemory(): number {
    if (typeof navigator === 'undefined') {
      return 0;
    }

    return (navigator as any).deviceMemory || 0;
  }

  /**
   * 手动触发指标收集
   */
  public async collectMetrics(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // 注意：web-vitals v3+ 中移除了 get* 函数
    // 指标会通过 on* 回调自动收集
    if (this.config.debug) {
      console.log('Metrics are collected automatically via callbacks');
    }
  }

  /**
   * 清除所有指标数据
   */
  public clearMetrics(): void {
    this.metrics.forEach(metricList => metricList.length = 0);
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): Required<PerformanceMonitorConfig> {
    return { ...this.config };
  }

  /**
   * 销毁监控器
   */
  public destroy(): void {
    this.clearMetrics();
    this.listeners.forEach(listenerSet => listenerSet.clear());
    this.isInitialized = false;
  }
}

// 创建全局实例
let globalPerformanceMonitor: PerformanceMonitor | null = null;

/**
 * 获取全局性能监控器实例
 */
export const getPerformanceMonitor = (config?: PerformanceMonitorConfig): PerformanceMonitor => {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor(config);
  }
  return globalPerformanceMonitor;
};

/**
 * 初始化性能监控
 */
export const initPerformanceMonitoring = (config?: PerformanceMonitorConfig): PerformanceMonitor => {
  return getPerformanceMonitor(config);
};

/**
 * 便捷函数：监听所有Core Web Vitals指标
 */
export const onWebVitals = (callback: (metric: PerformanceMetricData) => void): (() => void) => {
  const monitor = getPerformanceMonitor();
  return monitor.onAllMetrics(callback);
};

/**
 * 便捷函数：获取性能统计
 */
export const getPerformanceStats = (): PerformanceStats => {
  const monitor = getPerformanceMonitor();
  return monitor.getStats();
};

/**
 * 便捷函数：生成性能报告
 */
export const generatePerformanceReport = (): PerformanceReport => {
  const monitor = getPerformanceMonitor();
  return monitor.generateReport();
};

/**
 * 便捷函数：发送性能数据到分析服务
 */
export const sendPerformanceData = async (endpoint?: string): Promise<void> => {
  const monitor = getPerformanceMonitor();
  const report = monitor.generateReport();
  
  const url = endpoint || '/api/analytics/performance';
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
  } catch (error) {
    console.error('Failed to send performance data:', error);
  }
};

export default PerformanceMonitor;