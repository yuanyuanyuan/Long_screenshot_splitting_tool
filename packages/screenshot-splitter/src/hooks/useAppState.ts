import { useReducer, useCallback, useEffect } from 'react';
import type { AppState, AppAction, ImageSlice } from '../types';
import { loadState, saveState, createDebouncedSave, type PersistableState } from '../utils/persistence';

// 创建防抖保存函数
const debouncedSave = createDebouncedSave(500);

// 从持久化存储加载初始状态
function createInitialState(): AppState {
  const persistedState = loadState();
  
  return {
    worker: null,
    blobs: [],
    objectUrls: [],
    originalImage: null,
    imageSlices: [],
    selectedSlices: new Set<number>(),
    isProcessing: false,
    splitHeight: persistedState?.splitHeight ?? 1200,
    fileName: persistedState?.fileName ?? '分割结果',
  };
}

const initialState: AppState = createInitialState();

// 状态reducer
function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_WORKER':
      return { ...state, worker: action.payload };
    
    case 'ADD_BLOB': {
      const newBlobs = [...state.blobs];
      newBlobs[action.payload.index] = action.payload.blob;
      return { ...state, blobs: newBlobs };
    }
    
    case 'SET_ORIGINAL_IMAGE':
      return { ...state, originalImage: action.payload };
    
    case 'ADD_IMAGE_SLICE': {
      console.log('[AppState] 添加图片切片 action 被调用:', action.payload);
      const newState = {
        ...state,
        imageSlices: [...state.imageSlices, action.payload],
        objectUrls: [...state.objectUrls, action.payload.url],
      };
      console.log('[AppState] 新状态中的 imageSlices 数量:', newState.imageSlices.length);
      console.log('[AppState] 新状态中的 imageSlices:', newState.imageSlices);
      return newState;
    }
    
    case 'TOGGLE_SLICE_SELECTION': {
      const newSelectedSlices = new Set(state.selectedSlices);
      if (newSelectedSlices.has(action.payload)) {
        newSelectedSlices.delete(action.payload);
      } else {
        newSelectedSlices.add(action.payload);
      }
      return { ...state, selectedSlices: newSelectedSlices };
    }
    
    case 'SELECT_ALL_SLICES': {
      const allIndices = state.imageSlices.map(slice => slice.index);
      return { ...state, selectedSlices: new Set(allIndices) };
    }
    
    case 'DESELECT_ALL_SLICES':
      return { ...state, selectedSlices: new Set<number>() };
    
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    
    case 'SET_SPLIT_HEIGHT':
      return { ...state, splitHeight: action.payload };
    
    case 'SET_FILE_NAME':
      return { ...state, fileName: action.payload };
    
    case 'CLEANUP_SESSION':
      // 清理所有Object URLs
      state.objectUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn('[AppState] 释放 Object URL 失败:', error);
        }
      });
      
      // 终止Worker
      if (state.worker) {
        try {
          state.worker.terminate();
        } catch (error) {
          console.warn('[AppState] 终止 Worker 失败:', error);
        }
      }
      
      return {
        ...initialState,
        splitHeight: state.splitHeight, // 保留用户设置
        fileName: state.fileName, // 保留用户设置
      };
    
    case 'PROCESSING_COMPLETE':
      return { ...state, isProcessing: false };
    
    default:
      return state;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  // 自动保存可持久化的状态
  useEffect(() => {
    const persistableState: PersistableState = {
      splitHeight: state.splitHeight,
      fileName: state.fileName,
    };
    
    debouncedSave(persistableState);
  }, [state.splitHeight, state.fileName]);
  
  // 提供语言设置保存的辅助函数
  const saveLanguagePreference = useCallback((language: string) => {
    const currentState = loadState() || { splitHeight: state.splitHeight, fileName: state.fileName };
    const updatedState: PersistableState = {
      ...currentState,
      language,
    };
    saveState(updatedState);
  }, [state.splitHeight, state.fileName]);
  
  // Action creators
  const setWorker = useCallback((worker: Worker | null) => {
    dispatch({ type: 'SET_WORKER', payload: worker });
  }, []);
  
  const addBlob = useCallback((blob: Blob, index: number) => {
    dispatch({ type: 'ADD_BLOB', payload: { blob, index } });
  }, []);
  
  const setOriginalImage = useCallback((image: HTMLImageElement | null) => {
    dispatch({ type: 'SET_ORIGINAL_IMAGE', payload: image });
  }, []);
  
  const addImageSlice = useCallback((slice: ImageSlice) => {
    dispatch({ type: 'ADD_IMAGE_SLICE', payload: slice });
  }, []);
  
  const toggleSliceSelection = useCallback((index: number) => {
    dispatch({ type: 'TOGGLE_SLICE_SELECTION', payload: index });
  }, []);
  
  const selectAllSlices = useCallback(() => {
    dispatch({ type: 'SELECT_ALL_SLICES' });
  }, []);
  
  const deselectAllSlices = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL_SLICES' });
  }, []);
  
  const setProcessing = useCallback((isProcessing: boolean) => {
    dispatch({ type: 'SET_PROCESSING', payload: isProcessing });
  }, []);
  
  const setSplitHeight = useCallback((height: number) => {
    dispatch({ type: 'SET_SPLIT_HEIGHT', payload: height });
  }, []);
  
  const setFileName = useCallback((name: string) => {
    dispatch({ type: 'SET_FILE_NAME', payload: name });
  }, []);
  
  const cleanupSession = useCallback(() => {
    dispatch({ type: 'CLEANUP_SESSION' });
  }, []);
  
  const processingComplete = useCallback(() => {
    dispatch({ type: 'PROCESSING_COMPLETE' });
  }, []);
  
  // 调试用的状态快照
  const getStateSnapshot = useCallback(() => {
    return {
      hasOriginalImage: !!state.originalImage,
      blobsCount: state.blobs.length,
      objectUrlsCount: state.objectUrls.length,
      imageSlicesCount: state.imageSlices.length,
      selectedSlicesCount: state.selectedSlices.size,
      isProcessing: state.isProcessing,
      hasWorker: !!state.worker,
      splitHeight: state.splitHeight,
      fileName: state.fileName,
    };
  }, [state]);
  
  return {
    state,
    actions: {
      setWorker,
      addBlob,
      setOriginalImage,
      addImageSlice,
      toggleSliceSelection,
      selectAllSlices,
      deselectAllSlices,
      setProcessing,
      setSplitHeight,
      setFileName,
      cleanupSession,
      processingComplete,
    },
    utils: {
      saveLanguagePreference,
    },
    getStateSnapshot,
  };
}