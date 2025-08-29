/**
/**
 * 文件上传组件 - 移动端优化版
 * 支持拖拽上传、点击选择文件和触摸友好界面
 */

import React, { useCallback, useState, useRef } from 'react';
import { useI18nContext } from '../hooks/useI18nContext';
import { useViewport } from '../hooks/useViewport';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  maxFileSize?: number;
  supportedFormats?: string[];
  className?: string;
  isProcessing?: boolean;
  progress?: number;
  enableTouchOptimization?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  disabled = false,
  maxFileSize = 30 * 1024 * 1024, // 30MB
  supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  className = '',
  isProcessing = false,
  progress = 0,
  enableTouchOptimization = true,
}) => {
  const { t } = useI18nContext();
  const viewport = useViewport();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 触摸反馈
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (enableTouchOptimization && viewport.isMobile && 'vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 };
      navigator.vibrate(patterns[type]);
    }
  }, [enableTouchOptimization, viewport.isMobile]);

  // 验证文件
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return t('upload.fileSizeError', { size: Math.round(maxFileSize / 1024 / 1024) });
      }

      if (!supportedFormats.includes(file.type)) {
        const formats = supportedFormats.map(f => f.split('/')[1]).join(', ');
        return t('upload.fileTypeError', { formats });
      }

      return null;
    },
    [maxFileSize, supportedFormats, t]
  );

  // 处理文件选择
  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        triggerHapticFeedback('heavy');
        return;
      }

      triggerHapticFeedback('medium');
      onFileSelect(file);
    },
    [validateFile, onFileSelect, triggerHapticFeedback]
  );

  // 处理拖拽事件
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isProcessing) {
        setIsDragOver(true);
      }
    },
    [disabled, isProcessing]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled || isProcessing) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, isProcessing, handleFileSelect]
  );

  // 处理点击上传
  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      triggerHapticFeedback('light');
      fileInputRef.current.click();
    }
  }, [disabled, isProcessing, triggerHapticFeedback]);

  // 处理触摸事件（移动端）
  const handleTouchStart = useCallback(() => {
    if (!disabled && !isProcessing) {
      setIsActive(true);
      triggerHapticFeedback('light');
    }
  }, [disabled, isProcessing, triggerHapticFeedback]);

  const handleTouchEnd = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // 移动端样式
  const mobileOptimizedClass = viewport.isMobile ? 'mobile-file-uploader' : '';
  const isDisabled = disabled || isProcessing;

  return (
    <div className={`file-uploader ${className} ${mobileOptimizedClass}`}>
      {/* 上传区域 */}
      <div
        className={`
          upload-area border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200
          ${viewport.isMobile ? 'p-8 min-h-[200px]' : 'p-6 min-h-[160px]'}
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : isActive
            ? 'border-blue-400 bg-blue-25 scale-[0.98]'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${viewport.isMobile ? 'active:scale-[0.98] shadow-sm' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {/* 上传图标 */}
        <div className={`upload-icon ${viewport.isMobile ? 'text-5xl mb-4' : 'text-4xl mb-4'}`}>
          {isProcessing ? '⏳' : isDragOver ? '📥' : '📤'}
        </div>

        {/* 上传文字 */}
        <div className="upload-text">
          {isProcessing ? (
            <div className="processing-state">
              <p className={`${viewport.isMobile ? 'text-xl' : 'text-lg'} font-medium text-blue-600 mb-3`}>
                {t('upload.processing')}
              </p>
              {progress > 0 && (
                <div className="progress-container mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}%</p>
                </div>
              )}
            </div>
          ) : (
            <div className="upload-state">
              <p className={`${viewport.isMobile ? 'text-xl' : 'text-lg'} font-medium text-gray-700 mb-3`}>
                {isDragOver 
                  ? t('upload.dropToUpload') 
                  : viewport.isMobile 
                  ? t('upload.tapToUpload') 
                  : t('upload.dragText')
                }
              </p>
              
              {/* 移动端额外提示 */}
              {viewport.isMobile && !isDragOver && (
                <div className="mobile-instructions mb-4">
                  <div className="flex items-center justify-center space-x-4 text-gray-500">
                    <span className="flex items-center text-sm">
                      <span className="mr-1">👆</span>
                      {t('upload.tapInstruction')}
                    </span>
                    {/* 如果支持文件API，显示相机选项 */}
                    {'capture' in HTMLInputElement.prototype && (
                      <span className="flex items-center text-sm">
                        <span className="mr-1">📷</span>
                        {t('upload.cameraOption')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <p className={`${viewport.isMobile ? 'text-base' : 'text-sm'} text-gray-500`}>
                {t('upload.supportedFormats', { 
                  formats: supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', '),
                  maxSize: Math.round(maxFileSize / 1024 / 1024)
                })}
              </p>
            </div>
          )}
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={isDisabled}
          /* 移动端支持相机拍照 */
          capture={viewport.isMobile ? "environment" : undefined}
        />
      </div>

      {/* 移动端快捷按钮 */}
      {viewport.isMobile && !isProcessing && (
        <div className="mobile-upload-buttons mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={handleClick}
            disabled={isDisabled}
            className="
              px-4 py-3 bg-blue-500 text-white rounded-lg font-medium
              hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50
              min-h-[44px] flex items-center justify-center
              transition-colors shadow-sm
            "
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <span className="mr-2">📁</span>
            {t('upload.selectFile')}
          </button>
          
          {/* 相机按钮（如果设备支持） */}
          {'capture' in HTMLInputElement.prototype && (
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  // 设置相机捕获并触发
                  fileInputRef.current.setAttribute('capture', 'environment');
                  fileInputRef.current.click();
                }
              }}
              disabled={isDisabled}
              className="
                px-4 py-3 bg-green-500 text-white rounded-lg font-medium
                hover:bg-green-600 active:bg-green-700 disabled:opacity-50
                min-h-[44px] flex items-center justify-center
                transition-colors shadow-sm
              "
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span className="mr-2">📷</span>
              {t('upload.takePhoto')}
            </button>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className={`error-message ${viewport.isMobile ? 'mt-6 p-4' : 'mt-4 p-3'} bg-red-100 border border-red-400 text-red-700 rounded-lg`}>
          <div className="flex items-start">
            <span className="mr-2 text-lg">⚠️</span>
            <div className="flex-1">
              <p className={`${viewport.isMobile ? 'text-base font-medium' : 'text-sm'}`}>
                {error}
              </p>
              {/* 移动端错误解决提示 */}
              {viewport.isMobile && (
                <p className="text-sm text-red-600 mt-2">
                  💡 {t('upload.errorHint')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 移动端文件信息提示 */}
      {viewport.isMobile && !error && !isProcessing && (
        <div className="mobile-file-info mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 space-y-1">
            <p className="flex items-center">
              <span className="mr-2">📋</span>
              支持格式: {supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
            </p>
            <p className="flex items-center">
              <span className="mr-2">📏</span>
              文件大小限制: {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
            <p className="flex items-center">
              <span className="mr-2">🔒</span>
              文件仅在本地处理，不会上传到服务器
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;