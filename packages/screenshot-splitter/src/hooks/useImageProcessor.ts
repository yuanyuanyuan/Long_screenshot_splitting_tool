import { useState, useCallback } from 'react';
import type { ImageProcessorHookReturn, AppState } from '../types';
import { useWorker } from './useWorker';

interface UseImageProcessorProps {
  state: AppState;
  actions: {
    addBlob: (blob: Blob, index: number) => void;
    addImageSlice: (slice: any) => void;
    cleanupSession: () => void;
    setProcessing: (isProcessing: boolean) => void;
    setFileName: (name: string) => void;
    setWorker: (worker: Worker | null) => void;
    processingComplete: () => void;
  };
}

export function useImageProcessor({
  state,
  actions,
}: UseImageProcessorProps): ImageProcessorHookReturn {
  const [progress, setProgress] = useState(0);

  // Worker回调函数
  const handleProgress = useCallback((workerProgress: number) => {
    setProgress(workerProgress);
  }, []);

  const handleChunk = useCallback(
    (blob: Blob, index: number) => {
      console.log('[ImageProcessor] 收到图片切片:', index, blob.size);
      // 添加Blob到状态
      actions.addBlob(blob, index);

      // 创建Object URL并添加图片切片
      const url = URL.createObjectURL(blob);
      console.log('[ImageProcessor] 创建 Object URL:', url);

      // 创建临时图片来获取尺寸
      const img = new Image();
      img.onload = () => {
        console.log('[ImageProcessor] 图片加载完成，尺寸:', img.naturalWidth, img.naturalHeight);
        console.log(
          '[ImageProcessor] 添加图片切片到状态:',
          index,
          img.naturalWidth,
          img.naturalHeight
        );
        const imageSlice = {
          blob,
          url,
          index,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        console.log('[ImageProcessor] 即将添加的图片切片对象:', imageSlice);
        actions.addImageSlice(imageSlice);
      };
      img.onerror = error => {
        console.error('[ImageProcessor] 图片加载失败:', error);
      };
      img.src = url;
    },
    [actions]
  );

  const handleDone = useCallback(() => {
    console.log('[ImageProcessor] 图片处理完成');
    actions.processingComplete();
    setProgress(100);
  }, [actions]);

  const handleError = useCallback(
    (message: string) => {
      console.error('[ImageProcessor] Worker 错误:', message);
      actions.setProcessing(false);
      setProgress(0);
    },
    [actions]
  );

  // 使用Worker hook
  const { createWorker, startProcessing } = useWorker({
    onProgress: handleProgress,
    onChunk: handleChunk,
    onDone: handleDone,
    onError: handleError,
  });

  // 处理图片
  const processImage = useCallback(
    async (file: File) => {
      console.log('[ImageProcessor] 开始处理图片:', file.name);

      // 清理之前的会话
      actions.cleanupSession();
      setProgress(0);

      // 设置处理状态
      actions.setProcessing(true);
      actions.setFileName(file.name.replace(/\.[^/.]+$/, '') || '分割结果');

      // 确保Worker已创建
      createWorker();

      // 等待一小段时间确保Worker创建完成
      await new Promise(resolve => setTimeout(resolve, 200));

      // 开始处理
      startProcessing(file, state.splitHeight);

      console.log('[ImageProcessor] 已发送文件到 Worker，分割高度:', state.splitHeight);
    },
    [actions, createWorker, startProcessing, state.splitHeight]
  );

  return {
    processImage,
    progress,
    isProcessing: state.isProcessing,
  };
}
