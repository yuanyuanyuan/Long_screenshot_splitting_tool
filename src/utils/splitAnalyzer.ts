/**
 * 内容感知切割分析器（Content-Aware Split Analyzer）
 *
 * 设计依据：docs/superpowers/specs/2026-06-25-content-aware-split-design.md §4
 *
 * 核心原则：算法与 I/O 分离。本模块全部为纯函数，无 DOM/canvas/Worker 依赖，
 * 可独立单测。Worker 仅负责 decode/getImageData/drawImage 胶水并调用本模块。
 *
 * 流水线（spec §4.2 不变量）：
 *   压成行信号 → 去噪 → 找空白带 → 页高驱动选点 → 最小间距保护 → 无解安全回退
 *
 * ⚠️ thresholdRatio / minBandHeight / smoothingWindow 为起始经验值（spec §4.4），
 *    必须用真实长截图校准后回填，不可拍脑袋定死。
 */

/** 低变化水平带：一段连续的「内容空白」行区间 */
export interface Band {
  /** 起始行（inclusive） */
  top: number;
  /** 结束行（exclusive） */
  bottom: number;
  /** 带中心行，作为切割点候选 */
  center: number;
}

/**
 * 分析阶段全部可调参数（ratio 形式以适配不同尺寸图片）。
 * 默认值见 DEFAULT_SPLIT_OPTIONS。
 */
export interface SplitOptions {
  /** 目标页高（复用现有 splitHeight 语义） */
  targetHeight: number;
  /** 列降采样步长，越大越快、精度越低 */
  columnStep: number;
  /** 低变化阈值倍数：阈值 = mean(profile) × thresholdRatio */
  thresholdRatio: number;
  /** 平滑窗口大小（行），约一行行距；1 表示不平滑 */
  smoothingWindow: number;
  /** 空白带最小高度（行），用于过滤噪声细缝 */
  minBandHeight: number;
  /** 搜索范围占 targetHeight 的比例（±） */
  searchWindowRatio: number;
  /** 最小切割间距占 targetHeight 的比例，防碎页 */
  mergeRatio: number;
  /** 单页最小高度占 targetHeight 的比例，末页合并依据 */
  minPageRatio: number;
}

/** 默认参数（spec §4.3，部分为起始经验值，待校准） */
export const DEFAULT_SPLIT_OPTIONS: SplitOptions = {
  targetHeight: 1200,
  columnStep: 4,
  thresholdRatio: 0.3,
  smoothingWindow: 8,
  minBandHeight: 8,
  searchWindowRatio: 0.2,
  mergeRatio: 0.5,
  minPageRatio: 0.5,
};

/** chooseSplitPoints 的参数（已由 ratio 换算为像素绝对值） */
export interface ChoosePointsOptions {
  /** 目标页高 */
  targetHeight: number;
  /** 搜索范围（±像素） */
  searchWindow: number;
  /** 最小切割间距（像素） */
  mergeThreshold: number;
  /** 单页最小高度（像素） */
  minPageHeight: number;
  /** 图像总高度 */
  imageHeight: number;
}

/**
 * 计算行级水平变化率（spec §4.2 第 1 步）。
 *
 * 对每行 y：在采样列上累加水平相邻像素的【灰度差绝对值】。
 * 灰度 = 0.299R + 0.587G + 0.114B；行变化率反映该行内容密度，
 * 文字行高、空白行接近 0。变化率不依赖背景色检测，对多背景图更鲁棒。
 *
 * @param pixels   RGBA 像素数据（每像素 4 字节）
 * @param width    图像宽度（像素）
 * @param height   图像高度（像素）
 * @param columnStep 列降采样步长（默认 4，计算量降至 1/columnStep）
 * @returns 长度为 height 的数组，profile[y] = 第 y 行的总变化率
 */
export function computeVariationProfile(
  pixels: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  columnStep: number = DEFAULT_SPLIT_OPTIONS.columnStep
): number[] {
  const profile: number[] = new Array(height).fill(0);
  const step = Math.max(1, Math.floor(columnStep));

  for (let y = 0; y < height; y++) {
    const rowBase = y * width;
    let variation = 0;
    // 采样列 x = step, 2·step, ...，比较像素 x 与其左邻 x-1 的灰度差
    for (let x = step; x < width; x += step) {
      const idxCurr = (rowBase + x) * 4;
      const idxPrev = (rowBase + x - 1) * 4;
      const grayCurr =
        0.299 * pixels[idxCurr] + 0.587 * pixels[idxCurr + 1] + 0.114 * pixels[idxCurr + 2];
      const grayPrev =
        0.299 * pixels[idxPrev] + 0.587 * pixels[idxPrev + 1] + 0.114 * pixels[idxPrev + 2];
      variation += Math.abs(grayCurr - grayPrev);
    }
    profile[y] = variation;
  }
  return profile;
}

/**
 * 居中滑动平均平滑（spec §4.2 第 2 步）。
 * 消除单行噪声；windowSize=1 时原样返回（不平滑）。边界处只取存在的邻居。
 *
 * @param profile    变化率曲线
 * @param windowSize 窗口大小（行）；越大越平滑
 */
export function smooth(profile: number[], windowSize: number): number[] {
  const len = profile.length;
  if (len === 0) return [];

  const window = Math.max(1, Math.floor(windowSize));
  if (window === 1) return [...profile];

  const half = Math.floor(window / 2);
  const result: number[] = new Array(len);
  for (let i = 0; i < len; i++) {
    let sum = 0;
    let count = 0;
    for (let d = -half; d <= half; d++) {
      const j = i + d;
      if (j >= 0 && j < len) {
        sum += profile[j];
        count++;
      }
    }
    result[i] = count > 0 ? sum / count : 0;
  }
  return result;
}

/**
 * 找出连续的低变化水平带（spec §4.2 第 3 步）。
 *
 * 连续多行 variation < threshold 且宽度 ≥ minBandHeight 的区间记为一个 Band。
 * center 取区间中点，作为切割点候选。
 *
 * @param profile      （平滑后的）变化率曲线
 * @param threshold    低变化判定阈值（绝对值）
 * @param minBandHeight 空白带最小高度，过滤噪声细缝
 */
export function findLowVariationBands(
  profile: number[],
  threshold: number,
  minBandHeight: number
): Band[] {
  const bands: Band[] = [];
  const len = profile.length;
  const minHeight = Math.max(1, Math.floor(minBandHeight));

  let y = 0;
  while (y < len) {
    if (profile[y] < threshold) {
      const top = y;
      while (y < len && profile[y] < threshold) {
        y++;
      }
      const bottom = y; // exclusive
      if (bottom - top >= minHeight) {
        bands.push({ top, bottom, center: Math.floor((top + bottom) / 2) });
      }
    } else {
      y++;
    }
  }
  return bands;
}

/**
 * 页高驱动选点（spec §4.2 第 4 步 + §4.5 边界）。
 *
 * 从 0 起每推进约 targetHeight，在 ±searchWindow 内选最近 band.center；
 * 窗口内无合格 band → 该刀回退精确 targetHeight；相邻候选间距 < mergeThreshold
 * → 丢弃（防碎页）；末页剩余 < minPageHeight → 删除末点（并入上页）。
 *
 * 安全原则：任何不确定情况回退等分，绝不切得比固定高度等分差。
 *
 * @returns 切割点 y 坐标数组（长度 = 切片数 - 1）；空数组表示不切
 */
export function chooseSplitPoints(bands: Band[], options: ChoosePointsOptions): number[] {
  const { targetHeight, searchWindow, mergeThreshold, minPageHeight, imageHeight } = options;
  const points: number[] = [];

  // 图片不足以再切 → 整图作为唯一切片
  if (imageHeight <= targetHeight) {
    return [];
  }

  let cursor = 0;
  while (cursor + targetHeight < imageHeight) {
    const ideal = cursor + targetHeight;
    const lo = ideal - searchWindow;
    const hi = ideal + searchWindow;

    // 在 [lo, hi] 内找离 ideal 最近的 band.center；无则回退精确 ideal
    let candidate = ideal;
    let bestDist = Infinity;
    for (const band of bands) {
      if (band.center >= lo && band.center <= hi) {
        const dist = Math.abs(band.center - ideal);
        if (dist < bestDist) {
          bestDist = dist;
          candidate = band.center;
        }
      }
    }

    // 防碎页：候选距上一刀过近则丢弃（cursor 仍按 ideal 推进，避免死循环）
    if (points.length === 0 || candidate - points[points.length - 1] >= mergeThreshold) {
      points.push(candidate);
    }
    cursor = ideal;
  }

  // 末页合并：剩余高度过小 → 删除末点并入上一页
  if (points.length > 0 && imageHeight - points[points.length - 1] < minPageHeight) {
    points.pop();
  }

  return points;
}

/**
 * 内容感知切割分析入口（封装 spec §4.2 全流程）。
 *
 * Worker 调用此函数：传入全图像素 + 尺寸，返回切割点数组。
 * 返回空数组表示「不切」（图片过短）或「无合格空白带需等分回退」——
 * 调用方对空数组应回退到固定高度等分（spec §4.5）。
 *
 * @param pixels  RGBA 像素数据
 * @param width   图像宽度
 * @param height  图像高度
 * @param options 可选参数覆盖（缺省用 DEFAULT_SPLIT_OPTIONS）
 * @returns 切割点 y 坐标数组；空表示需等分回退或不切
 */
export function analyzeSplitPoints(
  pixels: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options?: Partial<SplitOptions>
): number[] {
  const opts = { ...DEFAULT_SPLIT_OPTIONS, ...options };

  // 图片短于目标页高 → 不切
  if (height <= opts.targetHeight) {
    return [];
  }

  // 1. 行变化率
  const profile = computeVariationProfile(pixels, width, height, opts.columnStep);
  // 2. 平滑去噪
  const smoothed = smooth(profile, opts.smoothingWindow);
  // 3. 相对阈值：低于变化率均值的 thresholdRatio 倍视为「低变化」
  const mean = profile.reduce((acc, v) => acc + v, 0) / Math.max(1, profile.length);
  const threshold = mean * opts.thresholdRatio;
  const bands = findLowVariationBands(smoothed, threshold, opts.minBandHeight);
  // 4. 页高驱动选点
  return chooseSplitPoints(bands, {
    targetHeight: opts.targetHeight,
    searchWindow: Math.round(opts.targetHeight * opts.searchWindowRatio),
    mergeThreshold: Math.round(opts.targetHeight * opts.mergeRatio),
    minPageHeight: Math.round(opts.targetHeight * opts.minPageRatio),
    imageHeight: height,
  });
}
