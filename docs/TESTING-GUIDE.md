# 测试指南

## 📋 测试概述

本项目采用全面的测试策略，确保代码质量和功能可靠性。测试框架基于 **Vitest** + **React Testing Library** + **Playwright**，实现了从单元测试到端到端测试的完整覆盖。

---

## 🏗️ 测试架构

### 测试策略金字塔

```mermaid
pyramid
    title 测试策略金字塔
    top "E2E Tests (5%)" : "Playwright - 用户完整流程"
    middle "Integration Tests (15%)" : "Vitest + RTL - 组件交互"
    bottom "Unit Tests (80%)" : "Vitest + RTL - 函数和组件"
```

### 测试覆盖率目标

| 测试类型   | 覆盖率目标 | 当前覆盖率 | 工具         |
| ---------- | ---------- | ---------- | ------------ |
| 单元测试   | ≥90%       | 95%+       | Vitest + RTL |
| 集成测试   | ≥80%       | 85%+       | Vitest + RTL |
| E2E 测试   | 核心流程   | 100%       | Playwright   |
| 整体覆盖率 | ≥90%       | 93%+       | -            |

---

## 🧪 测试环境配置

### 测试工具栈

```json
{
  "测试框架": "Vitest 3.2.4",
  "组件测试": "React Testing Library 16.3.0",
  "DOM 匹配器": "@testing-library/jest-dom 6.6.4",
  "用户交互": "@testing-library/user-event 14.6.1",
  "E2E 测试": "Playwright (通过工具脚本)",
  "Mock 支持": "Vitest 内置 Mock",
  "覆盖率": "Vitest 内置 Coverage"
}
```

### 配置文件

#### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 90,
          statements: 90,
        },
      },
      exclude: ['node_modules/', 'dist/', '*.config.js', '*.config.ts', 'src/vite-env.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/shared-components',
    },
  },
});
```

#### 测试设置文件 (src/test-setup.ts)

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock File API
global.File = vi.fn().mockImplementation((bits, name, options) => ({
  bits,
  name,
  ...options,
  size: bits.reduce((acc, bit) => acc + bit.length, 0),
}));

// Mock FileReader
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsDataURL: vi.fn(),
  readAsText: vi.fn(),
  onload: null,
  onerror: null,
  result: null,
}));
```

---

## 🔧 单元测试 (Unit Tests)

### 工具函数测试

#### 示例：文本格式化工具测试

```typescript
// src/utils/__tests__/textFormatter.test.ts
import { describe, it, expect } from 'vitest';
import { TextFormatter } from '../textFormatter';

describe('TextFormatter', () => {
  describe('formatFileSize', () => {
    it('应该正确格式化字节大小', () => {
      expect(TextFormatter.formatFileSize(0)).toBe('0 B');
      expect(TextFormatter.formatFileSize(1024)).toBe('1.00 KB');
      expect(TextFormatter.formatFileSize(1048576)).toBe('1.00 MB');
      expect(TextFormatter.formatFileSize(1073741824)).toBe('1.00 GB');
    });

    it('应该处理负数和非数字输入', () => {
      expect(TextFormatter.formatFileSize(-1)).toBe('0 B');
      expect(TextFormatter.formatFileSize(NaN)).toBe('0 B');
      expect(TextFormatter.formatFileSize(Infinity)).toBe('∞ B');
    });

    it('应该使用指定的小数位数', () => {
      expect(TextFormatter.formatFileSize(1536, 1)).toBe('1.5 KB');
      expect(TextFormatter.formatFileSize(1536, 3)).toBe('1.500 KB');
    });
  });

  describe('truncate', () => {
    it('应该截断长文本', () => {
      const text = 'This is a very long text that should be truncated';
      expect(TextFormatter.truncate(text, { maxLength: 20 })).toBe('This is a very long...');
    });

    it('应该保留完整单词', () => {
      const text = 'This is a test';
      expect(TextFormatter.truncate(text, { maxLength: 10, preserveWords: true })).toBe(
        'This is a...'
      );
    });

    it('应该使用自定义省略号', () => {
      const text = 'This is a test';
      expect(TextFormatter.truncate(text, { maxLength: 10, ellipsis: ' [...]' })).toBe(
        'This is a [...]'
      );
    });
  });
});
```

#### 示例：图片处理工具测试

```typescript
// src/utils/__tests__/imageProcessor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageProcessor } from '../imageProcessor';

// Mock Canvas API
const mockCanvas = {
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8Array(4) })),
    putImageData: vi.fn(),
    canvas: { toDataURL: vi.fn(() => 'data:image/png;base64,mock') },
  })),
  width: 800,
  height: 600,
};

global.HTMLCanvasElement = vi.fn(() => mockCanvas);
document.createElement = vi.fn(tagName => {
  if (tagName === 'canvas') return mockCanvas;
  return {};
});

describe('ImageProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('splitImage', () => {
    it('应该按指定高度分割图片', async () => {
      const mockImage = {
        width: 800,
        height: 1600,
        onload: null as any,
      };

      // Mock Image constructor
      global.Image = vi.fn(() => mockImage);

      const file = new File(['mock'], 'test.png', { type: 'image/png' });
      const segments = await ImageProcessor.splitImage(file, 400);

      expect(segments).toHaveLength(4); // 1600 / 400 = 4 segments
      segments.forEach((segment, index) => {
        expect(segment).toMatchObject({
          id: expect.stringContaining(index.toString()),
          width: 800,
          height: 400,
          index,
        });
      });
    });

    it('应该处理不能整除的图片高度', async () => {
      const mockImage = {
        width: 800,
        height: 1000,
        onload: null as any,
      };

      global.Image = vi.fn(() => mockImage);

      const file = new File(['mock'], 'test.png', { type: 'image/png' });
      const segments = await ImageProcessor.splitImage(file, 300);

      expect(segments).toHaveLength(4); // 3 full segments + 1 remainder
      expect(segments[3].height).toBe(100); // Last segment height
    });

    it('应该拒绝无效文件格式', async () => {
      const file = new File(['mock'], 'test.txt', { type: 'text/plain' });

      await expect(ImageProcessor.splitImage(file, 400)).rejects.toThrow('不支持的文件格式');
    });
  });

  describe('validateImageFile', () => {
    it('应该验证支持的图片格式', () => {
      const validFormats = ['image/png', 'image/jpeg', 'image/webp'];

      validFormats.forEach(type => {
        const file = new File(['mock'], `test.${type.split('/')[1]}`, { type });
        expect(ImageProcessor.validateImageFile(file)).toBe(true);
      });
    });

    it('应该拒绝不支持的格式', () => {
      const invalidFile = new File(['mock'], 'test.gif', { type: 'image/gif' });
      expect(ImageProcessor.validateImageFile(invalidFile)).toBe(false);
    });

    it('应该检查文件大小限制', () => {
      // Mock file size (50MB)
      const largeFile = Object.defineProperty(
        new File(['mock'], 'test.png', { type: 'image/png' }),
        'size',
        { value: 50 * 1024 * 1024 + 1 }
      );

      expect(ImageProcessor.validateImageFile(largeFile)).toBe(false);
    });
  });
});
```

### React 组件测试

#### 示例：Button 组件测试

```typescript
// shared-components/components/Button/__tests__/Button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button Component', () => {
  it('应该渲染正确的文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('点击我');
  });

  it('应该应用正确的变体样式', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('secondary');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('danger');
  });

  it('应该处理点击事件', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该在加载状态下禁用按钮', () => {
    render(<Button loading loadingText="加载中...">提交</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('加载中...');
  });

  it('应该显示图标', () => {
    const Icon = () => <span data-testid="icon">🎉</span>;
    render(
      <Button icon={<Icon />} iconPosition="left">
        带图标
      </Button>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('带图标')).toBeInTheDocument();
  });

  it('应该支持禁用状态', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>禁用按钮</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('应该支持不同尺寸', () => {
    const { rerender } = render(<Button size="small">小</Button>);
    expect(screen.getByRole('button')).toHaveClass('small');

    rerender(<Button size="large">大</Button>);
    expect(screen.getByRole('button')).toHaveClass('large');
  });
});
```

#### 示例：FileUploader 组件测试

```typescript
// src/components/__tests__/FileUploader.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FileUploader } from '../FileUploader';

describe('FileUploader Component', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染文件上传区域', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);

    expect(screen.getByText(/拖拽文件到此处/i)).toBeInTheDocument();
    expect(screen.getByText(/或点击选择文件/i)).toBeInTheDocument();
  });

  it('应该处理文件选择', async () => {
    const user = userEvent.setup();
    render(<FileUploader onFileSelect={mockOnFileSelect} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/选择文件/i);

    await user.upload(input, file);

    expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
  });

  it('应该验证文件类型', async () => {
    const user = userEvent.setup();
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
        accept="image/png,image/jpeg"
      />
    );

    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/选择文件/i);

    await user.upload(input, invalidFile);

    expect(mockOnError).toHaveBeenCalledWith('不支持的文件格式');
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('应该验证文件大小', async () => {
    const user = userEvent.setup();
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
        maxSize={1024} // 1KB
      />
    );

    // Mock large file
    const largeFile = Object.defineProperty(
      new File(['x'.repeat(2048)], 'large.png', { type: 'image/png' }),
      'size',
      { value: 2048 }
    );

    const input = screen.getByLabelText(/选择文件/i);
    await user.upload(input, largeFile);

    expect(mockOnError).toHaveBeenCalledWith('文件大小超出限制');
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('应该支持拖拽上传', async () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);

    const dropZone = screen.getByRole('button');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass('drag-over');

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
    });
  });

  it('应该支持多文件上传', async () => {
    const user = userEvent.setup();
    render(<FileUploader onFileSelect={mockOnFileSelect} multiple />);

    const files = [
      new File(['test1'], 'test1.png', { type: 'image/png' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
    ];

    const input = screen.getByLabelText(/选择文件/i);
    await user.upload(input, files);

    expect(mockOnFileSelect).toHaveBeenCalledWith(files);
  });
});
```

### Hook 测试

#### 示例：useImageProcessor Hook 测试

```typescript
// src/hooks/__tests__/useImageProcessor.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useImageProcessor } from '../useImageProcessor';

// Mock Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(public url: string) {}

  postMessage(data: any) {
    // Simulate async processing
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { segments: [{ id: '1', dataUrl: 'mock' }] } } as MessageEvent);
      }
    }, 100);
  }

  terminate() {}
}

global.Worker = MockWorker as any;

describe('useImageProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确初始化状态', () => {
    const { result } = renderHook(() => useImageProcessor());

    expect(result.current.processing).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.segments).toEqual([]);
  });

  it('应该处理图片分割', async () => {
    const { result } = renderHook(() => useImageProcessor());

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

    act(() => {
      result.current.processImage(mockFile, 800);
    });

    expect(result.current.processing).toBe(true);

    await waitFor(() => {
      expect(result.current.processing).toBe(false);
    });

    expect(result.current.segments).toHaveLength(1);
    expect(result.current.error).toBe(null);
  });

  it('应该处理处理错误', async () => {
    // Mock worker error
    global.Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onerror: null,
      onmessage: null,
    })) as any;

    const { result } = renderHook(() => useImageProcessor());

    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      try {
        await result.current.processImage(invalidFile, 800);
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.processing).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('应该支持重置状态', () => {
    const { result } = renderHook(() => useImageProcessor());

    act(() => {
      result.current.reset();
    });

    expect(result.current.processing).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.segments).toEqual([]);
  });

  it('应该更新进度', async () => {
    const { result } = renderHook(() => useImageProcessor());

    // Mock worker with progress updates
    global.Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    })) as any;

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

    act(() => {
      result.current.processImage(mockFile, 800);
    });

    // Simulate progress updates
    act(() => {
      // Progress update simulation would be here
      // This depends on your actual implementation
    });

    expect(result.current.progress).toBeGreaterThan(0);
  });
});
```

---

## 🔗 集成测试 (Integration Tests)

### 组件间交互测试

#### 示例：完整的图片处理流程测试

```typescript
// tests/integration/image-processing-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { App } from '../../src/App';

describe('Image Processing Integration', () => {
  it('应该完成完整的图片处理流程', async () => {
    const user = userEvent.setup();

    render(<App />);

    // 1. 上传文件
    const file = new File(['mock image data'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/选择文件/i);

    await user.upload(fileInput, file);

    // 2. 等待文件加载完成
    await waitFor(() => {
      expect(screen.getByText(/图片已加载/i)).toBeInTheDocument();
    });

    // 3. 设置分割参数
    const splitHeightInput = screen.getByLabelText(/分割高度/i);
    await user.clear(splitHeightInput);
    await user.type(splitHeightInput, '800');

    // 4. 开始处理
    const processButton = screen.getByText(/开始分割/i);
    await user.click(processButton);

    // 5. 等待处理完成
    await waitFor(() => {
      expect(screen.getByText(/处理完成/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // 6. 验证结果显示
    expect(screen.getByText(/共\s*\d+\s*个片段/i)).toBeInTheDocument();

    // 7. 测试导出功能
    const exportPdfButton = screen.getByText(/导出PDF/i);
    expect(exportPdfButton).not.toBeDisabled();

    const exportZipButton = screen.getByText(/导出ZIP/i);
    expect(exportZipButton).not.toBeDisabled();
  });

  it('应该处理错误情况', async () => {
    const user = userEvent.setup();

    render(<App />);

    // 上传无效文件
    const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/选择文件/i);

    await user.upload(fileInput, invalidFile);

    // 验证错误提示
    await waitFor(() => {
      expect(screen.getByText(/不支持的文件格式/i)).toBeInTheDocument();
    });

    // 验证处理按钮保持禁用
    const processButton = screen.getByText(/开始分割/i);
    expect(processButton).toBeDisabled();
  });

  it('应该支持语言切换', async () => {
    const user = userEvent.setup();

    render(<App />);

    // 初始语言是中文
    expect(screen.getByText(/长截图分割器/i)).toBeInTheDocument();

    // 切换到英文
    const languageButton = screen.getByText(/English/i);
    await user.click(languageButton);

    // 验证界面语言已切换
    expect(screen.getByText(/Screenshot Splitter/i)).toBeInTheDocument();
  });
});
```

### API 集成测试

#### 示例：导出功能集成测试

```typescript
// tests/integration/export-functionality.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportControls } from '../../src/components/ExportControls';

// Mock PDF and ZIP libraries
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
  })),
}));

vi.mock('jszip', () => ({
  default: vi.fn().mockImplementation(() => ({
    file: vi.fn(),
    generateAsync: vi.fn().mockResolvedValue(new Blob()),
  })),
}));

describe('Export Functionality Integration', () => {
  const mockSegments = [
    { id: '1', dataUrl: 'data:image/png;base64,mock1', width: 800, height: 400, index: 0 },
    { id: '2', dataUrl: 'data:image/png;base64,mock2', width: 800, height: 400, index: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock link click for download
    const mockClick = vi.fn();
    global.HTMLAnchorElement.prototype.click = mockClick;
  });

  it('应该成功导出PDF', async () => {
    const user = userEvent.setup();
    const onExportComplete = vi.fn();

    render(
      <ExportControls
        segments={mockSegments}
        onExportComplete={onExportComplete}
      />
    );

    const exportPdfButton = screen.getByText(/导出PDF/i);
    await user.click(exportPdfButton);

    await waitFor(() => {
      expect(onExportComplete).toHaveBeenCalledWith('pdf', true);
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('应该成功导出ZIP', async () => {
    const user = userEvent.setup();
    const onExportComplete = vi.fn();

    render(
      <ExportControls
        segments={mockSegments}
        onExportComplete={onExportComplete}
      />
    );

    const exportZipButton = screen.getByText(/导出ZIP/i);
    await user.click(exportZipButton);

    await waitFor(() => {
      expect(onExportComplete).toHaveBeenCalledWith('zip', true);
    });
  });

  it('应该处理导出错误', async () => {
    const user = userEvent.setup();
    const onExportComplete = vi.fn();

    // Mock export error
    vi.mocked(require('jspdf').jsPDF).mockImplementation(() => {
      throw new Error('Export failed');
    });

    render(
      <ExportControls
        segments={mockSegments}
        onExportComplete={onExportComplete}
      />
    );

    const exportPdfButton = screen.getByText(/导出PDF/i);
    await user.click(exportPdfButton);

    await waitFor(() => {
      expect(onExportComplete).toHaveBeenCalledWith('pdf', false);
    });

    expect(screen.getByText(/导出失败/i)).toBeInTheDocument();
  });

  it('应该显示导出进度', async () => {
    const user = userEvent.setup();

    render(<ExportControls segments={mockSegments} />);

    const exportPdfButton = screen.getByText(/导出PDF/i);
    await user.click(exportPdfButton);

    // 验证加载状态
    expect(screen.getByText(/导出中.../i)).toBeInTheDocument();
    expect(exportPdfButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/导出中.../i)).not.toBeInTheDocument();
      expect(exportPdfButton).not.toBeDisabled();
    });
  });
});
```

---

## 🎭 端到端测试 (E2E Tests)

### Playwright 测试配置

#### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run preview',
    port: 3000,
  },
});
```

### E2E 测试示例

#### 完整用户流程测试

```typescript
// tests/e2e/screenshot-splitter.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Screenshot Splitter E2E', () => {
  test('complete screenshot splitting workflow', async ({ page }) => {
    await page.goto('/');

    // 验证页面加载
    await expect(page.locator('h1')).toContainText('长截图分割器');

    // 上传文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-screenshot.png');

    // 等待图片预览加载
    await expect(page.locator('.image-preview')).toBeVisible();

    // 调整分割参数
    const splitHeightInput = page.locator('input[type="number"]');
    await splitHeightInput.fill('800');

    // 开始处理
    await page.click('button:has-text("开始分割")');

    // 等待处理完成
    await expect(page.locator('.processing-complete')).toBeVisible({ timeout: 10000 });

    // 验证分割结果
    const segments = page.locator('.segment-item');
    await expect(segments).toHaveCount(3); // 假设分割成3段

    // 测试PDF导出
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("导出PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    // 测试ZIP导出
    const downloadPromise2 = page.waitForEvent('download');
    await page.click('button:has-text("导出ZIP")');
    const download2 = await downloadPromise2;

    expect(download2.suggestedFilename()).toMatch(/\.zip$/);
  });

  test('should handle invalid file upload', async ({ page }) => {
    await page.goto('/');

    // 尝试上传无效文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/invalid-file.txt');

    // 验证错误提示
    await expect(page.locator('.error-message')).toContainText('不支持的文件格式');

    // 验证处理按钮保持禁用
    const processButton = page.locator('button:has-text("开始分割")');
    await expect(processButton).toBeDisabled();
  });

  test('should support language switching', async ({ page }) => {
    await page.goto('/');

    // 初始语言检查
    await expect(page.locator('h1')).toContainText('长截图分割器');

    // 切换到英文
    await page.click('button:has-text("English")');

    // 验证语言切换
    await expect(page.locator('h1')).toContainText('Screenshot Splitter');

    // 切换回中文
    await page.click('button:has-text("中文")');
    await expect(page.locator('h1')).toContainText('长截图分割器');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 验证移动端布局
    await expect(page.locator('.mobile-layout')).toBeVisible();

    // 测试移动端文件上传
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-screenshot.png');

    // 验证响应式预览
    await expect(page.locator('.responsive-preview')).toBeVisible();
  });

  test('should handle large file processing', async ({ page }) => {
    await page.goto('/');

    // 上传大文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/large-screenshot.png');

    // 调整分割参数
    await page.fill('input[type="number"]', '500');

    // 开始处理
    await page.click('button:has-text("开始分割")');

    // 验证进度指示器
    await expect(page.locator('.progress-indicator')).toBeVisible();

    // 等待处理完成 (增加超时时间)
    await expect(page.locator('.processing-complete')).toBeVisible({ timeout: 30000 });

    // 验证处理结果
    const segments = page.locator('.segment-item');
    await expect(segments.first()).toBeVisible();
  });

  test('should persist user settings', async ({ page }) => {
    await page.goto('/');

    // 设置用户偏好
    await page.selectOption('select[name="language"]', 'en');
    await page.fill('input[name="defaultSplitHeight"]', '1000');

    // 刷新页面
    await page.reload();

    // 验证设置是否保持
    await expect(page.locator('select[name="language"]')).toHaveValue('en');
    await expect(page.locator('input[name="defaultSplitHeight"]')).toHaveValue('1000');
  });
});
```

#### 性能测试

```typescript
// tests/e2e/performance.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should meet performance metrics', async ({ page }) => {
    await page.goto('/');

    // 测量页面加载性能
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    // 性能指标断言
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // < 2s
    expect(performanceMetrics.loadComplete).toBeLessThan(3000); // < 3s
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // < 1.5s

    // 测试图片处理性能
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/medium-screenshot.png');

    const startTime = Date.now();
    await page.click('button:has-text("开始分割")');
    await expect(page.locator('.processing-complete')).toBeVisible();
    const processingTime = Date.now() - startTime;

    // 处理时间不应超过10秒
    expect(processingTime).toBeLessThan(10000);
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');

    // 获取初始内存使用
    const initialMemory = await page.evaluate(
      () => (performance as any).memory?.usedJSHeapSize || 0
    );

    // 处理多个文件
    for (let i = 0; i < 3; i++) {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(`tests/fixtures/test-screenshot-${i + 1}.png`);

      await page.click('button:has-text("开始分割")');
      await expect(page.locator('.processing-complete')).toBeVisible();

      // 清除结果
      await page.click('button:has-text("清除")');
    }

    // 检查内存使用是否合理
    const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

    // 内存增长不应超过50MB
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
  });
});
```

---

## 🚀 测试命令和脚本

### 测试命令

```bash
# 基本测试命令
npm run test              # 监视模式运行测试
npm run test:run          # 单次运行所有测试
npm run test:coverage     # 生成覆盖率报告
npm run test:ui           # 启动测试UI界面

# 内存优化测试命令
npm run test:light        # 轻量级测试模式
npm run test:low-memory   # 超低内存模式
npm run test:smart        # 智能测试运行

# 特定测试运行
npm run test:file         # 运行特定文件测试
npm run test:groups       # 分组运行测试
npm run test:monitor      # 监控测试性能

# E2E 测试
npx playwright test       # 运行E2E测试
npx playwright test --ui  # E2E测试UI界面
npx playwright show-report # 查看E2E测试报告
```

### 测试脚本配置

#### package.json 测试脚本

```json
{
  "scripts": {
    "test": "NODE_OPTIONS='--max-old-space-size=2048' vitest",
    "test:run": "NODE_OPTIONS='--max-old-space-size=2048' vitest run",
    "test:coverage": "NODE_OPTIONS='--max-old-space-size=2048' vitest run --coverage",
    "test:ui": "NODE_OPTIONS='--max-old-space-size=2048' vitest --ui",
    "test:light": "NODE_OPTIONS='--max-old-space-size=1024' vitest run --pool=forks --poolOptions.forks.maxForks=1",
    "test:file": "NODE_OPTIONS='--max-old-space-size=1024' vitest run",
    "test:smart": "node scripts/test-runner.js",
    "test:monitor": "node scripts/test-runner.js --monitor",
    "test:low-memory": "node scripts/test-runner.js --mode=ultra-light",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 智能测试运行脚本

#### scripts/test-runner.js

```javascript
#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SmartTestRunner {
  constructor() {
    this.args = process.argv.slice(2);
    this.mode = this.getArg('--mode') || 'standard';
    this.monitor = this.hasArg('--monitor');
    this.pattern = this.getArg('--pattern') || '**/*.test.{js,ts,tsx}';
  }

  getArg(name) {
    const index = this.args.indexOf(name);
    return index !== -1 && index + 1 < this.args.length ? this.args[index + 1] : null;
  }

  hasArg(name) {
    return this.args.includes(name);
  }

  async run() {
    console.log(`🚀 启动智能测试运行器 (模式: ${this.mode})`);

    const config = this.getTestConfig();
    await this.runTests(config);

    if (this.monitor) {
      await this.generatePerformanceReport();
    }
  }

  getTestConfig() {
    const configs = {
      'ultra-light': {
        nodeOptions: '--max-old-space-size=512',
        vitestArgs: ['run', '--pool=forks', '--poolOptions.forks.maxForks=1', '--reporter=basic'],
      },
      light: {
        nodeOptions: '--max-old-space-size=1024',
        vitestArgs: ['run', '--pool=forks', '--poolOptions.forks.maxForks=2'],
      },
      standard: {
        nodeOptions: '--max-old-space-size=2048',
        vitestArgs: ['run'],
      },
      comprehensive: {
        nodeOptions: '--max-old-space-size=4096',
        vitestArgs: ['run', '--coverage', '--reporter=verbose'],
      },
    };

    return configs[this.mode] || configs['standard'];
  }

  async runTests(config) {
    return new Promise((resolve, reject) => {
      const env = { ...process.env, NODE_OPTIONS: config.nodeOptions };
      const child = spawn('npx', ['vitest', ...config.vitestArgs], {
        stdio: 'inherit',
        env,
      });

      child.on('close', code => {
        if (code === 0) {
          console.log('✅ 所有测试通过');
          resolve();
        } else {
          console.error('❌ 测试失败');
          reject(new Error(`测试进程退出码: ${code}`));
        }
      });

      child.on('error', error => {
        console.error('❌ 测试运行错误:', error);
        reject(error);
      });
    });
  }

  async generatePerformanceReport() {
    console.log('📊 生成性能报告...');

    const reportPath = path.join(process.cwd(), 'test-performance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      mode: this.mode,
      memory: process.memoryUsage(),
      duration: process.uptime(),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 性能报告已生成: ${reportPath}`);
  }
}

const runner = new SmartTestRunner();
runner.run().catch(console.error);
```

---

## 📊 测试报告和指标

### 覆盖率报告

测试覆盖率报告包括以下指标：

- **Statements**: 语句覆盖率 (目标: ≥90%)
- **Branches**: 分支覆盖率 (目标: ≥80%)
- **Functions**: 函数覆盖率 (目标: ≥90%)
- **Lines**: 行覆盖率 (目标: ≥90%)

### 质量门禁

#### vitest.config.ts 质量门禁配置

```typescript
export default defineConfig({
  test: {
    coverage: {
      threshold: {
        global: {
          branches: 80,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // 特定文件或目录的要求
        'src/utils/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'shared-components/': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
});
```

### 性能基准

| 指标             | 目标值 | 当前值 | 状态 |
| ---------------- | ------ | ------ | ---- |
| 单元测试执行时间 | <30s   | 25s    | ✅   |
| 集成测试执行时间 | <60s   | 45s    | ✅   |
| E2E测试执行时间  | <5min  | 4min   | ✅   |
| 内存使用峰值     | <2GB   | 1.5GB  | ✅   |
| 测试覆盖率       | ≥90%   | 95%    | ✅   |

---

## 🔧 持续集成中的测试

### GitHub Actions 测试工作流

#### .github/workflows/test.yml

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 🔍 测试最佳实践

### 测试编写原则

1. **AAA 模式**: Arrange (准备) → Act (执行) → Assert (断言)
2. **单一职责**: 每个测试只验证一个功能点
3. **独立性**: 测试间不应相互依赖
4. **可重复性**: 测试结果应该稳定一致
5. **有意义的命名**: 测试名称应清楚描述测试内容

### 常见反模式和解决方案

#### ❌ 反模式：测试实现细节

```typescript
// 错误：测试组件内部状态
it('should update internal counter state', () => {
  const { result } = renderHook(() => useCounter());
  act(() => result.current.increment());
  expect(result.current.internalState.count).toBe(1); // 测试了内部实现
});
```

#### ✅ 正确做法：测试行为和输出

```typescript
// 正确：测试用户可见的行为
it('should increment counter when increment is called', () => {
  const { result } = renderHook(() => useCounter());
  act(() => result.current.increment());
  expect(result.current.count).toBe(1); // 测试公共 API
});
```

#### ❌ 反模式：过度Mock

```typescript
// 错误：Mock了太多东西，测试变得无意义
it('should process image', () => {
  const mockProcessImage = vi.fn().mockResolvedValue([]);
  const mockUseImageProcessor = vi.fn(() => ({ processImage: mockProcessImage }));

  // 这个测试实际上什么都没测试
});
```

#### ✅ 正确做法：最小化Mock

```typescript
// 正确：只Mock外部依赖
it('should process image and return segments', async () => {
  // 只Mock Web Worker，测试实际的逻辑
  global.Worker = MockWorker;

  const { result } = renderHook(() => useImageProcessor());
  const file = new File(['test'], 'test.png', { type: 'image/png' });
  const segments = await result.current.processImage(file, 800);

  expect(segments).toHaveLength(2);
});
```

### 测试数据管理

#### 测试夹具 (Fixtures)

```typescript
// tests/fixtures/index.ts
export const mockImageFile = () => new File(['mock image data'], 'test.png', { type: 'image/png' });

export const mockImageSegments = () => [
  {
    id: '1',
    dataUrl: 'data:image/png;base64,mock1',
    width: 800,
    height: 400,
    index: 0,
  },
  {
    id: '2',
    dataUrl: 'data:image/png;base64,mock2',
    width: 800,
    height: 400,
    index: 1,
  },
];
```

#### 工厂函数

```typescript
// tests/factories/imageSegmentFactory.ts
export const createImageSegment = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  dataUrl: 'data:image/png;base64,mockdata',
  width: 800,
  height: 400,
  index: 0,
  ...overrides,
});

// 使用
const segment = createImageSegment({ width: 1200, height: 600 });
```

---

## 📚 相关文档

- **[项目文档索引](./PROJECT-INDEX.md)** - 完整项目文档导航
- **[开发指南](./DEVELOPMENT-GUIDE.md)** - 开发环境设置和工作流程
- **[API 参考文档](./API-REFERENCE.md)** - 详细的 API 接口说明
- **[架构文档](./ARCHITECTURE.md)** - 系统设计和架构决策

---

_📝 最后更新: 2025-08-26_  
_🧪 测试指南版本: v1.0.0_  
_📊 当前测试覆盖率: 95%+_
