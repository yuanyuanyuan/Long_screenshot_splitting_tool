import React from 'react';
import type { ImageSlice } from '../types';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../utils/styleMapping';

interface ExportControlsProps {
  selectedSlices: Set<number>;
  imageSlices: ImageSlice[];
  onExportPDF: () => void;
  onExportZIP: () => void;
  isExporting: boolean;
}

export function ExportControls({
  selectedSlices,
  imageSlices,
  onExportPDF,
  onExportZIP,
  isExporting
}: ExportControlsProps) {
  const { t } = useI18n();
  
  const hasSelectedSlices = selectedSlices.size > 0;
  const hasSlices = imageSlices.length > 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mt-4 md:mt-6 w-full">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">{t('export.title') || '导出选项'}</h3>
        <div>
          {hasSlices ? (
            <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
              {t('export.selectedInfo') || `已选择 ${selectedSlices.size} / ${imageSlices.length} 个片段`}
            </span>
          ) : (
            <span className="text-gray-500 text-sm">
              {t('export.noSlices') || '暂无可导出的片段'}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
        <button
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200",
            !hasSelectedSlices || isExporting 
              ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
              : "bg-error-500 text-white hover:bg-error-600 hover:shadow-md hover:-translate-y-0.5"
          )}
          onClick={onExportPDF}
          disabled={!hasSelectedSlices || isExporting}
          title={t('export.pdfTooltip') || '将选中的片段导出为 PDF 文件'}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isExporting ? (
            t('export.exporting') || '导出中...'
          ) : (
            t('export.exportPDF') || '导出为 PDF'
          )}
        </button>
        
        <button
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200",
            !hasSelectedSlices || isExporting 
              ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
              : "bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md hover:-translate-y-0.5"
          )}
          onClick={onExportZIP}
          disabled={!hasSelectedSlices || isExporting}
          title={t('export.zipTooltip') || '将选中的片段打包为 ZIP 文件'}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1v6m6-6v6" />
          </svg>
          {isExporting ? (
            t('export.exporting') || '导出中...'
          ) : (
            t('export.exportZIP') || '导出为 ZIP'
          )}
        </button>
      </div>
      
      {!hasSelectedSlices && hasSlices && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>{t('export.selectHint') || '请先选择要导出的片段'}</span>
        </div>
      )}
      
      {isExporting && (
        <div className="mt-4">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-pulse"></div>
          </div>
          <span className="text-sm text-gray-600 mt-2 block text-center">
            {t('export.processing') || '正在处理，请稍候...'}
          </span>
        </div>
      )}
    </div>
  );
}

export default ExportControls;