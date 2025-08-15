/**
 * 元数据生成器
 * 用于生成页面的SEO元数据
 */

import type { SEOMetadata, PageType } from '../../types/seo.types';
import { SEO_CONFIG } from '../../config/seo.config';

/**
 * 生成页面元数据
 * @param pageType 页面类型
 * @param context 上下文信息
 * @param language 语言
 * @param customMetadata 自定义元数据
 * @returns 生成的页面SEO元数据
 */
export const generatePageMetadata = (
  pageType: PageType = 'home',
  context: Record<string, any> = {},
  language: string = 'zh-CN',
  customMetadata: Partial<SEOMetadata> = {}
): SEOMetadata => {
  // 生成基础标题和描述
  const baseTitle = generatePageTitle(pageType, language, context);
  const baseDescription = generatePageDescription(pageType, language, context);

  // 基础元数据
  const metadata: SEOMetadata = {
    title: customMetadata.title || baseTitle,
    description: customMetadata.description || baseDescription,
    keywords: customMetadata.keywords || SEO_CONFIG.keywords.primary,
    ogTitle: customMetadata.ogTitle || baseTitle,
    ogDescription: customMetadata.ogDescription || baseDescription,
    ogImage: customMetadata.ogImage || `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImages.ogImage}`,
    ogType: customMetadata.ogType || 'website',
    ogUrl: customMetadata.ogUrl || generateCanonicalUrl(pageType, language),
    twitterCard: customMetadata.twitterCard || 'summary_large_image',
    twitterTitle: customMetadata.twitterTitle || baseTitle,
    twitterDescription: customMetadata.twitterDescription || baseDescription,
    twitterImage: customMetadata.twitterImage || `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImages.twitterImage}`,
    canonicalUrl: customMetadata.canonicalUrl || generateCanonicalUrl(pageType, language),
    hreflang: customMetadata.hreflang || generateHreflangLinks(pageType),
    robots: customMetadata.robots || 'index,follow',
    author: customMetadata.author || SEO_CONFIG.structuredData.organization.name,
    publishedTime: customMetadata.publishedTime,
    modifiedTime: customMetadata.modifiedTime || new Date().toISOString()
  };

  return metadata;
};

/**
 * 生成页面标题
 */
const generatePageTitle = (pageType: PageType, language: string, context: Record<string, any> = {}): string => {
  const siteName = SEO_CONFIG.siteName;
  
  const titles = {
    'zh-CN': {
      home: `${siteName} - 免费在线长截图分割工具`,
      upload: `上传图片 - ${siteName}`,
      split: `图片分割${context.sliceCount ? ` (${context.sliceCount}张)` : ''} - ${siteName}`,
      export: `导出结果${context.selectedCount ? ` (${context.selectedCount}张)` : ''} - ${siteName}`
    },
    'en': {
      home: `${siteName} - Free Online Long Screenshot Splitter`,
      upload: `Upload Image - ${siteName}`,
      split: `Split Image${context.sliceCount ? ` (${context.sliceCount} pieces)` : ''} - ${siteName}`,
      export: `Export Results${context.selectedCount ? ` (${context.selectedCount} selected)` : ''} - ${siteName}`
    }
  };

  return titles[language as keyof typeof titles]?.[pageType] || titles['zh-CN'][pageType];
};

/**
 * 生成页面描述
 */
const generatePageDescription = (pageType: PageType, language: string, context: Record<string, any> = {}): string => {
  const descriptions = {
    'zh-CN': {
      home: '免费的在线长截图分割工具，支持将长图片自动切割成多个部分，无需下载软件，操作简单快捷。',
      upload: '上传您的长截图文件，支持PNG、JPG等格式，文件大小限制10MB以内。',
      split: `正在处理您的图片分割${context.sliceCount ? `，已生成${context.sliceCount}张图片` : ''}，请稍候...`,
      export: `图片分割完成${context.selectedCount ? `，已选择${context.selectedCount}张图片` : ''}，可以下载单张图片或打包下载。`
    },
    'en': {
      home: 'Free online long screenshot splitter tool. Automatically split long images into multiple parts without downloading software.',
      upload: 'Upload your long screenshot file. Supports PNG, JPG formats with file size limit of 10MB.',
      split: `Processing your image splitting${context.sliceCount ? `, generated ${context.sliceCount} images` : ''}, please wait...`,
      export: `Image splitting completed${context.selectedCount ? `, ${context.selectedCount} images selected` : ''}, you can download individual images or download as a package.`
    }
  };

  return descriptions[language as keyof typeof descriptions]?.[pageType] || descriptions['zh-CN'][pageType];
};

/**
 * 生成规范URL
 * @param pageType 页面类型
 * @param language 语言
 * @returns 规范URL
 */
const generateCanonicalUrl = (pageType: PageType, language: string): string => {
  const baseUrl = SEO_CONFIG.siteUrl;
  const langPrefix = language === 'zh-CN' ? '' : `/${language}`;
  
  switch (pageType) {
    case 'home':
      return `${baseUrl}${langPrefix}`;
    case 'upload':
      return `${baseUrl}${langPrefix}/upload`;
    case 'split':
      return `${baseUrl}${langPrefix}/split`;
    case 'export':
      return `${baseUrl}${langPrefix}/export`;
    default:
      return `${baseUrl}${langPrefix}`;
  }
};

/**
 * 生成hreflang链接
 * @param pageType 页面类型
 * @returns hreflang对象
 */
const generateHreflangLinks = (pageType: PageType): Record<string, string> => {
  const baseUrl = SEO_CONFIG.siteUrl;
  const pagePath = pageType === 'home' ? '' : `/${pageType}`;
  
  return {
    'zh-CN': `${baseUrl}${pagePath}`,
    'en': `${baseUrl}/en${pagePath}`,
    'x-default': `${baseUrl}${pagePath}`
  };
};

/**
 * 验证元数据完整性
 * @param metadata 元数据对象
 * @returns 验证结果
 */
export const validateMetadata = (metadata: SEOMetadata): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!metadata.title || metadata.title.length < 10) {
    errors.push('标题长度不能少于10个字符');
  }

  if (metadata.title && metadata.title.length > 60) {
    errors.push('标题长度不能超过60个字符');
  }

  if (!metadata.description || metadata.description.length < 50) {
    errors.push('描述长度不能少于50个字符');
  }

  if (metadata.description && metadata.description.length > 160) {
    errors.push('描述长度不能超过160个字符');
  }

  if (!metadata.keywords || metadata.keywords.length === 0) {
    errors.push('至少需要设置一个关键词');
  }

  if (!metadata.canonicalUrl || !isValidUrl(metadata.canonicalUrl)) {
    errors.push('规范URL格式不正确');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 检查URL是否有效
 * @param url URL字符串
 * @returns 是否有效
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
