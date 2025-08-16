/**
 * SEO相关的TypeScript类型定义
 */

// 基础SEO元数据接口
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: 'website' | 'article' | 'product';
  ogUrl: string;
  twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl: string;
  hreflang: Record<string, string>;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

// 页面SEO配置接口
export interface PageSEO {
  path: string;
  title: {
    [language: string]: string;
  };
  description: {
    [language: string]: string;
  };
  keywords: string[];
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastModified: Date;
  customMeta?: Record<string, string>;
}

// SEO配置接口
export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  socialMedia: {
    twitter: string;
    facebook: string;
    linkedin: string;
  };
  analytics: {
    googleAnalyticsId: string;
    googleSearchConsoleId: string;
  };
  keywords: {
    primary: string[];
    secondary: string[];
    longTail: string[];
  };
  defaultImages: {
    ogImage: string;
    twitterImage: string;
    favicon: string;
    appleTouchIcon: string;
  };
}

// 结构化数据相关接口
export interface WebApplicationSchema {
  '@context': 'https://schema.org';
  '@type': 'WebApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  browserRequirements: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  featureList?: string[];
  screenshot?: string[];
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    ratingCount: string;
  };
}

export interface SoftwareApplicationSchema {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  operatingSystem: string;
  applicationCategory: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    ratingCount: string;
  };
  softwareVersion?: string;
  fileSize?: string;
  downloadUrl?: string;
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export interface HowToSchema {
  '@context': 'https://schema.org';
  '@type': 'HowTo';
  name: string;
  description: string;
  image?: string[];
  totalTime?: string;
  estimatedCost?: {
    '@type': 'MonetaryAmount';
    currency: string;
    value: string;
  };
  supply?: Array<{
    '@type': 'HowToSupply';
    name: string;
  }>;
  tool?: Array<{
    '@type': 'HowToTool';
    name: string;
  }>;
  step: Array<{
    '@type': 'HowToStep';
    name: string;
    text: string;
    image?: string;
    url?: string;
  }>;
}

// 性能监控相关接口
export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint
}

export interface SEOPerformanceReport {
  url: string;
  timestamp: Date;
  metrics: PerformanceMetrics;
  seoScore: number;
  issues: SEOIssue[];
  recommendations: string[];
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'metadata' | 'structured-data' | 'performance' | 'content' | 'technical';
  message: string;
  element?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fix?: string;
}

// 内容优化相关接口
export interface KeywordDensity {
  [keyword: string]: {
    count: number;
    density: number;
    isOptimal: boolean;
    positions: number[];
  };
}

export interface ContentOptimizationResult {
  title: {
    length: number;
    isOptimal: boolean;
    suggestions: string[];
  };
  description: {
    length: number;
    isOptimal: boolean;
    suggestions: string[];
  };
  headings: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    structure: Array<{
      level: number;
      text: string;
      hasKeywords: boolean;
    }>;
    issues: string[];
  };
  keywords: KeywordDensity;
  readability: {
    score: number;
    level: string;
    suggestions: string[];
  };
  internalLinks: {
    count: number;
    links: Array<{
      text: string;
      href: string;
      isOptimal: boolean;
    }>;
  };
}

// SEO管理器组件Props
export interface SEOManagerProps {
  page: 'home' | 'upload' | 'split' | 'export';
  language?: 'zh-CN' | 'en';
  context?: Record<string, any>;
  customMetadata?: Partial<SEOMetadata>;
  enableStructuredData?: boolean;
  enableOpenGraph?: boolean;
  enableTwitterCard?: boolean;
  enableCanonical?: boolean;
}

// SEO上下文接口
export interface SEOContext {
  sliceCount?: number;
  selectedCount?: number;
  fileName?: string;
  [key: string]: any;
}

// 页面类型
export type PageType = 'home' | 'upload' | 'split' | 'export';

// 语言类型
export type Language = 'zh-CN' | 'en';

// 结构化数据生成器接口
export interface StructuredDataGenerator {
  generateWebApplication(): WebApplicationSchema;
  generateSoftwareApplication(): SoftwareApplicationSchema;
  generateBreadcrumb(path: string): BreadcrumbSchema;
  generateFAQ(): FAQSchema;
  generateHowTo(): HowToSchema;
}

// 性能优化器接口
export interface PerformanceOptimizer {
  enableImageLazyLoading(): void;
  optimizeResourceLoading(): void;
  implementCriticalCSS(): void;
  enableGzipCompression(): void;
  setupCacheHeaders(): void;
  preloadCriticalResources(): void;
  measurePerformance(): Promise<PerformanceMetrics>;
}

// 内容优化器接口
export interface ContentOptimizer {
  generateOptimizedTitle(page: string, language: string, context?: Record<string, any>): string;
  generateMetaDescription(page: string, language: string, context?: Record<string, any>): string;
  optimizeHeadingStructure(content: string): string;
  generateInternalLinks(currentPage: string): Array<{ text: string; href: string }>;
  calculateKeywordDensity(content: string, keywords: string[]): KeywordDensity;
  analyzeContent(content: string): ContentOptimizationResult;
}

// SEO监控器接口
export interface SEOMonitor {
  checkMetaTags(): boolean;
  checkStructuredData(): boolean;
  checkPerformance(): Promise<PerformanceMetrics>;
  generateSEOReport(): Promise<SEOPerformanceReport>;
  validateSEO(): Promise<SEOIssue[]>;
}

// 导出所有类型的联合类型
export type StructuredDataType =
  | WebApplicationSchema
  | SoftwareApplicationSchema
  | BreadcrumbSchema
  | FAQSchema
  | HowToSchema;

export type SEOComponentProps = SEOManagerProps;
export type SEOAnalyticsEvent = {
  name: string;
  category: 'SEO' | 'Performance' | 'User Interaction';
  value?: number;
  metadata?: Record<string, any>;
};
