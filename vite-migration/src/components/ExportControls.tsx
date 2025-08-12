import React from 'react';
import type { ImageSlice } from '../types';
import { useI18n } from '../hooks/useI18n';

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
    <div className="export-controls">
      <div className="export-header">
        <h3>{t('export.title') || '导出选项'}</h3>
        <div className="export-info">
          {hasSlices ? (
            <span className="export-count">
              {t('export.selectedInfo') || `已选择 ${selectedSlices.size} / ${imageSlices.length} 个片段`}
            </span>
          ) : (
            <span className="export-empty">
              {t('export.noSlices') || '暂无可导出的片段'}
            </span>
          )}
        </div>
      </div>
      
      <div className="export-buttons">
        <button
          className="export-button export-pdf"
          onClick={onExportPDF}
          disabled={!hasSelectedSlices || isExporting}
          title={t('export.pdfTooltip') || '将选中的片段导出为 PDF 文件'}
        >
          <svg className="export-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isExporting ? (
            t('export.exporting') || '导出中...'
          ) : (
            t('export.exportPDF') || '导出为 PDF'
          )}
        </button>
        
        <button
          className="export-button export-zip"
          onClick={onExportZIP}
          disabled={!hasSelectedSlices || isExporting}
          title={t('export.zipTooltip') || '将选中的片段打包为 ZIP 文件'}
        >
          <svg className="export-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <div className="export-hint">
          <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>{t('export.selectHint') || '请先选择要导出的片段'}</span>
        </div>
      )}
      
      {isExporting && (
        <div className="export-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <span className="progress-text">
            {t('export.processing') || '正在处理，请稍候...'}
          </span>
        </div>
      )}
    </div>
  );
}

export default ExportControls;