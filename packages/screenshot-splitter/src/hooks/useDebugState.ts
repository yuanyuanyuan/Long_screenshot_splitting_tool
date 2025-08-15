/**
 * 调试状态Hook
 * 收集所有相关状态数据，用于问题诊断
 */

import { useMemo } from 'react';

interface DebugStateProps {
  state: any;
  originalImage?: HTMLImageElement | null;
  slices?: any[];
  selectedSlices?: number[];
  isProcessing?: boolean;
}

export const useDebugState = ({
  state,
  originalImage,
  slices,
  selectedSlices,
  isProcessing
}: DebugStateProps) => {
  
  const debugSnapshot = useMemo(() => {
    const snapshot = {
      // 原始状态数据
      hasOriginalImage: !!originalImage,
      originalImageSrc: originalImage?.src || null,
      
      // 切片相关数据
      slicesArray: slices || [],
      slicesCount: slices?.length || 0,
      hasSlices: !!(slices && slices.length > 0),
      
      // 选择状态
      selectedSlicesArray: selectedSlices || [],
      selectedSlicesCount: selectedSlices?.length || 0,
      
      // 处理状态
      isProcessing: !!isProcessing,
      
      // 状态对象详情
      stateDetails: state ? {
        imageSlicesLength: state.imageSlices?.length || 0,
        selectedSlicesSize: state.selectedSlices?.size || 0,
        hasOriginalImageInState: !!state.originalImage,
        isProcessingInState: !!state.isProcessing
      } : null,
      
      // URL对象检查
      urlValidation: slices ? slices.map((slice, index) => ({
        index,
        hasUrl: !!slice.url,
        urlValid: slice.url && slice.url.startsWith('blob:'),
        hasBlob: !!slice.blob,
        blobSize: slice.blob?.size || 0
      })) : [],
      
      // 渲染条件检查
      renderingConditions: {
        shouldShowNoContent: (!originalImage) && (!slices || slices.length === 0),
        shouldShowSlicesFirst: !!(slices && slices.length > 0 && !originalImage),
        canShowOriginal: !!originalImage,
        canShowSlices: !!(slices && slices.length > 0)
      },
      
      // 时间戳
      timestamp: new Date().toISOString()
    };
    
    return snapshot;
  }, [state, originalImage, slices, selectedSlices, isProcessing]);

  // 控制台输出详细调试信息
  const logDebugInfo = () => {
    console.group('🔍 图片切割调试信息');
    console.log('📊 完整状态快照:', debugSnapshot);
    console.log('🎯 渲染条件分析:', debugSnapshot.renderingConditions);
    console.log('🔗 URL验证结果:', debugSnapshot.urlValidation);
    console.groupEnd();
  };

  // 获取问题诊断结果
  const getDiagnostics = () => {
    const issues = [];
    
    if (debugSnapshot.slicesCount > 0 && debugSnapshot.renderingConditions.shouldShowNoContent) {
      issues.push('有切片数据但显示"暂无图片预览"');
    }
    
    if (debugSnapshot.slicesCount > 0 && !debugSnapshot.renderingConditions.canShowSlices) {
      issues.push('切片数据存在但无法显示切片视图');
    }
    
    const invalidUrls = debugSnapshot.urlValidation.filter(item => !item.urlValid);
    if (invalidUrls.length > 0) {
      issues.push(`${invalidUrls.length}个切片的URL无效`);
    }
    
    if (debugSnapshot.stateDetails && debugSnapshot.slicesCount !== debugSnapshot.stateDetails.imageSlicesLength) {
      issues.push('传递给组件的切片数量与状态中的不一致');
    }
    
    return {
      hasIssues: issues.length > 0,
      issues,
      recommendations: issues.length > 0 ? [
        '检查ImagePreview组件的props传递',
        '验证切片URL的生成逻辑',
        '确认状态更新的时序'
      ] : ['状态正常']
    };
  };

  return {
    debugSnapshot,
    logDebugInfo,
    getDiagnostics
  };
};

export default useDebugState;