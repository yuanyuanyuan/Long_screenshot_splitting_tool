/**
 * textDisplayOptimizer单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DeviceType,
  DisplayMode,
  optimizeTextDisplay,
  optimizeMultipleTextDisplay,
  detectDeviceType,
  detectTouchDevice,
  recommendDisplayMode,
  createResponsiveTextConfig,
  TextDisplayPerformanceMonitor,
  textDisplayCache,
  optimizeTextDisplayWithCache,
} from './textDisplayOptimizer';
import type { ResponsiveTextConfig } from './textDisplayOptimizer';
import { DEFAULT_TEXT_DISPLAY_OPTIONS } from '../components/TextDisplayConfig';
import type { ImageSlice } from '../types';

// Mock window对象
const mockWindow = {
  innerWidth: 1920,
  innerHeight: 1080,
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  maxTouchPoints: 0,
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
  writable: true,
});

// 创建模拟ImageSlice
const createMockImageSlice = (overrides: Partial<ImageSlice> = {}): ImageSlice => ({
  index: 0,
  width: 800,
  height: 600,
  blob: new Blob(['test'], { type: 'image/png' }),
  url: 'blob:test-url',
  ...overrides,
});

describe('DeviceType和DisplayMode常量', () => {
  it('应该正确定义DeviceType常量', () => {
    expect(DeviceType.MOBILE).toBe('mobile');
    expect(DeviceType.TABLET).toBe('tablet');
    expect(DeviceType.DESKTOP).toBe('desktop');
  });

  it('应该正确定义DisplayMode常量', () => {
    expect(DisplayMode.MINIMAL).toBe('minimal');
    expect(DisplayMode.COMPACT).toBe('compact');
    expect(DisplayMode.STANDARD).toBe('standard');
    expect(DisplayMode.DETAILED).toBe('detailed');
  });
});

describe('detectDeviceType', () => {
  beforeEach(() => {
    // 重置window mock
    mockWindow.innerWidth = 1920;
    mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  });

  it('应该在桌面端返回DESKTOP', () => {
    mockWindow.innerWidth = 1920;
    mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    expect(detectDeviceType()).toBe(DeviceType.DESKTOP);
  });

  it('应该在移动端返回MOBILE', () => {
    mockWindow.innerWidth = 375;
    mockNavigator.userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15';

    expect(detectDeviceType()).toBe(DeviceType.MOBILE);
  });

  it('应该在平板端返回TABLET', () => {
    mockWindow.innerWidth = 768;
    mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15';

    expect(detectDeviceType()).toBe(DeviceType.TABLET);
  });

  it('应该在窄屏桌面端返回MOBILE', () => {
    mockWindow.innerWidth = 600;
    mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    expect(detectDeviceType()).toBe(DeviceType.MOBILE);
  });

  it('应该在window未定义时返回DESKTOP', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    expect(detectDeviceType()).toBe(DeviceType.DESKTOP);

    global.window = originalWindow;
  });
});

describe('detectTouchDevice', () => {
  it('应该在触摸设备上返回true', () => {
    mockNavigator.maxTouchPoints = 1;
    Object.defineProperty(global.window, 'ontouchstart', {
      value: {},
      writable: true,
    });

    expect(detectTouchDevice()).toBe(true);
  });

  it('应该在非触摸设备上返回false', () => {
    mockNavigator.maxTouchPoints = 0;
    // @ts-ignore
    delete global.window.ontouchstart;

    expect(detectTouchDevice()).toBe(false);
  });

  it('应该在window未定义时返回false', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    expect(detectTouchDevice()).toBe(false);

    global.window = originalWindow;
  });
});

describe('recommendDisplayMode', () => {
  it('应该为移动设备推荐COMPACT模式', () => {
    const mode = recommendDisplayMode(375, 667, DeviceType.MOBILE);
    expect(mode).toBe(DisplayMode.COMPACT);
  });

  it('应该为平板设备推荐STANDARD模式', () => {
    const mode = recommendDisplayMode(768, 1024, DeviceType.TABLET);
    expect(mode).toBe(DisplayMode.STANDARD);
  });

  it('应该为桌面设备推荐DETAILED模式', () => {
    const mode = recommendDisplayMode(1920, 1080, DeviceType.DESKTOP);
    expect(mode).toBe(DisplayMode.DETAILED);
  });

  it('应该为窄屏推荐MINIMAL模式', () => {
    const mode = recommendDisplayMode(250, 400, DeviceType.MOBILE);
    expect(mode).toBe(DisplayMode.MINIMAL);
  });

  it('应该为低高度推荐更简洁的模式', () => {
    const mode = recommendDisplayMode(1920, 300, DeviceType.DESKTOP);
    expect(mode).toBe(DisplayMode.STANDARD);
  });
});

describe('createResponsiveTextConfig', () => {
  it('应该创建默认的响应式配置', () => {
    const config = createResponsiveTextConfig();

    expect(config).toHaveProperty('deviceType');
    expect(config).toHaveProperty('displayMode');
    expect(config).toHaveProperty('availableWidth');
    expect(config).toHaveProperty('availableHeight');
    expect(config).toHaveProperty('isTouchDevice');
  });

  it('应该合并自定义配置', () => {
    const customConfig = {
      deviceType: DeviceType.MOBILE,
      displayMode: DisplayMode.MINIMAL,
    };

    const config = createResponsiveTextConfig(customConfig);

    expect(config.deviceType).toBe(DeviceType.MOBILE);
    expect(config.displayMode).toBe(DisplayMode.MINIMAL);
  });
});

describe('optimizeTextDisplay', () => {
  const mockSlice = createMockImageSlice();
  const mockConfig: ResponsiveTextConfig = {
    deviceType: DeviceType.DESKTOP,
    displayMode: DisplayMode.STANDARD,
    availableWidth: 1920,
    availableHeight: 1080,
    isTouchDevice: false,
  };

  it('应该正确优化桌面端文字显示', () => {
    const result = optimizeTextDisplay(mockSlice, mockConfig, DEFAULT_TEXT_DISPLAY_OPTIONS);

    expect(result).toHaveProperty('showTitle', true);
    expect(result).toHaveProperty('showDimensions', true);
    expect(result).toHaveProperty('showFileSize', true);
    expect(result).toHaveProperty('showFullText', true);
    expect(result).toHaveProperty('titleText');
    expect(result).toHaveProperty('dimensionsText');
    expect(result).toHaveProperty('fileSizeText');
    expect(result).toHaveProperty('fullText');
    expect(result).toHaveProperty('cssClasses');
    expect(result).toHaveProperty('performanceHints');
  });

  it('应该为移动端优化文字显示', () => {
    const mobileConfig: ResponsiveTextConfig = {
      ...mockConfig,
      deviceType: DeviceType.MOBILE,
      displayMode: DisplayMode.MINIMAL,
      availableWidth: 375,
    };

    const result = optimizeTextDisplay(mockSlice, mobileConfig, DEFAULT_TEXT_DISPLAY_OPTIONS);

    expect(result.cssClasses).toContain('text-display-mobile');
    expect(result.cssClasses).toContain('text-display-minimal');
    expect(result.performanceHints.length).toBeGreaterThan(0);
  });

  it('应该正确处理文本截断', () => {
    const narrowConfig: ResponsiveTextConfig = {
      ...mockConfig,
      deviceType: DeviceType.MOBILE,
      displayMode: DisplayMode.MINIMAL,
      availableWidth: 200,
    };

    const result = optimizeTextDisplay(mockSlice, narrowConfig, DEFAULT_TEXT_DISPLAY_OPTIONS);

    // 移动端最小模式下，文本应该被简化
    expect(result.titleText.length).toBeLessThanOrEqual(10);
  });

  it('应该根据配置选项控制显示', () => {
    const limitedOptions = {
      ...DEFAULT_TEXT_DISPLAY_OPTIONS,
      showSliceTitle: false,
      showDimensions: false,
    };

    const result = optimizeTextDisplay(mockSlice, mockConfig, limitedOptions);

    expect(result.showTitle).toBe(false);
    expect(result.showDimensions).toBe(false);
  });
});

describe('optimizeMultipleTextDisplay', () => {
  it('应该正确优化多个切片的文字显示', () => {
    const slices = [
      createMockImageSlice({ index: 0 }),
      createMockImageSlice({ index: 1 }),
      createMockImageSlice({ index: 2 }),
    ];

    const config: ResponsiveTextConfig = {
      deviceType: DeviceType.DESKTOP,
      displayMode: DisplayMode.STANDARD,
      availableWidth: 1920,
      availableHeight: 1080,
      isTouchDevice: false,
    };

    const results = optimizeMultipleTextDisplay(slices, config, DEFAULT_TEXT_DISPLAY_OPTIONS);

    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result).toHaveProperty('titleText');
      expect(result.titleText).toContain((index + 1).toString());
    });
  });
});

describe('TextDisplayPerformanceMonitor', () => {
  let monitor: TextDisplayPerformanceMonitor;

  beforeEach(() => {
    monitor = new TextDisplayPerformanceMonitor();
  });

  it('应该正确记录渲染时间', () => {
    monitor.recordRenderTime(100, 105);
    monitor.recordRenderTime(200, 207);

    expect(monitor.getAverageRenderTime()).toBe(6);
    expect(monitor.getMaxRenderTime()).toBe(7);
  });

  it('应该生成正确的性能报告', () => {
    monitor.recordRenderTime(100, 101); // 1ms - excellent

    const report = monitor.getPerformanceReport();

    expect(report.averageRenderTime).toBe(1);
    expect(report.maxRenderTime).toBe(1);
    expect(report.sampleCount).toBe(1);
    expect(report.performanceGrade).toBe('excellent');
  });

  it('应该正确评估性能等级', () => {
    // 测试不同的性能等级
    const testCases = [
      { renderTime: 0.5, expectedGrade: 'excellent' },
      { renderTime: 3, expectedGrade: 'good' },
      { renderTime: 8, expectedGrade: 'fair' },
      { renderTime: 15, expectedGrade: 'poor' },
    ];

    testCases.forEach(({ renderTime, expectedGrade }) => {
      const testMonitor = new TextDisplayPerformanceMonitor();
      testMonitor.recordRenderTime(100, 100 + renderTime);

      const report = testMonitor.getPerformanceReport();
      expect(report.performanceGrade).toBe(expectedGrade);
    });
  });

  it('应该正确重置监控数据', () => {
    monitor.recordRenderTime(100, 105);
    monitor.reset();

    expect(monitor.getAverageRenderTime()).toBe(0);
    expect(monitor.getMaxRenderTime()).toBe(0);
  });

  it('应该限制样本数量', () => {
    // 添加超过最大样本数的记录
    for (let i = 0; i < 150; i++) {
      monitor.recordRenderTime(i, i + 1);
    }

    const report = monitor.getPerformanceReport();
    expect(report.sampleCount).toBeLessThanOrEqual(100);
  });
});

describe('textDisplayCache', () => {
  const mockSlice = createMockImageSlice();
  const mockConfig: ResponsiveTextConfig = {
    deviceType: DeviceType.DESKTOP,
    displayMode: DisplayMode.STANDARD,
    availableWidth: 1920,
    availableHeight: 1080,
    isTouchDevice: false,
  };

  beforeEach(() => {
    textDisplayCache.clear();
  });

  it('应该正确缓存和获取优化结果', () => {
    const result1 = optimizeTextDisplayWithCache(
      mockSlice,
      mockConfig,
      DEFAULT_TEXT_DISPLAY_OPTIONS
    );
    const result2 = optimizeTextDisplayWithCache(
      mockSlice,
      mockConfig,
      DEFAULT_TEXT_DISPLAY_OPTIONS
    );

    // 第二次调用应该返回相同的结果（从缓存获取）
    expect(result1).toEqual(result2);
  });

  it('应该为不同的配置生成不同的缓存键', () => {
    const config1 = { ...mockConfig, deviceType: DeviceType.MOBILE };
    const config2 = { ...mockConfig, deviceType: DeviceType.DESKTOP };

    const result1 = optimizeTextDisplayWithCache(mockSlice, config1, DEFAULT_TEXT_DISPLAY_OPTIONS);
    const result2 = optimizeTextDisplayWithCache(mockSlice, config2, DEFAULT_TEXT_DISPLAY_OPTIONS);

    // 不同配置应该产生不同的结果
    expect(result1.cssClasses).not.toEqual(result2.cssClasses);
  });

  it('应该提供缓存统计信息', () => {
    optimizeTextDisplayWithCache(mockSlice, mockConfig, DEFAULT_TEXT_DISPLAY_OPTIONS);

    const stats = textDisplayCache.getStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.maxSize).toBeGreaterThan(0);
    expect(typeof stats.hitRate).toBe('number');
  });
});

describe('边界情况和错误处理', () => {
  it('应该处理空切片数组', () => {
    const config: ResponsiveTextConfig = {
      deviceType: DeviceType.DESKTOP,
      displayMode: DisplayMode.STANDARD,
      availableWidth: 1920,
      availableHeight: 1080,
      isTouchDevice: false,
    };

    const results = optimizeMultipleTextDisplay([], config, DEFAULT_TEXT_DISPLAY_OPTIONS);
    expect(results).toHaveLength(0);
  });

  it('应该处理极小的可用空间', () => {
    const config: ResponsiveTextConfig = {
      deviceType: DeviceType.MOBILE,
      displayMode: DisplayMode.MINIMAL,
      availableWidth: 100,
      availableHeight: 100,
      isTouchDevice: true,
    };

    const result = optimizeTextDisplay(
      createMockImageSlice(),
      config,
      DEFAULT_TEXT_DISPLAY_OPTIONS
    );

    expect(result.cssClasses).toContain('text-display-mobile');
    expect(result.cssClasses).toContain('text-display-minimal');
    expect(result.cssClasses).toContain('text-display-touch');
  });

  it('应该处理无效的navigator对象', () => {
    const originalNavigator = global.navigator;
    // @ts-ignore
    delete global.navigator;

    expect(() => detectDeviceType()).not.toThrow();
    expect(detectDeviceType()).toBe(DeviceType.DESKTOP);

    global.navigator = originalNavigator;
  });
});
