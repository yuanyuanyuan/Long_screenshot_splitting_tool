/**
 * 文字格式化工具函数单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  formatSliceInfo,
  formatImageSliceInfo,
  formatMultipleSliceInfo,
  formatMultipleImageSliceInfo,
  getSimplifiedSliceTitle,
  getSliceDimensions,
  getSliceFileSize,
  type SliceDisplayInfo,
} from '../textFormatter';
import type { ImageSlice } from '../../types';

// 模拟数据
const createMockSliceInfo = (overrides: Partial<SliceDisplayInfo> = {}): SliceDisplayInfo => ({
  index: 0,
  width: 800,
  height: 600,
  size: 1024000, // 1MB
  ...overrides,
});

const createMockImageSlice = (overrides: Partial<ImageSlice> = {}): ImageSlice => ({
  index: 0,
  width: 800,
  height: 600,
  blob: new Blob(['test'], { type: 'image/png' }),
  url: 'blob:test-url',
  ...overrides,
});

describe('formatSliceInfo', () => {
  it('应该正确格式化基本切片信息', () => {
    const slice = createMockSliceInfo();
    const result = formatSliceInfo(slice);

    expect(result.title).toBe('切片 1');
    expect(result.dimensions).toBe('800 × 600');
    expect(result.fileSize).toBe('1000 KB');
    expect(result.fullText).toBe('切片 1 800 × 600 | 1000 KB');
  });

  it('应该正确处理不同的索引值', () => {
    const slice = createMockSliceInfo({ index: 5 });
    const result = formatSliceInfo(slice);

    expect(result.title).toBe('切片 6');
    expect(result.fullText).toBe('切片 6 800 × 600 | 1000 KB');
  });

  it('应该正确处理不同的尺寸', () => {
    const slice = createMockSliceInfo({ width: 1920, height: 1080 });
    const result = formatSliceInfo(slice);

    expect(result.dimensions).toBe('1920 × 1080');
    expect(result.fullText).toBe('切片 1 1920 × 1080 | 1000 KB');
  });

  it('应该正确处理不同的文件大小', () => {
    const slice = createMockSliceInfo({ size: 512000 }); // 500KB
    const result = formatSliceInfo(slice);

    expect(result.fileSize).toBe('500 KB');
    expect(result.fullText).toBe('切片 1 800 × 600 | 500 KB');
  });

  it('应该正确处理小于1KB的文件', () => {
    const slice = createMockSliceInfo({ size: 512 }); // 0.5KB
    const result = formatSliceInfo(slice);

    expect(result.fileSize).toBe('1 KB'); // 四舍五入到1KB
  });

  it('应该正确处理0字节文件', () => {
    const slice = createMockSliceInfo({ size: 0 });
    const result = formatSliceInfo(slice);

    expect(result.fileSize).toBe('0 KB');
  });

  it('应该在参数无效时抛出错误', () => {
    expect(() => formatSliceInfo(null as unknown as SliceDisplayInfo)).toThrow(
      'slice参数必须是一个对象'
    );
    expect(() => formatSliceInfo(undefined as unknown as SliceDisplayInfo)).toThrow(
      'slice参数必须是一个对象'
    );
    expect(() => formatSliceInfo('invalid' as unknown as SliceDisplayInfo)).toThrow(
      'slice参数必须是一个对象'
    );
  });

  it('应该在index无效时抛出错误', () => {
    expect(() => formatSliceInfo(createMockSliceInfo({ index: -1 }))).toThrow('index必须是非负数');
    expect(() =>
      formatSliceInfo(createMockSliceInfo({ index: 'invalid' as unknown as number }))
    ).toThrow('index必须是非负数');
  });

  it('应该在width无效时抛出错误', () => {
    expect(() => formatSliceInfo(createMockSliceInfo({ width: 0 }))).toThrow('width必须是正数');
    expect(() => formatSliceInfo(createMockSliceInfo({ width: -100 }))).toThrow('width必须是正数');
  });

  it('应该在height无效时抛出错误', () => {
    expect(() => formatSliceInfo(createMockSliceInfo({ height: 0 }))).toThrow('height必须是正数');
    expect(() => formatSliceInfo(createMockSliceInfo({ height: -100 }))).toThrow(
      'height必须是正数'
    );
  });

  it('应该在size无效时抛出错误', () => {
    expect(() => formatSliceInfo(createMockSliceInfo({ size: -1 }))).toThrow('size必须是非负数');
    expect(() =>
      formatSliceInfo(createMockSliceInfo({ size: 'invalid' as unknown as number }))
    ).toThrow('size必须是非负数');
  });
});

describe('formatImageSliceInfo', () => {
  it('应该正确格式化ImageSlice对象', () => {
    const imageSlice = createMockImageSlice();
    const result = formatImageSliceInfo(imageSlice);

    expect(result.title).toBe('切片 1');
    expect(result.dimensions).toBe('800 × 600');
    expect(result.fileSize).toBe('0 KB'); // Blob size is very small
    expect(result.fullText).toContain('切片 1 800 × 600 |');
  });

  it('应该在ImageSlice无效时抛出错误', () => {
    expect(() => formatImageSliceInfo(null as unknown as ImageSlice)).toThrow(
      'imageSlice参数必须是一个ImageSlice对象'
    );
    expect(() => formatImageSliceInfo(undefined as unknown as ImageSlice)).toThrow(
      'imageSlice参数必须是一个ImageSlice对象'
    );
  });

  it('应该在blob无效时抛出错误', () => {
    const invalidSlice = { ...createMockImageSlice(), blob: null as unknown as Blob };
    expect(() => formatImageSliceInfo(invalidSlice)).toThrow('imageSlice必须包含有效的blob对象');
  });
});

describe('formatMultipleSliceInfo', () => {
  it('应该正确格式化多个切片信息', () => {
    const slices = [
      createMockSliceInfo({ index: 0, size: 1024000 }),
      createMockSliceInfo({ index: 1, size: 512000 }),
      createMockSliceInfo({ index: 2, size: 2048000 }),
    ];

    const results = formatMultipleSliceInfo(slices);

    expect(results).toHaveLength(3);
    expect(results[0].fullText).toBe('切片 1 800 × 600 | 1000 KB');
    expect(results[1].fullText).toBe('切片 2 800 × 600 | 500 KB');
    expect(results[2].fullText).toBe('切片 3 800 × 600 | 2000 KB');
  });

  it('应该在输入不是数组时抛出错误', () => {
    expect(() => formatMultipleSliceInfo(null as unknown as SliceDisplayInfo[])).toThrow(
      'slices参数必须是数组'
    );
    expect(() => formatMultipleSliceInfo('invalid' as unknown as SliceDisplayInfo[])).toThrow(
      'slices参数必须是数组'
    );
  });

  it('应该在某个切片无效时抛出详细错误', () => {
    const slices = [
      createMockSliceInfo(),
      createMockSliceInfo({ index: -1 }), // 无效的index
    ];

    expect(() => formatMultipleSliceInfo(slices)).toThrow('第2个切片格式化失败');
  });
});

describe('formatMultipleImageSliceInfo', () => {
  it('应该正确格式化多个ImageSlice对象', () => {
    const imageSlices = [
      createMockImageSlice({ index: 0 }),
      createMockImageSlice({ index: 1 }),
      createMockImageSlice({ index: 2 }),
    ];

    const results = formatMultipleImageSliceInfo(imageSlices);

    expect(results).toHaveLength(3);
    expect(results[0].title).toBe('切片 1');
    expect(results[1].title).toBe('切片 2');
    expect(results[2].title).toBe('切片 3');
  });

  it('应该在输入不是数组时抛出错误', () => {
    expect(() => formatMultipleImageSliceInfo(null as unknown as ImageSlice[])).toThrow(
      'imageSlices参数必须是数组'
    );
  });
});

describe('getSimplifiedSliceTitle', () => {
  it('应该返回简化的切片标题', () => {
    const slice = createMockSliceInfo({ index: 5 });
    const result = getSimplifiedSliceTitle(slice);

    expect(result).toBe('切片 6');
  });

  it('应该在切片信息无效时抛出错误', () => {
    expect(() => getSimplifiedSliceTitle(null as unknown as SliceDisplayInfo)).toThrow(
      '无效的切片信息'
    );
    expect(() =>
      getSimplifiedSliceTitle({ index: 'invalid' } as unknown as SliceDisplayInfo)
    ).toThrow('无效的切片信息');
  });
});

describe('getSliceDimensions', () => {
  it('应该返回正确的尺寸文本', () => {
    const slice = createMockSliceInfo({ width: 1920, height: 1080 });
    const result = getSliceDimensions(slice);

    expect(result).toBe('1920 × 1080');
  });

  it('应该在尺寸信息无效时抛出错误', () => {
    expect(() => getSliceDimensions(null as unknown as SliceDisplayInfo)).toThrow(
      '无效的切片尺寸信息'
    );
    expect(() => getSliceDimensions({ width: 'invalid' } as unknown as SliceDisplayInfo)).toThrow(
      '无效的切片尺寸信息'
    );
  });
});

describe('getSliceFileSize', () => {
  it('应该返回正确的文件大小文本', () => {
    const slice = createMockSliceInfo({ size: 1536000 }); // 1.5MB
    const result = getSliceFileSize(slice);

    expect(result).toBe('1500 KB');
  });

  it('应该在大小信息无效时抛出错误', () => {
    expect(() => getSliceFileSize(null as unknown as SliceDisplayInfo)).toThrow(
      '无效的切片大小信息'
    );
    expect(() => getSliceFileSize({ size: 'invalid' } as unknown as SliceDisplayInfo)).toThrow(
      '无效的切片大小信息'
    );
  });
});

describe('边界情况测试', () => {
  it('应该正确处理极大的文件', () => {
    const slice = createMockSliceInfo({ size: 1073741824 }); // 1GB
    const result = formatSliceInfo(slice);

    expect(result.fileSize).toBe('1048576 KB');
  });

  it('应该正确处理极大的尺寸', () => {
    const slice = createMockSliceInfo({ width: 99999, height: 99999 });
    const result = formatSliceInfo(slice);

    expect(result.dimensions).toBe('99999 × 99999');
  });

  it('应该正确处理索引为0的情况', () => {
    const slice = createMockSliceInfo({ index: 0 });
    const result = formatSliceInfo(slice);

    expect(result.title).toBe('切片 1'); // 显示时从1开始
  });
});
