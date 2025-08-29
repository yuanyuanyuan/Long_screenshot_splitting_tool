/**
 * SEO Configuration Manager
 * Handles loading, validation, and management of SEO configuration
 * with comprehensive error handling and type safety
 */

import type {
  SEOConfig,
  SEOConfigValidationResult,
  SEOConfigLoadOptions,
  ConfigLoaderOptions,
  ConfigLoaderMetrics,
  Language,
  PageType,
  SEOConfigCache,
  SEOConfigManagerInterface,
} from '../../types/seo.types';

/**
 * Basic validation schema for SEO configuration
 * Simplified for core functionality without external dependencies
 */
// SEO配置验证模式（临时注释以避免未使用警告）
/* 
const SEO_CONFIG_SCHEMA = {
  type: 'object',
  required: ['version', 'site', 'keywords', 'pages', 'structuredData'],
  properties: {
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    site: {
      type: 'object',
      required: ['name', 'url', 'defaultLanguage', 'supportedLanguages'],
      properties: {
        name: {
          type: 'object',
          required: ['zh-CN', 'en'],
          properties: {
            'zh-CN': { type: 'string', minLength: 1, maxLength: 100 },
            'en': { type: 'string', minLength: 1, maxLength: 100 }
          }
        },
        url: { type: 'string', format: 'uri' },
        defaultLanguage: { type: 'string', enum: ['zh-CN', 'en'] },
        supportedLanguages: {
          type: 'array',
          items: { type: 'string', enum: ['zh-CN', 'en'] },
          minItems: 1,
          maxItems: 10
        }
      }
    },
    keywords: {
      type: 'object',
      required: ['primary'],
      properties: {
        primary: {
          type: 'object',
          required: ['zh-CN', 'en'],
          properties: {
            'zh-CN': { type: 'array', items: { type: 'string' }, minItems: 1 },
            'en': { type: 'array', items: { type: 'string' }, minItems: 1 }
          }
        },
        secondary: {
          type: 'object',
          properties: {
            'zh-CN': { type: 'array', items: { type: 'string' } },
            'en': { type: 'array', items: { type: 'string' } }
          }
        },
        longTail: {
          type: 'object',
          properties: {
            'zh-CN': { type: 'array', items: { type: 'string' } },
            'en': { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    pages: {
      type: 'object',
      required: ['home'],
      properties: {
        home: { $ref: '#/definitions/pageConfig' },
        upload: { $ref: '#/definitions/pageConfig' },
        split: { $ref: '#/definitions/pageConfig' },
        export: { $ref: '#/definitions/pageConfig' }
      }
    },
    structuredData: {
      type: 'object',
      required: ['organization', 'webApplication'],
      properties: {
        organization: {
          type: 'object',
          required: ['name', 'url'],
          properties: {
            name: { type: 'string', minLength: 1 },
            url: { type: 'string', format: 'uri' },
            logo: { type: 'string', format: 'uri' }
          }
        }
      }
    }
  },
  definitions: {
    pageConfig: {
      type: 'object',
      required: ['title', 'description', 'priority', 'changeFrequency'],
      properties: {
        title: {
          type: 'object',
          required: ['zh-CN', 'en'],
          properties: {
            'zh-CN': { type: 'string', minLength: 10, maxLength: 60 },
            'en': { type: 'string', minLength: 10, maxLength: 60 }
          }
        },
        description: {
          type: 'object',
          required: ['zh-CN', 'en'],
          properties: {
            'zh-CN': { type: 'string', minLength: 50, maxLength: 160 },
            'en': { type: 'string', minLength: 50, maxLength: 160 }
          }
        },
        priority: { type: 'number', minimum: 0, maximum: 1 },
        changeFrequency: {
          type: 'string',
          enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']
        }
      }
    }
  }
} as const;
*/

/**
 * SEO Configuration Manager Class
 * Provides robust configuration management with caching, validation, and hot-reload capabilities
 */
export class SEOConfigManager implements SEOConfigManagerInterface {
  private config: SEOConfig | null = null;
  private cache: SEOConfigCache = new Map();
  private metrics: ConfigLoaderMetrics = {
    loadCount: 0,
    successCount: 0,
    errorCount: 0,
    avgLoadTime: 0,
    lastLoadTime: 0,
    totalLoadTime: 0,
  };
  private loadPromise: Promise<SEOConfigValidationResult> | null = null;
  private readonly defaultConfigPath = '/src/config/seo.config.json';

  /**
   * Load and validate SEO configuration
   */
  async loadConfig(options: SEOConfigLoadOptions = {}): Promise<SEOConfigValidationResult> {
    const startTime = performance.now();
    
    try {
      // Return existing promise if already loading
      if (this.loadPromise && !options.force) {
        return this.loadPromise;
      }

      // Return cached config if available and valid
      if (this.config && !options.force && !options.validateOnly) {
        return {
          success: true,
          config: this.config,
          errors: [],
          warnings: [],
          loadTime: 0
        };
      }

      this.loadPromise = this._loadConfigInternal(options);
      const result = await this.loadPromise;
      
      const loadTime = performance.now() - startTime;
      this._updateMetrics(result.success, loadTime);
      
      return result;
      
    } catch (error) {
      const loadTime = performance.now() - startTime;
      this._updateMetrics(false, loadTime);
      
      return {
        success: false,
        errors: [`Configuration load error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        loadTime
      };
    } finally {
      this.loadPromise = null;
    }
  }

  /**
   * Internal configuration loading logic
   */
  private async _loadConfigInternal(options: SEOConfigLoadOptions): Promise<SEOConfigValidationResult> {
    try {
      // Dynamic import of configuration file
      const configPath = options.configPath || this.defaultConfigPath;
      
      let configData: unknown;
      
      if (configPath.endsWith('.json')) {
        // Load JSON configuration
        const response = await fetch(configPath);
        if (!response.ok) {
          throw new Error(`Failed to load config from ${configPath}: ${response.statusText}`);
        }
        configData = await response.json();
      } else {
        // Dynamic import for TypeScript/JavaScript configs
        const configModule = await import(configPath);
        configData = configModule.default || configModule.SEO_CONFIG;
      }

      return this.validateConfig(configData);
      
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        loadTime: 0
      };
    }
  }

  /**
   * Comprehensive configuration validation
   */
  async validateConfig(configData: unknown): Promise<SEOConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startTime = performance.now();

    try {
      if (!configData || typeof configData !== 'object') {
        return {
          success: false,
          errors: ['Configuration data is null or not an object'],
          warnings: [],
          loadTime: performance.now() - startTime
        };
      }

      // Basic structure validation
      this._validateBasicStructure(configData as Record<string, any>, errors);
      
      // Content validation
      this._validateContent(configData as SEOConfig, errors, warnings);
      
      // SEO-specific validations
      this._validateSEORequirements(configData as SEOConfig, errors, warnings);
      
      const loadTime = performance.now() - startTime;
      
      if (errors.length === 0) {
        this.config = configData as SEOConfig;
        this._buildCache();
        
        return {
          success: true,
          config: this.config,
          errors: [],
          warnings,
          loadTime
        };
      } else {
        return {
          success: false,
          errors,
          warnings,
          loadTime
        };
      }
      
    } catch (error) {
      return {
        success: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings,
        loadTime: performance.now() - startTime
      };
    }
  }

  /**
   * Validate basic configuration structure
   */
  private _validateBasicStructure(config: Record<string, any>, errors: string[]): void {
    const requiredFields = ['version', 'site', 'keywords', 'pages', 'structuredData'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate site configuration
    if (config.site) {
      if (!config.site.name?.['zh-CN'] || !config.site.name?.['en']) {
        errors.push('Site name must include both zh-CN and en translations');
      }
      
      if (!config.site.url || !this._isValidUrl(config.site.url)) {
        errors.push('Site URL is required and must be valid');
      }
      
      if (!config.site.supportedLanguages?.includes(config.site.defaultLanguage)) {
        errors.push('Default language must be included in supported languages');
      }
    }

    // Validate pages configuration
    if (config.pages) {
      const requiredPages = ['home'];
      for (const page of requiredPages) {
        if (!config.pages[page]) {
          errors.push(`Missing required page configuration: ${page}`);
        }
      }
    }
  }

  /**
   * Validate content quality and SEO requirements
   */
  private _validateContent(config: SEOConfig, errors: string[], warnings: string[]): void {
    // Validate page content
    Object.entries(config.pages).forEach(([pageKey, pageConfig]) => {
      // Title validation
      Object.entries(pageConfig.title).forEach(([lang, title]) => {
        if (title.length < 10) {
          errors.push(`Page ${pageKey} title too short for ${lang}: minimum 10 characters`);
        }
        if (title.length > 60) {
          warnings.push(`Page ${pageKey} title too long for ${lang}: recommended max 60 characters`);
        }
      });

      // Description validation
      Object.entries(pageConfig.description).forEach(([lang, description]) => {
        if (description.length < 50) {
          errors.push(`Page ${pageKey} description too short for ${lang}: minimum 50 characters`);
        }
        if (description.length > 160) {
          warnings.push(`Page ${pageKey} description too long for ${lang}: recommended max 160 characters`);
        }
      });

      // Priority validation
      if (pageConfig.priority < 0 || pageConfig.priority > 1) {
        errors.push(`Page ${pageKey} priority must be between 0 and 1`);
      }
    });

    // Validate keywords
    Object.entries(config.keywords.primary).forEach(([lang, keywords]) => {
      if (keywords.length < 3) {
        warnings.push(`Primary keywords for ${lang} should have at least 3 items`);
      }
      if (keywords.length > 10) {
        warnings.push(`Primary keywords for ${lang} should not exceed 10 items`);
      }
    });
  }

  /**
   * Validate SEO-specific requirements
   */
  private _validateSEORequirements(config: SEOConfig, errors: string[], warnings: string[]): void {
    // Check for duplicate keywords across languages
    const allKeywords = new Set<string>();
    const duplicates = new Set<string>();
    
    Object.values(config.keywords.primary).flat().forEach(keyword => {
      if (allKeywords.has(keyword.toLowerCase())) {
        duplicates.add(keyword);
      }
      allKeywords.add(keyword.toLowerCase());
    });
    
    if (duplicates.size > 0) {
      warnings.push(`Duplicate keywords found: ${Array.from(duplicates).join(', ')}`);
    }

    // Validate heading structure
    Object.entries(config.pages).forEach(([pageKey, pageConfig]) => {
      if (pageConfig.headingStructure) {
        if (!pageConfig.headingStructure.h1) {
          errors.push(`Page ${pageKey} missing H1 heading`);
        }
        
        const h1Count = Object.keys(pageConfig.headingStructure.h1).length;
        if (h1Count > 1) {
          errors.push(`Page ${pageKey} should have only one H1 heading per language`);
        }
      }
    });

    // Validate structured data
    if (!config.structuredData.webApplication.name) {
      errors.push('Web application structured data missing name');
    }
    
    if (!config.structuredData.organization.name) {
      errors.push('Organization structured data missing name');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SEOConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Get current configuration (alias for getConfig)
   * This method provides backward compatibility
   */
  getCurrentConfig(): SEOConfig | null {
    if (!this.config) {
      return null;
    }
    return this.config;
  }

  /**
   * Get page-specific configuration with language support
   */
  getPageConfig(page: PageType, language: Language = 'zh-CN'): {
    title: string;
    description: string;
    keywords: string[];
    headingStructure: Record<string, string | string[]>;
  } {
    const config = this.getConfig();
    const pageConfig = config.pages[page];
    
    if (!pageConfig) {
      throw new Error(`Page configuration not found: ${page}`);
    }

    return {
      title: pageConfig.title[language] || pageConfig.title[config.site.defaultLanguage],
      description: pageConfig.description[language] || pageConfig.description[config.site.defaultLanguage],
      keywords: this.getKeywords(page, language, true),
      headingStructure: this._getHeadingStructure(pageConfig, language)
    };
  }

  /**
   * Get keywords for specific page and language
   */
  getKeywords(page: PageType, language: Language = 'zh-CN', includeContext: boolean = false): string[] {
    const config = this.getConfig();
    const keywords = [
      ...(config.keywords.primary[language] || []),
      ...(config.keywords.secondary?.[language] || [])
    ];

    if (includeContext && config.keywords.longTail) {
      keywords.push(...(config.keywords.longTail[language] || []));
    }

    return keywords;
  }

  /**
   * Get structured data for specific page
   */
  getStructuredData(page: PageType, language: Language = 'zh-CN'): Record<string, unknown> {
    const config = this.getConfig();
    // const pageConfig = config.pages[page]; // 临时注释避免未使用警告
    
    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: config.structuredData.webApplication.name[language],
      description: config.structuredData.webApplication.description[language],
      url: config.site.url,
      applicationCategory: config.structuredData.webApplication.applicationCategory,
      operatingSystem: config.structuredData.webApplication.operatingSystem,
      browserRequirements: config.structuredData.webApplication.browserRequirements,
      inLanguage: language,
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Organization',
        name: config.structuredData.organization.name,
        url: config.structuredData.organization.url
      }
    };

    // Page-specific structured data enhancements
    if (page === 'home') {
      return {
        ...baseStructuredData,
        '@type': 'SoftwareApplication',
        featureList: config.structuredData.webApplication.features?.[language] || []
      };
    }

    return baseStructuredData;
  }

  /**
   * Reload configuration from source
   */
  async reloadConfig(): Promise<SEOConfigValidationResult> {
    this.clearCache();
    return this.loadConfig({ force: true });
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.config = null;
    this.cache.clear();
  }

  /**
   * Get configuration statistics
   */
  getStats(): {
    loaded: boolean;
    cacheSize: number;
    lastLoadTime: number;
    cacheValid: boolean;
  } {
    return {
      loaded: this.config !== null,
      cacheSize: this.cache.size,
      lastLoadTime: this.metrics.lastLoadTime,
      cacheValid: this.config !== null && this.cache.size > 0
    };
  }

  /**
   * Build internal cache for faster access
   */
  private _buildCache(): void {
    if (!this.config) return;

    this.cache.clear();
    
    // Cache page configs by language
    for (const [pageKey, pageConfig] of Object.entries(this.config.pages)) {
      for (const lang of this.config.site.supportedLanguages) {
        const cacheKey = `page:${pageKey}:${lang}`;
        this.cache.set(cacheKey, {
          title: pageConfig.title[lang],
          description: pageConfig.description[lang],
          keywords: this.getKeywords(pageKey as PageType, lang as Language, true)
        });
      }
    }

    // Cache structured data
    for (const lang of this.config.site.supportedLanguages) {
      const cacheKey = `structured:${lang}`;
      this.cache.set(cacheKey, this.getStructuredData('home', lang as Language));
    }
  }

  /**
   * Get heading structure for page and language
   */
  private _getHeadingStructure(pageConfig: any, language: Language): Record<string, string | string[]> {
    if (!pageConfig.headingStructure) return {};

    const structure: Record<string, string | string[]> = {};
    
    for (const [level, content] of Object.entries(pageConfig.headingStructure)) {
      if (typeof content === 'object' && content !== null) {
        const langContent = (content as Record<string, any>)[language];
        if (langContent) {
          structure[level] = langContent;
        }
      }
    }
    
    return structure;
  }

  /**
   * Update loading metrics
   */
  private _updateMetrics(success: boolean, loadTime: number): void {
    this.metrics.loadCount++;
    this.metrics.totalLoadTime += loadTime;
    this.metrics.avgLoadTime = this.metrics.totalLoadTime / this.metrics.loadCount;
    this.metrics.lastLoadTime = loadTime;
    
    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }
  }

  /**
   * Validate URL format
   */
  private _isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Global SEO Configuration Manager instance
 */
export const seoConfigManager = new SEOConfigManager();

/**
 * Configuration loading utility with advanced options
 */
export class SEOConfigLoader {
  private manager: SEOConfigManager;
  private options: ConfigLoaderOptions;
  private reloadTimer?: NodeJS.Timeout;

  constructor(manager: SEOConfigManager, options: ConfigLoaderOptions = {}) {
    this.manager = manager;
    this.options = {
      autoReload: false,
      reloadInterval: 300000, // 5 minutes
      enableHotReload: false,
      validateOnLoad: true,
      retryOnFailure: true,
      maxRetries: 3,
      ...options
    };
  }

  /**
   * Initialize configuration loader with hot reload support
   */
  async initialize(): Promise<SEOConfigValidationResult> {
    const result = await this.manager.loadConfig({
      validateOnly: this.options.validateOnLoad,
      ...this.options
    });

    if (this.options.autoReload && result.success) {
      this._setupAutoReload();
    }

    return result;
  }

  /**
   * Setup automatic configuration reloading
   */
  private _setupAutoReload(): void {
    if (this.reloadTimer) {
      clearInterval(this.reloadTimer);
    }

    this.reloadTimer = setInterval(async () => {
      try {
        await this.manager.reloadConfig();
      } catch (error) {
        console.warn('Auto-reload failed:', error);
      }
    }, this.options.reloadInterval);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.reloadTimer) {
      clearInterval(this.reloadTimer);
      this.reloadTimer = undefined;
    }
  }
}

export default SEOConfigManager;