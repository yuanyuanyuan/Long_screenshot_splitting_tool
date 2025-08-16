/**
 * 文字格式化工具函数
 * 用于统一格式化切片信息显示
 */

import type { ImageSlice } from '../types';

/**
 * 格式化后的切片信息接口
 */
export interface FormattedSliceInfo {
  /** 切片标题: "切片 {index}" */
  title: string;
  /** 尺寸信息: "{width} × {height}" */
  dimensions: string;
  /** 文件大小: "{size} KB" */
  fileSize: string;
  /** 完整格式化文本: "切片 {index} {width} × {height} | {size} KB" */
  fullText: string;
}

/**
 * 切片显示信息接口
 */
export interface SliceDisplayInfo {
  /** 切片索引 (从0开始) */
  index: number;
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
  /** 文件大小 (字节) */
  size: number;
}

/**
 * 格式化切片信息
 *
 * @param slice - 切片信息对象
 * @returns 格式化后的切片信息
 *
 * @example
 * ```typescript
 * const slice = { index: 0, width: 800, height: 600, size: 1024000 };
 * const formatted = formatSliceInfo(slice);
 * console.log(formatted.fullText); // "切片 1 800 × 600 | 1000 KB"
 * ```
 */
export function formatSliceInfo(slice: SliceDisplayInfo): FormattedSliceInfo {
  // 输入验证
  if (!slice || typeof slice !== 'object') {
    throw new Error('formatSliceInfo: slice参数必须是一个对象');
  }

  const { index, width, height, size } = slice;

  // 参数验证
  if (typeof index !== 'number' || index < 0) {
    throw new Error('formatSliceInfo: index必须是非负数');
  }
  if (typeof width !== 'number' || width <= 0) {
    throw new Error('formatSliceInfo: width必须是正数');
  }
  if (typeof height !== 'number' || height <= 0) {
    throw new Error('formatSliceInfo: height必须是正数');
  }
  if (typeof size !== 'number' || size < 0) {
    throw new Error('formatSliceInfo: size必须是非负数');
  }

  // 计算KB大小 (四舍五入到整数)
  const sizeInKB = Math.round(size / 1024);

  // 格式化各部分信息
  const title = `切片 ${index + 1}`;
  const dimensions = `${width} × ${height}`;
  const fileSize = `${sizeInKB} KB`;
  const fullText = `${title} ${dimensions} | ${fileSize}`;

  return {
    title,
    dimensions,
    fileSize,
    fullText,
  };
}

/**
 * 从ImageSlice对象格式化切片信息
 *
 * @param imageSlice - ImageSlice对象
 * @returns 格式化后的切片信息
 *
 * @example
 * ```typescript
 * const imageSlice: ImageSlice = {
 *   index: 0,
 *   width: 800,
 *   height: 600,
 *   blob: new Blob([...], { type: 'image/png' }),
 *   url: 'blob:...'
 * };
 * const formatted = formatImageSliceInfo(imageSlice);
 * console.log(formatted.fullText); // "切片 1 800 × 600 | 123 KB"
 * ```
 */
export function formatImageSliceInfo(imageSlice: ImageSlice): FormattedSliceInfo {
  if (!imageSlice || typeof imageSlice !== 'object') {
    throw new Error('formatImageSliceInfo: imageSlice参数必须是一个ImageSlice对象');
  }

  const { index, width, height, blob } = imageSlice;

  // 验证必要属性
  if (!blob || typeof blob.size !== 'number') {
    throw new Error('formatImageSliceInfo: imageSlice必须包含有效的blob对象');
  }

  return formatSliceInfo({
    index,
    width,
    height,
    size: blob.size,
  });
}

/**
 * 批量格式化多个切片信息
 *
 * @param slices - 切片信息数组
 * @returns 格式化后的切片信息数组
 *
 * @example
 * ```typescript
 * const slices = [
 *   { index: 0, width: 800, height: 600, size: 1024000 },
 *   { index: 1, width: 800, height: 400, size: 512000 }
 * ];
 * const formatted = formatMultipleSliceInfo(slices);
 * console.log(formatted.map(f => f.fullText));
 * // ["切片 1 800 × 600 | 1000 KB", "切片 2 800 × 400 | 500 KB"]
 * ```
 */
export function formatMultipleSliceInfo(slices: SliceDisplayInfo[]): FormattedSliceInfo[] {
  if (!Array.isArray(slices)) {
    throw new Error('formatMultipleSliceInfo: slices参数必须是数组');
  }

  return slices.map((slice, arrayIndex) => {
    try {
      return formatSliceInfo(slice);
    } catch (error) {
      throw new Error(
        `formatMultipleSliceInfo: 第${arrayIndex + 1}个切片格式化失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * 批量格式化多个ImageSlice对象
 *
 * @param imageSlices - ImageSlice对象数组
 * @returns 格式化后的切片信息数组
 */
export function formatMultipleImageSliceInfo(imageSlices: ImageSlice[]): FormattedSliceInfo[] {
  if (!Array.isArray(imageSlices)) {
    throw new Error('formatMultipleImageSliceInfo: imageSlices参数必须是数组');
  }

  return imageSlices.map((slice, arrayIndex) => {
    try {
      return formatImageSliceInfo(slice);
    } catch (error) {
      throw new Error(
        `formatMultipleImageSliceInfo: 第${arrayIndex + 1}个切片格式化失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * 获取简化的切片标题 (仅用于移动端等空间受限场景)
 *
 * @param slice - 切片信息对象
 * @returns 简化的标题文本
 *
 * @example
 * ```typescript
 * const slice = { index: 0, width: 800, height: 600, size: 1024000 };
 * const title = getSimplifiedSliceTitle(slice);
 * console.log(title); // "切片 1"
 * ```
 */
export function getSimplifiedSliceTitle(slice: SliceDisplayInfo): string {
  if (!slice || typeof slice.index !== 'number') {
    throw new Error('getSimplifiedSliceTitle: 无效的切片信息');
  }

  return `切片 ${slice.index + 1}`;
}

/**
 * 获取切片尺寸文本
 *
 * @param slice - 切片信息对象
 * @returns 尺寸文本
 *
 * @example
 * ```typescript
 * const slice = { index: 0, width: 800, height: 600, size: 1024000 };
 * const dimensions = getSliceDimensions(slice);
 * console.log(dimensions); // "800 × 600"
 * ```
 */
export function getSliceDimensions(slice: SliceDisplayInfo): string {
  if (!slice || typeof slice.width !== 'number' || typeof slice.height !== 'number') {
    throw new Error('getSliceDimensions: 无效的切片尺寸信息');
  }

  return `${slice.width} × ${slice.height}`;
}

/**
 * 获取切片文件大小文本
 *
 * @param slice - 切片信息对象
 * @returns 文件大小文本
 *
 * @example
 * ```typescript
 * const slice = { index: 0, width: 800, height: 600, size: 1024000 };
 * const fileSize = getSliceFileSize(slice);
 * console.log(fileSize); // "1000 KB"
 * ```
 */
export function getSliceFileSize(slice: SliceDisplayInfo): string {
  if (!slice || typeof slice.size !== 'number') {
    throw new Error('getSliceFileSize: 无效的切片大小信息');
  }

  const sizeInKB = Math.round(slice.size / 1024);
  return `${sizeInKB} KB`;
}
