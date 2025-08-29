/**
 * SEO配置桥接层 (Configuration Bridge)
 * 
 * ⚠️ 重要说明:
 * 这个文件现在是一个桥接层，实际配置请修改 src/config/seo.config.json
 * 
 * 工作原理:
 * 1. 优先从 seo.config.json 读取配置
 * 2. 如果JSON配置不可用，回退到硬编码默认值
 * 3. 保持与现有代码的向后兼容性
 * 
 * 配置管理:
 * - 主配置文件: src/config/seo.config.json
 * - 类型定义: src/types/seo.types.ts
 * - 配置管理器: src/utils/seo/SEOConfigManager.ts
 */

import { seoConfigManager } from '../utils/seo/SEOConfigManager';
import type { SEOConfig } from '../types/seo.types';

/**
 * 动态获取配置 - 优先使用JSON配置，回退到硬编码配置
 */
function getConfigValue<T>(path: string, fallback: T): T {
  try {
    const config = seoConfigManager.getCurrentConfig();
    if (!config) return fallback;

    const keys = path.split('.');
    let value = config as any;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return fallback;
      }
    }
    
    return value || fallback;
  } catch {
    return fallback;
  }
}

// Legacy configuration object for backward compatibility
// ⚠️ 实际值现在从 seo.config.json 读取
export const SEO_CONFIG = {
  // 网站基础信息 - 从JSON配置读取
  get siteName() {
    return getConfigValue('site.name.zh-CN', '长截图分割工具');
  },
  
  get siteUrl() {
    return getConfigValue('site.url', 'https://screenshot-splitter.com');
  },
  
  get defaultLanguage() {
    return getConfigValue('site.defaultLanguage', 'zh-CN');
  },
  
  get supportedLanguages() {
    return getConfigValue('site.supportedLanguages', ['zh-CN', 'en']);
  },

  // 社交媒体信息 - 从JSON配置读取
  get socialMedia() {
    return getConfigValue('socialMedia', {
      twitter: '@screenshot_tool',
      facebook: 'screenshot-splitter',
      linkedin: 'screenshot-splitter',
    });
  },

  // 分析工具配置 - 从JSON配置读取
  get analytics() {
    return getConfigValue('analytics', {
      googleAnalyticsId: 'G-XXXXXXXXXX',
      googleSearchConsoleId: 'XXXXXXXXXX',
    });
  },

  // 关键词配置 - 从JSON配置读取中文关键词
  get keywords() {
    const jsonKeywords = getConfigValue('keywords', null) as any;
    if (jsonKeywords && typeof jsonKeywords === 'object') {
      return {
        primary: jsonKeywords.primary?.['zh-CN'] || ['长截图分割', '截图切割', '图片分割工具'],
        secondary: jsonKeywords.secondary?.['zh-CN'] || ['长图切割', '截图处理', '图片编辑'],
        longTail: jsonKeywords.longTail?.['zh-CN'] || ['如何分割长截图', '长截图怎么切割']
      };
    }
    
    // 回退配置
    return {
      primary: ['长截图分割', '截图切割', '图片分割工具', '在线截图工具', '免费图片处理'],
      secondary: ['长图切割', '截图处理', '图片编辑', '在线工具', '图片分割器'],
      longTail: ['如何分割长截图', '长截图怎么切割', '免费在线图片分割工具']
    };
  },

  // 默认图片配置 - 从JSON配置读取
  get defaultImages() {
    return getConfigValue('defaultImages', {
      ogImage: '/og-image.png',
      twitterImage: '/twitter-card.png',
      favicon: '/favicon.ico',
      appleTouchIcon: '/apple-touch-icon.png',
    });
  },

  // 页面特定配置 - 从JSON配置读取
  get pages() {
    const jsonPages = getConfigValue('pages', null);
    if (jsonPages) {
      const legacyPages: Record<string, any> = {};
      Object.entries(jsonPages).forEach(([key, page]: [string, any]) => {
        legacyPages[key] = {
          priority: page.priority || 0.8,
          changeFrequency: page.changeFrequency || 'monthly'
        };
      });
      return legacyPages;
    }
    
    return {
      home: { priority: 1.0, changeFrequency: 'weekly' as const },
      upload: { priority: 0.8, changeFrequency: 'monthly' as const },
      split: { priority: 0.6, changeFrequency: 'monthly' as const },
      export: { priority: 0.6, changeFrequency: 'monthly' as const },
    };
  },

  // 结构化数据配置 - 从JSON配置读取
  get structuredData() {
    return getConfigValue('structuredData', {
      organization: {
        name: '长截图分割工具',
        url: 'https://screenshot-splitter.com',
        logo: 'https://screenshot-splitter.com/logo.png',
        description: '免费的在线长截图分割工具，支持将长图片自动切割成多个部分',
      },
      webApplication: {
        name: '长截图分割工具',
        description: '免费的在线长截图分割工具，支持将长图片自动切割成多个部分',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
      },
    });
  },
}

// 导出类型
export type SEOConfigType = typeof SEO_CONFIG;
export type SupportedLanguage = (typeof SEO_CONFIG.supportedLanguages)[number];
export type PageKey = keyof typeof SEO_CONFIG.pages;
export type ChangeFrequency = (typeof SEO_CONFIG.pages)[PageKey]['changeFrequency'];

/**
 * Backward compatibility utilities
 * These functions provide access to the new JSON-based configuration system
 * while maintaining compatibility with existing code
 */

/**
 * Initialize the new SEO configuration system
 * Call this function during application startup
 */
export async function initializeSEOConfig(): Promise<void> {
  try {
    const result = await seoConfigManager.loadConfig({
      validateOnly: false,
      force: false,
    });
    
    if (!result.success) {
      console.warn('SEO configuration failed to load:', result.errors);
      console.info('Falling back to legacy configuration');
    } else {
      console.info('SEO configuration loaded successfully');
    }
  } catch (error) {
    console.error('Failed to initialize SEO configuration:', error);
    console.info('Using legacy configuration as fallback');
  }
}

/**
 * Get the current SEO configuration with fallback to legacy
 */
export function getCurrentSEOConfig(): SEOConfig | typeof SEO_CONFIG {
  try {
    const stats = seoConfigManager.getStats();
    if (stats.loaded) {
      return seoConfigManager.getConfig();
    }
  } catch {
    console.warn('Failed to get current SEO config, using legacy fallback');
  }
  
  // Return legacy configuration as fallback
  return SEO_CONFIG as any;
}

/**
 * Migration utility to convert legacy config to new format
 * This can be used for testing or manual migration
 */
export function migrateLegacyConfig(): Partial<SEOConfig> {
  return {
    version: '1.0.0',
    site: {
      name: {
        'zh-CN': SEO_CONFIG.siteName,
        'en': 'Long Screenshot Splitter'
      },
      url: SEO_CONFIG.siteUrl,
      defaultLanguage: SEO_CONFIG.defaultLanguage as 'zh-CN',
      supportedLanguages: SEO_CONFIG.supportedLanguages as ['zh-CN', 'en']
    },
    socialMedia: SEO_CONFIG.socialMedia,
    analytics: SEO_CONFIG.analytics,
    keywords: {
      primary: {
        'zh-CN': SEO_CONFIG.keywords.primary,
        'en': [
          'long screenshot splitter',
          'screenshot cutter', 
          'image splitting tool',
          'online screenshot tool',
          'free image processing'
        ]
      },
      secondary: {
        'zh-CN': SEO_CONFIG.keywords.secondary,
        'en': [
          'long image cutter',
          'screenshot processing',
          'image editing',
          'online tool',
          'image splitter'
        ]
      },
      longTail: {
        'zh-CN': SEO_CONFIG.keywords.longTail,
        'en': [
          'how to split long screenshots',
          'cut long screenshots online',
          'free online image splitting tool',
          'mobile screenshot splitting method',
          'web screenshot splitting tool'
        ]
      }
    },
    defaultImages: SEO_CONFIG.defaultImages,
    // Note: pages and structuredData would need more complex migration
    // This is a simplified example
  } as unknown as Partial<SEOConfig>;
}
