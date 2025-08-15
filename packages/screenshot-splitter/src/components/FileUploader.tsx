/**
 * 文件上传组件
 * 支持拖拽上传和点击选择文件
 */

import React, { useCallback, useState, useRef } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  maxFileSize?: number;
  supportedFormats?: string[];
  className?: string;
  isProcessing?: boolean;
  progress?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  disabled = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `文件大小不能超过 ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }

    if (!supportedFormats.includes(file.type)) {
      return `不支持的文件格式，请上传 ${supportedFormats.map(f => f.split('/')[1]).join(', ')} 格式的图片`;
    }

    return null;
  }, [maxFileSize, supportedFormats]);

  // 处理文件选择
  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  // 处理点击上传
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className={`file-uploader ${className}`}>
      {/* 上传区域 */}
      <div
        className={`
          upload-area border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-icon text-4xl mb-4">
          📤
        </div>
        
        <div className="upload-text">
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragOver ? '释放文件以上传' : '拖拽图片到此处或点击选择'}
          </p>
          <p className="text-sm text-gray-500">
            支持 {supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} 格式，
            最大 {Math.round(maxFileSize / 1024 / 1024)}MB
          </p>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-message mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;