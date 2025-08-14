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

// 导航相关类型定义

export interface NavigationItem {
  path: string;
  name: string;
  icon?: string;
  disabled?: boolean;
  active?: boolean;
  tooltip?: string;
  badge?: number;
}

export interface NavigationState {
  currentStep: string;
  availableSteps: string[];
  completedSteps: string[];
  blockedSteps: string[];
}

export interface NavigationMetrics {
  totalSteps: number;
  completedSteps: number;
  currentStepIndex: number;
  progressPercentage: number;
}

export interface NavigationProps {
  items?: NavigationItem[];
  showBreadcrumb?: boolean;
  className?: string;
  appState: AppState;
  onNavigate?: NavigationCallback;
  onStateChange?: NavigationStateChangeCallback;
  enableValidation?: boolean;
  debounceMs?: number;
}

export type NavigationCallback = (path: string, navigationState: NavigationState) => boolean | void;
export type NavigationStateChangeCallback = (state: NavigationState, error?: NavigationError) => void;

export interface NavigationError {
  type: 'INVALID_STATE' | 'MISSING_PREREQUISITES' | 'PROCESSING_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  prerequisite?: string;
  suggestedPath?: string;
}

export interface NavigationContext {
  currentPath: string;
  appState: AppState;
  previousPath?: string;
}

export interface NavigationActionResult {
  action: 'redirect' | 'show_warning' | 'show_error' | 'log_error';
  path?: string;
  message: string;
  allowRetry?: boolean;
  suggestedPath?: string;
}
