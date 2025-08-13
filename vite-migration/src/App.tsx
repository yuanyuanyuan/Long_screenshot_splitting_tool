import { useEffect, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { useImageProcessor } from './hooks/useImageProcessor';
import { useI18n } from './hooks/useI18n';
import { FileUploader } from './components/FileUploader';
import { ImagePreview } from './components/ImagePreview';
import { ExportControls } from './components/ExportControls';
import { exportToPDF } from './utils/pdfExporter';
import { exportToZIP } from './utils/zipExporter';
import type { ImageSlice } from './types';

function App() {
  const { state, actions, getStateSnapshot } = useAppState();
  const { processImage, progress, isProcessing } = useImageProcessor({ state, actions });
  const { t, currentLanguage, changeLanguage, isLoading: i18nLoading } = useI18n();
  const [isExporting, setIsExporting] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // 调试：在控制台输出状态
  useEffect(() => {
    console.log('[App] 状态快照:', getStateSnapshot());
  }, [getStateSnapshot]);

  // 调试：监听 imageSlices 变化
  useEffect(() => {
    console.log('[App] imageSlices 变化:', state.imageSlices.length);
    console.log('[App] 是否应该显示预览界面:', state.imageSlices.length > 0);
    console.log('[App] 完整的state对象:', state);
    if (state.imageSlices.length > 0) {
      console.log('[App] 第一个切片信息:', state.imageSlices[0]);
      console.log('[App] 所有切片URLs:', state.imageSlices.map(slice => slice.url));
    }
  }, [state.imageSlices]);

  // 调试：监听整个state变化
  useEffect(() => {
    console.log('[App] 整个state发生变化:', {
      imageSlicesCount: state.imageSlices.length,
      isProcessing: state.isProcessing,
      hasOriginalImage: !!state.originalImage,
      selectedSlicesCount: state.selectedSlices.size
    });
  }, [state]);

  // 调试：监控处理状态变化
  useEffect(() => {
    console.log('[App] 处理状态变化:', isProcessing, progress);
  }, [isProcessing, progress]);

  // 调试：监控选中状态变化
  useEffect(() => {
    console.log('[App] 选中切片变化:', Array.from(state.selectedSlices));
  }, [state.selectedSlices]);

  const handleFileSelect = async (file: File) => {
    try {
      await processImage(file);
    } catch (error) {
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
           console.log(`PDF导出进度: ${progress}%`);
         }
      );
      console.log('PDF导出完成');
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
           console.log(`ZIP导出进度: ${progress}%`);
         }
      );
      console.log('ZIP导出完成');
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

        <main>
        <section className="mb-8">
          <FileUploader
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
            progress={progress}
          />
        </section>

        {/* 调试：预览界面渲染条件检查 */}
        {(() => {
          console.log('[App] 渲染时检查 - imageSlices.length:', state.imageSlices.length);
          console.log('[App] 渲染时检查 - 条件结果:', state.imageSlices.length > 0);
          return state.imageSlices.length > 0;
        })() && (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-bold text-red-600 mb-4 text-center">🎯 预览界面已渲染 - 切片数量: {state.imageSlices.length}</h2>
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
                  console.log('[App] 强制重新渲染:', forceRender + 1);
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
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-64">{JSON.stringify(getStateSnapshot(), null, 2)}</pre>
          </details>
        </section>
        </main>
      </div>
    </div>
  );
}

export default App;
