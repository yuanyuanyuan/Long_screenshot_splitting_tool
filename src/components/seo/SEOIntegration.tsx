/**
 * SEO集成组件
 * 统一管理所有SEO功能，包括meta标签、标题结构、robots.txt、sitemap等
 */

import React, { useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { EnhancedSEOManager } from './EnhancedSEOManager';
import { HeadingStructure } from './HeadingStructure';
import { robotsGenerator } from '../../utils/seo/robotsGenerator';
import { sitemapGenerator } from '../../utils/seo/sitemapGenerator';
import { keywordDensityManager } from '../../utils/seo/keywordDensityManager';
import type { SEOManagerProps, Language, PageType } from '../../types/seo.types';

interface SEOIntegrationProps extends SEOManagerProps {
  // 是否启用标题结构组件
  enableHeadingStructure?: boolean;
  // 是否在开发环境显示SEO调试信息
  showDebugInfo?: boolean;
  // 标题结构组件的自定义样式类名
  headingClassName?: string;
  // 是否自动生成静态SEO文件
  autoGenerateStaticFiles?: boolean;
}

interface SEODebugInfo {
  managersInitialized: boolean;
  robotsGenerated: boolean;
  sitemapGenerated: boolean;
  keywordAnalysis?: any;
  errors: string[];
}

/**
 * SEO集成组件
 */
export const SEOIntegration: React.FC<SEOIntegrationProps> = ({
  page,
  language = 'zh-CN',
  context = {},
  customMetadata = {},
  enableStructuredData = true,
  enableOpenGraph = true,
  enableTwitterCard = true,
  enableCanonical = true,
  enableHeadingStructure = true,
  showDebugInfo = process.env.NODE_ENV === 'development',
  headingClassName = '',
  autoGenerateStaticFiles = true,
}) => {
  const [debugInfo, setDebugInfo] = useState<SEODebugInfo>({
    managersInitialized: false,
    robotsGenerated: false,
    sitemapGenerated: false,
    errors: []
  });

  // 初始化所有SEO管理器
  useEffect(() => {
    const initializeSEOSystem = async () => {
      const errors: string[] = [];

      try {
        // 初始化所有管理器
        const [robotsInit, sitemapInit, keywordInit] = await Promise.all([
          robotsGenerator.initialize(),
          sitemapGenerator.initialize(),
          keywordDensityManager.initialize()
        ]);

        // 检查初始化结果
        if (!robotsInit) errors.push('Robots generator initialization failed');
        if (!sitemapInit) errors.push('Sitemap generator initialization failed');
        if (!keywordInit) errors.push('Keyword density manager initialization failed');

        // 生成静态文件
        if (autoGenerateStaticFiles) {
          try {
            const [robotsContent, sitemapContent] = await Promise.all([
              robotsGenerator.generate(),
              sitemapGenerator.generate()
            ]);

            // 在生产环境中，将生成的内容暴露给构建脚本
            if (typeof window !== 'undefined') {
              (window as any).__SEO_STATIC_FILES__ = {
                'robots.txt': robotsContent,
                'sitemap.xml': sitemapContent
              };
            }

            setDebugInfo(prev => ({
              ...prev,
              managersInitialized: true,
              robotsGenerated: true,
              sitemapGenerated: true,
              errors
            }));

            console.log('✅ SEO系统初始化成功');
          } catch (fileError) {
            errors.push(`Static file generation failed: ${fileError}`);
            console.error('❌ SEO静态文件生成失败:', fileError);
          }
        } else {
          setDebugInfo(prev => ({
            ...prev,
            managersInitialized: true,
            errors
          }));
        }

      } catch (error) {
        errors.push(`SEO system initialization failed: ${error}`);
        console.error('❌ SEO系统初始化失败:', error);
        setDebugInfo(prev => ({
          ...prev,
          errors
        }));
      }
    };

    initializeSEOSystem();
  }, [autoGenerateStaticFiles]);

  // 关键词分析（用于调试）
  useEffect(() => {
    if (showDebugInfo && debugInfo.managersInitialized) {
      const analyzePageKeywords = async () => {
        try {
          // 模拟页面内容进行关键词分析
          const sampleContent = generateSampleContent(page, language, context);
          const analysis = keywordDensityManager.analyzeKeywordDensity(sampleContent, language);
          
          setDebugInfo(prev => ({
            ...prev,
            keywordAnalysis: analysis
          }));
        } catch (error) {
          console.warn('关键词分析失败:', error);
        }
      };

      analyzePageKeywords();
    }
  }, [showDebugInfo, debugInfo.managersInitialized, page, language, context]);

  return (
    <HelmetProvider>
      <div className="seo-integration-wrapper">
        {/* 增强版SEO管理器 - 处理所有meta标签 */}
        <EnhancedSEOManager
          page={page}
          language={language}
          context={context}
          customMetadata={customMetadata}
          enableStructuredData={enableStructuredData}
          enableOpenGraph={enableOpenGraph}
          enableTwitterCard={enableTwitterCard}
          enableCanonical={enableCanonical}
        />

        {/* 页面标题结构组件 - 处理H1/H2/H3标签 */}
        {enableHeadingStructure && (
          <HeadingStructure
            page={page}
            language={language}
            context={context}
            className={headingClassName}
          />
        )}

        {/* SEO调试信息面板（开发环境） */}
        {showDebugInfo && (
          <SEODebugPanel
            debugInfo={debugInfo}
            page={page}
            language={language}
          />
        )}
      </div>
    </HelmetProvider>
  );
};

/**
 * SEO调试面板组件
 */
const SEODebugPanel: React.FC<{
  debugInfo: SEODebugInfo;
  page: PageType;
  language: Language;
}> = ({ debugInfo, page, language }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        显示SEO调试
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 max-w-md bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-xs z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm text-gray-800">🔍 SEO系统调试面板</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* 系统状态 */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-700 mb-1">系统状态</h4>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span>管理器初始化:</span>
            <span className={`px-2 py-1 rounded ${debugInfo.managersInitialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {debugInfo.managersInitialized ? '✅ 完成' : '❌ 失败'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Robots.txt生成:</span>
            <span className={`px-2 py-1 rounded ${debugInfo.robotsGenerated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {debugInfo.robotsGenerated ? '✅ 已生成' : '⏳ 等待'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Sitemap.xml生成:</span>
            <span className={`px-2 py-1 rounded ${debugInfo.sitemapGenerated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {debugInfo.sitemapGenerated ? '✅ 已生成' : '⏳ 等待'}
            </span>
          </div>
        </div>
      </div>

      {/* 当前页面信息 */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-700 mb-1">当前页面</h4>
        <div className="space-y-1 text-gray-600">
          <div>页面类型: <code className="bg-gray-100 px-1 rounded">{page}</code></div>
          <div>语言: <code className="bg-gray-100 px-1 rounded">{language}</code></div>
        </div>
      </div>

      {/* 关键词分析结果 */}
      {debugInfo.keywordAnalysis && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-700 mb-1">关键词分析</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {debugInfo.keywordAnalysis.slice(0, 5).map((analysis: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="truncate flex-1" title={analysis.keyword}>
                  {analysis.keyword}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  analysis.isOptimal 
                    ? 'bg-green-100 text-green-800' 
                    : analysis.density > 0 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                }`}>
                  {analysis.density.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {debugInfo.errors.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-red-700 mb-1">⚠️ 错误信息</h4>
          <div className="space-y-1">
            {debugInfo.errors.map((error, index) => (
              <div key={index} className="text-red-600 text-xs bg-red-50 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快捷操作 */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => console.log('🤖 Robots Stats:', robotsGenerator.getStats())}
          className="bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
        >
          检查Robots
        </button>
        <button
          onClick={() => console.log('🗺️ Sitemap Stats:', sitemapGenerator.getStats())}
          className="bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
        >
          检查Sitemap
        </button>
        <button
          onClick={() => console.log('📊 Keyword Stats:', keywordDensityManager.getStats())}
          className="bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200"
        >
          关键词统计
        </button>
      </div>
    </div>
  );
};

/**
 * 生成示例内容用于关键词分析
 */
function generateSampleContent(page: PageType, language: Language, context: Record<string, any>): string {
  const contentMap = {
    'zh-CN': {
      home: `长截图分割工具是一款专业的在线图片分割工具，支持长截图自动分割、截图切割等功能。我们的图片分割工具完全免费，提供在线截图工具服务，让您轻松处理长图切割需求。作为优秀的免费图片处理平台，我们致力于提供最好的截图处理体验。`,
      upload: `上传截图功能支持多种上传方式，包括拖拽上传和点击选择。我们的图片上传系统支持PNG、JPG、JPEG等常见图片格式，为您的截图处理提供便利。文件上传过程安全可靠，所有截图处理均在本地完成。`,
      split: `分割设置页面提供智能分割和手动调整功能。我们的截图分割算法可以自动识别最佳分割点，同时支持手动调整分割区域。分割预览功能让您实时查看分割效果，确保截图分割结果符合预期。`,
      export: `导出下载功能支持多种导出格式和下载方式。您可以选择单个下载或批量下载所有分割结果。我们提供多种文件格式选择，支持自定义文件命名规则，让图片导出更加便捷。`
    },
    'en': {
      home: `Long Screenshot Splitter is a professional online image splitting tool that supports automatic long screenshot splitting and screenshot cutting functions. Our image splitting tool is completely free, providing online screenshot tool services to help you easily handle long image cutting needs. As an excellent free image processing platform, we are committed to providing the best screenshot processing experience.`,
      upload: `The upload screenshot function supports multiple upload methods, including drag-and-drop upload and click selection. Our image upload system supports common image formats such as PNG, JPG, JPEG, providing convenience for your screenshot processing. The file upload process is safe and reliable, with all screenshot processing completed locally.`,
      split: `The split settings page provides intelligent splitting and manual adjustment functions. Our screenshot splitting algorithm can automatically identify optimal split points while supporting manual adjustment of split areas. The split preview function lets you view split effects in real-time, ensuring screenshot splitting results meet expectations.`,
      export: `The export download function supports multiple export formats and download methods. You can choose single download or batch download of all split results. We provide various file format options and support custom file naming rules, making image export more convenient.`
    }
  };

  const content = contentMap[language]?.[page] || contentMap['zh-CN'].home;
  
  // 根据上下文调整内容
  if (context.sliceCount) {
    const additionalText = language === 'zh-CN' 
      ? `当前已生成${context.sliceCount}张图片片段。` 
      : `Currently generated ${context.sliceCount} image segments.`;
    return content + ' ' + additionalText;
  }

  return content;
}

/**
 * SEO提供者组件
 * 为整个应用提供SEO上下文
 */
export const SEOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelmetProvider>
      {children}
    </HelmetProvider>
  );
};

export default SEOIntegration;