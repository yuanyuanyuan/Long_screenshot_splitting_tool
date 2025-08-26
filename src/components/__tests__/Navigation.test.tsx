/**
 * Navigation组件测试套件
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Navigation from '../Navigation';

// Mock性能监控器
vi.mock('../../utils/navigationPerformanceMonitor', () => ({
  usePerformanceMonitor: vi.fn(() => ({
    recordInteraction: vi.fn(),
    recordUpdate: vi.fn(),
    startMeasure: vi.fn(),
  })),
}));

// Mock导航状态Hook
vi.mock('../../hooks/useNavigationState', () => ({
  useNavigationState: vi.fn(() => ({
    navigationItems: [
      { path: '/', name: '首页', icon: '🏠', disabled: false, active: true },
      { path: '/upload', name: '上传', icon: '📤', disabled: false, active: false },
      { path: '/split', name: '分割', icon: '✂️', disabled: true, active: false },
      { path: '/export', name: '导出', icon: '💾', disabled: true, active: false },
    ],
    navigationMetrics: {
      totalSteps: 4,
      completedSteps: 1,
      currentStepIndex: 0,
      progressPercentage: 25,
    },
    canGoNext: true,
    canGoPrevious: false,
    getNextAvailableStep: vi.fn(() => '/upload'),
    getPreviousAvailableStep: vi.fn(() => null),
  })),
}));

describe('Navigation组件', () => {
  const mockAppState = {
    originalImage: null,
    imageSlices: [],
    selectedSlices: new Set(),
  };

  const defaultProps = {
    appState: mockAppState,
    currentPath: '/',
    onNavigate: vi.fn(),
    showProgress: true,
    showTooltips: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染导航组件', () => {
    render(<Navigation {...defaultProps} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('应该渲染所有导航按钮', () => {
    render(<Navigation {...defaultProps} />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('上传')).toBeInTheDocument();
    expect(screen.getByText('分割')).toBeInTheDocument();
    expect(screen.getByText('导出')).toBeInTheDocument();
  });

  it('应该显示进度条', () => {
    render(<Navigation {...defaultProps} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('1/4 步骤完成 (25%)')).toBeInTheDocument();
  });

  it('应该处理导航按钮点击', async () => {
    const mockOnNavigate = vi.fn();
    render(<Navigation {...defaultProps} onNavigate={mockOnNavigate} />);

    const uploadButton = screen.getByText('上传');
    await userEvent.click(uploadButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('/upload');
  });

  it('应该阻止禁用按钮的点击', async () => {
    const mockOnNavigate = vi.fn();
    render(<Navigation {...defaultProps} onNavigate={mockOnNavigate} />);

    const splitButton = screen.getByText('分割');
    await userEvent.click(splitButton);

    expect(mockOnNavigate).not.toHaveBeenCalled();
  });

  it('应该正确显示激活状态', () => {
    render(<Navigation {...defaultProps} />);
    const homeButton = screen.getByText('首页');
    expect(homeButton).toHaveClass('active');
  });

  it('应该正确显示禁用状态', () => {
    render(<Navigation {...defaultProps} />);
    const splitButton = screen.getByText('分割');
    expect(splitButton).toBeDisabled();
  });
});
