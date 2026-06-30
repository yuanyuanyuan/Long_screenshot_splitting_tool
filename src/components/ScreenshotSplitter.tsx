/**
 * 截图分割器主组件 - 移动端优化版
 * 整合文件上传、图片处理、预览和导出功能
 * 响应式设计，支持触摸友好界面
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FileUploader } from './FileUploader';
import { ImagePreview } from './ImagePreview';
import { ExportControls } from './ExportControls';
import { useImageProcessor } from '../hooks/useImageProcessor';
import { useAppState } from '../hooks/useAppState';
import { useDebugState } from '../hooks/useDebugState';
import { useViewport } from '../hooks/useViewport';
import { DebugPanel } from './DebugPanel';

interface ScreenshotSplitterProps {
  className?: string;
  onStateChange?: (state: any) => void;
  maxFileSize?: number;
  supportedFormats?: string[];
  enableTouchOptimization?: boolean;
}

export const ScreenshotSplitter: React.FC<ScreenshotSplitterProps> = ({
  className = '',
  onStateChange,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  enableTouchOptimization = true,
}) => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { state, actions } = useAppState();
  const { processImage, isProcessing } = useImageProcessor({ state, actions });
  const viewport = useViewport();

  // 触摸反馈
  const triggerHapticFeedback = useCallback(
    (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (enableTouchOptimization && viewport.isMobile && 'vibrate' in navigator) {
        const patterns = { light: 10, medium: 20, heavy: 30 };
        navigator.vibrate(patterns[type]);
      }
    },
    [enableTouchOptimization, viewport.isMobile]
  );

  // 添加调试状态Hook
  const debugState = useDebugState({
    state,
    originalImage: state.originalImage,
    slices: state.imageSlices,
    selectedSlices: Array.from(state.selectedSlices),
    isProcessing: isProcessing || state.isProcessing,
  });

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        setError(null);
        setCurrentFile(file);
        triggerHapticFeedback('medium');

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
        triggerHapticFeedback('heavy');
        console.error('File upload error:', err);
      }
    },
    [maxFileSize, supportedFormats, processImage, onStateChange, state, triggerHapticFeedback]
  );

  // 处理切片选择
  const handleSliceSelection = useCallback(
    (selectedIndices: number[]) => {
      // 清除当前选择
      actions.deselectAllSlices();
      // 添加新选择
      selectedIndices.forEach(index => {
        actions.toggleSliceSelection(index);
      });
      triggerHapticFeedback('light');
      onStateChange?.(state);
    },
    [actions, onStateChange, state, triggerHapticFeedback]
  );

  // 处理导出
  const handleExport = useCallback(
    (format: 'pdf' | 'zip', options?: any) => {
      // 导出逻辑将在ExportControls组件中处理
      triggerHapticFeedback('medium');
      console.log('Export requested:', format, options);
    },
    [triggerHapticFeedback]
  );

  // 重置状态
  const handleReset = useCallback(() => {
    setCurrentFile(null);
    setError(null);
    actions.cleanupSession();
    triggerHapticFeedback('light');
    onStateChange?.(state);
  }, [actions, onStateChange, state, triggerHapticFeedback]);

  // 计算组件状态
  const componentState = useMemo(
    () => ({
      hasFile: Boolean(currentFile),
      hasSlices: state.imageSlices.length > 0,
      hasSelection: state.selectedSlices.size > 0,
      isProcessing: isProcessing || state.isProcessing,
      canExport: state.selectedSlices.size > 0 && !isProcessing,
    }),
    [
      currentFile,
      state.imageSlices.length,
      state.selectedSlices.size,
      isProcessing,
      state.isProcessing,
    ]
  );

  // 移动端样式类
  const mobileOptimizedClass = viewport.isMobile ? 'mobile-screenshot-splitter' : '';

  return (
    <div className={`screenshot-splitter ${className} ${mobileOptimizedClass}`}>
      {/* 错误提示 - 移动端优化 */}
      {error && (
        <div
          className={`error-message bg-red-100 border border-red-400 text-red-700 rounded ${
            viewport.isMobile ? 'px-4 py-4 mb-6 text-base' : 'px-4 py-3 mb-4 text-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <span className="text-lg mr-2 flex-shrink-0">⚠️</span>
              <div>
                <strong className={viewport.isMobile ? 'text-base' : 'text-sm'}>错误：</strong>
                <span className="ml-1">{error}</span>
                {/* 移动端错误处理提示 */}
                {viewport.isMobile && (
                  <p className="mt-2 text-sm text-red-600">
                    💡 请检查文件格式和大小，或尝试选择其他图片
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className={`text-red-700 hover:text-red-900 font-bold ${
                viewport.isMobile ? 'text-xl p-1 min-w-[44px] min-h-[44px]' : 'text-lg'
              }`}
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 文件上传区域 - 移动端优化 */}
      <div className={`upload-section ${viewport.isMobile ? 'mb-8' : 'mb-6'}`}>
        <FileUploader
          onFileSelect={handleFileUpload}
          disabled={componentState.isProcessing}
          maxFileSize={maxFileSize}
          supportedFormats={supportedFormats}
          enableTouchOptimization={enableTouchOptimization}
          isProcessing={componentState.isProcessing}
        />
      </div>

      {/* 处理状态指示器 - 移动端优化 */}
      {componentState.isProcessing && (
        <div
          className={`processing-indicator bg-blue-100 border border-blue-400 text-blue-700 rounded ${
            viewport.isMobile ? 'px-5 py-4 mb-8' : 'px-4 py-3 mb-4'
          }`}
        >
          <div className="flex items-center justify-center">
            <div
              className={`animate-spin rounded-full border-b-2 border-blue-700 mr-3 ${
                viewport.isMobile ? 'h-6 w-6' : 'h-4 w-4'
              }`}
            ></div>
            <span className={viewport.isMobile ? 'text-base font-medium' : 'text-sm'}>
              正在处理图片，请稍候...
            </span>
          </div>
          {/* 移动端处理提示 */}
          {viewport.isMobile && (
            <p className="text-sm text-blue-600 mt-2 text-center">
              📱 图片较大时处理时间可能较长，请耐心等待
            </p>
          )}
        </div>
      )}

      {/* 图片预览区域 - 移动端优化 */}
      {(componentState.hasSlices || state.imageSlices.length > 0) && (
        <div className={`preview-section ${viewport.isMobile ? 'mb-8' : 'mb-6'}`}>
          <ImagePreview
            originalImage={state.originalImage}
            slices={state.imageSlices}
            selectedSlices={Array.from(state.selectedSlices)}
            onSelectionChange={handleSliceSelection}
            enableTouchOptimization={enableTouchOptimization}
          />
        </div>
      )}

      {/* 导出控制区域 - 移动端优化 */}
      {componentState.canExport && (
        <div className={`export-section ${viewport.isMobile ? 'mb-8' : 'mb-6'}`}>
          <ExportControls
            selectedSlices={Array.from(state.selectedSlices)}
            slices={state.imageSlices}
            onExport={handleExport}
            disabled={!componentState.canExport}
            enableTouchOptimization={enableTouchOptimization}
          />
        </div>
      )}

      {/* 操作按钮 - 移动端优化 */}
      <div
        className={`actions-section ${
          viewport.isMobile ? 'flex-col space-y-4' : 'flex gap-4 items-center'
        }`}
      >
        {componentState.hasFile && (
          <button
            onClick={handleReset}
            className={`
              reset-button bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white rounded transition-colors
              ${
                viewport.isMobile
                  ? 'w-full px-6 py-4 text-lg font-medium min-h-[48px] order-2'
                  : 'px-4 py-2 text-sm'
              }
            `}
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            disabled={componentState.isProcessing}
          >
            {viewport.isMobile ? '🔄 重新开始' : '重新开始'}
          </button>
        )}

        {/* 状态信息 - 移动端优化 */}
        <div
          className={`status-info text-gray-600 ${
            viewport.isMobile
              ? 'w-full p-4 bg-gray-50 rounded-lg border border-gray-200 order-1'
              : 'flex-1 text-sm flex items-center'
          }`}
        >
          {componentState.hasFile ? (
            <div className={viewport.isMobile ? 'space-y-2' : ''}>
              <div
                className={`flex items-center ${viewport.isMobile ? 'text-base font-medium' : 'text-sm'}`}
              >
                <span className="mr-2">📄</span>
                <span className="truncate">{currentFile?.name}</span>
              </div>

              {componentState.hasSlices && (
                <div
                  className={`flex items-center ${viewport.isMobile ? 'text-sm text-gray-500' : 'ml-2'}`}
                >
                  <span className="mr-1">✂️</span>
                  <span>切片：{state.imageSlices.length}个</span>
                </div>
              )}

              {componentState.hasSelection && (
                <div
                  className={`flex items-center ${viewport.isMobile ? 'text-sm text-blue-600 font-medium' : 'ml-2'}`}
                >
                  <span className="mr-1">✅</span>
                  <span>已选择：{state.selectedSlices.size}个</span>
                </div>
              )}

              {/* 移动端额外信息 */}
              {viewport.isMobile && componentState.canExport && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="mr-1">💡</span>
                    准备就绪，可以导出选中的切片了
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className={`text-center ${viewport.isMobile ? 'py-2' : ''}`}>
              <span className={`text-gray-500 ${viewport.isMobile ? 'text-base' : 'text-sm'}`}>
                {viewport.isMobile ? '📱 请选择要分割的长截图' : '请选择文件开始'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 移动端操作提示 */}
      {viewport.isMobile && !componentState.hasFile && (
        <div className="mobile-tips mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-base font-medium text-blue-800 mb-2 flex items-center">
            <span className="mr-2">💡</span>
            使用提示
          </h4>
          <div className="space-y-2 text-sm text-blue-700">
            <p className="flex items-start">
              <span className="mr-2 mt-0.5">1️⃣</span>
              点击上方区域选择长截图文件
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-0.5">2️⃣</span>
              等待系统自动分割图片
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-0.5">3️⃣</span>
              选择需要的切片进行导出
            </p>
          </div>
        </div>
      )}

      {/* 调试面板（仅开发环境）- 移动端优化 */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`debug-section ${viewport.isMobile ? 'mt-8' : 'mt-6'}`}>
          <DebugPanel
            debugSnapshot={debugState.debugSnapshot}
            onLogDebugInfo={debugState.logDebugInfo}
            onRunDiagnostics={() => {
              const diagnostics = debugState.getDiagnostics();
              console.log('🩺 问题诊断结果:', diagnostics);

              if (diagnostics.hasIssues) {
                alert(
                  `发现 ${diagnostics.issues.length} 个问题:\n\n${diagnostics.issues.join('\n')}\n\n建议:\n${diagnostics.recommendations.join('\n')}`
                );
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
