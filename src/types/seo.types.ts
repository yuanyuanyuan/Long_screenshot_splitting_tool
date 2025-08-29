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
  ogSiteName?: string;
  ogLocale?: string;
  twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCreator?: string;
  twitterSite?: string;
  ogImageAlt?: string;
  canonicalUrl: string;
  hreflang: Record<string, string>;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  language?: Language;
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

// 语言类型
export type Language = 'zh-CN' | 'en';

// 多语言字符串接口
export interface MultiLanguageString {
  'zh-CN': string;
  'en': string;
}

// 多语言字符串数组接口
export interface MultiLanguageStringArray {
  'zh-CN': string[];
  'en': string[];
}

// 页面类型
export type PageType = 'home' | 'upload' | 'split' | 'export';

// 修改频率类型
export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

// 标题结构接口
export interface HeadingStructure {
  h1: string;
  h2?: string[];
  h3?: string[];
  h4?: string[];
  h5?: string[];
  h6?: string[];
}

// 页面配置接口
export interface PageConfig {
  title: MultiLanguageString;
  description: MultiLanguageString;
  priority: number;
  changeFrequency: ChangeFrequency;
  headingStructure?: HeadingStructure;
  customMeta?: Record<string, string>;
}

// 验证规则接口
export interface ValidationRule {
  minLength: number;
  maxLength: number;
}

// 计数验证规则接口
export interface CountValidationRule {
  minCount: number;
  maxCount: number;
}

// 验证配置接口
export interface ValidationConfig {
  title?: ValidationRule;
  description?: ValidationRule;
  keywords?: CountValidationRule;
}

// 性能配置接口
export interface PerformanceConfig {
  enableImageLazyLoading?: boolean;
  enableResourcePreloading?: boolean;
  enableCriticalCSS?: boolean;
  optimizeForMobile?: boolean;
}

// 组织信息接口
export interface OrganizationInfo {
  name: string;
  url: string;
  logo?: string;
  description: MultiLanguageString;
}

// Web应用信息接口
export interface WebApplicationInfo {
  name: MultiLanguageString;
  description: MultiLanguageString;
  applicationCategory: 'UtilitiesApplication' | 'MultimediaApplication' | 'ProductivityApplication';
  operatingSystem: string;
  browserRequirements?: string;
  features?: MultiLanguageStringArray;
  datePublished?: string;
}

// 结构化数据配置接口
export interface StructuredDataConfig {
  organization: OrganizationInfo;
  webApplication: WebApplicationInfo;
}

// 站点配置接口
export interface SiteConfig {
  name: MultiLanguageString;
  url: string;
  defaultLanguage: Language;
  supportedLanguages: Language[];
}

// 社交媒体配置接口
export interface SocialMediaConfig {
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

// 分析工具配置接口
export interface AnalyticsConfig {
  googleAnalyticsId?: string;
  googleSearchConsoleId?: string;
  baiduAnalyticsId?: string;
  hotjarId?: string;
}

// 关键词配置接口
export interface KeywordsConfig {
  primary: MultiLanguageStringArray;
  secondary?: MultiLanguageStringArray;
  longTail?: MultiLanguageStringArray;
}

// 默认图片配置接口
export interface DefaultImagesConfig {
  ogImage?: string;
  twitterImage?: string;
  favicon?: string;
  appleTouchIcon?: string;
  logo?: string;
}

// 主SEO配置接口
export interface SEOConfig {
  version: string;
  site: SiteConfig;
  socialMedia?: SocialMediaConfig;
  analytics?: AnalyticsConfig;
  keywords: KeywordsConfig;
  defaultImages?: DefaultImagesConfig;
  pages: Record<PageType, PageConfig>;
  structuredData: StructuredDataConfig;
  validation?: ValidationConfig;
  performance?: PerformanceConfig;
  robotsTxt?: RobotsTxtConfig;
  sitemap?: SitemapConfig;
  keywordOptimization?: KeywordOptimizationConfig;
  contentSEO?: ContentSEOConfig;
}

// Robots.txt 配置接口
export interface RobotsTxtConfig {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
  sitemapUrl: string;
  customRules?: string[];
}

// Sitemap 配置接口
export interface SitemapConfig {
  baseUrl: string;
  generateStaticSitemap: boolean;
  includeDynamicPages: boolean;
  lastModified: string;
  staticPages: Array<{
    url: string;
    lastmod: string;
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
    languages?: Language[];
  }>;
}

// 关键词优化配置接口
export interface KeywordOptimizationConfig {
  targetDensity: {
    primary: number;
    secondary: number;
    longTail: number;
  };
  contentStructure: {
    titleKeywordPosition: 'beginning' | 'middle' | 'end' | 'natural';
    keywordVariations: boolean;
    semanticKeywords: boolean;
    keywordProximity: number;
  };
  densityRules: {
    minDensity: number;
    maxDensity: number;
    optimalRange: [number, number];
    avoidOverOptimization: boolean;
  };
}

// 内容SEO配置接口
export interface ContentSEOConfig {
  minContentLength: Record<PageType, number>;
  headingDistribution: {
    h1Count: number;
    h2MinCount: number;
    h2MaxCount: number;
    h3MinCount: number;
    h3MaxCount: number;
  };
  keywordPlacement: {
    h1: string;
    h2: string;
    h3: string;
    firstParagraph: string;
    lastParagraph: string;
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
  inLanguage: string;
  isAccessibleForFree: boolean;
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
  author?: {
    '@type': 'Organization';
    name: string;
    url: string;
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
  enablePerformanceTracking?: boolean;
  structuredDataTypes?: StructuredDataType[];
  onMetadataGenerated?: (metadata: SEOMetadata) => void;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

// SEO上下文接口
export interface SEOContext {
  sliceCount?: number;
  selectedCount?: number;
  fileName?: string;
  [key: string]: any;
}

// Removed duplicate type definitions - already defined earlier

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

// 配置加载选项接口
export interface SEOConfigLoadOptions {
  force?: boolean;
  validateOnly?: boolean;
  configPath?: string;
}

// 配置验证结果接口
export interface SEOConfigValidationResult {
  success: boolean;
  config?: SEOConfig;
  errors: string[];
  warnings: string[];
  loadTime: number;
}

// 配置加载器选项接口
export interface ConfigLoaderOptions extends SEOConfigLoadOptions {
  autoReload?: boolean;
  reloadInterval?: number;
  enableHotReload?: boolean;
  validateOnLoad?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

// 配置加载器指标接口
export interface ConfigLoaderMetrics {
  loadCount: number;
  successCount: number;
  errorCount: number;
  avgLoadTime: number;
  lastLoadTime: number;
  totalLoadTime: number;
}

// SEO配置缓存类型
export type SEOConfigCache = Map<string, any>;

// 标题层级类型
export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

// 标题层级验证接口
export interface HeadingHierarchyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  structure: {
    level: HeadingLevel;
    text: string;
    position: number;
  }[];
}

// H标签组件属性接口
export interface HeadingProps {
  level: HeadingLevel;
  children: React.ReactNode;
  id?: string;
  className?: string;
  validateHierarchy?: boolean;
  context?: string;
}

// 标题提供者上下文接口
export interface HeadingContextValue {
  currentLevel: number;
  headings: {
    level: HeadingLevel;
    text: string;
    id: string;
  }[];
  registerHeading: (level: HeadingLevel, text: string, id: string) => void;
  validateHierarchy: () => HeadingHierarchyValidation;
}

// SEO国际化hook接口
export interface UseSEOI18nReturn {
  t: (key: string, variables?: Record<string, any>) => string;
  language: Language;
  setLanguage: (language: Language) => void;
  getSEOText: (page: PageType, field: 'title' | 'description', context?: Record<string, any>) => string;
  getKeywords: (page: PageType, includeContext?: boolean) => string[];
}

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 响应式断点
export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

// 视窗检测结果接口
export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
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

// 增强的SEO配置管理器接口
export interface SEOConfigManagerInterface {
  loadConfig(options?: SEOConfigLoadOptions): Promise<SEOConfigValidationResult>;
  validateConfig(configData: unknown): Promise<SEOConfigValidationResult>;
  getConfig(): SEOConfig;
  getPageConfig(page: PageType, language?: Language): {
    title: string;
    description: string;
    keywords: string[];
    headingStructure: Record<string, string | string[]>;
  };
  getKeywords(page: PageType, language?: Language, includeContext?: boolean): string[];
  getStructuredData(page: PageType, language?: Language): Record<string, unknown>;
  reloadConfig(): Promise<SEOConfigValidationResult>;
  clearCache(): void;
  getStats(): {
    loaded: boolean;
    cacheSize: number;
    lastLoadTime: number;
    cacheValid: boolean;
  };
}

// JSON Schema validation interfaces
export interface JSONSchemaProperty {
  type: string;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: string[];
  items?: JSONSchemaProperty;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  $ref?: string;
}

export interface JSONSchema {
  type: string;
  required?: string[];
  properties?: Record<string, JSONSchemaProperty>;
  definitions?: Record<string, JSONSchemaProperty>;
}

// Configuration validation error interfaces
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning';
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Enhanced configuration loader interfaces
export interface ConfigurationSource {
  type: 'json' | 'typescript' | 'remote';
  path: string;
  encoding?: string;
  timeout?: number;
}

export interface LoaderStrategy {
  primary: ConfigurationSource;
  fallback?: ConfigurationSource[];
  cache?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

// Configuration manager events
export type ConfigManagerEventType = 
  | 'config:loaded'
  | 'config:validated' 
  | 'config:error'
  | 'config:cache:cleared'
  | 'config:hot:reload';

export interface ConfigManagerEvent {
  type: ConfigManagerEventType;
  timestamp: number;
  data?: any;
  error?: Error;
}

export interface ConfigManagerEventHandler {
  (event: ConfigManagerEvent): void;
}

// Advanced configuration management interfaces
export interface ConfigurationManager {
  load(strategy?: LoaderStrategy): Promise<SEOConfigValidationResult>;
  validate(config: unknown, schema?: JSONSchema): Promise<SchemaValidationResult>;
  watch(handler: ConfigManagerEventHandler): () => void;
  get<T = any>(path: string): T | undefined;
  set(path: string, value: any): boolean;
  merge(config: Partial<SEOConfig>): boolean;
  export(format?: 'json' | 'typescript'): string;
}

// Hot reload configuration interfaces
export interface HotReloadOptions {
  enabled: boolean;
  watchPaths: string[];
  debounceMs: number;
  validateOnChange: boolean;
  notifyOnError: boolean;
}

export interface WatcherEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  stats?: any;
}

// Configuration migration interfaces
export interface ConfigMigration {
  version: string;
  description: string;
  up: (config: any) => any;
  down: (config: any) => any;
}

export interface MigrationRunner {
  migrate(config: any, fromVersion: string, toVersion: string): Promise<any>;
  rollback(config: any, fromVersion: string, toVersion: string): Promise<any>;
  getAvailableMigrations(): ConfigMigration[];
}

// Performance monitoring for config operations
export interface ConfigPerformanceMetrics {
  loadTime: number;
  parseTime: number;
  validationTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  operationCount: number;
}

export interface PerformanceMonitor {
  startTimer(operation: string): () => number;
  recordMetrics(operation: string, metrics: Partial<ConfigPerformanceMetrics>): void;
  getMetrics(): ConfigPerformanceMetrics;
  reset(): void;
}
