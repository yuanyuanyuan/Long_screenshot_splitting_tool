/**
 * DebugInfoControl组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DebugInfoControl, { DEBUG_LEVELS, type DebugInfoControlProps } from './DebugInfoControl';

// Mock TextDisplayConfig
vi.mock('./TextDisplayConfig', () => ({
  useTextDisplayConfig: vi.fn(() => ({
    options: {
      showSliceTitle: true,
      showDimensions: true,
      showFileSize: true,
      showFullText: true,
      showThumbnailNumber: true,
      showKeyboardHints: true,
      showPreloadStatus: true,
      showDebugInfo: true,
    },
    updateOptions: vi.fn(),
    resetOptions: vi.fn(),
    applyPreset: vi.fn(),
    enableMinimalMode: vi.fn(),
    enableDetailedMode: vi.fn(),
    enableDefaultMode: vi.fn(),
  })),
}));

const mockUseTextDisplayConfig = vi.mocked(
  await import('./TextDisplayConfig')
).useTextDisplayConfig;

describe('DebugInfoControl', () => {
  const defaultProps: DebugInfoControlProps = {
    visible: true,
    position: 'top-right',
    compact: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染调试控制面板', () => {
      render(<DebugInfoControl {...defaultProps} />);

      expect(screen.getByText('调试信息控制')).toBeInTheDocument();
      expect(screen.getByText('调试级别:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('标准调试')).toBeInTheDocument();
    });

    it('应该在不可见时显示切换按钮', () => {
      render(<DebugInfoControl {...defaultProps} visible={false} />);

      expect(screen.getByTitle('显示调试控制面板')).toBeInTheDocument();
      expect(screen.queryByText('调试信息控制')).not.toBeInTheDocument();
    });

    it('应该在紧凑模式下正确渲染', () => {
      render(<DebugInfoControl {...defaultProps} compact={true} />);

      expect(screen.getByText('调试信息控制')).toBeInTheDocument();
      expect(screen.queryByText('快速切换:')).not.toBeInTheDocument();
    });

    it('应该应用正确的位置样式类', () => {
      const { container } = render(<DebugInfoControl {...defaultProps} position="bottom-left" />);

      const controlPanel = container.querySelector('.debug-info-control');
      expect(controlPanel).toHaveClass('debug-control-bottom-left');
    });

    it('应该应用自定义样式类', () => {
      const { container } = render(<DebugInfoControl {...defaultProps} className="custom-class" />);

      const controlPanel = container.querySelector('.debug-info-control');
      expect(controlPanel).toHaveClass('custom-class');
    });
  });

  describe('调试级别选择', () => {
    it('应该显示所有预定义的调试级别', () => {
      render(<DebugInfoControl {...defaultProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.click(select);

      DEBUG_LEVELS.forEach(level => {
        expect(screen.getByText(level.name)).toBeInTheDocument();
      });
    });

    it('应该在选择调试级别时调用updateOptions', () => {
      const mockUpdateOptions = vi.fn();
      mockUseTextDisplayConfig.mockReturnValue({
        options: {
          showSliceTitle: true,
          showDimensions: true,
          showFileSize: true,
          showFullText: true,
          showThumbnailNumber: true,
          showKeyboardHints: true,
          showPreloadStatus: true,
          showDebugInfo: true,
        },
        updateOptions: mockUpdateOptions,
        resetOptions: vi.fn(),
        applyPreset: vi.fn(),
        enableMinimalMode: vi.fn(),
        enableDetailedMode: vi.fn(),
        enableDefaultMode: vi.fn(),
      });

      render(<DebugInfoControl {...defaultProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'minimal' } });

      // 验证调用了updateOptions，参数应该是minimal级别的完整配置
      expect(mockUpdateOptions).toHaveBeenCalledWith({
        showSliceTitle: true,
        showDimensions: true,
        showFileSize: false,
        showFullText: true,
        showThumbnailNumber: true,
        showKeyboardHints: true,
        showPreloadStatus: true,
        showDebugInfo: true,
      });
    });

    it('应该显示当前级别的描述', () => {
      render(<DebugInfoControl {...defaultProps} />);

      expect(screen.getByText('显示常用的调试信息')).toBeInTheDocument();
    });
  });

  describe('快速切换选项', () => {
    it('应该显示快速切换选项', () => {
      render(<DebugInfoControl {...defaultProps} />);

      expect(screen.getByText('快速切换:')).toBeInTheDocument();
      expect(screen.getByText('切片标题')).toBeInTheDocument();
      expect(screen.getByText('尺寸信息')).toBeInTheDocument();
      expect(screen.getByText('文件大小')).toBeInTheDocument();
    });

    it('应该正确反映当前配置状态', () => {
      render(<DebugInfoControl {...defaultProps} />);

      const titleCheckbox = screen.getByLabelText('切片标题');
      const dimensionsCheckbox = screen.getByLabelText('尺寸信息');

      expect(titleCheckbox).toBeChecked();
      expect(dimensionsCheckbox).toBeChecked();
    });

    it('应该在切换选项时调用updateOptions', () => {
      const mockUpdateOptions = vi.fn();
      mockUseTextDisplayConfig.mockReturnValue({
        options: {
          showSliceTitle: true,
          showDimensions: true,
          showFileSize: true,
          showFullText: true,
          showThumbnailNumber: true,
          showKeyboardHints: true,
          showPreloadStatus: true,
          showDebugInfo: true,
        },
        updateOptions: mockUpdateOptions,
        resetOptions: vi.fn(),
        applyPreset: vi.fn(),
        enableMinimalMode: vi.fn(),
        enableDetailedMode: vi.fn(),
        enableDefaultMode: vi.fn(),
      });

      render(<DebugInfoControl {...defaultProps} />);

      const titleCheckbox = screen.getByLabelText('切片标题');
      fireEvent.click(titleCheckbox);

      expect(mockUpdateOptions).toHaveBeenCalledWith({
        showSliceTitle: false,
        showDimensions: true,
        showFileSize: true,
        showFullText: true,
        showThumbnailNumber: true,
        showKeyboardHints: true,
        showPreloadStatus: true,
        showDebugInfo: true,
      });
    });
  });

  describe('操作按钮', () => {
    it('应该显示全部隐藏和全部显示按钮', () => {
      render(<DebugInfoControl {...defaultProps} />);

      expect(screen.getByTitle('隐藏所有调试信息')).toBeInTheDocument();
      expect(screen.getByTitle('显示所有调试信息')).toBeInTheDocument();
    });

    it('应该在点击全部隐藏时应用none级别', () => {
      const mockUpdateOptions = vi.fn();
      mockUseTextDisplayConfig.mockReturnValue({
        options: {
          showSliceTitle: true,
          showDimensions: true,
          showFileSize: true,
          showFullText: true,
          showThumbnailNumber: true,
          showKeyboardHints: true,
          showPreloadStatus: true,
          showDebugInfo: true,
        },
        updateOptions: mockUpdateOptions,
        resetOptions: vi.fn(),
        applyPreset: vi.fn(),
        enableMinimalMode: vi.fn(),
        enableDetailedMode: vi.fn(),
        enableDefaultMode: vi.fn(),
      });

      render(<DebugInfoControl {...defaultProps} />);

      const hideAllButton = screen.getByTitle('隐藏所有调试信息');
      fireEvent.click(hideAllButton);

      expect(mockUpdateOptions).toHaveBeenCalledWith(DEBUG_LEVELS[0].options);
    });

    it('应该在点击全部显示时应用detailed级别', () => {
      const mockUpdateOptions = vi.fn();
      mockUseTextDisplayConfig.mockReturnValue({
        options: {
          showSliceTitle: true,
          showDimensions: true,
          showFileSize: true,
          showFullText: true,
          showThumbnailNumber: true,
          showKeyboardHints: true,
          showPreloadStatus: true,
          showDebugInfo: true,
        },
        updateOptions: mockUpdateOptions,
        resetOptions: vi.fn(),
        applyPreset: vi.fn(),
        enableMinimalMode: vi.fn(),
        enableDetailedMode: vi.fn(),
        enableDefaultMode: vi.fn(),
      });

      render(<DebugInfoControl {...defaultProps} />);

      const showAllButton = screen.getByTitle('显示所有调试信息');
      fireEvent.click(showAllButton);

      expect(mockUpdateOptions).toHaveBeenCalledWith(DEBUG_LEVELS[3].options);
    });
  });

  describe('可见性控制', () => {
    it('应该在点击关闭按钮时调用onVisibilityChange', () => {
      const mockOnVisibilityChange = vi.fn();
      render(<DebugInfoControl {...defaultProps} onVisibilityChange={mockOnVisibilityChange} />);

      const closeButton = screen.getByTitle('隐藏控制面板');
      fireEvent.click(closeButton);

      expect(mockOnVisibilityChange).toHaveBeenCalledWith(false);
    });

    it('应该在点击切换按钮时调用onVisibilityChange', () => {
      const mockOnVisibilityChange = vi.fn();
      render(
        <DebugInfoControl
          {...defaultProps}
          visible={false}
          onVisibilityChange={mockOnVisibilityChange}
        />
      );

      const toggleButton = screen.getByTitle('显示调试控制面板');
      fireEvent.click(toggleButton);

      expect(mockOnVisibilityChange).toHaveBeenCalledWith(true);
    });
  });

  describe('调试级别推断', () => {
    it('应该正确推断当前的调试级别', () => {
      // 模拟minimal级别的配置
      mockUseTextDisplayConfig.mockReturnValue({
        options: {
          showSliceTitle: true,
          showDimensions: true,
          showFileSize: false,
          showFullText: true,
          showThumbnailNumber: true,
          showKeyboardHints: true,
          showPreloadStatus: true,
          showDebugInfo: true,
        },
        updateOptions: vi.fn(),
        resetOptions: vi.fn(),
        applyPreset: vi.fn(),
        enableMinimalMode: vi.fn(),
        enableDetailedMode: vi.fn(),
        enableDefaultMode: vi.fn(),
      });

      render(<DebugInfoControl {...defaultProps} />);

      expect(screen.getByDisplayValue('最小调试')).toBeInTheDocument();
    });

    it('应该在无匹配级别时显示标准调试', () => {
      // 模拟自定义配置
      mockUseTextDisplayConfig.mockReturnValue({
        options: {
          showSliceTitle: false,
          showDimensions: true,
          showFileSize: true,
          showFullText: true,
          showThumbnailNumber: true,
          showKeyboardHints: true,
          showPreloadStatus: true,
          showDebugInfo: true,
        },
        updateOptions: vi.fn(),
        resetOptions: vi.fn(),
        applyPreset: vi.fn(),
        enableMinimalMode: vi.fn(),
        enableDetailedMode: vi.fn(),
        enableDefaultMode: vi.fn(),
      });

      render(<DebugInfoControl {...defaultProps} />);

      expect(screen.getByDisplayValue('标准调试')).toBeInTheDocument();
    });
  });
});

describe('DEBUG_LEVELS常量', () => {
  it('应该包含所有预期的调试级别', () => {
    expect(DEBUG_LEVELS).toHaveLength(4);

    const levelIds = DEBUG_LEVELS.map(level => level.id);
    expect(levelIds).toEqual(['none', 'minimal', 'standard', 'detailed']);
  });

  it('应该为每个级别提供完整的配置', () => {
    DEBUG_LEVELS.forEach(level => {
      expect(level).toHaveProperty('id');
      expect(level).toHaveProperty('name');
      expect(level).toHaveProperty('description');
      expect(level).toHaveProperty('options');

      expect(typeof level.id).toBe('string');
      expect(typeof level.name).toBe('string');
      expect(typeof level.description).toBe('string');
      expect(typeof level.options).toBe('object');
    });
  });

  it('应该为none级别隐藏所有选项', () => {
    const noneLevel = DEBUG_LEVELS.find(level => level.id === 'none');
    expect(noneLevel?.options.showSliceTitle).toBe(false);
    expect(noneLevel?.options.showDimensions).toBe(false);
    expect(noneLevel?.options.showFileSize).toBe(false);
  });

  it('应该为detailed级别显示所有选项', () => {
    const detailedLevel = DEBUG_LEVELS.find(level => level.id === 'detailed');
    expect(detailedLevel?.options.showSliceTitle).toBe(true);
    expect(detailedLevel?.options.showDimensions).toBe(true);
    expect(detailedLevel?.options.showFileSize).toBe(true);
  });
});
