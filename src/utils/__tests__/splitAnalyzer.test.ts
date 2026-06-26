/**
 * splitAnalyzer 单元测试
 *
 * 测试策略（spec §6）：
 * - 底层纯函数用构造数据精确断言（不依赖像素计算）。
 * - 顶层 analyzeSplitPoints 用合成像素图（白底 + 模拟文字行 + 已知空白带）端到端验证。
 */

import { describe, it, expect } from 'vitest';
import {
  computeVariationProfile,
  smooth,
  findLowVariationBands,
  chooseSplitPoints,
  analyzeSplitPoints,
  DEFAULT_SPLIT_OPTIONS,
} from '../splitAnalyzer';
import type { Band, ChoosePointsOptions } from '../splitAnalyzer';

// ---------- 合成像素图 fixture ----------

/**
 * 生成合成像素图：白底，在指定行区间填充"模拟文字"（x%2 黑白交替条纹），
 * 其余为纯白空白。文字行产生高水平变化率，空白行变化率为 0。
 *
 * @param textRegions 文字行区间数组 [startY, endY)（endY exclusive）
 */
function makeSyntheticImage(
  width: number,
  height: number,
  textRegions: Array<[number, number]>
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  // 全白底（RGBA）
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }
  // 填充模拟文字：x%2===0 处置黑，与白色相邻形成强水平灰度差
  for (const [startY, endY] of textRegions) {
    for (let y = startY; y < endY; y++) {
      for (let x = 0; x < width; x++) {
        if (x % 2 === 0) {
          const idx = (y * width + x) * 4;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
        }
      }
    }
  }
  return data;
}

// ---------- computeVariationProfile ----------

describe('computeVariationProfile', () => {
  it('空白行（纯白）变化率应为 0', () => {
    const width = 20;
    const height = 5;
    const pixels = makeSyntheticImage(width, height, []);
    const profile = computeVariationProfile(pixels, width, height, 1);
    expect(profile).toHaveLength(height);
    profile.forEach(v => expect(v).toBe(0));
  });

  it('文字行变化率应显著大于空白行', () => {
    const width = 20;
    const height = 4;
    // 行 0-1 文字，行 2-3 空白
    const pixels = makeSyntheticImage(width, height, [[0, 2]]);
    const profile = computeVariationProfile(pixels, width, height, 1);
    expect(profile[0]).toBeGreaterThan(0);
    expect(profile[1]).toBeGreaterThan(0);
    expect(profile[2]).toBe(0);
    expect(profile[3]).toBe(0);
    // 文字行变化率远大于空白行
    expect(profile[0]).toBeGreaterThan(profile[2] + 100);
  });

  it('columnStep 降采样应保持行级信号相对关系', () => {
    const width = 40;
    const height = 4;
    const pixels = makeSyntheticImage(width, height, [[0, 2]]);
    const full = computeVariationProfile(pixels, width, height, 1);
    const sampled = computeVariationProfile(pixels, width, height, 4);
    expect(sampled[0]).toBeGreaterThan(sampled[2]);
    expect(sampled[1]).toBeGreaterThan(sampled[3]);
    // 降采样后计算量减少，文字行变化率应低于全采样
    expect(sampled[0]).toBeLessThan(full[0]);
  });

  it('默认 columnStep 应为 4', () => {
    const width = 40;
    const height = 2;
    const pixels = makeSyntheticImage(width, height, [[0, 1]]);
    const withDefault = computeVariationProfile(pixels, width, height);
    const withExplicit = computeVariationProfile(pixels, width, height, 4);
    expect(withDefault).toEqual(withExplicit);
  });
});

// ---------- smooth ----------

describe('smooth', () => {
  it('windowSize=1 应原样返回（不平滑）', () => {
    const profile = [1, 5, 3, 9, 2];
    expect(smooth(profile, 1)).toEqual(profile);
  });

  it('windowSize=3 应做居中滑动平均', () => {
    const profile = [0, 0, 30, 0, 0];
    const result = smooth(profile, 3);
    // 居中窗口 [i-1, i, i+1]，边界只取存在的邻居
    expect(result[0]).toBeCloseTo(0, 5);
    expect(result[1]).toBeCloseTo(10, 5); // avg(0,0,30)
    expect(result[2]).toBeCloseTo(10, 5); // avg(0,30,0)
    expect(result[3]).toBeCloseTo(10, 5); // avg(30,0,0)
    expect(result[4]).toBeCloseTo(0, 5);
  });

  it('平滑应保持数组长度', () => {
    const profile = [1, 2, 3, 4, 5, 6, 7];
    expect(smooth(profile, 3)).toHaveLength(7);
  });
});

// ---------- findLowVariationBands ----------

describe('findLowVariationBands', () => {
  it('应找出连续低变化带并计算中心', () => {
    // 高-低(4行)-高-低(4行)-高
    const profile = [100, 100, 0, 0, 0, 0, 100, 100, 0, 0, 0, 0, 100, 100];
    const bands = findLowVariationBands(profile, 10, 3);
    expect(bands).toHaveLength(2);
    expect(bands[0]).toEqual({ top: 2, bottom: 6, center: 4 });
    expect(bands[1]).toEqual({ top: 8, bottom: 12, center: 10 });
  });

  it('应过滤宽度不足 minBandHeight 的带', () => {
    // 4 行的带（保留）+ 2 行的带（< 3 应过滤）
    const profile = [100, 0, 0, 0, 0, 100, 100, 0, 0, 100];
    const bands = findLowVariationBands(profile, 10, 3);
    expect(bands).toHaveLength(1);
    expect(bands[0]).toEqual({ top: 1, bottom: 5, center: 3 });
  });

  it('全高变化（无低变化带）应返回空', () => {
    const profile = [100, 100, 100, 100];
    expect(findLowVariationBands(profile, 10, 2)).toHaveLength(0);
  });

  it('全低变化应返回一个贯穿全图的带', () => {
    const profile = [0, 0, 0, 0, 0];
    const bands = findLowVariationBands(profile, 10, 2);
    expect(bands).toHaveLength(1);
    expect(bands[0]).toEqual({ top: 0, bottom: 5, center: 2 });
  });
});

// ---------- chooseSplitPoints ----------

describe('chooseSplitPoints', () => {
  /** 构造 chooseSplitPoints 的 options，便于覆盖单字段 */
  const makeOpts = (overrides: Partial<ChoosePointsOptions> = {}): ChoosePointsOptions => ({
    targetHeight: 1000,
    searchWindow: 200,
    mergeThreshold: 500,
    minPageHeight: 500,
    imageHeight: 3000,
    ...overrides,
  });

  it('应在目标高度附近选最近的 band center', () => {
    const bands: Band[] = [
      { top: 950, bottom: 1050, center: 1000 },
      { top: 1950, bottom: 2050, center: 2000 },
    ];
    const points = chooseSplitPoints(bands, makeOpts());
    expect(points).toEqual([1000, 2000]);
  });

  it('无合格 band 时应回退到精确等分点', () => {
    const points = chooseSplitPoints([], makeOpts());
    expect(points).toEqual([1000, 2000]);
  });

  it('图片短于 targetHeight 应返回空（不切）', () => {
    const points = chooseSplitPoints([], makeOpts({ imageHeight: 800 }));
    expect(points).toEqual([]);
  });

  it('末页剩余不足 minPageHeight 应删除末点（并入上页）', () => {
    // imageHeight=2400：候选 [1000, 2000]，末页 2400-2000=400 < 500 → 删末点
    const bands: Band[] = [
      { top: 950, bottom: 1050, center: 1000 },
      { top: 1950, bottom: 2050, center: 2000 },
    ];
    const points = chooseSplitPoints(bands, makeOpts({ imageHeight: 2400 }));
    expect(points).toEqual([1000]);
  });

  it('窗口内无 band 应在该刀回退精确 targetHeight', () => {
    // band center=525 远离 ideal=1000 的窗口 [800,1200]
    const bands: Band[] = [{ top: 500, bottom: 550, center: 525 }];
    const points = chooseSplitPoints(bands, makeOpts());
    expect(points).toEqual([1000, 2000]);
  });

  it('相邻候选点间距小于 mergeThreshold 应合并（防碎页）', () => {
    // searchWindow=600 使第二刀窗口 [1400,2600] 仍覆盖 center=1500
    // 第二候选 1500 距上一刀 1000 仅 500 < mergeThreshold=600 → 合并丢弃
    const bands: Band[] = [
      { top: 980, bottom: 1020, center: 1000 },
      { top: 1480, bottom: 1520, center: 1500 },
    ];
    const points = chooseSplitPoints(
      bands,
      makeOpts({ searchWindow: 600, mergeThreshold: 600 })
    );
    expect(points).toEqual([1000]);
  });
});

// ---------- analyzeSplitPoints（合成图集成） ----------

describe('analyzeSplitPoints（合成图集成）', () => {
  it('切割点应落在预设空白带内', () => {
    // 文字段 [0,950]/[1050,1950]/[2050,2950]，空白带中心约 1000 与 2000
    const width = 60;
    const height = 3000;
    const pixels = makeSyntheticImage(width, height, [
      [0, 950],
      [1050, 1950],
      [2050, 2950],
    ]);
    const points = analyzeSplitPoints(pixels, width, height, { targetHeight: 1000 });
    expect(points).toHaveLength(2);
    expect(points[0]).toBeGreaterThanOrEqual(950);
    expect(points[0]).toBeLessThanOrEqual(1050);
    expect(points[1]).toBeGreaterThanOrEqual(1950);
    expect(points[1]).toBeLessThanOrEqual(2050);
  });

  it('纯白图（无内容）应回退等分', () => {
    const width = 60;
    const height = 3000;
    const pixels = makeSyntheticImage(width, height, []);
    const points = analyzeSplitPoints(pixels, width, height, { targetHeight: 1000 });
    // 全白 → 变化率全 0 → threshold=0 → 无低变化带 → 回退等分
    expect(points).toEqual([1000, 2000]);
  });

  it('密集内容图（无空白带）应回退等分', () => {
    const width = 60;
    const height = 3000;
    const pixels = makeSyntheticImage(width, height, [[0, 3000]]);
    const points = analyzeSplitPoints(pixels, width, height, { targetHeight: 1000 });
    expect(points).toEqual([1000, 2000]);
  });
});

// ---------- 边界情况 ----------

describe('边界情况', () => {
  it('图片短于 targetHeight 应返回空（整图作为唯一切片）', () => {
    const width = 60;
    const height = 800;
    const pixels = makeSyntheticImage(width, height, [[0, 800]]);
    const points = analyzeSplitPoints(pixels, width, height, { targetHeight: 1000 });
    expect(points).toEqual([]);
  });

  it('超短图（height=1）应返回空', () => {
    const pixels = makeSyntheticImage(10, 1, []);
    const points = analyzeSplitPoints(pixels, 10, 1, { targetHeight: 1000 });
    expect(points).toEqual([]);
  });

  it('不传 options 时应使用 DEFAULT_SPLIT_OPTIONS', () => {
    expect(DEFAULT_SPLIT_OPTIONS.targetHeight).toBe(1200);
    // height=100 < 默认 targetHeight=1200 → 不切
    const pixels = makeSyntheticImage(60, 100, []);
    const points = analyzeSplitPoints(pixels, 60, 100);
    expect(points).toEqual([]);
  });
});
