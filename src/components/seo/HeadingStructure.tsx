/**
 * 页面标题层级结构组件
 * 基于SEO配置自动生成H1/H2/H3标签，确保关键词合理分布
 */

import React, { useMemo } from 'react';
import { seoConfigManager } from '../../utils/seo/SEOConfigManager';
import type { Language, PageType } from '../../types/seo.types';

interface HeadingStructureProps {
  page: PageType;
  language?: Language;
  context?: Record<string, any>;
  className?: string;
}

interface HeadingConfig {
  h1: string;
  h2: string[];
  h3: string[];
}

interface KeywordOptimizedHeading {
  text: string;
  keywords: string[];
  density: number;
}

/**
 * 关键词优化钩子
 */
const useKeywordOptimization = (page: PageType, language: Language, context: Record<string, any>) => {
  return useMemo(() => {
    try {
      // 尝试从配置管理器获取关键词
      if (seoConfigManager.getStats().loaded) {
        const pageConfig = seoConfigManager.getPageConfig(page, language);
        const seoConfig = seoConfigManager.getCurrentConfig();
        
        if (seoConfig && seoConfig.keywords) {
          return {
            primary: seoConfig.keywords?.primary?.[language] || [],
            secondary: seoConfig.keywords?.secondary?.[language] || [],
            longTail: seoConfig.keywords?.longTail?.[language] || [],
            targetDensity: seoConfig.keywordOptimization?.targetDensity || {
              primary: 2.5,
              secondary: 1.8,
              longTail: 1.2
            }
          };
        }
      }
      
      // 回退到默认关键词
      return getDefaultKeywords(page, language);
    } catch (error) {
      console.warn('Failed to load keyword optimization config:', error);
      return getDefaultKeywords(page, language);
    }
  }, [page, language, context]);
};

/**
 * 获取默认关键词配置
 */
const getDefaultKeywords = (page: PageType, language: Language) => {
  const keywordMap = {
    'zh-CN': {
      home: {
        primary: ['长截图分割', '截图切割', '图片分割工具'],
        secondary: ['在线截图工具', '免费图片处理', '长图切割'],
        longTail: ['如何分割长截图', '长截图怎么切割', '免费在线图片分割工具']
      },
      upload: {
        primary: ['上传截图', '图片上传', '截图处理'],
        secondary: ['拖拽上传', '文件选择', '图片格式'],
        longTail: ['如何上传长截图', '支持的图片格式', '上传图片要求']
      },
      split: {
        primary: ['分割设置', '截图分割', '智能分割'],
        secondary: ['手动调整', '预览效果', '分割点识别'],
        longTail: ['如何设置分割点', '智能识别分割区域', '手动调整分割']
      },
      export: {
        primary: ['导出下载', '保存图片', '批量下载'],
        secondary: ['文件格式', '压缩打包', '命名规则'],
        longTail: ['如何导出分割图片', '批量下载设置', '自定义文件名']
      }
    },
    'en': {
      home: {
        primary: ['long screenshot splitter', 'screenshot cutter', 'image splitting tool'],
        secondary: ['online screenshot tool', 'free image processing', 'long image cutter'],
        longTail: ['how to split long screenshots', 'cut long screenshots online', 'free online image splitting tool']
      },
      upload: {
        primary: ['upload screenshot', 'image upload', 'screenshot processing'],
        secondary: ['drag and drop', 'file selection', 'image format'],
        longTail: ['how to upload long screenshots', 'supported image formats', 'upload requirements']
      },
      split: {
        primary: ['split settings', 'screenshot splitting', 'smart splitting'],
        secondary: ['manual adjustment', 'preview effects', 'split point detection'],
        longTail: ['how to set split points', 'smart split area detection', 'manual split adjustment']
      },
      export: {
        primary: ['export download', 'save images', 'batch download'],
        secondary: ['file format', 'compression packaging', 'naming rules'],
        longTail: ['how to export split images', 'batch download settings', 'custom file names']
      }
    }
  };

  const pageKeywords = keywordMap[language]?.[page] || keywordMap['zh-CN'].home;
  
  return {
    ...pageKeywords,
    targetDensity: {
      primary: 2.5,
      secondary: 1.8,
      longTail: 1.2
    }
  };
};

/**
 * 生成关键词优化的标题文本
 */
const generateOptimizedHeading = (
  baseText: string, 
  keywords: string[], 
  keywordType: 'primary' | 'secondary' | 'longTail',
  context: Record<string, any>
): KeywordOptimizedHeading => {
  let optimizedText = baseText;
  const usedKeywords: string[] = [];
  
  // 根据上下文调整标题
  if (context.sliceCount && keywordType === 'primary') {
    const countText = baseText.includes('English') || baseText.includes('en') 
      ? ` (${context.sliceCount} pieces)` 
      : ` (${context.sliceCount}张)`;
    optimizedText = optimizedText + countText;
  }

  // 选择合适的关键词进行集成
  const keywordToUse = keywords[0]; // 使用第一个主要关键词
  if (keywordToUse && !optimizedText.toLowerCase().includes(keywordToUse.toLowerCase())) {
    // 如果标题中没有关键词，尝试自然地集成
    if (keywordType === 'primary') {
      // 主要关键词放在前面
      optimizedText = `${keywordToUse} - ${optimizedText}`;
    } else {
      // 次要关键词可以放在后面或中间
      optimizedText = optimizedText.replace(/^(.*?)(\s-\s.*)?$/, `$1 ${keywordToUse}$2`);
    }
    usedKeywords.push(keywordToUse);
  }

  // 计算关键词密度（简单估算）
  const totalWords = optimizedText.split(/\s+/).length;
  const keywordCount = usedKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return count + (optimizedText.match(regex) || []).length;
  }, 0);
  
  const density = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;

  return {
    text: optimizedText,
    keywords: usedKeywords,
    density
  };
};

/**
 * 页面标题层级结构组件
 */
export const HeadingStructure: React.FC<HeadingStructureProps> = ({
  page,
  language = 'zh-CN',
  context = {},
  className = ''
}) => {
  // 获取关键词优化配置
  const keywordConfig = useKeywordOptimization(page, language, context);
  
  // 生成标题配置
  const headingConfig: HeadingConfig = useMemo(() => {
    try {
      // 尝试从SEO配置获取标题结构
      if (seoConfigManager.getStats().loaded) {
        const seoConfig = seoConfigManager.getCurrentConfig();
        const pageConfig = seoConfig?.pages?.[page];
        
        if (pageConfig?.headingStructure) {
          const headingData = pageConfig.headingStructure as any;
          const h1Value = headingData.h1?.[language];
          const h2Value = headingData.h2?.[language];
          const h3Value = headingData.h3?.[language];
          
          return {
            h1: typeof h1Value === 'string' ? h1Value : '',
            h2: Array.isArray(h2Value) ? h2Value : [],
            h3: Array.isArray(h3Value) ? h3Value : []
          };
        }
      }
      
      // 回退到默认标题结构
      return getDefaultHeadingStructure(page, language);
    } catch (error) {
      console.warn('Failed to load heading structure config:', error);
      return getDefaultHeadingStructure(page, language);
    }
  }, [page, language]);

  // 生成优化的标题
  const optimizedHeadings = useMemo(() => {
    const h1Optimized = generateOptimizedHeading(
      headingConfig.h1,
      keywordConfig.primary,
      'primary',
      context
    );

    const h2Optimized = headingConfig.h2.map((h2, index) => 
      generateOptimizedHeading(
        h2,
        index < keywordConfig.primary.length 
          ? [keywordConfig.primary[index]]
          : keywordConfig.secondary,
        index < keywordConfig.primary.length ? 'primary' : 'secondary',
        context
      )
    );

    const h3Optimized = headingConfig.h3.map((h3, index) => 
      generateOptimizedHeading(
        h3,
        index < keywordConfig.secondary.length 
          ? [keywordConfig.secondary[index]]
          : keywordConfig.longTail,
        index < keywordConfig.secondary.length ? 'secondary' : 'longTail',
        context
      )
    );

    return {
      h1: h1Optimized,
      h2: h2Optimized,
      h3: h3Optimized
    };
  }, [headingConfig, keywordConfig, context]);

  // 调试信息（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('🏷️ Heading Structure Debug:', {
      page,
      language,
      context,
      keywordConfig,
      optimizedHeadings,
      totalKeywordDensity: {
        h1: optimizedHeadings.h1.density,
        h2Avg: optimizedHeadings.h2.reduce((sum, h) => sum + h.density, 0) / optimizedHeadings.h2.length || 0,
        h3Avg: optimizedHeadings.h3.reduce((sum, h) => sum + h.density, 0) / optimizedHeadings.h3.length || 0
      }
    });
  }

  return (
    <div className={`seo-heading-structure ${className}`} data-page={page} data-language={language}>
      {/* H1标题 - 页面主标题 */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
        {optimizedHeadings.h1.text}
      </h1>

      {/* H2标题 - 主要功能区块 */}
      <div className="space-y-8">
        {optimizedHeadings.h2.map((h2, index) => (
          <section key={`h2-${index}`} className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
              {h2.text}
            </h2>
            
            {/* 对应的H3子标题 */}
            {index * 2 < optimizedHeadings.h3.length && (
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {optimizedHeadings.h3.slice(index * 2, (index + 1) * 2).map((h3, h3Index) => (
                  <div key={`h3-${index}-${h3Index}`} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg md:text-xl font-medium text-gray-700 mb-2">
                      {h3.text}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {/* 这里可以添加对应的内容描述 */}
                      {getSubsectionContent(page, language, index * 2 + h3Index)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* SEO优化信息（开发环境显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-gray-600">
          <h4 className="font-semibold mb-2">SEO优化信息:</h4>
          <div className="space-y-1">
            <p>H1关键词密度: {optimizedHeadings.h1.density.toFixed(1)}%</p>
            <p>H2平均密度: {(optimizedHeadings.h2.reduce((sum, h) => sum + h.density, 0) / optimizedHeadings.h2.length || 0).toFixed(1)}%</p>
            <p>H3平均密度: {(optimizedHeadings.h3.reduce((sum, h) => sum + h.density, 0) / optimizedHeadings.h3.length || 0).toFixed(1)}%</p>
            <p>总计关键词: {[optimizedHeadings.h1, ...optimizedHeadings.h2, ...optimizedHeadings.h3].flatMap(h => h.keywords).join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 获取默认标题结构
 */
function getDefaultHeadingStructure(page: PageType, language: Language): HeadingConfig {
  const structures = {
    'zh-CN': {
      home: {
        h1: '长截图分割工具',
        h2: ['功能特点', '使用方法', '支持格式', '常见问题'],
        h3: ['自动识别分割点', '多种导出格式', '批量处理功能', '隐私安全保护', '操作简单快捷', '完全免费使用']
      },
      upload: {
        h1: '上传长截图',
        h2: ['上传方式', '支持格式', '文件要求'],
        h3: ['拖拽上传', '点击选择', 'PNG格式', 'JPG格式', '文件大小限制', '分辨率要求']
      },
      split: {
        h1: '分割设置',
        h2: ['自动分割', '手动调整', '预览效果'],
        h3: ['智能识别', '算法优化', '精确调节', '实时预览', '效果确认', '重新分割']
      },
      export: {
        h1: '导出设置',
        h2: ['选择片段', '导出选项', '下载文件'],
        h3: ['单个下载', '批量下载', '格式选择', '命名规则', '压缩设置', '下载管理']
      }
    },
    'en': {
      home: {
        h1: 'Long Screenshot Splitter',
        h2: ['Features', 'How to Use', 'Supported Formats', 'FAQ'],
        h3: ['Auto Split Point Detection', 'Multiple Export Formats', 'Batch Processing', 'Privacy Protection', 'Easy Operation', 'Completely Free']
      },
      upload: {
        h1: 'Upload Long Screenshot',
        h2: ['Upload Methods', 'Supported Formats', 'File Requirements'],
        h3: ['Drag and Drop', 'Click to Select', 'PNG Format', 'JPG Format', 'File Size Limit', 'Resolution Requirements']
      },
      split: {
        h1: 'Split Settings',
        h2: ['Auto Split', 'Manual Adjustment', 'Preview Effects'],
        h3: ['Smart Recognition', 'Algorithm Optimization', 'Precise Adjustment', 'Real-time Preview', 'Effect Confirmation', 'Re-split']
      },
      export: {
        h1: 'Export Settings',
        h2: ['Select Segments', 'Export Options', 'Download Files'],
        h3: ['Single Download', 'Batch Download', 'Format Selection', 'Naming Rules', 'Compression Settings', 'Download Management']
      }
    }
  };

  return structures[language]?.[page] || structures['zh-CN'].home;
}

/**
 * 获取子章节内容描述
 */
function getSubsectionContent(page: PageType, language: Language, index: number): string {
  const contentMap = {
    'zh-CN': {
      home: [
        '基于AI算法智能识别截图中的最佳分割点，无需手动设置',
        '支持PNG、JPG、WebP等多种图片格式导出，满足不同需求',
        '一次处理多张长截图，提高工作效率',
        '所有处理均在本地完成，不上传服务器，保护用户隐私',
        '简洁直观的操作界面，三步完成长截图分割',
        '无需注册登录，完全免费使用，无任何隐藏费用'
      ],
      upload: [
        '支持直接拖拽图片文件到指定区域',
        '点击上传按钮选择本地图片文件',
        '支持PNG、JPG、JPEG等常见格式',
        '支持WebP、BMP等现代图片格式',
        '单文件最大支持50MB，确保处理流畅',
        '建议分辨率不超过8000x8000像素'
      ],
      split: [
        '基于内容分析自动识别最佳分割位置',
        '采用先进图像处理算法确保分割精度',
        '提供手动调节工具精确控制分割点',
        '实时显示分割预览效果',
        '可随时查看和确认分割结果',
        '不满意可重新设置分割参数'
      ],
      export: [
        '选择需要的图片片段单独下载',
        '一键下载所有分割结果的压缩包',
        '支持PNG、JPG等多种输出格式',
        '可自定义文件命名规则和前缀',
        '提供不同质量的压缩选项',
        '支持断点续传的下载管理'
      ]
    },
    'en': {
      home: [
        'AI-based algorithm automatically identifies optimal split points in screenshots',
        'Supports multiple export formats including PNG, JPG, WebP for different needs',
        'Process multiple long screenshots at once to improve work efficiency',
        'All processing is done locally without uploading to servers, protecting user privacy',
        'Simple and intuitive interface, complete long screenshot splitting in three steps',
        'No registration required, completely free to use with no hidden fees'
      ],
      upload: [
        'Support direct drag and drop of image files to designated area',
        'Click upload button to select local image files',
        'Supports common formats like PNG, JPG, JPEG',
        'Supports modern formats like WebP, BMP',
        'Maximum 50MB per file to ensure smooth processing',
        'Recommended resolution not exceeding 8000x8000 pixels'
      ],
      split: [
        'Automatically identifies optimal split positions based on content analysis',
        'Uses advanced image processing algorithms to ensure split accuracy',
        'Provides manual adjustment tools for precise split point control',
        'Real-time display of split preview effects',
        'View and confirm split results anytime',
        'Can reset split parameters if not satisfied'
      ],
      export: [
        'Select desired image segments for individual download',
        'One-click download of compressed package with all split results',
        'Supports multiple output formats including PNG, JPG',
        'Customizable file naming rules and prefixes',
        'Provides different quality compression options',
        'Supports resumable download management'
      ]
    }
  };

  const content = contentMap[language]?.[page] || contentMap['zh-CN'].home;
  return content[index] || content[0];
}

export default HeadingStructure;