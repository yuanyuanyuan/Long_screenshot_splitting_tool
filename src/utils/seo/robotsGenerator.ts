/**
 * Robots.txt 生成器
 * 基于SEO配置自动生成robots.txt文件
 */

import { seoConfigManager } from './SEOConfigManager';
// import type { Language as _Language } from '../../types/seo.types';

interface RobotsTxtConfig {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
  sitemapUrl: string;
  customRules?: string[];
}

interface GeneratedRobotsTxt {
  content: string;
  lastGenerated: string;
  config: RobotsTxtConfig;
}

class RobotsGenerator {
  private config: RobotsTxtConfig | null = null;
  private cache: GeneratedRobotsTxt | null = null;
  private readonly cacheKey = 'robots-txt-cache';

  /**
   * 初始化生成器，加载配置
   */
  async initialize(): Promise<boolean> {
    try {
      const result = await seoConfigManager.loadConfig();
      if (result.success && result.config?.robotsTxt) {
        this.config = result.config.robotsTxt;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize robots generator:', error);
      return false;
    }
  }

  /**
   * 生成robots.txt内容
   */
  generateRobotsContent(): string {
    if (!this.config) {
      return this.getFallbackRobotsContent();
    }

    const lines: string[] = [];

    // 基础规则
    lines.push(`User-agent: ${this.config.userAgent}`);
    
    // 允许的路径
    this.config.allow.forEach(path => {
      lines.push(`Allow: ${path}`);
    });

    // 禁止的路径
    this.config.disallow.forEach(path => {
      lines.push(`Disallow: ${path}`);
    });

    // 爬取延迟
    if (this.config.crawlDelay) {
      lines.push(`Crawl-delay: ${this.config.crawlDelay}`);
    }

    lines.push(''); // 空行

    // Sitemap位置
    lines.push(`Sitemap: ${this.config.sitemapUrl}`);
    
    lines.push(''); // 空行

    // 自定义规则
    if (this.config.customRules && this.config.customRules.length > 0) {
      lines.push(...this.config.customRules);
    }

    // Google SEO最佳实践的额外规则
    lines.push('');
    lines.push('# Google SEO 优化规则');
    lines.push('User-agent: Googlebot');
    lines.push('Allow: /*.js');
    lines.push('Allow: /*.css');
    lines.push('Allow: /*.png');
    lines.push('Allow: /*.jpg');
    lines.push('Allow: /*.jpeg');
    lines.push('Allow: /*.gif');
    lines.push('Allow: /*.webp');
    lines.push('Allow: /*.svg');
    lines.push('Allow: /*.ico');
    
    lines.push('');
    lines.push('# 移动端优化');
    lines.push('User-agent: Googlebot-Mobile');
    lines.push('Allow: /');
    lines.push('Crawl-delay: 0.5');

    lines.push('');
    lines.push('# 百度搜索引擎优化');
    lines.push('User-agent: Baiduspider');
    lines.push('Allow: /');
    lines.push('Disallow: /api/');
    lines.push('Crawl-delay: 2');

    return lines.join('\n');
  }

  /**
   * 获取缓存的robots.txt内容
   */
  getCachedRobots(): GeneratedRobotsTxt | null {
    if (this.cache) {
      // 检查缓存是否过期（24小时）
      const cacheTime = new Date(this.cache.lastGenerated);
      const now = new Date();
      const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        return this.cache;
      }
    }

    // 尝试从localStorage读取缓存
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as GeneratedRobotsTxt;
        const cacheTime = new Date(parsed.lastGenerated);
        const now = new Date();
        const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          this.cache = parsed;
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load robots cache:', error);
    }

    return null;
  }

  /**
   * 生成并缓存robots.txt
   */
  async generateAndCache(): Promise<GeneratedRobotsTxt> {
    // 检查缓存
    const cached = this.getCachedRobots();
    if (cached) {
      return cached;
    }

    // 确保配置已加载
    if (!this.config) {
      await this.initialize();
    }

    // 生成新内容
    const content = this.generateRobotsContent();
    const generated: GeneratedRobotsTxt = {
      content,
      lastGenerated: new Date().toISOString(),
      config: this.config || this.getFallbackConfig(),
    };

    // 缓存结果
    this.cache = generated;
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(generated));
    } catch (error) {
      console.warn('Failed to cache robots content:', error);
    }

    return generated;
  }

  /**
   * 直接生成robots.txt文件内容
   */
  async generate(): Promise<string> {
    const result = await this.generateAndCache();
    return result.content;
  }

  /**
   * 验证robots.txt内容
   */
  validateRobotsContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = content.split('\n');

    let hasUserAgent = false;
    let hasSitemap = false;
    let hasValidRules = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('User-agent:')) {
        hasUserAgent = true;
      } else if (trimmed.startsWith('Sitemap:')) {
        hasSitemap = true;
        // 验证sitemap URL格式
        const url = trimmed.replace('Sitemap:', '').trim();
        if (!url.startsWith('http')) {
          errors.push('Sitemap URL must be absolute (start with http/https)');
        }
      } else if (trimmed.startsWith('Allow:') || trimmed.startsWith('Disallow:')) {
        hasValidRules = true;
      }
    }

    if (!hasUserAgent) {
      errors.push('Missing User-agent directive');
    }

    if (!hasSitemap) {
      errors.push('Missing Sitemap directive');
    }

    if (!hasValidRules) {
      errors.push('Missing Allow/Disallow rules');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取回退配置
   */
  private getFallbackConfig(): RobotsTxtConfig {
    return {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/api/', '/admin/', '/temp/'],
      crawlDelay: 1,
      sitemapUrl: 'https://screenshot-splitter.com/sitemap.xml',
      customRules: [
        '# 基础SEO优化',
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /admin/',
      ]
    };
  }

  /**
   * 获取回退的robots.txt内容
   */
  private getFallbackRobotsContent(): string {
    return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /temp/
Crawl-delay: 1

Sitemap: https://screenshot-splitter.com/sitemap.xml

# 基础SEO优化规则
User-agent: Googlebot
Allow: /*.js
Allow: /*.css
Allow: /*.png
Allow: /*.jpg
Allow: /*.webp
Crawl-delay: 0.5

User-agent: Baiduspider
Allow: /
Disallow: /api/
Crawl-delay: 2`;
  }

  /**
   * 获取生成统计信息
   */
  getStats() {
    return {
      configLoaded: this.config !== null,
      cacheAvailable: this.cache !== null,
      lastGenerated: this.cache?.lastGenerated || null,
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
      console.warn('Failed to clear robots cache:', error);
    }
  }
}

// 创建单例实例
export const robotsGenerator = new RobotsGenerator();

// 默认导出生成函数，方便使用
export default async function generateRobotsTxt(): Promise<string> {
  return await robotsGenerator.generate();
}

// 类型导出
export type { RobotsTxtConfig, GeneratedRobotsTxt };