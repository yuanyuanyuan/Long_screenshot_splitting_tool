import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18nContext } from './useI18nContext';
import { seoConfigManager } from '../utils/seo/SEOConfigManager';
import type { Language, PageType } from '../types/seo.types';

/**
 * SEO-specific translation keys interface
 */
interface SEOI18nKeys {
  // Meta content
  title: string;
  description: string;
  keywords: string[];
  
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImageAlt?: string;
  
  // Twitter
  twitterTitle?: string;
  twitterDescription?: string;
  
  // Structured data
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  
  // H-tag content
  mainHeading: string;
  subHeadings?: Record<string, string>;
  
  // Dynamic content
  imageCount?: string;
  processingTime?: string;
  lastUpdated?: string;
}

/**
 * Contextual keyword management
 */
interface KeywordContext {
  page: PageType;
  userAction?: string;
  searchQuery?: string;
  imageType?: string;
  deviceType?: 'mobile' | 'desktop';
}

/**
 * Hook for SEO-specific i18n integration
 */
export const useSEOI18n = (page: PageType = 'home') => {
  const { language, changeLanguage } = useI18nContext() as any;
  const [seoContent, setSEOContent] = useState<SEOI18nKeys | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load SEO translations
  useEffect(() => {
    const loadSEOTranslations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get SEO config for current language and page
        const config = await seoConfigManager.getConfig();
        const pageConfig = config.pages[page];
        
        if (!pageConfig) {
          throw new Error(`No SEO configuration found for page: ${page}`);
        }
        
        // Get language-specific content
        const langConfig = (pageConfig as any)[language as Language];
        
        if (!langConfig) {
          throw new Error(`No SEO configuration found for language: ${language}`);
        }
        
        // Build SEO content object
        const content: SEOI18nKeys = {
          title: langConfig.title,
          description: langConfig.description,
          keywords: langConfig.keywords || [],
          ogTitle: langConfig.ogTitle,
          ogDescription: langConfig.ogDescription,
          ogImageAlt: langConfig.ogImageAlt,
          twitterTitle: langConfig.twitterTitle,
          twitterDescription: langConfig.twitterDescription,
          breadcrumbHome: language === 'zh-CN' ? '首页' : 'Home',
          breadcrumbCurrent: langConfig.title,
          mainHeading: langConfig.h1 || langConfig.title,
          subHeadings: langConfig.subHeadings
        };
        
        setSEOContent(content);
        
        // Set initial keywords
        const baseKeywords = config.keywords?.primary?.[language as Language] || [];
        const pageKeywords = langConfig.keywords || [];
        setKeywords([...new Set([...baseKeywords, ...pageKeywords])]);
        
      } catch (err) {
        console.error('[useSEOI18n] Failed to load SEO translations:', err);
        setError(err as Error);
        
        // Fallback content
        setSEOContent({
          title: language === 'zh-CN' ? '长截图分割工具' : 'Long Screenshot Splitter',
          description: language === 'zh-CN' 
            ? '免费在线长截图分割工具，支持批量处理'
            : 'Free online long screenshot splitting tool with batch processing',
          keywords: [],
          breadcrumbHome: language === 'zh-CN' ? '首页' : 'Home',
          breadcrumbCurrent: language === 'zh-CN' ? '当前页' : 'Current Page',
          mainHeading: language === 'zh-CN' ? '长截图分割工具' : 'Long Screenshot Splitter'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSEOTranslations();
  }, [language, page]);

  /**
   * Generate contextual keywords based on user actions
   */
  const generateContextualKeywords = useCallback((context: KeywordContext): string[] => {
    const contextKeywords: string[] = [];
    
    // Page-specific keywords
    switch (context.page) {
      case 'upload':
        if (language === 'zh-CN') {
          contextKeywords.push('上传截图', '选择图片', '拖拽上传');
        } else {
          contextKeywords.push('upload screenshot', 'select image', 'drag and drop');
        }
        break;
        
      case 'split':
        if (language === 'zh-CN') {
          contextKeywords.push('分割图片', '切割长图', '批量分割');
        } else {
          contextKeywords.push('split image', 'cut screenshot', 'batch split');
        }
        break;
        
      case 'export':
        if (language === 'zh-CN') {
          contextKeywords.push('导出图片', '下载ZIP', '保存PDF');
        } else {
          contextKeywords.push('export images', 'download ZIP', 'save PDF');
        }
        break;
    }
    
    // User action keywords
    if (context.userAction) {
      const actionKeywords = {
        'upload': language === 'zh-CN' ? ['上传中', '选择文件'] : ['uploading', 'select file'],
        'process': language === 'zh-CN' ? ['处理中', '分割中'] : ['processing', 'splitting'],
        'export': language === 'zh-CN' ? ['导出中', '生成文件'] : ['exporting', 'generating file']
      };
      
      const action = actionKeywords[context.userAction as keyof typeof actionKeywords];
      if (action) {
        contextKeywords.push(...action);
      }
    }
    
    // Device-specific keywords
    if (context.deviceType === 'mobile') {
      if (language === 'zh-CN') {
        contextKeywords.push('手机截图', '移动端', '触屏操作');
      } else {
        contextKeywords.push('mobile screenshot', 'mobile device', 'touch screen');
      }
    }
    
    // Image type keywords
    if (context.imageType) {
      const imageTypeKeywords = {
        'chat': language === 'zh-CN' ? ['聊天截图', '对话记录'] : ['chat screenshot', 'conversation'],
        'webpage': language === 'zh-CN' ? ['网页截图', '长网页'] : ['webpage screenshot', 'long page'],
        'document': language === 'zh-CN' ? ['文档截图', 'PDF截图'] : ['document screenshot', 'PDF screenshot']
      };
      
      const imageType = imageTypeKeywords[context.imageType as keyof typeof imageTypeKeywords];
      if (imageType) {
        contextKeywords.push(...imageType);
      }
    }
    
    // Combine with existing keywords
    return [...new Set([...keywords, ...contextKeywords])];
  }, [keywords, language]);

  /**
   * Update keywords based on context
   */
  const updateKeywords = useCallback((context: KeywordContext) => {
    const updatedKeywords = generateContextualKeywords(context);
    setKeywords(updatedKeywords);
    return updatedKeywords;
  }, [generateContextualKeywords]);

  /**
   * Get formatted meta description with dynamic content
   */
  const getFormattedDescription = useCallback((params?: {
    imageCount?: number;
    processingTime?: number;
  }): string => {
    if (!seoContent) return '';
    
    let description = seoContent.description;
    
    if (params?.imageCount) {
      const countText = language === 'zh-CN' 
        ? `已处理${params.imageCount}张图片` 
        : `${params.imageCount} images processed`;
      description = `${description} - ${countText}`;
    }
    
    if (params?.processingTime) {
      const timeText = language === 'zh-CN'
        ? `处理时间${params.processingTime}秒`
        : `Processing time ${params.processingTime}s`;
      description = `${description} - ${timeText}`;
    }
    
    return description;
  }, [seoContent, language]);

  /**
   * Get formatted title with dynamic content
   */
  const getFormattedTitle = useCallback((suffix?: string): string => {
    if (!seoContent) return '';
    
    let title = seoContent.title;
    
    if (suffix) {
      title = `${title} - ${suffix}`;
    }
    
    // Add site name
    const siteName = language === 'zh-CN' ? '长截图分割工具' : 'Long Screenshot Splitter';
    if (!title.includes(siteName)) {
      title = `${title} | ${siteName}`;
    }
    
    return title;
  }, [seoContent, language]);

  /**
   * Generate breadcrumb items for current page
   */
  const getBreadcrumbItems = useCallback(() => {
    if (!seoContent) return [];
    
    const items = [
      {
        name: seoContent.breadcrumbHome,
        url: '/',
        position: 1
      }
    ];
    
    if (page !== 'home') {
      // Add intermediate breadcrumbs based on page hierarchy
      const pageHierarchy: Record<PageType, string[]> = {
        'upload': [],
        'split': ['upload'],
        'export': ['upload', 'split'],
        'home': []
      };
      
      const hierarchy = pageHierarchy[page] || [];
      
      hierarchy.forEach((parentPage, index) => {
        const parentTitle = language === 'zh-CN'
          ? {
            'upload': '上传图片',
            'split': '分割设置',
            'export': '导出选项'
          }[parentPage]
          : {
            'upload': 'Upload Image',
            'split': 'Split Settings',
            'export': 'Export Options'
          }[parentPage];
          
        if (parentTitle) {
          items.push({
            name: parentTitle,
            url: `/${parentPage}`,
            position: index + 2
          });
        }
      });
      
      // Add current page
      items.push({
        name: seoContent.breadcrumbCurrent,
        url: `/${page}`,
        position: items.length + 1
      });
    }
    
    return items;
  }, [seoContent, page, language]);

  /**
   * Switch language with SEO content update
   */
  const switchLanguageWithSEO = useCallback(async (newLanguage: Language) => {
    await changeLanguage(newLanguage);
    // SEO content will auto-update through the effect
  }, [changeLanguage]);

  // Memoized return value
  const value = useMemo(() => ({
    // Current state
    language: language as Language,
    seoContent,
    keywords,
    isLoading,
    error,
    
    // Methods
    updateKeywords,
    getFormattedDescription,
    getFormattedTitle,
    getBreadcrumbItems,
    switchLanguage: switchLanguageWithSEO,
    
    // Utilities
    generateContextualKeywords
  }), [
    language,
    seoContent,
    keywords,
    isLoading,
    error,
    updateKeywords,
    getFormattedDescription,
    getFormattedTitle,
    getBreadcrumbItems,
    switchLanguageWithSEO,
    generateContextualKeywords
  ]);
  
  return value;
};

/**
 * HOC for components that need SEO i18n
 */
export const withSEOI18n = <P extends object>(
  Component: React.ComponentType<P & ReturnType<typeof useSEOI18n>>,
  page: PageType = 'home'
) => {
  return (props: P) => {
    const seoI18n = useSEOI18n(page);
    return <Component {...props} {...seoI18n} />;
  };
};

export default useSEOI18n;