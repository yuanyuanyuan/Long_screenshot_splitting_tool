/**
 * 长截图分割工具核心组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScreenshotSplitter } from '../ScreenshotSplitter';

// 模拟文件
const createMockFile = (name: string, size: number = 1024) => {
  const file = new File(['mock content'], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('ScreenshotSplitter', () => {
  beforeEach(() => {
    // 清理所有模拟
    jest.clearAllMocks();
  });

  describe('文件上传', () => {
    test('应该显示文件上传区域', () => {
      render(<ScreenshotSplitter />);
      
      expect(screen.getByText(/拖拽图片到此处/)).toBeInTheDocument();
      expect(screen.getByText(/或点击选择文件/)).toBeInTheDocument();
    });

    test('应该能够通过拖拽上传文件', async () => {
      render(<ScreenshotSplitter />);
      
      const dropZone = screen.getByTestId('drop-zone');
      const file = createMockFile('test-screenshot.png');
      
      fireEvent.dragOver(dropZone);
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('test-screenshot.png')).toBeInTheDocument();
      });
    });

    test('应该能够通过文件选择器上传文件', async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('selected-image.png');
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByText('selected-image.png')).toBeInTheDocument();
      });
    });

    test('应该拒绝非图片文件', async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['content'], 'document.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/请选择图片文件/)).toBeInTheDocument();
      });
    });

    test('应该限制文件大小', async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const largeFile = createMockFile('large-image.png', 50 * 1024 * 1024); // 50MB
      
      fireEvent.change(fileInput, {
        target: { files: [largeFile] }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/文件大小超过限制/)).toBeInTheDocument();
      });
    });
  });

  describe('图片预览', () => {
    test('上传文件后应该显示图片预览', async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('preview-test.png');
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      });
    });

    test('应该显示图片信息', async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('info-test.png', 2048);
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByText('info-test.png')).toBeInTheDocument();
        expect(screen.getByText(/2.0 KB/)).toBeInTheDocument();
      });
    });
  });

  describe('分割设置', () => {
    beforeEach(async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('settings-test.png');
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      });
    });

    test('应该显示分割设置选项', () => {
      expect(screen.getByText(/分割设置/)).toBeInTheDocument();
      expect(screen.getByLabelText(/分割高度/)).toBeInTheDocument();
      expect(screen.getByLabelText(/重叠像素/)).toBeInTheDocument();
    });

    test('应该能够调整分割高度', () => {
      const heightInput = screen.getByLabelText(/分割高度/) as HTMLInputElement;
      
      fireEvent.change(heightInput, { target: { value: '800' } });
      
      expect(heightInput.value).toBe('800');
    });

    test('应该能够调整重叠像素', () => {
      const overlapInput = screen.getByLabelText(/重叠像素/) as HTMLInputElement;
      
      fireEvent.change(overlapInput, { target: { value: '50' } });
      
      expect(overlapInput.value).toBe('50');
    });

    test('应该验证输入值的有效性', () => {
      const heightInput = screen.getByLabelText(/分割高度/) as HTMLInputElement;
      
      fireEvent.change(heightInput, { target: { value: '-100' } });
      fireEvent.blur(heightInput);
      
      expect(screen.getByText(/请输入有效的高度值/)).toBeInTheDocument();
    });
  });

  describe('分割处理', () => {
    beforeEach(async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('process-test.png');
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      });
    });

    test('应该显示开始分割按钮', () => {
      expect(screen.getByText(/开始分割/)).toBeInTheDocument();
    });

    test('点击开始分割应该开始处理', async () => {
      const startButton = screen.getByText(/开始分割/);
      
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText(/正在处理/)).toBeInTheDocument();
      });
    });

    test('处理过程中应该显示进度', async () => {
      const startButton = screen.getByText(/开始分割/);
      
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      });
    });

    test('处理完成后应该显示结果', async () => {
      const startButton = screen.getByText(/开始分割/);
      
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText(/分割完成/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('结果展示', () => {
    beforeEach(async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('result-test.png');
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      });
      
      const startButton = screen.getByText(/开始分割/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText(/分割完成/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('应该显示分割结果列表', () => {
      expect(screen.getByTestId('result-list')).toBeInTheDocument();
    });

    test('应该显示下载按钮', () => {
      expect(screen.getByText(/下载全部/)).toBeInTheDocument();
    });

    test('应该能够预览单个分割图片', () => {
      const previewButtons = screen.getAllByText(/预览/);
      expect(previewButtons.length).toBeGreaterThan(0);
    });

    test('应该能够下载单个分割图片', () => {
      const downloadButtons = screen.getAllByText(/下载/);
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe('错误处理', () => {
    test('应该处理图片加载失败', async () => {
      // 模拟图片加载失败
      const mockImage = global.Image as any;
      const originalOnload = mockImage.prototype.onload;
      
      mockImage.prototype.onload = null;
      mockImage.prototype.onerror = function() {
        setTimeout(() => {
          this.onerror && this.onerror();
        }, 100);
      };
      
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('error-test.png');
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByText(/图片加载失败/)).toBeInTheDocument();
      });
      
      // 恢复原始行为
      mockImage.prototype.onload = originalOnload;
    });

    test('应该处理分割处理错误', async () => {
      // 模拟Canvas错误
      const mockGetContext = HTMLCanvasElement.prototype.getContext as jest.Mock;
      mockGetContext.mockReturnValueOnce(null);
      
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('canvas-error-test.png');
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      });
      
      const startButton = screen.getByText(/开始分割/);
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText(/处理失败/)).toBeInTheDocument();
      });
    });
  });

  describe('重置功能', () => {
    test('应该能够重置到初始状态', async () => {
      render(<ScreenshotSplitter />);
      
      const fileInput = screen.getByTestId('file-input');
      const file = createMockFile('reset-test.png');
      
      fireEvent.change(fileInput, {
        target: { files: [file] }
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeInTheDocument();
      });
      
      const resetButton = screen.getByText(/重新选择/);
      fireEvent.click(resetButton);
      
      expect(screen.getByText(/拖拽图片到此处/)).toBeInTheDocument();
      expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
    });
  });
});