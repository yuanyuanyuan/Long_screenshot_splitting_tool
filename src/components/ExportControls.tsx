/**
 * 导出控制组件
 * 提供PDF和ZIP导出功能
 */

import React, { useState, useCallback } from 'react';
import { useI18nContext } from '../hooks/useI18nContext';
import { useViewport } from '../hooks/useViewport';

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
  enableTouchOptimization?: boolean;
  showAdvancedOptions?: boolean;
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
  enableTouchOptimization = true,
  showAdvancedOptions = true,
}) => {
  const { t } = useI18nContext();
  const viewport = useViewport();
  
  const [exportFormat, setExportFormat] = useState<'pdf' | 'zip'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(!viewport.isMobile);
  
  // 触摸反馈
  const triggerHapticFeedback = useCallback(() => {
    if (enableTouchOptimization && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [enableTouchOptimization]);

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

    triggerHapticFeedback();
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
  }, [disabled, selectedSlices, exportFormat, exportOptions, onExport, slices, triggerHapticFeedback]);
  
  // 切换格式
  const handleFormatChange = useCallback((format: 'pdf' | 'zip') => {
    setExportFormat(format);
    updateExportOptions({ format });
    triggerHapticFeedback();
  }, [triggerHapticFeedback]);
  
  // 切换选项显示
  const toggleOptions = useCallback(() => {
    setShowOptions(!showOptions);
    triggerHapticFeedback();
  }, [showOptions, triggerHapticFeedback]);

  // 更新导出选项
  const updateExportOptions = useCallback((updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const canExport = selectedSlices.length > 0 && !disabled && !isExporting;
  const mobileOptimizedClass = viewport.isMobile ? 'mobile-export-controls' : '';

  return (
    <div className={`export-controls ${className} ${mobileOptimizedClass}`}>
      <div className={`export-header ${viewport.isMobile ? 'mb-6' : 'mb-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`${viewport.isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-800 mb-2`}>
              {t('export.title')}
            </h3>
            <p className={`${viewport.isMobile ? 'text-base' : 'text-sm'} text-gray-600`}>
              {t('export.selectedSlicesInfo', { count: selectedSlices.length })}
            </p>
          </div>
          
          {/* 移动端选项切换按钮 */}
          {viewport.isMobile && showAdvancedOptions && (
            <button
              onClick={toggleOptions}
              className="flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg font-medium"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span>{showOptions ? '收起设置' : '展开设置'}</span>
              <span className={`ml-1 transform transition-transform ${
                showOptions ? 'rotate-180' : ''
              }`}>▼</span>
            </button>
          )}
        </div>
      </div>

      {/* 快速导出按钮（移动端优先） */}
      {viewport.isMobile && (
        <div className="quick-export mb-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                handleFormatChange('pdf');
                if (!showOptions) handleExport();
              }}
              disabled={!canExport}
              className={`${
                exportFormat === 'pdf' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-blue-500 border-blue-500'
              } border-2 rounded-xl p-4 font-medium text-center min-h-[60px] flex flex-col items-center justify-center transition-colors`}
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span className="text-lg mb-1">📄</span>
              <span className="text-sm">PDF</span>
            </button>
            
            <button
              onClick={() => {
                handleFormatChange('zip');
                if (!showOptions) handleExport();
              }}
              disabled={!canExport}
              className={`${
                exportFormat === 'zip' 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'bg-white text-green-500 border-green-500'
              } border-2 rounded-xl p-4 font-medium text-center min-h-[60px] flex flex-col items-center justify-center transition-colors`}
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span className="text-lg mb-1">🗜️</span>
              <span className="text-sm">ZIP</span>
            </button>
          </div>
        </div>
      )}
      
      {/* 格式选择（桌面端或展开时显示） */}
      {(!viewport.isMobile || showOptions) && (
        <div className={`format-selection ${viewport.isMobile ? 'mb-6' : 'mb-4'}`}>
          <label className={`block ${viewport.isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-3`}>
            {t('export.formatLabel')}
          </label>
          <div className={`format-options ${viewport.isMobile ? 'flex-col space-y-3' : 'flex gap-4'}`}>
            <label className={`flex items-center ${viewport.isMobile ? 'p-3 bg-gray-50 rounded-lg' : ''} cursor-pointer`}>
              <input
                type="radio"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={() => handleFormatChange('pdf')}
                className={`${viewport.isMobile ? 'mr-3 w-5 h-5' : 'mr-2'}`}
                disabled={disabled}
                style={{
                  touchAction: 'manipulation'
                }}
              />
              <span className="flex items-center flex-1">
                <span className={`${viewport.isMobile ? 'text-base font-medium' : ''}`}>
                  {t('export.pdfOption')}
                </span>
                <span className={`ml-2 ${viewport.isMobile ? 'text-sm' : 'text-xs'} text-gray-500 ${viewport.isMobile ? 'block' : ''}`}>
                  {t('export.pdfDescription')}
                </span>
              </span>
            </label>

            <label className={`flex items-center ${viewport.isMobile ? 'p-3 bg-gray-50 rounded-lg' : ''} cursor-pointer`}>
              <input
                type="radio"
                value="zip"
                checked={exportFormat === 'zip'}
                onChange={() => handleFormatChange('zip')}
                className={`${viewport.isMobile ? 'mr-3 w-5 h-5' : 'mr-2'}`}
                disabled={disabled}
                style={{
                  touchAction: 'manipulation'
                }}
              />
              <span className="flex items-center flex-1">
                <span className={`${viewport.isMobile ? 'text-base font-medium' : ''}`}>
                  {t('export.zipOption')}
                </span>
                <span className={`ml-2 ${viewport.isMobile ? 'text-sm' : 'text-xs'} text-gray-500 ${viewport.isMobile ? 'block' : ''}`}>
                  {t('export.zipDescription')}
                </span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* 基础设置 */}
      {(!viewport.isMobile || showOptions) && showAdvancedOptions && (
        <div className={`basic-settings ${viewport.isMobile ? 'mb-6' : 'mb-4'}`}>
          <div className={`grid grid-cols-1 ${viewport.isMobile ? 'gap-4' : 'md:grid-cols-2 gap-4'}`}>
            <div>
              <label className={`block ${viewport.isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                {t('export.filenameLabel')}
              </label>
              <input
                type="text"
                value={exportOptions.filename}
                onChange={e => updateExportOptions({ filename: e.target.value })}
                className={`w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  viewport.isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'
                }`}
                disabled={disabled}
                style={{
                  touchAction: 'manipulation'
                }}
              />
            </div>

            <div>
              <label className={`block ${viewport.isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                {t('export.qualityLabel')}
              </label>
              <select
                value={exportOptions.quality}
                onChange={e => updateExportOptions({ quality: parseFloat(e.target.value) })}
                className={`w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  viewport.isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'
                }`}
                disabled={disabled}
                style={{
                  touchAction: 'manipulation'
                }}
              >
                <option value={1.0}>{t('export.qualityHighest')}</option>
                <option value={0.9}>{t('export.qualityHigh')}</option>
                <option value={0.8}>{t('export.qualityMedium')}</option>
                <option value={0.7}>{t('export.qualityLow')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 导出按钮 */}
      <div className="export-actions">
        <button
          onClick={handleExport}
          disabled={!canExport}
          className={`
            w-full rounded-lg font-medium transition-colors
            ${viewport.isMobile ? 'px-6 py-4 text-lg min-h-[56px]' : 'px-6 py-3'}
            ${
              canExport
                ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
          style={{
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {isExporting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('export.exporting')}
            </span>
          ) : (
            t('export.exportAs', { format: exportFormat.toUpperCase() })
          )}
        </button>

        {!canExport && selectedSlices.length === 0 && (
          <p className={`${viewport.isMobile ? 'text-base' : 'text-sm'} text-red-500 mt-3 text-center font-medium`}>
            {t('export.pleaseSelectSlices')}
          </p>
        )}
        
        {/* 移动端提示信息 */}
        {viewport.isMobile && selectedSlices.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 text-center">
              💡 已选择 {selectedSlices.length} 个切片，点击上方按钮导出为 {exportFormat.toUpperCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportControls;
