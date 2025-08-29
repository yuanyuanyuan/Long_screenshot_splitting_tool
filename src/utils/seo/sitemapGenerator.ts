/**
 * Sitemap.xml 生成器
 * 基于SEO配置自动生成sitemap.xml文件
 */

import { seoConfigManager } from './SEOConfigManager';
import type { Language, PageType } from '../../types/seo.types';

interface SitemapUrl {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  languages?: Language[];
}

interface SitemapConfig {
  baseUrl: string;
  generateStaticSitemap: boolean;
  includeDynamicPages: boolean;
  lastModified: string;
  staticPages: SitemapUrl[];
}

interface GeneratedSitemap {
  content: string;
  lastGenerated: string;
  urlCount: number;
  config: SitemapConfig;
}

class SitemapGenerator {
  private config: SitemapConfig | null = null;
  private cache: GeneratedSitemap | null = null;
  private readonly cacheKey = 'sitemap-cache';

  /**
   * 初始化生成器，加载配置
   */
  async initialize(): Promise<boolean> {
    try {
      const result = await seoConfigManager.loadConfig();
      if (result.success && result.config?.sitemap) {
        this.config = result.config.sitemap;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize sitemap generator:', error);
      return false;
    }
  }

  /**
   * 生成sitemap.xml内容
   */
  generateSitemapContent(): string {
    if (!this.config) {
      return this.getFallbackSitemapContent();
    }

    const urls: string[] = [];

    // XML声明和根元素
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    urls.push(header);

    // 生成静态页面URL
    if (this.config.staticPages) {
      this.config.staticPages.forEach(page => {
        urls.push(this.generateUrlEntry(page));
      });
    }

    // 生成多语言页面
    this.generateMultilingualUrls().forEach(url => {
      urls.push(url);
    });

    // 关闭根元素
    urls.push('</urlset>');

    return urls.join('\n');
  }

  /**
   * 生成单个URL条目
   */
  private generateUrlEntry(page: SitemapUrl): string {
    const baseUrl = this.config?.baseUrl || 'https://screenshot-splitter.com';
    const fullUrl = `${baseUrl}${page.url}`;
    
    let entry = `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>`;

    // 添加多语言链接
    if (page.languages && page.languages.length > 1) {
      page.languages.forEach(lang => {
        const langUrl = this.generateLanguageUrl(page.url, lang);
        const hreflang = lang === 'zh-CN' ? 'zh-cn' : lang;
        entry += `
    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${baseUrl}${langUrl}" />`;
      });
      
      // 添加x-default
      const defaultUrl = this.generateLanguageUrl(page.url, 'zh-CN');
      entry += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${defaultUrl}" />`;
    }

    entry += `
  </url>`;

    return entry;
  }

  /**
   * 生成语言特定的URL
   */
  private generateLanguageUrl(basePath: string, language: Language): string {
    if (language === 'zh-CN') {
      return basePath; // 中文为默认语言，不需要前缀
    }
    
    // 英文等其他语言添加语言前缀
    const langPrefix = `/${language}`;
    return basePath === '/' ? langPrefix : `${langPrefix}${basePath}`;
  }

  /**
   * 生成多语言URL条目
   */
  private generateMultilingualUrls(): string[] {
    const urls: string[] = [];
    const baseUrl = this.config?.baseUrl || 'https://screenshot-splitter.com';
    
    // 页面类型和路径的映射
    const pageRoutes: Record<PageType, string> = {
      home: '/',
      upload: '/upload',
      split: '/split',
      export: '/export'
    };

    // 支持的语言
    const supportedLanguages: Language[] = ['zh-CN', 'en'];
    
    // 为每个页面生成多语言版本
    Object.entries(pageRoutes).forEach(([pageType, route]) => {
      const page = pageType as PageType;
      
      // 获取页面配置
      const pageConfig = this.getPageConfig(page);
      
      supportedLanguages.forEach(lang => {
        const langUrl = this.generateLanguageUrl(route, lang);
        const fullUrl = `${baseUrl}${langUrl}`;
        
        let entry = `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${pageConfig.lastmod}</lastmod>
    <changefreq>${pageConfig.changefreq}</changefreq>
    <priority>${pageConfig.priority}</priority>`;

        // 添加备用语言链接
        supportedLanguages.forEach(altLang => {
          const altUrl = this.generateLanguageUrl(route, altLang);
          const hreflang = altLang === 'zh-CN' ? 'zh-cn' : altLang;
          entry += `
    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${baseUrl}${altUrl}" />`;
        });

        // 添加x-default（指向中文版本）
        const defaultUrl = this.generateLanguageUrl(route, 'zh-CN');
        entry += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${defaultUrl}" />`;

        entry += `
  </url>`;

        urls.push(entry);
      });
    });

    return urls;
  }

  /**
   * 获取页面配置
   */
  private getPageConfig(page: PageType): SitemapUrl {
    const today = new Date().toISOString().split('T')[0];
    
    const defaultConfigs: Record<PageType, Omit<SitemapUrl, 'url' | 'languages'>> = {
      home: {
        lastmod: today,
        changefreq: 'weekly',
        priority: 1.0
      },
      upload: {
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.8
      },
      split: {
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.9
      },
      export: {
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.7
      }
    };

    return {
      url: '',
      languages: ['zh-CN', 'en'],
      ...defaultConfigs[page]
    };
  }

  /**
   * 获取缓存的sitemap内容
   */
  getCachedSitemap(): GeneratedSitemap | null {
    if (this.cache) {
      // 检查缓存是否过期（6小时）
      const cacheTime = new Date(this.cache.lastGenerated);
      const now = new Date();
      const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 6) {
        return this.cache;
      }
    }

    // 尝试从localStorage读取缓存
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as GeneratedSitemap;
        const cacheTime = new Date(parsed.lastGenerated);
        const now = new Date();
        const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 6) {
          this.cache = parsed;
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load sitemap cache:', error);
    }

    return null;
  }

  /**
   * 生成并缓存sitemap
   */
  async generateAndCache(): Promise<GeneratedSitemap> {
    // 检查缓存
    const cached = this.getCachedSitemap();
    if (cached) {
      return cached;
    }

    // 确保配置已加载
    if (!this.config) {
      await this.initialize();
    }

    // 生成新内容
    const content = this.generateSitemapContent();
    const urlCount = (content.match(/<url>/g) || []).length;
    
    const generated: GeneratedSitemap = {
      content,
      lastGenerated: new Date().toISOString(),
      urlCount,
      config: this.config || this.getFallbackConfig(),
    };

    // 缓存结果
    this.cache = generated;
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(generated));
    } catch (error) {
      console.warn('Failed to cache sitemap content:', error);
    }

    return generated;
  }

  /**
   * 直接生成sitemap.xml文件内容
   */
  async generate(): Promise<string> {
    const result = await this.generateAndCache();
    return result.content;
  }

  /**
   * 验证sitemap.xml内容
   */
  validateSitemapContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查XML格式
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'application/xml');
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        errors.push('Invalid XML format');
      }
    } catch (error) {
      errors.push('Failed to parse XML');
    }

    // 检查必需元素
    if (!content.includes('<urlset')) {
      errors.push('Missing urlset element');
    }

    if (!content.includes('<url>')) {
      errors.push('No URL entries found');
    }

    // 检查URL数量限制（Google建议每个sitemap最多50,000个URL）
    const urlCount = (content.match(/<url>/g) || []).length;
    if (urlCount > 50000) {
      errors.push('Too many URLs (maximum 50,000 per sitemap)');
    }

    // 检查文件大小限制（Google建议最大50MB未压缩）
    const sizeInBytes = new Blob([content]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB > 50) {
      errors.push('Sitemap too large (maximum 50MB uncompressed)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取回退配置
   */
  private getFallbackConfig(): SitemapConfig {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      baseUrl: 'https://screenshot-splitter.com',
      generateStaticSitemap: true,
      includeDynamicPages: false,
      lastModified: today,
      staticPages: [
        {
          url: '/',
          lastmod: today,
          changefreq: 'weekly',
          priority: 1.0,
          languages: ['zh-CN', 'en']
        },
        {
          url: '/upload',
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.8,
          languages: ['zh-CN', 'en']
        },
        {
          url: '/split',
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.9,
          languages: ['zh-CN', 'en']
        },
        {
          url: '/export',
          lastmod: today,
          changefreq: 'monthly',
          priority: 0.7,
          languages: ['zh-CN', 'en']
        }
      ]
    };
  }

  /**
   * 获取回退的sitemap内容
   */
  private getFallbackSitemapContent(): string {
    const today = new Date().toISOString().split('T')[0];
    const baseUrl = 'https://screenshot-splitter.com';

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="zh-cn" href="${baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
  </url>
  <url>
    <loc>${baseUrl}/en</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="zh-cn" href="${baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
  </url>
  <url>
    <loc>${baseUrl}/upload</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="zh-cn" href="${baseUrl}/upload" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/upload" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/upload" />
  </url>
  <url>
    <loc>${baseUrl}/en/upload</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="zh-cn" href="${baseUrl}/upload" />
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/upload" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/upload" />
  </url>
</urlset>`;
  }

  /**
   * 获取生成统计信息
   */
  getStats() {
    return {
      configLoaded: this.config !== null,
      cacheAvailable: this.cache !== null,
      lastGenerated: this.cache?.lastGenerated || null,
      urlCount: this.cache?.urlCount || 0,
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = null;
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.warn('Failed to clear sitemap cache:', error);
    }
  }
}

// 创建单例实例
export const sitemapGenerator = new SitemapGenerator();

// 默认导出生成函数，方便使用
export default async function generateSitemap(): Promise<string> {
  return await sitemapGenerator.generate();
}

// 类型导出
export type { SitemapUrl, SitemapConfig, GeneratedSitemap };