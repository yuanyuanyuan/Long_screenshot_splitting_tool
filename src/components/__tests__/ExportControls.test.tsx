import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { ExportControls } from '../ExportControls';
import { I18nProvider } from '../../hooks/useI18nContext';

// 模拟切片数据
const mockSlices = [
  { blob: new Blob(), url: 'url1', index: 0, width: 100, height: 100 },
  { blob: new Blob(), url: 'url2', index: 1, width: 100, height: 100 },
  { blob: new Blob(), url: 'url3', index: 2, width: 100, height: 100 },
];

describe('ExportControls 组件国际化测试', () => {
  const mockExportFn = vi.fn();
  
  test('在中文环境下正确显示文本', () => {
    render(
      <I18nProvider initialLanguage="zh-CN">
        <ExportControls 
          selectedSlices={[0, 1]} 
          slices={mockSlices} 
          onExport={mockExportFn} 
        />
      </I18nProvider>
    );
    
    // 验证中文文本显示
    expect(screen.getByText('导出结果')).toBeInTheDocument();
    expect(screen.getByText('已选择 2 个切片')).toBeInTheDocument();
    expect(screen.getByText('导出格式')).toBeInTheDocument();
    expect(screen.getByText('📄 PDF文档')).toBeInTheDocument();
    expect(screen.getByText('(适合打印和阅读)')).toBeInTheDocument();
    expect(screen.getByText('📦 ZIP压缩包')).toBeInTheDocument();
    expect(screen.getByText('(包含所有图片文件)')).toBeInTheDocument();
    expect(screen.getByText('文件名')).toBeInTheDocument();
    expect(screen.getByText('图片质量')).toBeInTheDocument();
    expect(screen.getByText('导出为 PDF')).toBeInTheDocument();
  });
  
  test('在英文环境下正确显示文本', () => {
    render(
      <I18nProvider initialLanguage="en">
        <ExportControls 
          selectedSlices={[0, 1]} 
          slices={mockSlices} 
          onExport={mockExportFn} 
        />
      </I18nProvider>
    );
    
    // 验证英文文本显示
    expect(screen.getByText('Export Results')).toBeInTheDocument();
    expect(screen.getByText('Selected 2 slices')).toBeInTheDocument();
    expect(screen.getByText('Export Format')).toBeInTheDocument();
    expect(screen.getByText('📄 PDF Document')).toBeInTheDocument();
    expect(screen.getByText('(Suitable for printing and reading)')).toBeInTheDocument();
    expect(screen.getByText('📦 ZIP Archive')).toBeInTheDocument();
    expect(screen.getByText('(Contains all image files)')).toBeInTheDocument();
    expect(screen.getByText('Filename')).toBeInTheDocument();
    expect(screen.getByText('Image Quality')).toBeInTheDocument();
    expect(screen.getByText('Export as PDF')).toBeInTheDocument();
  });
  
  test('当没有选择切片时显示提示信息', () => {
    render(
      <I18nProvider initialLanguage="zh-CN">
        <ExportControls 
          selectedSlices={[]} 
          slices={mockSlices} 
          onExport={mockExportFn} 
        />
      </I18nProvider>
    );
    
    expect(screen.getByText('请先选择要导出的切片')).toBeInTheDocument();
  });
  
  test('语言切换后文本正确更新', () => {
    const { rerender } = render(
      <I18nProvider initialLanguage="zh-CN">
        <ExportControls 
          selectedSlices={[0, 1]} 
          slices={mockSlices} 
          onExport={mockExportFn} 
        />
      </I18nProvider>
    );
    
    // 验证初始中文文本
    expect(screen.getByText('导出格式')).toBeInTheDocument();
    
    // 重新渲染为英文
    rerender(
      <I18nProvider initialLanguage="en">
        <ExportControls 
          selectedSlices={[0, 1]} 
          slices={mockSlices} 
          onExport={mockExportFn} 
        />
      </I18nProvider>
    );
    
    // 验证切换后的英文文本
    expect(screen.getByText('Export Format')).toBeInTheDocument();
  });
});