/**
 * 增强SEO系统使用示例
 * 展示如何使用新的SEO功能
 */

import React, { useEffect, useState } from 'react';
// import { Helmet } from 'react-helmet-async';
import { SEOManager } from '../SEOManager';
import { EnhancedHelmetProvider, useEnhancedHelmet } from '../EnhancedHelmetProvider';
import { SEOProvider, useSEO } from '../../context/SEOContext';
import { useCoreWebVitals } from '../../hooks/useSEOOptimization';
import type { PageType, Language } from '../../types/seo.types';

/**
 * 页面组件示例 - 展示动态SEO功能
 */
const ExamplePage: React.FC<{
  page: PageType;
  language?: Language;
}> = ({ page, language = 'zh-CN' }) => {
  const [sliceCount, setSliceCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);

  // 使用SEO上下文
  const { actions, utils } = useSEO();
  const { updateMetadata, updatePage } = actions;
  const { getPageTitle, getPageDescription, isPerformanceOptimal } = utils;

  // 使用增强的Helmet功能
  const { updateTitle, updateDescription } = useEnhancedHelmet();

  // 性能监控
  const performanceMetrics = useCoreWebVitals();

  // 模拟用户操作
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 'split') {
        setSliceCount(5);
      } else if (page === 'export') {
        setSelectedCount(3);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [page]);

  // 根据页面变化更新SEO
  useEffect(() => {
    const context = { sliceCount, selectedCount };
    updatePage(page, language, context);
  }, [page, language, sliceCount, selectedCount, updatePage]);

  // 性能监控
  useEffect(() => {
    if (performanceMetrics) {
      console.log('Performance Metrics:', performanceMetrics);
      
      // 如果性能不佳，可以触发优化
      if (!isPerformanceOptimal()) {
        console.warn('Performance needs optimization');
      }
    }
  }, [performanceMetrics, isPerformanceOptimal]);

  return (
    <div>
      {/* 使用增强的SEOManager */}
      <SEOManager
        page={page}
        language={language}
        context={{ sliceCount, selectedCount }}
        enableStructuredData={true}
        enableOpenGraph={true}
        enableTwitterCard={true}
        enableCanonical={true}
      />

      {/* 页面内容 */}
      <main>
        <h1>{getPageTitle(page, language, { sliceCount, selectedCount })}</h1>
        <p>{getPageDescription(page, language, { sliceCount, selectedCount })}</p>
        
        {/* 性能指标展示（开发环境） */}
        {process.env.NODE_ENV === 'development' && performanceMetrics && (
          <div style={{ 
            position: 'fixed', 
            top: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999
          }}>
            <h4>Core Web Vitals</h4>
            <div>LCP: {Math.round(performanceMetrics.lcp)}ms</div>
            <div>FID: {Math.round(performanceMetrics.fid)}ms</div>
            <div>CLS: {performanceMetrics.cls.toFixed(3)}</div>
            <div>FCP: {Math.round(performanceMetrics.fcp)}ms</div>
            <div>TTFB: {Math.round(performanceMetrics.ttfb)}ms</div>
            <div style={{ color: isPerformanceOptimal() ? '#4CAF50' : '#F44336' }}>
              {isPerformanceOptimal() ? '✅ Optimal' : '⚠️ Needs Optimization'}
            </div>
          </div>
        )}

        {/* 动态内容示例 */}
        <div>
          <h2>动态SEO示例</h2>
          {page === 'split' && (
            <div>
              <p>正在处理图片分割...</p>
              {sliceCount > 0 && (
                <p>已生成 {sliceCount} 张图片片段</p>
              )}
            </div>
          )}
          
          {page === 'export' && (
            <div>
              <p>图片分割完成</p>
              {selectedCount > 0 && (
                <p>已选择 {selectedCount} 张图片用于导出</p>
              )}
            </div>
          )}

          {/* 实时更新SEO的按钮 */}
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => updateTitle(`更新的标题 - ${new Date().toLocaleTimeString()}`)}
              style={{ margin: '5px' }}
            >
              更新标题
            </button>
            
            <button 
              onClick={() => updateDescription(`更新的描述 - ${new Date().toLocaleTimeString()}`)}
              style={{ margin: '5px' }}
            >
              更新描述
            </button>
            
            <button 
              onClick={() => updateMetadata({
                keywords: ['动态关键词', '实时更新', new Date().toISOString()],
                modifiedTime: new Date().toISOString()
              })}
              style={{ margin: '5px' }}
            >
              更新关键词
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

/**
 * 多语言SEO示例
 */
const MultiLanguageExample: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('zh-CN');
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  return (
    <div>
      {/* 语言切换器 */}
      <div style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
        <h3>语言切换</h3>
        <button 
          onClick={() => setCurrentLanguage('zh-CN')}
          disabled={currentLanguage === 'zh-CN'}
          style={{ margin: '5px' }}
        >
          中文
        </button>
        <button 
          onClick={() => setCurrentLanguage('en')}
          disabled={currentLanguage === 'en'}
          style={{ margin: '5px' }}
        >
          English
        </button>
      </div>

      {/* 页面切换器 */}
      <div style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
        <h3>页面切换</h3>
        {(['home', 'upload', 'split', 'export'] as PageType[]).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            disabled={currentPage === page}
            style={{ margin: '5px' }}
          >
            {page}
          </button>
        ))}
      </div>

      {/* 当前页面 */}
      <ExamplePage page={currentPage} language={currentLanguage} />
    </div>
  );
};

/**
 * 完整的应用示例
 */
const EnhancedSEOExample: React.FC = () => {
  return (
    <SEOProvider
      enablePerformanceMonitoring={true}
      enableRealTimeUpdates={true}
      autoLoadConfig={true}
    >
      <EnhancedHelmetProvider
        enableRealTimeUpdates={true}
        enablePerformanceOptimizations={true}
      >
        <div>
          <header style={{ padding: '20px', background: '#f5f5f5' }}>
            <h1>增强SEO系统示例</h1>
            <p>展示动态元标签注入、性能优化钩子和React Helmet Async集成</p>
          </header>
          
          <MultiLanguageExample />
          
          <footer style={{ padding: '20px', marginTop: '40px', background: '#f5f5f5' }}>
            <h3>功能特点</h3>
            <ul>
              <li>✅ 动态元标签注入</li>
              <li>✅ 实时性能监控</li>
              <li>✅ 响应式设备优化</li>
              <li>✅ 多语言SEO支持</li>
              <li>✅ 结构化数据注入</li>
              <li>✅ Core Web Vitals监控</li>
              <li>✅ 智能缓存机制</li>
              <li>✅ React Helmet Async集成</li>
            </ul>
          </footer>
        </div>
      </EnhancedHelmetProvider>
    </SEOProvider>
  );
};

export default EnhancedSEOExample;