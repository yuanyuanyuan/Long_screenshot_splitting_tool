/**
 * 导航性能监控工具
 * 监控导航组件的渲染性能和用户交互响应时间
 */

import { useEffect } from 'react';

// 性能指标接口
export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  interactionTime: number;
  memoryUsage?: number;
  componentCount: number;
  timestamp: number;
}

// 性能事件接口
export interface PerformanceEvent {
  type: 'render' | 'update' | 'interaction' | 'memory';
  duration: number;
  details?: Record<string, unknown>;
  timestamp: number;
}

// 性能阈值配置
export interface PerformanceThresholds {
  renderTime: number; // 渲染时间阈值（毫秒）
  updateTime: number; // 更新时间阈值（毫秒）
  interactionTime: number; // 交互响应时间阈值（毫秒）
  memoryUsage: number; // 内存使用阈值（MB）
}

// 默认性能阈值
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  renderTime: 16, // 60fps = 16.67ms per frame
  updateTime: 100, // 100ms for state updates
  interactionTime: 50, // 50ms for user interactions
  memoryUsage: 50, // 50MB memory usage
};

/**
 * 导航性能监控器类
 */
export class NavigationPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private events: PerformanceEvent[] = [];
  private thresholds: PerformanceThresholds;
  private isEnabled: boolean = true;
  private maxHistorySize: number = 100;
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.initPerformanceObservers();
  }

  /**
   * 初始化性能观察器
   */
  private initPerformanceObservers() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // 观察渲染性能
      const paintObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (
            entry.name === 'first-contentful-paint' ||
            entry.name === 'largest-contentful-paint'
          ) {
            this.recordEvent({
              type: 'render',
              duration: entry.startTime,
              details: { name: entry.name },
              timestamp: Date.now(),
            });
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      this.observers.set('paint', paintObserver);

      // 观察用户交互
      const eventObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordEvent({
            type: 'interaction',
            duration: entry.duration,
            details: { name: entry.name },
            timestamp: Date.now(),
          });
        });
      });
      eventObserver.observe({ entryTypes: ['event'] });
      this.observers.set('event', eventObserver);
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  /**
   * 开始性能测量
   */
  startMeasure(name: string): () => number {
    if (!this.isEnabled) {
      return () => 0;
    }

    const startTime = performance.now();
    const markName = `navigation-${name}-start`;

    try {
      performance.mark(markName);
    } catch {
      // Fallback for environments that don't support performance.mark
    }

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      try {
        const endMarkName = `navigation-${name}-end`;
        performance.mark(endMarkName);
        performance.measure(`navigation-${name}`, markName, endMarkName);
      } catch {
        // Fallback
      }

      this.recordMeasurement(name, duration);
      return duration;
    };
  }

  /**
   * 记录测量结果
   */
  private recordMeasurement(name: string, duration: number) {
    const event: PerformanceEvent = {
      type: name.includes('render') ? 'render' : name.includes('update') ? 'update' : 'interaction',
      duration,
      details: { name },
      timestamp: Date.now(),
    };

    this.recordEvent(event);

    // 检查是否超过阈值
    this.checkThresholds(event);
  }

  /**
   * 记录性能事件
   */
  private recordEvent(event: PerformanceEvent) {
    this.events.push(event);

    // 限制历史记录大小
    if (this.events.length > this.maxHistorySize) {
      this.events = this.events.slice(-this.maxHistorySize);
    }
  }

  /**
   * 检查性能阈值
   */
  private checkThresholds(event: PerformanceEvent) {
    let threshold: number;

    switch (event.type) {
      case 'render':
        threshold = this.thresholds.renderTime;
        break;
      case 'update':
        threshold = this.thresholds.updateTime;
        break;
      case 'interaction':
        threshold = this.thresholds.interactionTime;
        break;
      default:
        return;
    }

    if (event.duration > threshold) {
      console.warn(
        `Navigation performance warning: ${event.type} took ${event.duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
        event.details
      );
    }
  }

  /**
   * 记录组件渲染性能
   */
  recordRender(componentName: string, renderTime: number) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetrics = {
      renderTime,
      updateTime: 0,
      interactionTime: 0,
      componentCount: 1,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxHistorySize) {
      this.metrics = this.metrics.slice(-this.maxHistorySize);
    }

    this.recordEvent({
      type: 'render',
      duration: renderTime,
      details: { component: componentName },
      timestamp: Date.now(),
    });
  }

  /**
   * 记录状态更新性能
   */
  recordUpdate(updateTime: number, details?: any) {
    if (!this.isEnabled) return;

    this.recordEvent({
      type: 'update',
      duration: updateTime,
      details,
      timestamp: Date.now(),
    });
  }

  /**
   * 记录用户交互性能
   */
  recordInteraction(interactionType: string, responseTime: number) {
    if (!this.isEnabled) return;

    this.recordEvent({
      type: 'interaction',
      duration: responseTime,
      details: { type: interactionType },
      timestamp: Date.now(),
    });
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const renderEvents = this.events.filter(e => e.type === 'render');
    const updateEvents = this.events.filter(e => e.type === 'update');
    const interactionEvents = this.events.filter(e => e.type === 'interaction');

    const calculateStats = (events: PerformanceEvent[]) => {
      if (events.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };

      const durations = events.map(e => e.duration);
      return {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length,
      };
    };

    return {
      render: calculateStats(renderEvents),
      update: calculateStats(updateEvents),
      interaction: calculateStats(interactionEvents),
      total: {
        events: this.events.length,
        timespan:
          this.events.length > 0
            ? this.events[this.events.length - 1].timestamp - this.events[0].timestamp
            : 0,
      },
    };
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): number | null {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
  }

  /**
   * 检查内存使用是否超过阈值
   */
  checkMemoryUsage(): boolean {
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage === null) return true;

    if (memoryUsage > this.thresholds.memoryUsage) {
      console.warn(
        `Navigation memory warning: ${memoryUsage}MB used (threshold: ${this.thresholds.memoryUsage}MB)`
      );
      return false;
    }

    return true;
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const stats = this.getPerformanceStats();
    const memoryUsage = this.getMemoryUsage();

    let report = '=== Navigation Performance Report ===\n\n';

    report += `Render Performance:\n`;
    report += `  Average: ${stats.render.avg.toFixed(2)}ms\n`;
    report += `  Min: ${stats.render.min.toFixed(2)}ms\n`;
    report += `  Max: ${stats.render.max.toFixed(2)}ms\n`;
    report += `  Count: ${stats.render.count}\n\n`;

    report += `Update Performance:\n`;
    report += `  Average: ${stats.update.avg.toFixed(2)}ms\n`;
    report += `  Min: ${stats.update.min.toFixed(2)}ms\n`;
    report += `  Max: ${stats.update.max.toFixed(2)}ms\n`;
    report += `  Count: ${stats.update.count}\n\n`;

    report += `Interaction Performance:\n`;
    report += `  Average: ${stats.interaction.avg.toFixed(2)}ms\n`;
    report += `  Min: ${stats.interaction.min.toFixed(2)}ms\n`;
    report += `  Max: ${stats.interaction.max.toFixed(2)}ms\n`;
    report += `  Count: ${stats.interaction.count}\n\n`;

    if (memoryUsage !== null) {
      report += `Memory Usage: ${memoryUsage}MB\n\n`;
    }

    report += `Total Events: ${stats.total.events}\n`;
    report += `Monitoring Duration: ${(stats.total.timespan / 1000).toFixed(2)}s\n`;

    return report;
  }

  /**
   * 清除历史数据
   */
  clearHistory() {
    this.metrics = [];
    this.events = [];
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * 销毁监控器
   */
  destroy() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    this.clearHistory();
  }
}

// 创建全局实例
export const navigationPerformanceMonitor = new NavigationPerformanceMonitor();

// 性能装饰器，用于自动监控函数执行时间
export function performanceMonitor(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const endMeasure = navigationPerformanceMonitor.startMeasure(
      `${target.constructor.name}.${propertyName}`
    );

    try {
      const result = method.apply(this, args);

      if (result instanceof Promise) {
        return result.finally(() => {
          endMeasure();
        });
      } else {
        endMeasure();
        return result;
      }
    } catch (error) {
      endMeasure();
      throw error;
    }
  };

  return descriptor;
}

// React Hook用于组件性能监控
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = performance.now();

  // 组件挂载后记录渲染时间
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    navigationPerformanceMonitor.recordRender(componentName, renderTime);
  }, [componentName]);

  // 返回性能监控工具
  return {
    startMeasure: navigationPerformanceMonitor.startMeasure.bind(navigationPerformanceMonitor),
    recordUpdate: navigationPerformanceMonitor.recordUpdate.bind(navigationPerformanceMonitor),
    recordInteraction: navigationPerformanceMonitor.recordInteraction.bind(
      navigationPerformanceMonitor
    ),
  };
}
