// 应用状态类型定义

export interface ImageSlice {
  blob: Blob;
  url: string;
  index: number;
  width: number;
  height: number;
}

export interface AppState {
  // Worker 相关状态
  worker: Worker | null;
  blobs: Blob[];
  objectUrls: string[];
  
  // 图片处理状态
  originalImage: HTMLImageElement | null;
  imageSlices: ImageSlice[];
  selectedSlices: Set<number>;
  
  // 处理状态
  isProcessing: boolean;
  
  // 元数据
  splitHeight: number;
  fileName: string;
}

export type AppAction = 
  | { type: 'SET_WORKER'; payload: Worker | null }
  | { type: 'ADD_BLOB'; payload: { blob: Blob; index: number } }
  | { type: 'SET_ORIGINAL_IMAGE'; payload: HTMLImageElement | null }
  | { type: 'ADD_IMAGE_SLICE'; payload: ImageSlice }
  | { type: 'TOGGLE_SLICE_SELECTION'; payload: number }
  | { type: 'SELECT_ALL_SLICES' }
  | { type: 'DESELECT_ALL_SLICES' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SPLIT_HEIGHT'; payload: number }
  | { type: 'SET_FILE_NAME'; payload: string }
  | { type: 'CLEANUP_SESSION' }
  | { type: 'PROCESSING_COMPLETE' };

export interface WorkerMessage {
  type: 'progress' | 'chunk' | 'done' | 'error';
  progress?: number;
  blob?: Blob;
  index?: number;
  message?: string;
}

export interface ImageProcessorHookReturn {
  processImage: (file: File) => void;
  progress: number;
  isProcessing: boolean;
}

export interface I18nHookReturn {
  t: (key: string, params?: Record<string, any>) => string;
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  isLoading: boolean;
  supportedLanguages: readonly string[];
}