import { useCallback, useRef, useEffect } from 'react';
import type { WorkerMessage } from '../types';

export interface UseWorkerOptions {
  onProgress?: (progress: number) => void;
  onChunk?: (blob: Blob, index: number) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

export interface UseWorkerReturn {
  worker: Worker | null;
  isWorkerReady: boolean;
  startProcessing: (file: File, splitHeight: number) => void;
  terminateWorker: () => void;
  createWorker: () => void;
}

/**
 * Web Worker管理Hook
 * 提供Worker的创建、通信、生命周期管理功能
 */
export function useWorker(options: UseWorkerOptions = {}): UseWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const isWorkerReadyRef = useRef(false);
  
  const { onProgress, onChunk, onDone, onError } = options;
  
  // 创建Worker
  const createWorker = useCallback(() => {
    try {
      // 终止现有Worker
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        isWorkerReadyRef.current = false;
      }
      
      // 创建新Worker
      workerRef.current = new Worker(
        new URL('../workers/split.worker.js', import.meta.url)
      );
      
      // 设置消息监听器
      workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, progress, blob, index, message } = event.data;
        
        switch (type) {
          case 'progress':
            if (progress !== undefined && onProgress) {
              onProgress(progress);
            }
            break;
            
          case 'chunk':
            if (blob && index !== undefined && onChunk) {
              onChunk(blob, index);
            }
            break;
            
          case 'done':
            if (onDone) {
              onDone();
            }
            break;
            
          case 'error':
            if (message && onError) {
              onError(message);
            }
            break;
            
          default:
            console.warn('[useWorker] 未知的消息类型:', type);
        }
      };
      
      // 设置错误监听器
      workerRef.current.onerror = (error) => {
        console.error('[useWorker] Worker错误:', error);
        if (onError) {
          onError(`Worker错误: ${error.message}`);
        }
      };
      
      // 设置消息错误监听器
      workerRef.current.onmessageerror = (error) => {
        console.error('[useWorker] Worker消息错误:', error);
        if (onError) {
          onError('Worker消息传递错误');
        }
      };
      
      isWorkerReadyRef.current = true;
      console.log('[useWorker] Worker创建成功');
      
    } catch (error) {
      console.error('[useWorker] 创建Worker失败:', error);
      if (onError) {
        onError(`创建Worker失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }, [onProgress, onChunk, onDone, onError]);
  
  // 终止Worker
  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      try {
        workerRef.current.terminate();
        console.log('[useWorker] Worker已终止');
      } catch (error) {
        console.warn('[useWorker] 终止Worker时出错:', error);
      } finally {
        workerRef.current = null;
        isWorkerReadyRef.current = false;
      }
    }
  }, []);
  
  // 开始处理
  const startProcessing = useCallback((file: File, splitHeight: number) => {
    if (!workerRef.current || !isWorkerReadyRef.current) {
      console.error('[useWorker] Worker未就绪');
      if (onError) {
        onError('Worker未就绪，请先创建Worker');
      }
      return;
    }
    
    try {
      workerRef.current.postMessage({ file, splitHeight });
      console.log('[useWorker] 已发送处理请求到Worker');
    } catch (error) {
      console.error('[useWorker] 发送消息到Worker失败:', error);
      if (onError) {
        onError(`发送消息失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }, [onError]);
  
  // 组件卸载时清理Worker
  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, [terminateWorker]);
  
  return {
    worker: workerRef.current,
    isWorkerReady: isWorkerReadyRef.current,
    startProcessing,
    terminateWorker,
    createWorker,
  };
}