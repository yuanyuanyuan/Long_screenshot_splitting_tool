import { useEffect, useState, useRef } from 'react';
import { useAppState } from './hooks/useAppState';
import { useImageProcessor } from './hooks/useImageProcessor';
import { useI18nContext, I18nProvider } from './hooks/useI18nContext';
import { useRouter } from './hooks/useRouter';
import { useViewport, createResponsiveClasses } from './hooks/useViewport';
import { FileUploader } from './components/FileUploader';
import { ImagePreview } from './components/ImagePreview';
import { ExportControls } from './components/ExportControls';
import Navigation from './components/Navigation';
import DebugInfoControl from './components/DebugInfoControl';
import I18nTestPanel from './components/I18nTestPanel';
import { exportToPDF } from './utils/pdfExporter';
import { exportToZIP } from './utils/zipExporter';
import {
  navigationErrorHandler,
  validateNavigation,
  handleProcessingError,
  type NavigationError,
} from './utils/navigationErrorHandler';
import { CopyrightInfo } from 'shared-components';
import { initializeTouchOptimization } from './utils/touchOptimization';
import { mobileCache } from './utils/mobileCaching';
import { SEOManager } from './components/SEOManager';
import { HelmetProvider } from 'react-helmet-async';
import './styles/responsive.css';

function AppContent() {
  const { state, actions, getStateSnapshot } = useAppState();
  const { processImage, progress, isProcessing } = useImageProcessor({
    state,
    actions: {
      ...actions,
      setOriginalImage: actions.setOriginalImage,
    },
  });
  const { t, isLoading: i18nLoading } = useI18nContext();
  const { currentPath, push } = useRouter();
  const viewport = useViewport();
  const [isExporting, setIsExporting] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [isStateValidated, setIsStateValidated] = useState(false);
  const [navigationError, setNavigationError] = useState<NavigationError | null>(null);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  // 调试控制状态 - 只在开发环境启用
  const [debugControlVisible, setDebugControlVisible] = useState(false);
  const isDevelopment = import.meta.env.DEV;
  const shouldShowDebugInfo = isDevelopment && debugControlVisible;

  // 调试日志包装函数
  const debugLog = (...args: any[]) => {
    if (shouldShowDebugInfo) {
      console.log(...args);
    }
  };

  // 初始化移动端优化（触摸优化 + 缓存策略）
  useEffect(() => {
    const initializeMobileOptimizations = async () => {
      // 1. 初始化触摸优化
      initializeTouchOptimization({
        fastClick: true,
        preventGhostClick: true,
        touchFeedback: true,
        scrollOptimization: true,
      });

      // 2. 初始化缓存管理器
      await mobileCache.initialize();

      debugLog('[App] 移动端优化已初始化 (触摸优化 + 缓存策略)');
    };

    initializeMobileOptimizations();

    return () => {
      // 应用卸载时清理（通常不会发生）
    };
  }, []);

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
      debugLog(
        '[App] 所有切片URLs:',
        state.imageSlices.map(slice => slice.url)
      );
    }
  }, [state.imageSlices, shouldShowDebugInfo]);

  // 调试：监听整个state变化
  useEffect(() => {
    debugLog('[App] 整个state发生变化:', {
      imageSlicesCount: state.imageSlices.length,
      isProcessing: state.isProcessing,
      hasOriginalImage: !!state.originalImage,
      selectedSlicesCount: state.selectedSlices.size,
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

  // 上传完成自动跳转：监听切片「首次到达」(0→>0) 再跳 /split。
  // 不能在 handleFileSelect 里上传后立即跳——此时 worker 尚未产出切片，
  // /split 的状态守卫会因 imageSlices 为空判定 MISSING_SLICES 并踢回 /upload。
  const prevSliceCountRef = useRef(state.imageSlices.length);
  useEffect(() => {
    const prevCount = prevSliceCountRef.current;
    prevSliceCountRef.current = state.imageSlices.length;
    if (
      prevCount === 0 &&
      state.imageSlices.length > 0 &&
      (currentPath === '/upload' || currentPath === '/')
    ) {
      push('/split');
    }
  }, [state.imageSlices, currentPath, push]);

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
          <p className="text-gray-600">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  const handleFileSelect = async (file: File) => {
    try {
      await processImage(file);

      // 跳转由 imageSlices 监听 useEffect 驱动（切片到达后再跳，避免过早跳转被守卫踢回）
    } catch (error) {
      // 使用导航错误处理器处理处理错误
      console.error(t('console.processingFailed'), error);

      const strategy = handleProcessingError(currentPath, error as Error, state);

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

  const handleExport = async (format: 'pdf' | 'zip', options?: any) => {
    if (state.selectedSlices.size === 0) {
      alert(t('export.noSelection'));
      return;
    }

    try {
      setIsExporting(true);

      const filename = options?.filename || 'exported-images';

      if (format === 'pdf') {
        const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        await exportToPDF(
          state.imageSlices,
          state.selectedSlices,
          pdfFilename,
          (progress: number) => {
            debugLog(`${t('console.pdfProgress')}: ${progress}%`);
          }
        );
        debugLog(t('console.pdfComplete'));
      } else if (format === 'zip') {
        const zipFilename = filename.endsWith('.zip') ? filename : `${filename}.zip`;
        await exportToZIP(
          state.imageSlices,
          state.selectedSlices,
          zipFilename,
          (progress: number) => {
            debugLog(t('console.zipProgress', { progress }));
          }
        );
        debugLog(t('console.zipComplete'));
      }
    } catch (error) {
      console.error(t('console.exportFailed'), error);
      alert(t('export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  if (i18nLoading) {
    return <div>{t('app.i18nLoading')}</div>;
  }

  // 获取当前页面类型用于SEO
  const getCurrentPageType = (): 'home' | 'upload' | 'split' | 'export' => {
    switch (currentPath) {
      case '/upload':
        return 'upload';
      case '/split':
        return 'split';
      case '/export':
        return 'export';
      default:
        return 'home';
    }
  };

  // 根据路由渲染不同内容
  const renderContent = () => {
    switch (currentPath) {
      case '/upload':
        return (
          <section className={`mb-8 ${viewport.isMobile ? 'mb-4' : 'mb-8'}`}>
            <h2
              className={`font-bold text-gray-800 text-center ${
                viewport.isMobile ? 'text-xl mb-4' : 'text-2xl mb-6'
              }`}
            >
              {t('upload.title')}
            </h2>
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
            <div
              className={`text-center bg-white rounded-lg shadow-sm mobile-center ${
                viewport.isMobile ? 'py-8 mx-2' : 'py-12 mx-4'
              }`}
            >
              <div className={viewport.isMobile ? 'max-w-sm mx-auto px-4' : 'max-w-md mx-auto'}>
                <div className={`mb-4 ${viewport.isMobile ? 'text-4xl' : 'text-6xl'}`}>📤</div>
                <h3
                  className={`font-semibold text-gray-800 mb-2 ${
                    viewport.isMobile ? 'text-lg' : 'text-xl'
                  }`}
                >
                  {t('split.validation.title')}
                </h3>
                <p
                  className={`text-gray-600 mb-6 mobile-text ${viewport.isMobile ? 'text-sm' : ''}`}
                >
                  {t('split.validation.message')}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => push('/upload')}
                    className={`w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium btn-touch ${
                      viewport.isMobile ? 'px-4 py-3 text-sm' : 'px-6 py-3'
                    }`}
                  >
                    {t('split.validation.goUpload')}
                  </button>
                  <button
                    onClick={() => push('/')}
                    className={`w-full bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors btn-touch ${
                      viewport.isMobile ? 'px-4 py-3 text-sm' : 'px-6 py-3'
                    }`}
                  >
                    {t('split.validation.goHome')}
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <section className={`mb-8 ${viewport.isMobile ? 'mb-4' : 'mb-8'}`}>
            <h2
              className={`font-bold text-gray-800 text-center ${
                viewport.isMobile ? 'text-xl mb-4' : 'text-2xl mb-6'
              }`}
            >
              {t('split.title')}
            </h2>
            <ImagePreview
              originalImage={state.originalImage}
              slices={state.imageSlices}
              selectedSlices={Array.from(state.selectedSlices)}
              onSelectionChange={selectedIndices => {
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
                  {t('export.validation.noImage.title')}
                </h3>
                <p className="text-gray-600 mb-6">{t('export.validation.noImage.message')}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => push('/upload')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('export.validation.noImage.goUpload')}
                  </button>
                  <button
                    onClick={() => push('/')}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('export.validation.goHome')}
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
                  {t('export.validation.noSelection.title')}
                </h3>
                <p className="text-gray-600 mb-6">{t('export.validation.noSelection.message')}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center text-blue-800 text-sm">
                    <span className="mr-2">💡</span>
                    <span>
                      {t('export.validation.noSelection.tip', { count: state.imageSlices.length })}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => push('/split')}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t('export.validation.noSelection.goSplit')}
                  </button>
                  <button
                    onClick={() => push('/')}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('export.validation.goHome')}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <section className={`mb-8 ${viewport.isMobile ? 'mb-4' : 'mb-8'}`}>
            <h2
              className={`font-bold text-gray-800 text-center ${
                viewport.isMobile ? 'text-xl mb-4' : 'text-2xl mb-6'
              }`}
            >
              {t('export.title')}
            </h2>
            <ExportControls
              selectedSlices={Array.from(state.selectedSlices)}
              slices={state.imageSlices}
              onExport={handleExport}
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
                      {t('debug.preview.title')}: {state.imageSlices.length}
                    </h2>
                  )}
                  <ImagePreview
                    originalImage={state.originalImage}
                    slices={state.imageSlices}
                    selectedSlices={Array.from(state.selectedSlices)}
                    onSelectionChange={selectedIndices => {
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
                      <h3 className="font-bold">{t('debug.preview.dataTitle')}</h3>
                      <pre className="text-xs mt-2">
                        {JSON.stringify(
                          {
                            originalImage: !!state.originalImage,
                            slicesCount: state.imageSlices.length,
                            selectedSlicesCount: Array.from(state.selectedSlices).length,
                            firstSlice: state.imageSlices[0]
                              ? {
                                  hasBlob: !!state.imageSlices[0].blob,
                                  hasUrl: !!state.imageSlices[0].url,
                                  url: state.imageSlices[0].url?.substring(0, 50) + '...',
                                  width: state.imageSlices[0].width,
                                  height: state.imageSlices[0].height,
                                }
                              : null,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </section>

                <section className="mb-8">
                  <ExportControls
                    selectedSlices={Array.from(state.selectedSlices)}
                    slices={state.imageSlices}
                    onExport={handleExport}
                    disabled={isExporting}
                  />
                </section>
              </>
            )}
          </>
        );
    }
  };

  const appContainerClasses = createResponsiveClasses('app-container', viewport);

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOManager
        page={getCurrentPageType()}
        language="zh-CN"
        context={{
          sliceCount: state.imageSlices.length,
          selectedCount: state.selectedSlices.size,
          isProcessing: isProcessing,
          hasImage: !!state.originalImage,
        }}
        enableStructuredData={true}
        enableOpenGraph={true}
        enableTwitterCard={true}
        enableCanonical={true}
        enablePerformanceTracking={true}
      />
      <div className="min-h-screen bg-gray-50">
        <div className={`${appContainerClasses} mobile-stack`}>
          <header
            className={`text-center py-8 mb-8 relative ${
              viewport.isMobile ? 'py-4 mb-4' : 'py-8 mb-8'
            }`}
          >
            {/* Responsive copyright positioning */}
            <div
              className={`absolute z-10 ${
                viewport.isMobile ? 'bottom-2 right-2 opacity-60' : 'top-4 right-4'
              }`}
            >
              <CopyrightInfo />
            </div>

            <h1
              className={`font-bold text-gray-800 mb-4 ${
                viewport.isMobile ? 'text-2xl' : viewport.isTablet ? 'text-3xl' : 'text-4xl'
              }`}
            >
              {t('header.title')}
            </h1>
            <p className={`text-gray-600 mb-6 ${viewport.isMobile ? 'text-base px-4' : 'text-lg'}`}>
              {t('header.subtitle')}
            </p>
          </header>

          {/* 导航组件 */}
          <Navigation
            appState={state}
            currentPath={currentPath}
            onNavigate={(path: string) => {
              push(path);
            }}
          />

          <main className={`flex-1 ${viewport.isMobile ? 'px-2' : ''}`}>
            {/* Responsive error message */}
            {showErrorMessage && navigationError && (
              <div
                className={`fixed z-50 ${
                  viewport.isMobile ? 'top-2 left-2 right-2' : 'top-4 right-4 max-w-md'
                }`}
              >
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-red-400 text-xl">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {t('navigation.error.title')}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{t(navigationError.message) || navigationError.message}</p>
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          className={`text-sm bg-red-100 text-red-800 rounded px-2 py-1 hover:bg-red-200 transition-colors btn-touch ${
                            viewport.isTouch ? 'min-h-12 px-4' : ''
                          }`}
                          onClick={() => setShowErrorMessage(false)}
                        >
                          {t('navigation.error.dismiss')}
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
                  <summary className="text-lg font-semibold text-gray-800 cursor-pointer mb-4">
                    {t('debug.info.title')}
                  </summary>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => {
                        console.log('=== 手动调试检查 ===');
                        console.log('当前状态:', getStateSnapshot());
                        console.log('imageSlices数量:', state.imageSlices.length);
                        console.log('是否正在处理:', isProcessing);
                        console.log('处理进度:', progress);
                        console.log('选中切片:', Array.from(state.selectedSlices));
                        alert(
                          t('alert.debugOutput', {
                            count: state.imageSlices.length,
                            shouldShow:
                              state.imageSlices.length > 0
                                ? t('debug.info.yes')
                                : t('debug.info.no'),
                          })
                        );
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('debug.info.manualCheck')}
                    </button>
                    <button
                      onClick={() => {
                        setForceRender((prev: number) => prev + 1);
                        debugLog('[App] 强制重新渲染:', forceRender + 1);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      {t('debug.info.forceRefresh')} ({forceRender})
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                    <div className="font-semibold text-gray-800 mb-2">
                      {t('debug.info.realTimeStatus')}
                    </div>
                    <div className="space-y-1 text-gray-700">
                      <div>
                        {t('debug.info.sliceCount')}: {state.imageSlices.length}
                      </div>
                      <div>
                        {t('debug.info.processing')}:{' '}
                        {isProcessing ? t('debug.info.yes') : t('debug.info.no')}
                      </div>
                      <div>
                        {t('debug.info.progress')}: {progress}%
                      </div>
                      <div>
                        {t('debug.info.selectedCount')}: {state.selectedSlices.size}
                      </div>
                      <div>
                        {t('debug.info.shouldShowPreview')}:{' '}
                        {state.imageSlices.length > 0 ? t('debug.info.yes') : t('debug.info.no')}
                      </div>
                      <div className="font-semibold text-red-600 mt-2">
                        {t('debug.info.directStateCheck')}
                      </div>
                      <div>
                        {t('debug.info.stateObject')}:{' '}
                        {JSON.stringify({
                          imageSlicesLength: state.imageSlices.length,
                          hasImageSlices: state.imageSlices.length > 0,
                        })}
                      </div>
                      <div>
                        {t('debug.info.snapshotObject')}: {JSON.stringify(getStateSnapshot())}
                      </div>
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
          {/* 调试控制面板 - 仅在开发环境中显示，生产环境完全隐藏 */}
          {isDevelopment && (
            <DebugInfoControl
              visible={debugControlVisible}
              onVisibilityChange={setDebugControlVisible}
              position="bottom-right"
              compact={false}
            />
          )}

          {/* I18n测试面板 - 仅在开发环境中显示 */}
          {isDevelopment && <I18nTestPanel show={true} />}
        </div>
      </div>
    </>
  );
}

// 包装App组件以提供I18n上下文
function App() {
  return (
    <HelmetProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </HelmetProvider>
  );
}

export default App;
