import React, { useEffect, useMemo } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { generatePageMetadata } from '../utils/seo/metadataGenerator';
import { SEO_CONFIG } from '../config/seo.config';
import type { SEOManagerProps, SEOMetadata } from '../types/seo.types';

/**
 * SEO管理器组件
 * 负责动态管理页面的SEO元数据，包括标题、描述、关键词、OG标签等
 */
export const SEOManager: React.FC<SEOManagerProps> = ({
  page,
  language = 'zh-CN',
  context = {},
  customMetadata = {},
  enableStructuredData = true,
  enableOpenGraph = true,
  enableTwitterCard = true,
  enableCanonical = true,
}) => {
  // 生成页面元数据
  const metadata: SEOMetadata = useMemo(() => {
    try {
      const baseMetadata = generatePageMetadata(page, context, language);
      
      // 合并自定义元数据
      return {
        ...baseMetadata,
        ...customMetadata,
        // 确保关键字段不被覆盖为空
        title: customMetadata.title || baseMetadata.title,
        description: customMetadata.description || baseMetadata.description,
        keywords: customMetadata.keywords?.length 
          ? customMetadata.keywords 
          : baseMetadata.keywords,
      };
    } catch (error) {
      console.error('SEO metadata generation failed:', error);
      // 返回默认的元数据
      return {
        title: (SEO_CONFIG.siteName as any)[language] || 'Long Screenshot Splitter',
        description: '长截图分割工具 - 快速、免费、在线处理',
        keywords: ['截图分割', '长截图', '图片处理'],
        ogTitle: 'Long Screenshot Splitter',
        ogDescription: '长截图分割工具 - 快速、免费、在线处理',
        ogImage: `${SEO_CONFIG.siteUrl}/images/og-image.jpg`,
        ogType: 'website' as const,
        ogUrl: SEO_CONFIG.siteUrl,
        twitterCard: 'summary_large_image' as const,
        twitterTitle: 'Long Screenshot Splitter',
        twitterDescription: '长截图分割工具 - 快速、免费、在线处理',
        twitterImage: `${SEO_CONFIG.siteUrl}/images/twitter-image.jpg`,
        canonicalUrl: SEO_CONFIG.siteUrl,
        hreflang: {},
        robots: 'index,follow',
        author: SEO_CONFIG.structuredData.organization.name,
      };
    }
  }, [page, context, language, customMetadata]);

  // 生成结构化数据
  const structuredData = useMemo(() => {
    if (!enableStructuredData) return null;

    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: (SEO_CONFIG.siteName as any)[language],
      description: metadata.description,
      url: SEO_CONFIG.siteUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: {
        '@type': 'Organization',
        name: SEO_CONFIG.structuredData.organization.name,
        url: SEO_CONFIG.structuredData.organization.url,
      },
      inLanguage: language,
      isAccessibleForFree: true,
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
    };

    // 根据页面添加特定的结构化数据
    if (page === 'home') {
      return {
        ...baseStructuredData,
        '@type': 'SoftwareApplication',
        featureList: [
          '长截图自动分割',
          '多格式支持',
          '批量导出',
          '在线处理',
          '免费使用',
        ],
      };
    }

    return baseStructuredData;
  }, [page, language, metadata.description, enableStructuredData]);

  // 监控SEO性能（开发环境）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 SEO Manager Debug Info');
      console.log('Page:', page);
      console.log('Language:', language);
      console.log('Context:', context);
      console.log('Generated Metadata:', metadata);
      console.log('Structured Data:', structuredData);
      console.groupEnd();
    }
  }, [page, language, context, metadata, structuredData]);

  return (
    <Helmet>
      {/* 基础元数据 */}
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="keywords" content={metadata.keywords.join(', ')} />
      <meta name="author" content={SEO_CONFIG.structuredData.organization.name} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content={language} />
      
      {/* 视口和移动端优化 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* 规范URL */}
      {enableCanonical && metadata.canonicalUrl && (
        <link rel="canonical" href={metadata.canonicalUrl} />
      )}
      
      {/* 多语言支持 */}
      {metadata.hreflang && Object.entries(metadata.hreflang).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Open Graph 标签 */}
      {enableOpenGraph && (
        <>
          <meta property="og:title" content={metadata.ogTitle || metadata.title} />
          <meta property="og:description" content={metadata.ogDescription || metadata.description} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={metadata.canonicalUrl || SEO_CONFIG.siteUrl} />
          <meta property="og:site_name" content={SEO_CONFIG.siteName} />
          <meta property="og:locale" content={language === 'zh-CN' ? 'zh_CN' : 'en_US'} />
          {metadata.ogImage && <meta property="og:image" content={metadata.ogImage} />}
          {metadata.ogImage && <meta property="og:image:alt" content={metadata.title} />}
        </>
      )}
      
      {/* Twitter Card 标签 */}
      {enableTwitterCard && (
        <>
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={metadata.twitterTitle || metadata.title} />
          <meta name="twitter:description" content={metadata.twitterDescription || metadata.description} />
          {SEO_CONFIG.socialMedia.twitter && (
            <meta name="twitter:site" content={SEO_CONFIG.socialMedia.twitter} />
          )}
          {metadata.twitterImage && <meta name="twitter:image" content={metadata.twitterImage} />}
        </>
      )}
      
      {/* 结构化数据 */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData, null, 2)}
        </script>
      )}
      
      {/* 预加载关键资源 */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS预解析 */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
    </Helmet>
  );
};

/**
 * SEO管理器提供者组件
 * 为整个应用提供SEO上下文
 */
export const SEOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelmetProvider>
      {children}
    </HelmetProvider>
  );
};

export default SEOManager;