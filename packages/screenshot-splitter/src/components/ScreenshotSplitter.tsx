/**
 * 截图分割器主组件
 * 整合文件上传、图片处理、预览和导出功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FileUploader } from './FileUploader';
import { ImagePreview } from './ImagePreview';
import { ExportControls } from './ExportControls';
import { useImageProcessor } from '../hooks/useImageProcessor';
import { useAppState } from '../hooks/useAppState';
import { useDebugState } from '../hooks/useDebugState';
import { DebugPanel } from './DebugPanel';

interface ScreenshotSplitterProps {
  className?: string;
  onStateChange?: (state: any) => void;
  maxFileSize?: number;
  supportedFormats?: string[];
}

export const ScreenshotSplitter: React.FC<ScreenshotSplitterProps> = ({
  className = '',
  onStateChange,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
}) => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { state, actions } = useAppState();
  const { processImage, isProcessing } = useImageProcessor({ state, actions });
  
  // 添加调试状态Hook
  const debugState = useDebugState({
    state,
    originalImage: state.originalImage,
    slices: state.imageSlices,
    selectedSlices: Array.from(state.selectedSlices),
    isProcessing: isProcessing || state.isProcessing
  });

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setCurrentFile(file);
      
      // 验证文件大小
      if (file.size > maxFileSize) {
        throw new Error(`文件大小不能超过 ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      }

      // 验证文件格式
      if (!supportedFormats.includes(file.type)) {
        throw new Error(`不支持的文件格式，请上传 ${supportedFormats.join(', ')} 格式的图片`);
      }

      // 处理图片
      await processImage(file);

      // 通知父组件状态变化
      onStateChange?.(state);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件处理失败';
      setError(errorMessage);
      console.error('File upload error:', err);
    }
  }, [maxFileSize, supportedFormats, processImage, onStateChange, state]);

  // 处理切片选择
  const handleSliceSelection = useCallback((selectedIndices: number[]) => {
    // 清除当前选择
    actions.deselectAllSlices();
    // 添加新选择
    selectedIndices.forEach(index => {
      actions.toggleSliceSelection(index);
    });
    onStateChange?.(state);
  }, [actions, onStateChange, state]);

  // 处理导出
  const handleExport = useCallback((format: 'pdf' | 'zip', options?: any) => {
    // 导出逻辑将在ExportControls组件中处理
    console.log('Export requested:', format, options);
  }, []);

  // 重置状态
  const handleReset = useCallback(() => {
    setCurrentFile(null);
    setError(null);
    actions.cleanupSession();
    onStateChange?.(state);
  }, [actions, onStateChange, state]);

  // 计算组件状态
  const componentState = useMemo(() => ({
    hasFile: !!currentFile,
    hasSlices: state.imageSlices.length > 0,
    hasSelection: state.selectedSlices.size > 0,
    isProcessing: isProcessing || state.isProcessing,
    canExport: state.selectedSlices.size > 0 && !isProcessing
  }), [currentFile, state.imageSlices.length, state.selectedSlices.size, isProcessing, state.isProcessing]);

  return (
    <div className={`screenshot-splitter ${className}`}>
      {/* 错误提示 */}
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>错误：</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* 文件上传区域 */}
      <div className="upload-section mb-6">
        <FileUploader
          onFileSelect={handleFileUpload}
          disabled={componentState.isProcessing}
          maxFileSize={maxFileSize}
          supportedFormats={supportedFormats}
        />
      </div>

      {/* 处理状态指示器 */}
      {componentState.isProcessing && (
        <div className="processing-indicator bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            正在处理图片，请稍候...
          </div>
        </div>
      )}

      {/* 图片预览区域 */}
      {(componentState.hasSlices || state.imageSlices.length > 0) && (
        <div className="preview-section mb-6">
          <ImagePreview
            originalImage={state.originalImage}
            slices={state.imageSlices}
            selectedSlices={Array.from(state.selectedSlices)}
            onSelectionChange={handleSliceSelection}
          />
        </div>
      )}

      {/* 导出控制区域 */}
      {componentState.canExport && (
        <div className="export-section mb-6">
          <ExportControls
            selectedSlices={Array.from(state.selectedSlices)}
            slices={state.imageSlices}
            onExport={handleExport}
            disabled={!componentState.canExport}
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="actions-section flex gap-4">
        {componentState.hasFile && (
          <button
            onClick={handleReset}
            className="reset-button bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            disabled={componentState.isProcessing}
          >
            重新开始
          </button>
        )}
        
        {/* 状态信息 */}
        <div className="status-info flex-1 text-sm text-gray-600 flex items-center">
          {componentState.hasFile && (
            <span>
              文件：{currentFile?.name} 
              {componentState.hasSlices && ` | 切片：${state.imageSlices.length}个`}
              {componentState.hasSelection && ` | 已选择：${state.selectedSlices.size}个`}
            </span>
          )}
        </div>
      </div>

      {/* 调试面板（仅开发环境） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-section mt-6">
          <DebugPanel
            debugSnapshot={debugState.debugSnapshot}
            onLogDebugInfo={debugState.logDebugInfo}
            onRunDiagnostics={() => {
              const diagnostics = debugState.getDiagnostics();
              console.log('🩺 问题诊断结果:', diagnostics);
              
              if (diagnostics.hasIssues) {
                alert(`发现 ${diagnostics.issues.length} 个问题:\n\n${diagnostics.issues.join('\n')}\n\n建议:\n${diagnostics.recommendations.join('\n')}`);
              } else {
                alert('✅ 状态检查正常，未发现问题');
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ScreenshotSplitter;