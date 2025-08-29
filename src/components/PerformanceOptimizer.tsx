import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  PerformanceMonitor,
  getPerformanceMonitor,
  onWebVitals,
  type PerformanceMetricData,
  type PerformanceStats,
  type CoreWebVitalsMetric,
} from '../utils/analytics/performanceMonitor';
import {



  type LazyLoadingOptions,
} from '../hooks/useLazyLoading';

/**
 * 懒加载性能数据接口
 */
export interface LazyLoadingPerformanceData {
  totalCount: number;
  loadedCount: number;
  errorCount: number;
  averageLoadTime: number;
  errorRate: number;
  successRate: number;
}

/**
 * 性能优化组件配置
 */
export interface PerformanceOptimizerConfig {
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
  /** 是否启用懒加载 */
  enableLazyLoading?: boolean;
  /** 是否显示性能指标 */
  showMetrics?: boolean;
  /** 是否在开发环境显示调试信息 */
  showDebugInfo?: boolean;
  /** 性能监控配置 */
  performanceConfig?: {
    sampleRate?: number;
    sendToAnalytics?: boolean;
    analyticsEndpoint?: string;
    debug?: boolean;
  };
  /** 懒加载配置 */
  lazyLoadingConfig?: LazyLoadingOptions;
  /** 性能阈值配置 */
  thresholds?: {
    CLS?: { good: number; poor: number };
    INP?: { good: number; poor: number };
    FCP?: { good: number; poor: number };
    LCP?: { good: number; poor: number };
    TTFB?: { good: number; poor: number };
  };
}

/**
 * 性能优化状态
 */
export interface PerformanceOptimizerState {
  /** 性能监控器实例 */
  monitor: PerformanceMonitor | null;
  /** 当前性能统计 */
  stats: PerformanceStats | null;
  /** 最新的性能指标 */
  latestMetrics: Map<CoreWebVitalsMetric, PerformanceMetricData>;
  /** 懒加载性能数据 */
  lazyLoadingPerformance: LazyLoadingPerformanceData | null;
  /** 是否正在监控 */
  isMonitoring: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 性能指标显示组件
 */
interface MetricsDisplayProps {
  stats: PerformanceStats;
  latestMetrics: Map<CoreWebVitalsMetric, PerformanceMetricData>;
  lazyLoadingPerformance: LazyLoadingPerformanceData | null;
  showDebugInfo: boolean;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  stats,
  latestMetrics,
  lazyLoadingPerformance,
  showDebugInfo,
}) => {
  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good':
        return '#10b981'; // green-500
      case 'needs-improvement':
        return '#f59e0b'; // amber-500
      case 'poor':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const formatValue = (metric: CoreWebVitalsMetric, value: number): string => {
    switch (metric) {
      case 'CLS':
        return value.toFixed(3);
      case 'INP':
      case 'FCP':
      case 'LCP':
      case 'TTFB':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  };

  return (
    <div
      className="performance-metrics"
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        minWidth: '200px',
        maxWidth: '300px',
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        性能指标 (评分: {Math.round(stats.overallScore)}/100)
      </div>

      {/* Core Web Vitals */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Core Web Vitals:</div>
        {(['CLS', 'INP', 'FCP', 'LCP', 'TTFB'] as CoreWebVitalsMetric[]).map(metric => {
          const latest = latestMetrics.get(metric);
          const metricStats = stats.metrics[metric];

          return (
            <div
              key={metric}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2px',
              }}
            >
              <span>{metric}:</span>
              <span
                style={{
                  color: latest ? getRatingColor(latest.rating) : '#6b7280',
                }}
              >
                {latest ? formatValue(metric, latest.value) : 'N/A'}
                {showDebugInfo && metricStats.count > 0 && (
                  <span style={{ color: '#9ca3af', marginLeft: '4px' }}>
                    (avg: {formatValue(metric, metricStats.average)})
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* 懒加载性能 */}
      {lazyLoadingPerformance && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>懒加载性能:</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>已加载:</span>
            <span>
              {lazyLoadingPerformance.loadedCount}/{lazyLoadingPerformance.totalCount}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>平均加载时间:</span>
            <span>{Math.round(lazyLoadingPerformance.averageLoadTime)}ms</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>错误率:</span>
            <span
              style={{
                color: lazyLoadingPerformance.errorRate > 0.1 ? '#ef4444' : '#10b981',
              }}
            >
              {(lazyLoadingPerformance.errorRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* 调试信息 */}
      {showDebugInfo && (
        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
          <div>总测量: {stats.totalMeasurements}</div>
          <div>最后更新: {new Date(stats.lastUpdated).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
};

/**
 * 性能优化组件
 * 整合懒加载和性能监控功能
 */
export const PerformanceOptimizer: React.FC<{
  config?: PerformanceOptimizerConfig;
  children?: React.ReactNode;
}> = ({ config = {}, children }) => {
  const {
    enablePerformanceMonitoring = true,
    enableLazyLoading = true,
    showMetrics = process.env.NODE_ENV === 'development',
    showDebugInfo = process.env.NODE_ENV === 'development',
    performanceConfig = {},
    thresholds = {},
  } = config;

  // 状态管理
  const [state, setState] = useState<PerformanceOptimizerState>({
    monitor: null,
    stats: null,
    latestMetrics: new Map(),
    lazyLoadingPerformance: null,
    isMonitoring: false,
    error: null,
  });

  // 性能监控初始化
  useEffect(() => {
    if (!enablePerformanceMonitoring) {
      return;
    }

    try {
      const monitor = getPerformanceMonitor({
        enabled: true,
        enableInDevelopment: true,
        ...performanceConfig,
        thresholds: {
          ...thresholds,
        },
      });

      setState(prev => ({
        ...prev,
        monitor,
        isMonitoring: true,
        error: null,
      }));

      // 监听性能指标
      const unsubscribe = onWebVitals((metric: PerformanceMetricData) => {
        setState(prev => {
          const newLatestMetrics = new Map(prev.latestMetrics);
          newLatestMetrics.set(metric.name, metric);

          return {
            ...prev,
            latestMetrics: newLatestMetrics,
            stats: monitor.getStats(),
          };
        });
      });

      // 定期更新统计数据
      const statsInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          stats: monitor.getStats(),
        }));
      }, 5000);

      return () => {
        unsubscribe();
        clearInterval(statsInterval);
      };
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isMonitoring: false,
      }));
    }
  }, [enablePerformanceMonitoring, performanceConfig, thresholds]);

  // 懒加载性能监控
  const lazyLoadingPerformanceHook = useLazyLoading({});

  useEffect(() => {
    if (enableLazyLoading && lazyLoadingPerformanceHook) {
      const report = lazyLoadingPerformanceHook.getPerformanceReport();
      const performanceData: LazyLoadingPerformanceData = {
        totalCount: lazyLoadingPerformanceHook.metrics.totalImages,
        loadedCount: lazyLoadingPerformanceHook.metrics.loadedImages,
        errorCount: lazyLoadingPerformanceHook.metrics.failedImages,
        averageLoadTime: lazyLoadingPerformanceHook.metrics.averageLoadTime,
        errorRate: report.failureRate / 100,
        successRate: report.successRate / 100,
      };

      setState(prev => ({
        ...prev,
        lazyLoadingPerformance: performanceData,
      }));
    }
  }, [enableLazyLoading, lazyLoadingPerformanceHook]);

  // 错误处理
  if (state.error) {
    console.warn('PerformanceOptimizer error:', state.error);
  }

  return (
    <>
      {children}
      {showMetrics && state.stats && (
        <MetricsDisplay
          stats={state.stats}
          latestMetrics={state.latestMetrics}
          lazyLoadingPerformance={state.lazyLoadingPerformance}
          showDebugInfo={showDebugInfo}
        />
      )}
    </>
  );
};

/**
 * 性能优化Hook
 * 提供性能监控和懒加载的统一接口
 */
export const usePerformanceOptimizer = (config: PerformanceOptimizerConfig = {}) => {
  const {
    enablePerformanceMonitoring = true,
    enableLazyLoading = true,
    performanceConfig = {},
  } = config;

  // 性能监控
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<
    Map<CoreWebVitalsMetric, PerformanceMetricData>
  >(new Map());

  // 懒加载性能监控
  const lazyLoadingPerformanceHook = useLazyLoading({});

  // 转换性能数据格式
  const lazyLoadingPerformance = useMemo(() => {
    if (!enableLazyLoading || !lazyLoadingPerformanceHook) {
      return null;
    }

    const report = lazyLoadingPerformanceHook.getPerformanceReport();
    return {
      totalCount: lazyLoadingPerformanceHook.metrics.totalImages,
      loadedCount: lazyLoadingPerformanceHook.metrics.loadedImages,
      errorCount: lazyLoadingPerformanceHook.metrics.failedImages,
      averageLoadTime: lazyLoadingPerformanceHook.metrics.averageLoadTime,
      errorRate: report.failureRate / 100,
      successRate: report.successRate / 100,
    };
  }, [enableLazyLoading, lazyLoadingPerformanceHook]);

  // 初始化性能监控
  useEffect(() => {
    if (!enablePerformanceMonitoring) {
      return;
    }

    const monitor = getPerformanceMonitor(performanceConfig);

    const unsubscribe = onWebVitals((metric: PerformanceMetricData) => {
      setLatestMetrics(prev => {
        const newMap = new Map(prev);
        newMap.set(metric.name, metric);
        return newMap;
      });

      setPerformanceStats(monitor.getStats());
    });

    // 初始统计
    setPerformanceStats(monitor.getStats());

    return unsubscribe;
  }, [enablePerformanceMonitoring, performanceConfig]);

  // 获取性能报告
  const getPerformanceReport = useCallback(() => {
    if (!enablePerformanceMonitoring) {
      return null;
    }

    const monitor = getPerformanceMonitor();
    return monitor.generateReport();
  }, [enablePerformanceMonitoring]);

  // 发送性能数据
  const sendPerformanceData = useCallback(
    async (endpoint?: string) => {
      if (!enablePerformanceMonitoring) {
        return;
      }

      const monitor = getPerformanceMonitor();
      const report = monitor.generateReport();

      const url = endpoint || performanceConfig.analyticsEndpoint || '/api/analytics/performance';

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
    },
    [enablePerformanceMonitoring, performanceConfig.analyticsEndpoint]
  );

  // 清除性能数据
  const clearPerformanceData = useCallback(() => {
    if (!enablePerformanceMonitoring) {
      return;
    }

    const monitor = getPerformanceMonitor();
    monitor.clearMetrics();
    setPerformanceStats(monitor.getStats());
    setLatestMetrics(new Map());
  }, [enablePerformanceMonitoring]);

  return {
    // 性能监控
    performanceStats,
    latestMetrics,
    getPerformanceReport,
    sendPerformanceData,
    clearPerformanceData,

    // 懒加载
    lazyLoadingPerformance: enableLazyLoading ? lazyLoadingPerformance : null,

    // 状态
    isPerformanceMonitoringEnabled: enablePerformanceMonitoring,
    isLazyLoadingEnabled: enableLazyLoading,
  };
};

/**
 * 懒加载图片组件（集成性能监控）
 */
export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  lazyOptions?: LazyLoadingOptions;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  style,
  placeholder,
  onLoad,
  onError,
  lazyOptions = {},
}) => {
  const { imgProps, containerRef, isLoaded, hasError } = useLazyLoading({
    ...lazyOptions,
    placeholder: placeholder || '#f3f4f6',
  });

  // 处理加载完成事件
  useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  // 处理错误事件
  useEffect(() => {
    if (hasError && onError) {
      onError(new Error(`Failed to load image: ${src}`));
    }
  }, [hasError, onError, src]);

  return (
    <div ref={containerRef as any} className={className} style={style}>
      {isLoaded ? (
        <img
          {...imgProps}
          alt={alt}
          style={{
            ...imgProps.style,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : hasError ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6',
            color: '#6b7280',
            minHeight: '100px',
          }}
        >
          加载失败
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: placeholder || '#f3f4f6',
            color: '#6b7280',
            minHeight: '100px',
          }}
        >
          加载中...
        </div>
      )}
    </div>
  );
};

/**
 * 批量懒加载组件
 */
export interface BatchLazyLoaderProps {
  items: Array<{
    id: string;
    src: string;
    alt: string;
  }>;
  renderItem: (item: any, isLoaded: boolean, error: Error | null) => React.ReactNode;
  batchSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BatchLazyLoader: React.FC<BatchLazyLoaderProps> = ({
  items,
  renderItem,
  className,
  style,
}) => {
  // 简化处理，使用基本的懒加载逻辑
  const lazyItems = items.map((item, index) => ({
    ...item,
    isVisible: true // 简化实现
  }));

  return (
    <div className={className} style={style}>
      {items.map((item, index) => {
        const lazyItem = lazyItems[index];
        const isLoaded = lazyItem ? lazyItem.isLoaded : false;
        const error =
          lazyItem && lazyItem.hasError ? new Error('Unknown error') : null;

        return (
          <div key={item.id} ref={lazyItem?.ref as any}>
            {renderItem(item, isLoaded, error)}
          </div>
        );
      })}
    </div>
  );
};

export default PerformanceOptimizer;
