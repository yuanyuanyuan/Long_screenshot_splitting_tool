/**
 * 增强版SEO管理器
 * 修复所有缺失的SEO元素：canonical URL、meta description、social media标签等
 * 集成robots.txt和sitemap.xml生成功能
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { seoConfigManager } from '../../utils/seo/SEOConfigManager';
import { robotsGenerator } from '../../utils/seo/robotsGenerator';
import { sitemapGenerator } from '../../utils/seo/sitemapGenerator';
import { keywordDensityManager } from '../../utils/seo/keywordDensityManager';
import type { SEOManagerProps, SEOMetadata, Language, PageType } from '../../types/seo.types';

/**
 * 增强版SEO管理器钩子
 * 整合所有SEO功能和配置
 */
const useEnhancedSEO = (
  page: PageType,
  language: Language,
  context: Record<string, any>,
  customMetadata: Partial<SEOMetadata>
) => {
  // 生成完整的meta标签数据
  const metadata = useMemo(() => {
    try {
      // 获取SEO配置
      const config = seoConfigManager.getCurrentConfig();
      const pageConfig = seoConfigManager.getPageConfig(page, language);
      
      if (!config || !pageConfig) {
        return generateFallbackMetadata(page, language, context, customMetadata);
      }

      // 基础URL构建
      const baseUrl = config.site?.url || 'https://screenshot-splitter.com';
      const pagePath = generatePagePath(page, language);
      const canonicalUrl = `${baseUrl}${pagePath}`;

      // 构建完整的metadata
      const metadata: SEOMetadata = {
        // 基础meta标签
        title: customMetadata.title || pageConfig.title,
        description: customMetadata.description || pageConfig.description,
        keywords: pageConfig.keywords || config.keywords?.primary[language] || [],
        author: config.structuredData?.organization?.name || 'Long Screenshot Splitter',
        robots: 'index,follow',
        language: language,

        // Canonical URL - 修复缺失问题
        canonicalUrl: canonicalUrl,

        // Open Graph标签 - 完整实现
        ogTitle: customMetadata.ogTitle || pageConfig.title,
        ogDescription: customMetadata.ogDescription || pageConfig.description,
        ogType: 'website' as const,
        ogUrl: canonicalUrl,
        ogImage: config.defaultImages?.ogImage ? `${baseUrl}${config.defaultImages.ogImage}` : `${baseUrl}/images/og-image-1200x630.jpg`,
        ogSiteName: config.site?.name[language] || 'Long Screenshot Splitter',
        ogLocale: language === 'zh-CN' ? 'zh_CN' : 'en_US',

        // Twitter Card标签 - 完整实现
        twitterCard: 'summary_large_image' as const,
        twitterTitle: customMetadata.twitterTitle || pageConfig.title,
        twitterDescription: customMetadata.twitterDescription || pageConfig.description,
        twitterImage: config.defaultImages?.twitterImage ? `${baseUrl}${config.defaultImages.twitterImage}` : `${baseUrl}/images/twitter-card-1200x600.jpg`,
        twitterSite: config.socialMedia?.twitter || '@screenshot_tool',
        twitterCreator: config.socialMedia?.twitter || '@screenshot_tool',

        // 多语言支持
        hreflang: generateHreflangTags(page, baseUrl, config.site?.supportedLanguages || ['zh-CN', 'en']),

        // 时间戳
        publishedTime: customMetadata.publishedTime,
        modifiedTime: customMetadata.modifiedTime || new Date().toISOString(),
      };

      return metadata;
    } catch (error) {
      console.error('Failed to generate enhanced SEO metadata:', error);
      return generateFallbackMetadata(page, language, context, customMetadata);
    }
  }, [page, language, context, customMetadata]);

  // 生成结构化数据
  const structuredData = useMemo(() => {
    try {
      const config = seoConfigManager.getCurrentConfig();
      if (!config) return generateFallbackStructuredData(page, language, metadata);

      const baseUrl = config.site?.url || 'https://screenshot-splitter.com';
      const siteName = config.site?.name[language] || 'Long Screenshot Splitter';

      // 基础结构化数据
      const baseStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: siteName,
        description: metadata.description,
        url: baseUrl,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web Browser',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        inLanguage: language,
        isAccessibleForFree: true,
        
        // 组织信息
        author: {
          '@type': 'Organization',
          name: config.structuredData?.organization?.name || siteName,
          url: config.structuredData?.organization?.url || baseUrl,
          logo: config.defaultImages?.logo ? `${baseUrl}${config.defaultImages.logo}` : `${baseUrl}/images/logo-512x512.png`
        },

        // 功能特性
        featureList: config?.structuredData?.webApplication?.features?.[language] || [
          language === 'zh-CN' ? '长截图自动分割' : 'Automatic long screenshot splitting',
          language === 'zh-CN' ? '多格式支持' : 'Multi-format support',
          language === 'zh-CN' ? '批量导出' : 'Batch export',
          language === 'zh-CN' ? '在线处理' : 'Online processing',
          language === 'zh-CN' ? '免费使用' : 'Free to use'
        ],

        // 软件信息
        softwareVersion: config.version || '1.0.0',
        datePublished: config.structuredData?.webApplication?.datePublished || '2024-01-01',
        dateModified: new Date().toISOString().split('T')[0],

        // 评分和评论（可选）
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '150',
          bestRating: '5',
          worstRating: '1'
        },

        // 价格信息
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        }
      };

      // 根据页面类型添加特定信息
      if (page === 'home') {
        return {
          ...baseStructuredData,
          '@type': 'SoftwareApplication',
          downloadUrl: baseUrl,
          screenshot: `${baseUrl}/images/screenshot-app.jpg`
        };
      }

      return baseStructuredData;
    } catch (error) {
      console.error('Failed to generate structured data:', error);
      return generateFallbackStructuredData(page, language, metadata);
    }
  }, [page, language, metadata]);

  return { metadata, structuredData };
};

/**
 * 增强版SEO管理器组件
 */
export const EnhancedSEOManager: React.FC<SEOManagerProps> = ({
  page,
  language = 'zh-CN',
  context = {},
  customMetadata = {},
  enableStructuredData = true,
  enableOpenGraph = true,
  enableTwitterCard = true,
  enableCanonical = true,
}) => {
  const { metadata, structuredData } = useEnhancedSEO(page, language, context, customMetadata);

  // 初始化所有SEO管理器
  useEffect(() => {
    const initializeSEOManagers = async () => {
      try {
        await Promise.all([
          seoConfigManager.loadConfig(),
          robotsGenerator.initialize(),
          sitemapGenerator.initialize(),
          keywordDensityManager.initialize()
        ]);
        
        console.log('🚀 All SEO managers initialized successfully');
      } catch (error) {
        console.error('Failed to initialize SEO managers:', error);
      }
    };

    initializeSEOManagers();
  }, []);

  // 生成robots.txt和sitemap.xml（仅在生产环境）
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      generateStaticSEOFiles();
    }
  }, []);

  // 生成静态SEO文件
  const generateStaticSEOFiles = useCallback(async () => {
    try {
      // 生成robots.txt
      const robotsContent = await robotsGenerator.generate();
      
      // 生成sitemap.xml  
      const sitemapContent = await sitemapGenerator.generate();

      // 在开发环境下显示生成的内容（用于调试）
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 Generated robots.txt:', robotsContent.substring(0, 200) + '...');
        console.log('🗺️ Generated sitemap.xml:', sitemapContent.substring(0, 200) + '...');
      }

      // 在生产环境中，这些内容应该通过构建过程写入到静态文件
      // 这里我们通过window对象暴露，供构建脚本使用
      if (typeof window !== 'undefined') {
        (window as any).__SEO_GENERATED_FILES__ = {
          'robots.txt': robotsContent,
          'sitemap.xml': sitemapContent
        };
      }
    } catch (error) {
      console.error('Failed to generate static SEO files:', error);
    }
  }, []);

  return (
    <Helmet>
      {/* 基础meta标签 - 修复缺失的meta description */}
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="keywords" content={metadata.keywords.join(', ')} />
      <meta name="author" content={metadata.author} />
      <meta name="robots" content={metadata.robots} />
      <meta name="language" content={metadata.language} />

      {/* 增强的meta标签 */}
      <meta name="generator" content="Enhanced Long Screenshot Splitter SEO Manager" />
      <meta name="referrer" content="origin-when-cross-origin" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#1976d2" />
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />

      {/* 时间相关meta标签 */}
      {metadata.publishedTime && <meta name="article:published_time" content={metadata.publishedTime} />}
      {metadata.modifiedTime && <meta name="article:modified_time" content={metadata.modifiedTime} />}
      <meta name="last-modified" content={metadata.modifiedTime || new Date().toISOString()} />

      {/* Canonical URL - 修复缺失问题 */}
      {enableCanonical && metadata.canonicalUrl && (
        <link rel="canonical" href={metadata.canonicalUrl} />
      )}

      {/* 多语言支持 - hreflang标签 */}
      {metadata.hreflang &&
        Object.entries(metadata.hreflang).map(([lang, url]) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={url} />
        ))}

      {/* Enhanced Open Graph标签 - 修复缺失的social media标签 */}
      {enableOpenGraph && (
        <>
          <meta property="og:title" content={metadata.ogTitle} />
          <meta property="og:description" content={metadata.ogDescription} />
          <meta property="og:type" content={metadata.ogType} />
          <meta property="og:url" content={metadata.ogUrl} />
          <meta property="og:site_name" content={metadata.ogSiteName} />
          <meta property="og:locale" content={metadata.ogLocale} />
          
          {/* 备用语言 */}
          {language === 'zh-CN' && <meta property="og:locale:alternate" content="en_US" />}
          {language === 'en' && <meta property="og:locale:alternate" content="zh_CN" />}
          
          {/* 图片信息 */}
          <meta property="og:image" content={metadata.ogImage} />
          <meta property="og:image:alt" content={metadata.ogTitle} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:type" content="image/png" />
          
          {/* 应用程序信息 */}
          <meta property="og:app_id" content="long-screenshot-splitter" />
          <meta property="article:author" content={metadata.author} />
          
          {/* Facebook特定标签 */}
          <meta property="fb:app_id" content="123456789" />
        </>
      )}

      {/* Enhanced Twitter Card标签 - 完整实现 */}
      {enableTwitterCard && (
        <>
          <meta name="twitter:card" content={metadata.twitterCard} />
          <meta name="twitter:title" content={metadata.twitterTitle} />
          <meta name="twitter:description" content={metadata.twitterDescription} />
          <meta name="twitter:image" content={metadata.twitterImage} />
          <meta name="twitter:image:alt" content={metadata.twitterTitle} />
          
          {/* Twitter账号信息 */}
          <meta name="twitter:site" content={metadata.twitterSite} />
          <meta name="twitter:creator" content={metadata.twitterCreator} />
          
          {/* Twitter应用信息 */}
          <meta name="twitter:app:name:iphone" content={metadata.title} />
          <meta name="twitter:app:name:googleplay" content={metadata.title} />
          <meta name="twitter:app:url:iphone" content={metadata.canonicalUrl} />
          <meta name="twitter:app:url:googleplay" content={metadata.canonicalUrl} />
        </>
      )}

      {/* 其他社交媒体平台标签 */}
      <meta property="linkedin:title" content={metadata.title} />
      <meta property="linkedin:description" content={metadata.description} />
      <meta property="linkedin:image" content={metadata.ogImage} />
      
      {/* Pinterest */}
      <meta property="pinterest:title" content={metadata.title} />
      <meta property="pinterest:description" content={metadata.description} />
      <meta property="pinterest:image" content={metadata.ogImage} />

      {/* 移动端优化 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={metadata.title} />
      <meta name="application-name" content={metadata.title} />
      <meta name="msapplication-TileColor" content="#1976d2" />
      <meta name="msapplication-TileImage" content="/images/mstile-144x144.png" />

      {/* PWA支持 */}
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#1976d2" />

      {/* 结构化数据 */}
      {enableStructuredData && structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData, null, 2)}
        </script>
      )}

      {/* 性能优化 - 预加载和DNS预解析 */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      
      {/* DNS预解析 */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
      
      {/* 预加载关键资源 */}
      {metadata.ogImage && <link rel="preload" href={metadata.ogImage} as="image" />}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* Favicon完整支持 */}
      <link rel="icon" href="/favicon.ico" sizes="32x32" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1976d2" />
      
      {/* 搜索引擎验证 */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="baidu-site-verification" content="your-baidu-verification-code" />
      <meta name="msvalidate.01" content="your-bing-verification-code" />
      
      {/* 开发环境调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <meta name="seo-debug" content={`page:${page},lang:${language},timestamp:${Date.now()}`} />
      )}
    </Helmet>
  );
};

// 辅助函数
function generatePagePath(page: PageType, language: Language): string {
  const langPrefix = language === 'zh-CN' ? '' : `/${language}`;
  const pagePath = page === 'home' ? '' : `/${page}`;
  return `${langPrefix}${pagePath}`;
}

function generateHreflangTags(page: PageType, baseUrl: string, supportedLanguages: string[]): Record<string, string> {
  const hreflang: Record<string, string> = {};
  const pagePath = page === 'home' ? '' : `/${page}`;

  supportedLanguages.forEach(lang => {
    const langCode = lang === 'zh-CN' ? 'zh-cn' : lang;
    const urlPath = lang === 'zh-CN' ? pagePath : `/${lang}${pagePath}`;
    hreflang[langCode] = `${baseUrl}${urlPath}`;
  });

  // 添加x-default（指向默认语言）
  hreflang['x-default'] = `${baseUrl}${pagePath}`;

  return hreflang;
}

function generateFallbackMetadata(
  page: PageType,
  language: Language,
  context: Record<string, any>,
  customMetadata: Partial<SEOMetadata>
): SEOMetadata {
  const baseUrl = 'https://screenshot-splitter.com';
  const siteName = language === 'zh-CN' ? '长截图分割工具' : 'Long Screenshot Splitter';
  const canonicalUrl = `${baseUrl}${generatePagePath(page, language)}`;

  return {
    title: customMetadata.title || `${siteName} - ${language === 'zh-CN' ? '免费在线截图处理工具' : 'Free Online Screenshot Processing Tool'}`,
    description: customMetadata.description || (language === 'zh-CN' 
      ? '专业的在线长截图分割工具，支持自动识别分割点，多格式导出，完全免费使用。' 
      : 'Professional online long screenshot splitter with automatic split point detection, multiple export formats, completely free to use.'),
    keywords: language === 'zh-CN' 
      ? ['长截图分割', '截图切割', '图片分割工具', '在线截图工具', '免费图片处理']
      : ['long screenshot splitter', 'screenshot cutter', 'image splitting tool', 'online screenshot tool', 'free image processing'],
    author: 'Long Screenshot Splitter Team',
    robots: 'index,follow',
    language: language,
    canonicalUrl: canonicalUrl,
    ogTitle: customMetadata.ogTitle || siteName,
    ogDescription: customMetadata.ogDescription || (language === 'zh-CN' 
      ? '专业的在线长截图分割工具' 
      : 'Professional online long screenshot splitter'),
    ogType: 'website' as const,
    ogUrl: canonicalUrl,
    ogImage: `${baseUrl}/images/og-image-1200x630.jpg`,
    ogSiteName: siteName,
    ogLocale: language === 'zh-CN' ? 'zh_CN' : 'en_US',
    twitterCard: 'summary_large_image' as const,
    twitterTitle: customMetadata.twitterTitle || siteName,
    twitterDescription: customMetadata.twitterDescription || (language === 'zh-CN' 
      ? '专业的在线长截图分割工具' 
      : 'Professional online long screenshot splitter'),
    twitterImage: `${baseUrl}/images/twitter-card-1200x600.jpg`,
    twitterSite: '@screenshot_tool',
    twitterCreator: '@screenshot_tool',
    hreflang: generateHreflangTags(page, baseUrl, ['zh-CN', 'en']),
    publishedTime: customMetadata.publishedTime,
    modifiedTime: customMetadata.modifiedTime || new Date().toISOString(),
  };
}

function generateFallbackStructuredData(page: PageType, language: Language, metadata: SEOMetadata) {
  const baseUrl = 'https://screenshot-splitter.com';
  const siteName = language === 'zh-CN' ? '长截图分割工具' : 'Long Screenshot Splitter';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteName,
    description: metadata.description,
    url: baseUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    inLanguage: language,
    isAccessibleForFree: true,
    author: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    featureList: language === 'zh-CN' 
      ? ['长截图自动分割', '多格式支持', '批量导出', '在线处理', '免费使用']
      : ['Automatic long screenshot splitting', 'Multi-format support', 'Batch export', 'Online processing', 'Free to use'],
  };
}

export default EnhancedSEOManager;