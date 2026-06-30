# API 参考文档

## 📋 概述

本文档提供了长截图分割器项目的完整 API 参考，包括组件接口、Hook 函数、工具函数和配置选项。

---

## 🧩 组件 API

### 核心业务组件

#### ScreenshotSplitter

主要的截图分割组件，负责处理图片上传、分割预览和导出功能。

**文件位置**: `src/components/ScreenshotSplitter.tsx`

**Props 接口**:

```typescript
interface ScreenshotSplitterProps {
  /** 初始分割高度 */
  initialSplitHeight?: number;
  /** 最大文件大小 (字节) */
  maxFileSize?: number;
  /** 支持的文件类型 */
  acceptedFileTypes?: string[];
  /** 分割完成回调 */
  onSplitComplete?: (segments: ImageSegment[]) => void;
  /** 错误处理回调 */
  onError?: (error: Error) => void;
}

interface ImageSegment {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  index: number;
}
```

**使用示例**:

```typescript
import { ScreenshotSplitter } from '../components/ScreenshotSplitter';

const App = () => {
  const handleSplitComplete = (segments: ImageSegment[]) => {
    console.log(`分割完成，共 ${segments.length} 个片段`);
  };

  return (
    <ScreenshotSplitter
      initialSplitHeight={800}
      maxFileSize={10 * 1024 * 1024} // 10MB
      acceptedFileTypes={['image/png', 'image/jpeg']}
      onSplitComplete={handleSplitComplete}
    />
  );
};
```

#### FileUploader

文件上传组件，支持拖拽上传和文件类型验证。

**文件位置**: `src/components/FileUploader.tsx`

**Props 接口**:

```typescript
interface FileUploaderProps {
  /** 接受的文件类型 */
  accept?: string;
  /** 最大文件大小 */
  maxSize?: number;
  /** 是否支持多文件上传 */
  multiple?: boolean;
  /** 文件上传回调 */
  onFileSelect: (files: File[]) => void;
  /** 上传错误回调 */
  onError?: (error: string) => void;
  /** 自定义样式类名 */
  className?: string;
}
```

#### ImagePreview

图片预览组件，支持缩放、分割线标记和导出预览。

**文件位置**: `src/components/ImagePreview.tsx`

**Props 接口**:

```typescript
interface ImagePreviewProps {
  /** 图片源 */
  src: string;
  /** 图片alt文本 */
  alt?: string;
  /** 分割高度 */
  splitHeight: number;
  /** 是否显示分割线 */
  showSplitLines?: boolean;
  /** 缩放比例 */
  scale?: number;
  /** 点击回调 */
  onClick?: () => void;
}
```

#### ExportControls

导出控制组件，提供 PDF 和 ZIP 格式导出功能。

**文件位置**: `src/components/ExportControls.tsx`

**Props 接口**:

```typescript
interface ExportControlsProps {
  /** 图片片段数据 */
  segments: ImageSegment[];
  /** 文件名前缀 */
  filenamePrefix?: string;
  /** 是否禁用导出 */
  disabled?: boolean;
  /** 导出开始回调 */
  onExportStart?: (format: 'pdf' | 'zip') => void;
  /** 导出完成回调 */
  onExportComplete?: (format: 'pdf' | 'zip', success: boolean) => void;
}
```

### 共享组件

#### Button

通用按钮组件，支持多种样式变体和状态。

**文件位置**: `shared-components/components/Button/Button.tsx`

**Props 接口**:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 是否为加载状态 */
  loading?: boolean;
  /** 加载文本 */
  loadingText?: string;
  /** 按钮图标 */
  icon?: React.ReactNode;
  /** 图标位置 */
  iconPosition?: 'left' | 'right';
}
```

**使用示例**:

```typescript
import { Button } from '../../shared-components/components/Button';

<Button
  variant="primary"
  size="large"
  loading={isProcessing}
  loadingText="处理中..."
  onClick={handleProcess}
>
  开始处理
</Button>
```

#### CopyrightInfo

版权信息组件，支持多语言和主题配置。

**文件位置**: `shared-components/components/CopyrightInfo/CopyrightInfo.tsx`

**Props 接口**:

```typescript
interface CopyrightInfoProps {
  /** 版权所有者 */
  owner: string;
  /** 版权年份 */
  year?: number | string;
  /** 许可证类型 */
  license?: string;
  /** 项目链接 */
  projectUrl?: string;
  /** 主题 */
  theme?: 'light' | 'dark';
  /** 语言 */
  language?: 'zh-CN' | 'en';
}
```

---

## 🪝 Hooks API

### useImageProcessor

图片处理核心 Hook，提供图片分割和处理功能。

**文件位置**: `src/hooks/useImageProcessor.ts`

**接口定义**:

```typescript
interface UseImageProcessorReturn {
  /** 处理图片 */
  processImage: (file: File, splitHeight: number) => Promise<ImageSegment[]>;
  /** 当前处理状态 */
  processing: boolean;
  /** 处理进度 (0-100) */
  progress: number;
  /** 错误信息 */
  error: string | null;
  /** 重置状态 */
  reset: () => void;
}

const useImageProcessor = (): UseImageProcessorReturn;
```

**使用示例**:

```typescript
import { useImageProcessor } from '../hooks/useImageProcessor';

const Component = () => {
  const { processImage, processing, progress, error, reset } = useImageProcessor();

  const handleFileUpload = async (file: File) => {
    try {
      const segments = await processImage(file, 800);
      console.log('处理完成:', segments);
    } catch (err) {
      console.error('处理失败:', err);
    }
  };

  return (
    <div>
      {processing && <div>处理进度: {progress}%</div>}
      {error && <div>错误: {error}</div>}
    </div>
  );
};
```

### useAppState

应用全局状态管理 Hook。

**文件位置**: `src/hooks/useAppState.ts`

**接口定义**:

```typescript
interface AppState {
  currentImage: File | null;
  splitHeight: number;
  segments: ImageSegment[];
  isProcessing: boolean;
  language: 'zh-CN' | 'en';
}

interface UseAppStateReturn {
  /** 当前应用状态 */
  state: AppState;
  /** 更新图片 */
  setCurrentImage: (image: File | null) => void;
  /** 更新分割高度 */
  setSplitHeight: (height: number) => void;
  /** 更新图片片段 */
  setSegments: (segments: ImageSegment[]) => void;
  /** 更新处理状态 */
  setProcessing: (processing: boolean) => void;
  /** 切换语言 */
  toggleLanguage: () => void;
  /** 重置状态 */
  resetState: () => void;
}
```

### useI18n

国际化管理 Hook。

**文件位置**: `src/hooks/useI18n.ts`

**接口定义**:

```typescript
interface UseI18nReturn {
  /** 当前语言 */
  language: 'zh-CN' | 'en';
  /** 翻译函数 */
  t: (key: string, params?: Record<string, any>) => string;
  /** 切换语言 */
  setLanguage: (language: 'zh-CN' | 'en') => void;
  /** 可用语言列表 */
  availableLanguages: Array<{
    code: 'zh-CN' | 'en';
    name: string;
    nativeName: string;
  }>;
}
```

### useWorker

Web Worker 集成 Hook。

**文件位置**: `src/hooks/useWorker.ts`

**接口定义**:

```typescript
interface UseWorkerReturn<T, R> {
  /** 执行 Worker 任务 */
  runWorker: (data: T) => Promise<R>;
  /** Worker 是否忙碌 */
  isWorking: boolean;
  /** 终止 Worker */
  terminate: () => void;
}

function useWorker<T = any, R = any>(workerScript: string): UseWorkerReturn<T, R>;
```

---

## 🛠️ 工具函数 API

### 图片处理工具

#### textFormatter

文本格式化工具，提供各种文本处理功能。

**文件位置**: `src/utils/textFormatter.ts`

```typescript
interface TextFormatterOptions {
  maxLength?: number;
  ellipsis?: string;
  preserveWords?: boolean;
}

export class TextFormatter {
  /** 截断文本 */
  static truncate(text: string, options: TextFormatterOptions): string;

  /** 首字母大写 */
  static capitalize(text: string): string;

  /** 驼峰转换 */
  static camelCase(text: string): string;

  /** 短横线分隔 */
  static kebabCase(text: string): string;

  /** 格式化文件大小 */
  static formatFileSize(bytes: number): string;
}
```

#### pdfExporter

PDF 导出工具。

**文件位置**: `src/utils/pdfExporter.ts`

```typescript
interface PDFExportOptions {
  filename?: string;
  quality?: number;
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  pageSize?: 'a4' | 'a3' | 'letter';
}

export class PDFExporter {
  /** 导出图片片段为 PDF */
  static exportSegmentsToPDF(segments: ImageSegment[], options?: PDFExportOptions): Promise<void>;

  /** 获取 PDF 预览 */
  static generatePreview(segments: ImageSegment[]): Promise<string>;
}
```

#### zipExporter

ZIP 导出工具。

**文件位置**: `src/utils/zipExporter.ts`

```typescript
interface ZIPExportOptions {
  filename?: string;
  compression?: number;
  filenameTemplate?: string;
}

export class ZIPExporter {
  /** 导出图片片段为 ZIP */
  static exportSegmentsToZIP(segments: ImageSegment[], options?: ZIPExportOptions): Promise<void>;

  /** 估算压缩后大小 */
  static estimateCompressedSize(segments: ImageSegment[]): number;
}
```

### 性能监控工具

#### performanceMonitor

性能监控工具，收集和分析性能指标。

**文件位置**: `src/utils/analytics/performanceMonitor.ts`

```typescript
interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export class PerformanceMonitor {
  /** 开始监控 */
  static startMonitoring(): void;

  /** 停止监控 */
  static stopMonitoring(): void;

  /** 获取性能指标 */
  static getMetrics(): Promise<PerformanceMetrics>;

  /** 记录自定义指标 */
  static recordCustomMetric(name: string, value: number): void;

  /** 获取报告 */
  static generateReport(): Promise<PerformanceReport>;
}
```

---

## ⚙️ 配置 API

### 应用配置

#### app.config.ts

应用主配置文件。

**文件位置**: `config/app/app.config.ts`

```typescript
interface AppConfig {
  /** 应用名称 */
  name: string;
  /** 应用版本 */
  version: string;
  /** 默认语言 */
  defaultLanguage: 'zh-CN' | 'en';
  /** 最大文件大小 */
  maxFileSize: number;
  /** 支持的文件类型 */
  supportedFileTypes: string[];
  /** 默认分割高度 */
  defaultSplitHeight: number;
  /** 性能监控配置 */
  performance: {
    enableMonitoring: boolean;
    sampleRate: number;
  };
}

export const appConfig: AppConfig;
```

#### routing.config.ts

路由配置文件。

**文件位置**: `config/app/routing.config.ts`

```typescript
interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  title?: string;
  meta?: Record<string, any>;
}

export const routes: RouteConfig[];
```

### 环境配置

#### environment.config.ts

环境配置管理。

**文件位置**: `config/env/environment.config.ts`

```typescript
interface EnvironmentConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  VITE_USE_ABSOLUTE_URLS: boolean;
  VITE_ASSETS_BASE_URL: string;
  VITE_CDN_BASE_URL: string;
  VITE_GITHUB_PAGES: boolean;
  VITE_GITHUB_REPOSITORY: string;
  VITE_BASE_PATH: string;
}

export const envConfig: EnvironmentConfig;
```

---

## 🧪 测试 API

### 测试工具

#### 测试配置

**文件位置**: `vitest.config.ts`

```typescript
interface TestConfig {
  testMatch: string[];
  coverage: {
    provider: string;
    threshold: {
      global: {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
      };
    };
  };
}
```

#### 测试辅助函数

**文件位置**: `src/test-setup.ts`

```typescript
/** 渲染组件用于测试 */
export function renderComponent(
  component: React.ReactElement,
  options?: RenderOptions
): RenderResult;

/** 模拟文件上传 */
export function mockFileUpload(file: File, element: HTMLElement): Promise<void>;

/** 等待异步操作完成 */
export function waitForAsync(callback: () => Promise<any>, timeout?: number): Promise<any>;
```

---

## 📊 类型定义

### 核心类型

```typescript
// 图片片段类型
export interface ImageSegment {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  index: number;
  size?: number;
}

// 应用状态类型
export interface AppState {
  currentImage: File | null;
  splitHeight: number;
  segments: ImageSegment[];
  isProcessing: boolean;
  language: 'zh-CN' | 'en';
}

// 导出选项类型
export interface ExportOptions {
  format: 'pdf' | 'zip';
  filename?: string;
  quality?: number;
  compression?: number;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}
```

### 工具类型

```typescript
// 异步状态类型
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// 事件处理函数类型
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

// 配置验证类型
export type ConfigValidator<T> = (config: T) => boolean | string;
```

---

## 🔗 相关链接

- **[项目文档索引](./PROJECT-INDEX.md)** - 完整项目文档导航
- **[前端技术规范](./frontend-spec-new.md)** - 架构设计和编码规范
- **[配置管理文档](./configuration.md)** - 环境配置和部署指南
- **[主 README](../README.md)** - 项目概述和快速开始

---

_📝 最后更新: 2025-08-26_  
_📋 API 版本: v1.0.0_  
_🔄 更新频率: 随项目版本更新_
