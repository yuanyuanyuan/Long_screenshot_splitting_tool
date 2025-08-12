import React, { useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';

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
      onFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.match('image.*')) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="file-uploader">
      <div
        className={`drop-zone ${
          isDragOver ? 'drag-over' : ''
        } ${disabled || isProcessing ? 'disabled' : ''}`}
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
          style={{ display: 'none' }}
          disabled={disabled || isProcessing}
        />
        
        <div className="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        
        <div className="upload-text">
          <h3>{t('upload.title') || '选择或拖拽图片文件'}</h3>
          <p>{t('upload.subtitle') || '支持 JPG、PNG、GIF 等格式'}</p>
          {isProcessing && (
            <p className="processing-text">{t('upload.processing') || '正在处理中...'}</p>
          )}
        </div>
        
        {isProcessing && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
        
        <button 
          type="button" 
          className="upload-button"
          disabled={disabled || isProcessing}
        >
          {t('upload.button') || '选择文件'}
        </button>
      </div>
    </div>
  );
};