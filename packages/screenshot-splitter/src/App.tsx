import { useEffect, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { useImageProcessor } from './hooks/useImageProcessor';
import { useI18n } from './hooks/useI18n';
import { useRouter } from './hooks/useRouter';
import { useNavigationState } from './hooks/useNavigationState';
import { FileUploader } from './components/FileUploader';
import { ImagePreview } from './components/ImagePreview';
import { ExportControls } from './components/ExportControls';
import Navigation from './components/Navigation';
import DebugInfoControl from './components/DebugInfoControl';
import { exportToPDF } from './utils/pdfExporter';
import { exportToZIP } from './utils/zipExporter';
import { 
  navigationErrorHandler, 
  validateNavigation, 
  handleProcessingError,
  type NavigationError,
  type RecoveryStrategy 
} from './utils/navigationErrorHandler';

function App() {
  const { state, actions, getStateSnapshot } = useAppState();
  const { processImage, progress, isProcessing } = useImageProcessor({ state, actions });
  const { t, currentLanguage, changeLanguage, isLoading: i18nLoading } = useI18n();
  const { currentPath, push } = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [isStateValidated, setIsStateValidated] = useState(false);
  const [navigationError, setNavigationError] = useState<NavigationError | null>(null);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  
  // 调试控制状态
  const [debugControlVisible, setDebugControlVisible] = useState(false);
  const isDevelopment = import.meta.env.DEV;
  const shouldShowDebugInfo = isDevelopment || debugControlVisible;
  
  // 调试日志包装函数
  const debugLog = (...args: any[]) => {
    if (shouldShowDebugInfo) {
      console.log(...args);
    }
  };

  // 调试：在控制台输出状态（仅在允许调试时）
  useEffect(() => {
    debugLog('[App] 状态快照:', getStateSnapshot());
  }, [getStateSnapshot, shouldShowDebugInfo]);

  // 调试：监听 imageSlices 变化
  useEffect(() => {
    debugLog('[App] imageSlices 变化:', state.imageSlices.length);
    debugLog('[App] 是否应该显示预览界面:', state.imageSlices.length > 0);
    debugLog('[App] 完整的state对象:', state);
    if (state.imageSlices.length > 0) {
      debugLog('[App] 第一个切片信息:', state.imageSlices[0]);
      debugLog('[App] 所有切片URLs:', state.imageSlices.map(slice => slice.url));
    }
  }, [state.imageSlices, shouldShowDebugInfo]);

  // 调试：监听整个state变化
  useEffect(() => {
    debugLog('[App] 整个state发生变化:', {
      imageSlicesCount: state.imageSlices.length,
      isProcessing: state.isProcessing,
      hasOriginalImage: !!state.originalImage,
      selectedSlicesCount: state.selectedSlices.size
    });
  }, [state, shouldShowDebugInfo]);

  // 调试：监控处理状态变化
  useEffect(() => {
    debugLog('[App] 处理状态变化:', isProcessing, progress);
  }, [isProcessing, progress, shouldShowDebugInfo]);

  // 调试：监控选中状态变化
  useEffect(() => {
    debugLog('[App] 选中切片变化:', Array.from(state.selectedSlices));
  }, [state.selectedSlices, shouldShowDebugInfo]);

  // 页面刷新状态恢复逻辑（集成错误处理）
  useEffect(() => {
    const validateAndRecoverState = () => {
      debugLog('[App] 开始状态验证和恢复...');
      
      // 使用导航错误处理器验证状态
      const error = validateNavigation(currentPath, state);
      
      if (error) {
        debugLog('[App] 发现导航错误:', error);
        
        // 处理导航错误并获取恢复策略
        const strategy = navigationErrorHandler.handleNavigationError(error);
        
        debugLog('[App] 执行恢复策略:', strategy);
        
        // 设置错误状态
        setNavigationError(error);
        
        // 显示错误消息（如果需要）
        if (strategy.showMessage) {
          setShowErrorMessage(true);
          // 3秒后自动隐藏错误消息
          setTimeout(() => setShowErrorMessage(false), 3000);
        }
        
        // 清除状态（如果需要）
        if (strategy.clearState) {
          debugLog('[App] 清除应用状态');
          actions.cleanupSession();
        }
        
        // 重定向到恢复路径
        push(strategy.redirectTo);
        return;
      }
      
      debugLog('[App] 状态验证完成，路径一致');
      setIsStateValidated(true);
    };

    // 延迟执行状态验证，确保所有状态都已初始化
    const timer = setTimeout(validateAndRecoverState, 100);
    
    return () => clearTimeout(timer);
  }, [currentPath, state, push, debugLog, actions]);

  // 防止在状态验证完成前渲染内容
  if (!isStateValidated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('app.loading') || '正在加载...'}</p>
        </div>
      </div>
    );
  }

  const handleFileSelect = async (file: File) => {
    try {
      await processImage(file);
    } catch (error) {
      // 使用导航错误处理器处理处理错误
      console.error('[App] 图片处理失败:', error);
      
      const strategy = handleProcessingError(
        currentPath, 
        error as Error, 
        state
      );
      
      // 设置错误状态
      setNavigationError(navigationErrorHandler.getLastError());
      setShowErrorMessage(true);
      
      // 执行恢复策略
      if (strategy.clearState) {
        actions.cleanupSession();
      }
      
      // 延迟重定向，让用户看到错误消息
      setTimeout(() => {
        push(strategy.redirectTo);
        setShowErrorMessage(false);
      }, 2000);
    }
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(event.target.value);
  };

  const handleExportPDF = async () => {
    if (state.selectedSlices.size === 0) {
      alert(t('export.noSelection'));
      return;
    }
    
    try {
      setIsExporting(true);
      await exportToPDF(
        state.imageSlices,
        state.selectedSlices,
        'exported-images.pdf',
        (progress: number) => {
          debugLog(`PDF导出进度: ${progress}%`);
        }
      );
      debugLog('PDF导出完成');
    } catch (error) {
      console.error('PDF导出失败:', error);
      alert(t('export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZIP = async () => {
    if (state.selectedSlices.size === 0) {
      alert(t('export.noSelection'));
      return;
    }
    
    try {
      setIsExporting(true);
      await exportToZIP(
        state.imageSlices,
        state.selectedSlices,
        'exported-images.zip',
        (progress: number) => {
          debugLog(`ZIP导出进度: ${progress}%`);
        }
      );
      debugLog('ZIP导出完成');
    } catch (error) {
      console.error('ZIP导出失败:', error);
      alert(t('export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  if (i18nLoading) {
    return <div>Loading...</div>;
  }

  // 根据路由渲染不同内容
  const renderContent = () => {
    switch (currentPath) {
      case '/upload':
        return (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('upload.title') || '上传图片'}</h2>
            <FileUploader
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
              progress={progress}
            />
          </section>
        );
        
      case '/split':
        // 增强状态验证：检查是否有原始图片和切片
        if (!state.originalImage || state.imageSlices.length === 0) {
          return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm mx-4">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('split.validation.title') || '需要先上传图片'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('split.validation.message') || '要使用分割功能，请先上传一张长截图。系统会自动将其分割成多个部分。'}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => push('/upload')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('split.validation.goUpload') || '📤 去上传图片'}
                  </button>
                  <button
                    onClick={() => push('/')}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('split.validation.goHome') || '🏠 返回首页'}
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('split.title') || '分割设置'}</h2>
            <ImagePreview
              originalImage={state.originalImage}
              slices={state.imageSlices}
              selectedSlices={Array.from(state.selectedSlices)}
              onSelectionChange={(selectedIndices) => {
                // 清除当前选择
                actions.deselectAllSlices();
                // 添加新选择
                selectedIndices.forEach(index => {
                  actions.toggleSliceSelection(index);
                });
              }}
            />
          </section>
        );
        
      case '/export':
        // 增强状态验证：检查完整的导出前置条件
        if (!state.originalImage || state.imageSlices.length === 0) {
          return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm mx-4">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('export.validation.noImage.title') || '需要先上传图片'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('export.validation.noImage.message') || '要导出图片，请先上传一张长截图并完成分割。'}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => push('/upload')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('export.validation.noImage.goUpload') || '📤 去上传图片'}
                  </button>
                  <button
                    onClick={() => push('/')}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('export.validation.goHome') || '🏠 返回首页'}
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        if (state.selectedSlices.size === 0) {
          return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm mx-4">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">✂️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('export.validation.noSelection.title') || '需要选择要导出的图片'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('export.validation.noSelection.message') || '请先在分割页面选择要导出的图片切片，然后再进行导出操作。'}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center text-blue-800 text-sm">
                    <span className="mr-2">💡</span>
                    <span>{t('export.validation.noSelection.tip') || `当前有 ${state.imageSlices.length} 个切片可供选择`}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => push('/split')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('export.validation.noSelection.goSplit') || '✂️ 去选择图片'}
                  </button>
                  <button
                    onClick={() => push('/')}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('export.validation.goHome') || '🏠 返回首页'}
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('export.title') || '导出结果'}</h2>
            <ExportControls
              selectedSlices={Array.from(state.selectedSlices)}
              slices={state.imageSlices}
              onExport={(format) => {
                if (format === 'pdf') {
                  handleExportPDF();
                } else if (format === 'zip') {
                  handleExportZIP();
                }
              }}
              disabled={isExporting}
            />
          </section>
        );
        
      default: // 首页
        return (
          <>
            <section className="mb-8">
              <FileUploader
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                progress={progress}
              />
            </section>

            {state.imageSlices.length > 0 && (
              <>
                <section className="mb-8">
                  {shouldShowDebugInfo && (
                    <h2 className="text-xl font-bold text-red-600 mb-4 text-center">
                      🎯 预览界面已渲染 - 切片数量: {state.imageSlices.length}
                    </h2>
                  )}
                  <ImagePreview
                    originalImage={state.originalImage}
                    slices={state.imageSlices}
                    selectedSlices={Array.from(state.selectedSlices)}
                    onSelectionChange={(selectedIndices) => {
                      // 清除当前选择
                      actions.deselectAllSlices();
                      // 添加新选择
                      selectedIndices.forEach(index => {
                        actions.toggleSliceSelection(index);
                      });
                    }}
                  />
                  {/* 调试信息 */}
                  {shouldShowDebugInfo && (
                    <div className="debug-info mt-4 p-4 bg-yellow-100 rounded">
                      <h3 className="font-bold">🔍 App.tsx 传递给 ImagePreview 的数据:</h3>
                      <pre className="text-xs mt-2">
                        {JSON.stringify({
                          originalImage: !!state.originalImage,
                          slicesCount: state.imageSlices.length,
                          selectedSlicesCount: Array.from(state.selectedSlices).length,
                          firstSlice: state.imageSlices[0] ? {
                            hasBlob: !!state.imageSlices[0].blob,
                            hasUrl: !!state.imageSlices[0].url,
                            url: state.imageSlices[0].url?.substring(0, 50) + '...',
                            width: state.imageSlices[0].width,
                            height: state.imageSlices[0].height
                          } : null
                        }, null, 2)}
                      </pre>
                    </div>
                  )}
                </section>

                <section className="mb-8">
            <ExportControls
              selectedSlices={Array.from(state.selectedSlices)}
              slices={state.imageSlices}
              onExport={handleExportPDF}
              disabled={isExporting}
            />
                </section>
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="app-container">
        <header className="text-center py-8 mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">{t('header.title')}</h1>
          <p className="text-lg text-gray-600 mb-6">{t('header.subtitle')}</p>
          
          <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
            <label htmlFor="language-select" className="text-sm font-medium text-gray-700">{t('lang.current')}: </label>
            <select 
              id="language-select" 
              value={currentLanguage} 
              onChange={handleLanguageChange}
              className="bg-transparent border-none text-sm font-medium text-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="zh-CN">{t('lang.switcher.zh-CN')}</option>
              <option value="en">{t('lang.switcher.en')}</option>
            </select>
          </div>
        </header>

        {/* 导航组件 */}
        <Navigation
          appState={state}
          currentPath={currentPath}
          onNavigate={(path: string) => {
            push(path);
          }}
        />

        <main>
          {/* 错误消息提示 */}
          {showErrorMessage && navigationError && (
            <div className="fixed top-4 right-4 z-50 max-w-md">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-red-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {t('navigation.error.title') || '导航错误'}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{t(navigationError.message) || navigationError.message}</p>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        className="text-sm bg-red-100 text-red-800 rounded px-2 py-1 hover:bg-red-200 transition-colors"
                        onClick={() => setShowErrorMessage(false)}
                      >
                        {t('navigation.error.dismiss') || '关闭'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {renderContent()}

          {/* 调试信息面板 - 仅在开发环境或用户明确启用时显示 */}
          {isDevelopment && shouldShowDebugInfo && (
            <section className="bg-white rounded-lg shadow-sm p-6">
              <details open>
                <summary className="text-lg font-semibold text-gray-800 cursor-pointer mb-4">调试信息</summary>
                <div className="flex gap-3 mb-4">
                  <button 
                    onClick={() => {
                      console.log('=== 手动调试检查 ===');
                      console.log('当前状态:', getStateSnapshot());
                      console.log('imageSlices数量:', state.imageSlices.length);
                      console.log('是否正在处理:', isProcessing);
                      console.log('处理进度:', progress);
                      console.log('选中切片:', Array.from(state.selectedSlices));
                      alert(`调试信息已输出到控制台\n切片数量: ${state.imageSlices.length}\n是否应显示预览: ${state.imageSlices.length > 0}`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🔍 手动检查状态
                  </button>
                  <button 
                    onClick={() => {
                      setForceRender(prev => prev + 1);
                      debugLog('[App] 强制重新渲染:', forceRender + 1);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    🔄 强制刷新 ({forceRender})
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                  <div className="font-semibold text-gray-800 mb-2">实时状态:</div>
                  <div className="space-y-1 text-gray-700">
                    <div>切片数量: {state.imageSlices.length}</div>
                    <div>是否处理中: {isProcessing ? '是' : '否'}</div>
                    <div>处理进度: {progress}%</div>
                    <div>选中切片数: {state.selectedSlices.size}</div>
                    <div>应显示预览界面: {state.imageSlices.length > 0 ? '是' : '否'}</div>
                    <div className="font-semibold text-red-600 mt-2">直接状态检查:</div>
                    <div>state对象: {JSON.stringify({imageSlicesLength: state.imageSlices.length, hasImageSlices: state.imageSlices.length > 0})}</div>
                    <div>快照对象: {JSON.stringify(getStateSnapshot())}</div>
                  </div>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(getStateSnapshot(), null, 2)}
                </pre>
              </details>
            </section>
          )}
        </main>

        {/* 调试控制面板 - 仅在开发环境中显示，生产环境完全隐藏 */}
        {isDevelopment && (
          <DebugInfoControl
            visible={debugControlVisible}
            onVisibilityChange={setDebugControlVisible}
            position="bottom-right"
            compact={false}
          />
        )}
      </div>
    </div>
  );
}

export default App;