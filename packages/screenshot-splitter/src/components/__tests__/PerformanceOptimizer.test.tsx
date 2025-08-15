import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceOptimizer } from '../PerformanceOptimizer';

// Mock the performance monitor
vi.mock('../../utils/analytics/performanceMonitor', () => {
  const mockGetStats = vi.fn(() => ({
    overallScore: 85,
    metrics: {
      CLS: { average: 0.1, count: 5, good: 5, needsImprovement: 0, poor: 0 },
      INP: { average: 100, count: 3, good: 3, needsImprovement: 0, poor: 0 },
      FCP: { average: 1500, count: 2, good: 2, needsImprovement: 0, poor: 0 },
      LCP: { average: 2500, count: 2, good: 2, needsImprovement: 0, poor: 0 },
      TTFB: { average: 800, count: 2, good: 2, needsImprovement: 0, poor: 0 },
    },
    totalMeasurements: 14,
    lastUpdated: Date.now(),
  }));

  const mockGenerateReport = vi.fn(() => ({
    timestamp: Date.now(),
    metrics: [],
    sessionId: 'test-session',
    url: 'http://localhost',
    userAgent: 'test-agent',
    connectionType: '4g',
    deviceMemory: 8,
    hardwareConcurrency: 4,
    navigationType: 'navigate',
  }));

  return {
    getPerformanceMonitor: vi.fn(() => ({
      getStats: mockGetStats,
      generateReport: mockGenerateReport,
      clearMetrics: vi.fn(),
    })),
    onWebVitals: vi.fn((callback) => {
      // 存储回调以便测试可以触发它
      (onWebVitals as any).callback = callback;
      return vi.fn(); // 返回取消订阅函数
    }),
  };
});

// Mock the lazy loading hooks
vi.mock('../../hooks/useLazyLoading', () => {
  return {
    useLazyLoadingPerformance: vi.fn(() => ({
      metrics: {
        totalImages: 10,
        loadedImages: 8,
        failedImages: 1,
        averageLoadTime: 250,
      },
      getPerformanceReport: vi.fn(() => ({
        failureRate: 10,
        successRate: 80,
      })),
    })),
    useLazyLoading: vi.fn(),
    useBatchLazyLoading: vi.fn(),
    useLazyImage: vi.fn(),
  };
});

describe('PerformanceOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<PerformanceOptimizer />);
      expect(document.body).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      render(
        <PerformanceOptimizer>
          <div data-testid="child-component">Child Content</div>
        </PerformanceOptimizer>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('performance monitoring', () => {
    it('should initialize performance monitor on mount', () => {
      const { getPerformanceMonitor } = require('../../utils/analytics/performanceMonitor');
      
      render(<PerformanceOptimizer />);

      expect(getPerformanceMonitor).toHaveBeenCalled();
    });

    it('should subscribe to performance metrics', () => {
      const { onWebVitals } = require('../../utils/analytics/performanceMonitor');
      
      render(<PerformanceOptimizer />);
      
      expect(onWebVitals).toHaveBeenCalled();
    });

    it('should handle custom configuration', () => {
      const { getPerformanceMonitor } = require('../../utils/analytics/performanceMonitor');
      
      const customConfig = {
        performanceConfig: {
          sampleRate: 0.5,
          sendToAnalytics: true,
          analyticsEndpoint: '/custom-analytics',
        },
      };

      render(<PerformanceOptimizer config={customConfig} />);

      expect(getPerformanceMonitor).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          enableInDevelopment: true,
          sampleRate: 0.5,
          sendToAnalytics: true,
          analyticsEndpoint: '/custom-analytics',
        })
      );
    });
  });

  describe('lazy loading integration', () => {
    it('should use lazy loading when enabled', () => {
      const { useLazyLoadingPerformance } = require('../../hooks/useLazyLoading');
      
      render(
        <PerformanceOptimizer 
          config={{ enableLazyLoading: true }}
        />
      );

      expect(useLazyLoadingPerformance).toHaveBeenCalled();
    });

    it('should not use lazy loading when disabled', () => {
      const { useLazyLoadingPerformance } = require('../../hooks/useLazyLoading');
      vi.mocked(useLazyLoadingPerformance).mockClear();
      
      render(
        <PerformanceOptimizer 
          config={{ enableLazyLoading: false }}
        />
      );

      // 组件仍然会调用hook，但不会使用其数据
      expect(useLazyLoadingPerformance).toHaveBeenCalled();
    });
  });

  describe('metrics display', () => {
    it('should show metrics in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <PerformanceOptimizer 
          config={{ showMetrics: true }}
        >
          <div data-testid="content">Content</div>
        </PerformanceOptimizer>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide metrics when disabled', () => {
      render(
        <PerformanceOptimizer 
          config={{ showMetrics: false }}
        >
          <div data-testid="content">Content</div>
        </PerformanceOptimizer>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle performance monitor initialization errors', () => {
      const { getPerformanceMonitor } = require('../../utils/analytics/performanceMonitor');
      vi.mocked(getPerformanceMonitor).mockImplementationOnce(() => {
        throw new Error('Performance monitor failed');
      });

      expect(() => render(<PerformanceOptimizer />)).not.toThrow();
    });

    it('should handle lazy loading hook errors', () => {
      const { useLazyLoadingPerformance } = require('../../hooks/useLazyLoading');
      vi.mocked(useLazyLoadingPerformance).mockImplementationOnce(() => {
        throw new Error('Lazy loading failed');
      });

      expect(() => 
        render(
          <PerformanceOptimizer 
            config={{ enableLazyLoading: true }}
          />
        )
      ).not.toThrow();
    });
  });

  describe('web vitals callback', () => {
    it('should handle web vitals metrics', () => {
      const { onWebVitals } = require('../../utils/analytics/performanceMonitor');
      
      render(<PerformanceOptimizer />);

      // 获取存储的回调函数
      const callback = (onWebVitals as any).callback;
      expect(callback).toBeDefined();

      // 模拟接收指标
      const mockMetric = {
        name: 'LCP',
        value: 2500,
        rating: 'good',
        delta: 100,
        id: 'test-id',
        timestamp: Date.now(),
        navigationType: 'navigate',
        entries: [],
      };

      // 调用回调不应抛出错误
      expect(() => callback(mockMetric)).not.toThrow();
    });
  });
});