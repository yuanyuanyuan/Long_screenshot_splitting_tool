import React, { useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../utils/styleMapping';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  progress: number;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  isProcessing,
  progress,
  disabled = false,
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.match('image.*')) {
      // 添加文件大小检查
      if (file.size > 50 * 1024 * 1024) {
        alert(t('upload.fileTooLarge') || '文件大小不能超过50MB');
        return;
      }
      onFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isProcessing) return;
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.match('image.*')) {
        // 添加文件大小检查
        if (file.size > 50 * 1024 * 1024) {
          alert(t('upload.fileTooLarge') || '文件大小不能超过50MB');
          return;
        }
        onFileSelect(file);
      } else {
        alert(t('upload.invalidFileType') || '请选择图片文件');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "bg-gray-50 border-2 border-dashed rounded-xl p-4 md:p-8 text-center transition-all duration-300 cursor-pointer relative overflow-hidden",
          isDragOver ? "border-success-500 bg-success-50 scale-[1.02]" : "border-gray-300 hover:border-primary-500 hover:bg-primary-50",
          (disabled || isProcessing) ? "opacity-70 cursor-not-allowed" : ""
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />
        
        <div className="mx-auto mb-3 md:mb-4 text-gray-500">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        
        <div className="mb-2">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-1 md:mb-2">{t('upload.title') || '选择或拖拽图片文件'}</h3>
          <p className="text-gray-600 text-xs md:text-sm">{t('upload.subtitle') || '支持 JPG、PNG、GIF 等格式，最大50MB'}</p>
          {isProcessing && (
            <p className="text-primary-600 mt-2">{t('upload.processing') || '正在处理中...'}</p>
          )}
        </div>
        
        {isProcessing && (
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 mt-1 block">{progress}%</span>
          </div>
        )}
        
        <button 
          type="button" 
          className={cn(
            "mt-3 md:mt-4 px-4 md:px-6 py-1.5 md:py-2 rounded-md font-medium transition-colors duration-200",
            disabled || isProcessing 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
              : "bg-primary-500 text-white hover:bg-primary-600"
          )}
          disabled={disabled || isProcessing}
        >
          {t('upload.button') || '选择文件'}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;