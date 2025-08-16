/**
 * 导出控制组件
 * 提供PDF和ZIP导出功能
 */

import React, { useState, useCallback } from 'react';

interface ImageSlice {
  blob: Blob;
  url: string;
  index: number;
  width: number;
  height: number;
}

interface ExportControlsProps {
  selectedSlices: number[];
  slices: ImageSlice[];
  onExport: (format: 'pdf' | 'zip', options?: any) => void;
  disabled?: boolean;
  className?: string;
}

interface ExportOptions {
  format: 'pdf' | 'zip';
  quality: number;
  filename: string;
  pdfOptions?: {
    orientation: 'portrait' | 'landscape';
    pageSize: 'A4' | 'A3' | 'Letter';
    margin: number;
  };
  zipOptions?: {
    compression: 'none' | 'low' | 'medium' | 'high';
    imageFormat: 'png' | 'jpeg';
  };
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  selectedSlices,
  slices,
  onExport,
  disabled = false,
  className = '',
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'zip'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 0.9,
    filename: 'screenshot-slices',
    pdfOptions: {
      orientation: 'portrait',
      pageSize: 'A4',
      margin: 20,
    },
    zipOptions: {
      compression: 'medium',
      imageFormat: 'png',
    },
  });

  // 处理导出
  const handleExport = useCallback(async () => {
    if (disabled || selectedSlices.length === 0) return;

    setIsExporting(true);
    try {
      await onExport(exportFormat, {
        ...exportOptions,
        selectedSlices,
        slices: selectedSlices.map(index => slices[index]),
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [disabled, selectedSlices, exportFormat, exportOptions, onExport, slices]);

  // 更新导出选项
  const updateExportOptions = useCallback((updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const canExport = selectedSlices.length > 0 && !disabled && !isExporting;

  return (
    <div className={`export-controls ${className}`}>
      <div className="export-header mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">导出设置</h3>
        <p className="text-sm text-gray-600">
          已选择 {selectedSlices.length} 个切片，选择导出格式和参数
        </p>
      </div>

      {/* 格式选择 */}
      <div className="format-selection mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
        <div className="format-options flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="pdf"
              checked={exportFormat === 'pdf'}
              onChange={() => {
                setExportFormat('pdf');
                updateExportOptions({ format: 'pdf' });
              }}
              className="mr-2"
              disabled={disabled}
            />
            <span className="flex items-center">
              📄 PDF文档
              <span className="ml-2 text-xs text-gray-500">(适合打印和阅读)</span>
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              value="zip"
              checked={exportFormat === 'zip'}
              onChange={() => {
                setExportFormat('zip');
                updateExportOptions({ format: 'zip' });
              }}
              className="mr-2"
              disabled={disabled}
            />
            <span className="flex items-center">
              📦 ZIP压缩包
              <span className="ml-2 text-xs text-gray-500">(包含所有图片文件)</span>
            </span>
          </label>
        </div>
      </div>

      {/* 基础设置 */}
      <div className="basic-settings mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文件名</label>
            <input
              type="text"
              value={exportOptions.filename}
              onChange={e => updateExportOptions({ filename: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">图片质量</label>
            <select
              value={exportOptions.quality}
              onChange={e => updateExportOptions({ quality: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            >
              <option value={1.0}>最高质量</option>
              <option value={0.9}>高质量</option>
              <option value={0.8}>中等质量</option>
              <option value={0.7}>较低质量</option>
            </select>
          </div>
        </div>
      </div>

      {/* 导出按钮 */}
      <div className="export-actions">
        <button
          onClick={handleExport}
          disabled={!canExport}
          className={`
            w-full px-6 py-3 rounded-lg font-medium transition-colors
            ${
              canExport
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isExporting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              正在导出...
            </span>
          ) : (
            `导出为 ${exportFormat.toUpperCase()}`
          )}
        </button>

        {!canExport && selectedSlices.length === 0 && (
          <p className="text-sm text-red-500 mt-2 text-center">请先选择要导出的切片</p>
        )}
      </div>
    </div>
  );
};

export default ExportControls;
