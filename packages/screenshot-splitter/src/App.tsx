import { useEffect, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { useImageProcessor } from './hooks/useImageProcessor';
import { useI18n } from './hooks/useI18n';
import { useRouter } from './hooks/useRouter';
import { FileUploader } from './components/FileUploader';
import { ImagePreview } from './components/ImagePreview';
import { ExportControls } from './components/ExportControls';
import { Navigation } from './components/Navigation';
import DebugInfoControl from './components/DebugInfoControl';
import { exportToPDF } from './utils/pdfExporter';
import { exportToZIP } from './utils/zipExporter';

function App() {
  const { state, actions, getStateSnapshot } = useAppState();
  const { processImage, progress, isProcessing } = useImageProcessor({ state, actions });
  const { t, currentLanguage, changeLanguage, isLoading: i18nLoading } = useI18n();
  const { currentPath, push } = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  
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

  const handleFileSelect = async (file: File) => {
    try {
      await processImage(file);
    } catch (error) {
      // 错误信息始终显示，不受调试控制影响
      console.error('[App] 图片处理失败:', error);
      alert('图片处理失败，请重试');
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
        if (state.imageSlices.length === 0) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">{t('split.noImage') || '请先上传图片'}</p>
              <button
                onClick={() => push('/upload')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('split.goUpload') || '去上传'}
              </button>
            </div>
          );
        }
        return (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('split.title') || '分割设置'}</h2>
            <ImagePreview
              imageSlices={state.imageSlices}
              selectedSlices={state.selectedSlices}
              onToggleSelection={actions.toggleSliceSelection}
              onSelectAll={actions.selectAllSlices}
              onDeselectAll={actions.deselectAllSlices}
            />
          </section>
        );
        
      case '/export':
        if (state.selectedSlices.size === 0) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">{t('export.noSelection') || '请先选择要导出的图片'}</p>
              <button
                onClick={() => push('/split')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('export.goSplit') || '去选择'}
              </button>
            </div>
          );
        }
        return (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('export.title') || '导出结果'}</h2>
            <ExportControls
              selectedSlices={state.selectedSlices}
              imageSlices={state.imageSlices}
              onExportPDF={handleExportPDF}
              onExportZIP={handleExportZIP}
              isExporting={isExporting}
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
                    imageSlices={state.imageSlices}
                    selectedSlices={state.selectedSlices}
                    onToggleSelection={actions.toggleSliceSelection}
                    onSelectAll={actions.selectAllSlices}
                    onDeselectAll={actions.deselectAllSlices}
                  />
                </section>

                <section className="mb-8">
                  <ExportControls
                    selectedSlices={state.selectedSlices}
                    imageSlices={state.imageSlices}
                    onExportPDF={handleExportPDF}
                    onExportZIP={handleExportZIP}
                    isExporting={isExporting}
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
        <Navigation />

        <main>
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