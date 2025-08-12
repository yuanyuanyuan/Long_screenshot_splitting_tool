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
import './App.css';
import './components/Components.css';

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
    <div className="app">
      <header>
        <h1>{t('header.title')}</h1>
        <p>{t('header.subtitle')}</p>
        
        <div className="language-switcher">
          <label htmlFor="language-select">{t('lang.current')}: </label>
          <select 
            id="language-select" 
            value={currentLanguage} 
            onChange={handleLanguageChange}
          >
            <option value="zh-CN">{t('lang.switcher.zh-CN')}</option>
            <option value="en">{t('lang.switcher.en')}</option>
          </select>
        </div>
      </header>

      <main>
        <section className="upload-section">
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
            <section className="preview-section">
              <h2 style={{color: 'red', fontSize: '20px', margin: '20px 0'}}>🎯 预览界面已渲染 - 切片数量: {state.imageSlices.length}</h2>
              <ImagePreview
                imageSlices={state.imageSlices}
                selectedSlices={state.selectedSlices}
                onToggleSelection={actions.toggleSliceSelection}
                onSelectAll={actions.selectAllSlices}
                onDeselectAll={actions.deselectAllSlices}
              />
            </section>

            <section className="export-section">
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

        <section className="debug-section">
          <details open>
            <summary>调试信息</summary>
            <div style={{margin: '10px 0'}}>
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
                style={{padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px'}}
              >
                🔍 手动检查状态
              </button>
              <button 
                onClick={() => {
                  setForceRender(prev => prev + 1);
                  console.log('[App] 强制重新渲染:', forceRender + 1);
                }}
                style={{padding: '10px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
              >
                🔄 强制刷新 ({forceRender})
              </button>
            </div>
            <div style={{backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '10px'}}>
               <strong>实时状态:</strong><br/>
               切片数量: {state.imageSlices.length}<br/>
               是否处理中: {isProcessing ? '是' : '否'}<br/>
               处理进度: {progress}%<br/>
               选中切片数: {state.selectedSlices.size}<br/>
               应显示预览界面: {state.imageSlices.length > 0 ? '是' : '否'}<br/>
               <strong style={{color: 'red'}}>直接状态检查:</strong><br/>
               state对象: {JSON.stringify({imageSlicesLength: state.imageSlices.length, hasImageSlices: state.imageSlices.length > 0})}<br/>
               快照对象: {JSON.stringify(getStateSnapshot())}
             </div>
            <pre>{JSON.stringify(getStateSnapshot(), null, 2)}</pre>
          </details>
        </section>
      </main>
    </div>
  );
}

export default App;
