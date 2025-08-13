/**
 * TextDisplayConfig组件单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextDisplayConfig, useTextDisplayConfig, DEFAULT_TEXT_DISPLAY_OPTIONS, MINIMAL_TEXT_DISPLAY_OPTIONS, DETAILED_TEXT_DISPLAY_OPTIONS } from './TextDisplayConfig';
import type { TextDisplayOptions } from './TextDisplayConfig';

// Mock useI18n hook
vi.mock('../hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'textDisplay.title': '文字显示设置'
      };
      return translations[key] || key;
    }
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('TextDisplayConfig', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    options: DEFAULT_TEXT_DISPLAY_OPTIONS,
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染组件标题', () => {
    render(<TextDisplayConfig {...defaultProps} />);
    
    expect(screen.getByText('文字显示设置')).toBeInTheDocument();
  });

  it('应该显示当前配置摘要', () => {
    render(<TextDisplayConfig {...defaultProps} />);
    
    // 默认配置有7个启用项（showDebugInfo为false）
    expect(screen.getByText(/7 \/ 8 项已启用/)).toBeInTheDocument();
  });

  it('应该在点击展开按钮时显示详细配置', async () => {
    render(<TextDisplayConfig {...defaultProps} />);
    
    // 初始状态不显示详细配置
    expect(screen.queryByText('基础信息')).not.toBeInTheDocument();
    
    // 点击展开按钮
    const expandButton = screen.getByTitle('展开');
    fireEvent.click(expandButton);
    
    // 应该显示详细配置
    await waitFor(() => {
      expect(screen.getByText('基础信息')).toBeInTheDocument();
      expect(screen.getByText('界面元素')).toBeInTheDocument();
      expect(screen.getByText('状态信息')).toBeInTheDocument();
    });
  });

  it('应该正确处理配置项的切换', async () => {
    render(<TextDisplayConfig {...defaultProps} />);
    
    // 展开配置面板
    const expandButton = screen.getByTitle('展开');
    fireEvent.click(expandButton);
    
    await waitFor(() => {
      expect(screen.getByText('基础信息')).toBeInTheDocument();
    });
    
    // 找到切片标题的复选框并点击
    const sliceTitleCheckbox = screen.getByLabelText(/切片标题/);
    fireEvent.click(sliceTitleCheckbox);
    
    // 验证onChange被调用
    expect(mockOnChange).toHaveBeenCalledWith({
      ...DEFAULT_TEXT_DISPLAY_OPTIONS,
      showSliceTitle: false
    });
  });

  it('应该正确应用预设配置', async () => {
    render(<TextDisplayConfig {...defaultProps} showPresets={true} />);
    
    // 展开配置面板
    const expandButton = screen.getByTitle('展开');
    fireEvent.click(expandButton);
    
    await waitFor(() => {
      expect(screen.getByText('快速预设')).toBeInTheDocument();
    });
    
    // 点击简洁模式按钮
    const minimalButton = screen.getByText('简洁模式');
    fireEvent.click(minimalButton);
    
    // 验证onChange被调用，传入简洁模式配置
    expect(mockOnChange).toHaveBeenCalledWith(MINIMAL_TEXT_DISPLAY_OPTIONS);
  });

  it('应该正确处理全显示和全隐藏操作', async () => {
    render(<TextDisplayConfig {...defaultProps} />);
    
    // 点击全显示按钮
    const showAllButton = screen.getByText('全显示');
    fireEvent.click(showAllButton);
    
    // 验证所有选项都被设置为true
    const expectedAllTrue = Object.keys(DEFAULT_TEXT_DISPLAY_OPTIONS).reduce((acc, key) => {
      acc[key as keyof TextDisplayOptions] = true;
      return acc;
    }, {} as TextDisplayOptions);
    
    expect(mockOnChange).toHaveBeenCalledWith(expectedAllTrue);
    
    // 清除mock调用记录
    mockOnChange.mockClear();
    
    // 点击全隐藏按钮
    const hideAllButton = screen.getByText('全隐藏');
    fireEvent.click(hideAllButton);
    
    // 验证所有选项都被设置为false
    const expectedAllFalse = Object.keys(DEFAULT_TEXT_DISPLAY_OPTIONS).reduce((acc, key) => {
      acc[key as keyof TextDisplayOptions] = false;
      return acc;
    }, {} as TextDisplayOptions);
    
    expect(mockOnChange).toHaveBeenCalledWith(expectedAllFalse);
  });

  it('应该在compact模式下正确渲染', () => {
    render(<TextDisplayConfig {...defaultProps} compact={true} />);
    
    // 在compact模式下，标题应该使用较小的字体
    const title = screen.getByText('文字显示设置');
    expect(title).toHaveClass('text-base');
  });

  it('应该在showPresets为false时隐藏预设按钮', async () => {
    render(<TextDisplayConfig {...defaultProps} showPresets={false} />);
    
    // 展开配置面板
    const expandButton = screen.getByTitle('展开');
    fireEvent.click(expandButton);
    
    await waitFor(() => {
      expect(screen.getByText('基础信息')).toBeInTheDocument();
    });
    
    // 不应该显示快速预设部分
    expect(screen.queryByText('快速预设')).not.toBeInTheDocument();
  });

  it('应该正确显示配置摘要标签', async () => {
    const customOptions: TextDisplayOptions = {
      ...DEFAULT_TEXT_DISPLAY_OPTIONS,
      showDebugInfo: true,
      showPreloadStatus: false
    };
    
    render(<TextDisplayConfig options={customOptions} onChange={mockOnChange} />);
    
    // 展开配置面板
    const expandButton = screen.getByTitle('展开');
    fireEvent.click(expandButton);
    
    await waitFor(() => {
      expect(screen.getByText('当前配置摘要')).toBeInTheDocument();
    });
    
    // 验证启用的配置项数量
    expect(screen.getByText(/7 \/ 8 项已启用/)).toBeInTheDocument();
  });
});

describe('useTextDisplayConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该使用默认配置初始化', () => {
    const TestComponent = () => {
      const { options } = useTextDisplayConfig();
      return <div data-testid="options">{JSON.stringify(options)}</div>;
    };

    render(<TestComponent />);
    
    const optionsElement = screen.getByTestId('options');
    expect(JSON.parse(optionsElement.textContent || '{}')).toEqual(DEFAULT_TEXT_DISPLAY_OPTIONS);
  });

  it('应该从localStorage加载保存的配置', () => {
    const savedOptions = {
      ...DEFAULT_TEXT_DISPLAY_OPTIONS,
      showDebugInfo: true
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedOptions));
    
    const TestComponent = () => {
      const { options } = useTextDisplayConfig();
      return <div data-testid="options">{JSON.stringify(options)}</div>;
    };

    render(<TestComponent />);
    
    const optionsElement = screen.getByTestId('options');
    expect(JSON.parse(optionsElement.textContent || '{}')).toEqual(savedOptions);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('textDisplayOptions');
  });

  it('应该正确更新配置并保存到localStorage', () => {
    const TestComponent = () => {
      const { options, updateOptions } = useTextDisplayConfig();
      
      const handleUpdate = () => {
        updateOptions({
          ...options,
          showDebugInfo: true
        });
      };
      
      return (
        <div>
          <div data-testid="options">{JSON.stringify(options)}</div>
          <button onClick={handleUpdate}>Update</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // 点击更新按钮
    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);
    
    // 验证localStorage.setItem被调用
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'textDisplayOptions',
      JSON.stringify({
        ...DEFAULT_TEXT_DISPLAY_OPTIONS,
        showDebugInfo: true
      })
    );
  });

  it('应该正确应用预设配置', () => {
    const TestComponent = () => {
      const { options, applyPreset } = useTextDisplayConfig();
      
      const handleApplyMinimal = () => {
        applyPreset(MINIMAL_TEXT_DISPLAY_OPTIONS);
      };
      
      return (
        <div>
          <div data-testid="options">{JSON.stringify(options)}</div>
          <button onClick={handleApplyMinimal}>Apply Minimal</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // 点击应用简洁模式按钮
    const applyButton = screen.getByText('Apply Minimal');
    fireEvent.click(applyButton);
    
    // 验证配置被更新为简洁模式
    const optionsElement = screen.getByTestId('options');
    expect(JSON.parse(optionsElement.textContent || '{}')).toEqual(MINIMAL_TEXT_DISPLAY_OPTIONS);
  });

  it('应该正确重置配置', () => {
    const customInitial: TextDisplayOptions = {
      ...DEFAULT_TEXT_DISPLAY_OPTIONS,
      showDebugInfo: true
    };
    
    const TestComponent = () => {
      const { options, resetOptions } = useTextDisplayConfig(customInitial);
      
      return (
        <div>
          <div data-testid="options">{JSON.stringify(options)}</div>
          <button onClick={resetOptions}>Reset</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // 点击重置按钮
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    // 验证配置被重置为初始配置
    const optionsElement = screen.getByTestId('options');
    expect(JSON.parse(optionsElement.textContent || '{}')).toEqual(customInitial);
  });

  it('应该处理localStorage错误', () => {
    // Mock localStorage.getItem抛出错误
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const TestComponent = () => {
      const { options } = useTextDisplayConfig();
      return <div data-testid="options">{JSON.stringify(options)}</div>;
    };

    render(<TestComponent />);
    
    // 应该使用默认配置
    const optionsElement = screen.getByTestId('options');
    expect(JSON.parse(optionsElement.textContent || '{}')).toEqual(DEFAULT_TEXT_DISPLAY_OPTIONS);
    
    // 应该输出警告
    expect(consoleSpy).toHaveBeenCalledWith('[TextDisplayConfig] 加载本地配置失败:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('应该提供便捷方法', () => {
    const TestComponent = () => {
      const { options, enableMinimalMode, enableDetailedMode, enableDefaultMode } = useTextDisplayConfig();
      
      return (
        <div>
          <div data-testid="options">{JSON.stringify(options)}</div>
          <button onClick={enableMinimalMode}>Minimal</button>
          <button onClick={enableDetailedMode}>Detailed</button>
          <button onClick={enableDefaultMode}>Default</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // 测试简洁模式
    fireEvent.click(screen.getByText('Minimal'));
    expect(JSON.parse(screen.getByTestId('options').textContent || '{}')).toEqual(MINIMAL_TEXT_DISPLAY_OPTIONS);
    
    // 测试详细模式
    fireEvent.click(screen.getByText('Detailed'));
    expect(JSON.parse(screen.getByTestId('options').textContent || '{}')).toEqual(DETAILED_TEXT_DISPLAY_OPTIONS);
    
    // 测试默认模式
    fireEvent.click(screen.getByText('Default'));
    expect(JSON.parse(screen.getByTestId('options').textContent || '{}')).toEqual(DEFAULT_TEXT_DISPLAY_OPTIONS);
  });
});

describe('配置选项常量', () => {
  it('DEFAULT_TEXT_DISPLAY_OPTIONS应该有正确的默认值', () => {
    expect(DEFAULT_TEXT_DISPLAY_OPTIONS).toEqual({
      showSliceTitle: true,
      showDimensions: true,
      showFileSize: true,
      showFullText: true,
      showThumbnailNumber: true,
      showKeyboardHints: true,
      showPreloadStatus: true,
      showDebugInfo: false,
    });
  });

  it('MINIMAL_TEXT_DISPLAY_OPTIONS应该只显示必要信息', () => {
    expect(MINIMAL_TEXT_DISPLAY_OPTIONS).toEqual({
      showSliceTitle: true,
      showDimensions: false,
      showFileSize: false,
      showFullText: false,
      showThumbnailNumber: true,
      showKeyboardHints: false,
      showPreloadStatus: false,
      showDebugInfo: false,
    });
  });

  it('DETAILED_TEXT_DISPLAY_OPTIONS应该显示所有信息', () => {
    expect(DETAILED_TEXT_DISPLAY_OPTIONS).toEqual({
      showSliceTitle: true,
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