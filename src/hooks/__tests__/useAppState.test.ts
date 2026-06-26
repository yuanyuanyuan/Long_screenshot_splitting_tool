/**
 * useAppState 单元测试
 * 重点验证 ADD_IMAGE_SLICE 按 index 写入（修复 img.onload 异步乱序，spec §5）
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from '../useAppState';
import type { ImageSlice } from '../../types';

const makeSlice = (index: number): ImageSlice => ({
  index,
  blob: new Blob([`slice-${index}`]),
  url: `blob:test-${index}`,
  width: 100,
  height: 200,
});

describe('useAppState - ADD_IMAGE_SLICE 按 index 写入', () => {
  it('乱序到达时应按 index 排列（修复 img.onload 异步乱序）', () => {
    const { result } = renderHook(() => useAppState());

    // 模拟 img.onload 回调导致的乱序：先收到 index 1，再收到 index 0
    act(() => {
      result.current.actions.addImageSlice(makeSlice(1));
    });
    act(() => {
      result.current.actions.addImageSlice(makeSlice(0));
    });

    expect(result.current.state.imageSlices).toHaveLength(2);
    // 按 index 写入后，数组下标与 slice.index 必须一致
    expect(result.current.state.imageSlices[0].index).toBe(0);
    expect(result.current.state.imageSlices[1].index).toBe(1);
  });

  it('顺序到达时也应正确', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.actions.addImageSlice(makeSlice(0));
      result.current.actions.addImageSlice(makeSlice(1));
      result.current.actions.addImageSlice(makeSlice(2));
    });

    expect(result.current.state.imageSlices).toHaveLength(3);
    result.current.state.imageSlices.forEach((slice, i) => {
      expect(slice.index).toBe(i);
    });
  });
});
