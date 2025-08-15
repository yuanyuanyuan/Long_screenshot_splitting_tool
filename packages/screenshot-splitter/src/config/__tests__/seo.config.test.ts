/**
 * SEO配置文件的单元测试
 */

import { describe, it, expect } from 'vitest';
import { SEO_CONFIG, type SEOConfigType, type SupportedLanguage, type PageKey } from '../seo.config';

describe('SEO配置文件测试', () => {
  describe('基础配置验证', () => {
    it('应该包含必要的网站基础信息', () => {
      expect(SEO_CONFIG.siteName).toBe('长截图分割工具');
      expect(SEO_CONFIG.siteUrl).toBe('https://screenshot-splitter.com');
      expect(SEO_CONFIG.defaultLanguage).toBe('zh-CN');
      expect(SEO_CONFIG.supportedLanguages).toEqual(['zh-CN', 'en']);
    });

    it('应该包含社交媒体配置', () => {
      expect(SEO_CONFIG.socialMedia).toHaveProperty('twitter');
      expect(SEO_CONFIG.socialMedia).toHaveProperty('facebook');
      expect(SEO_CONFIG.socialMedia).toHaveProperty('linkedin');
      
      expect(typeof SEO_CONFIG.socialMedia.twitter).toBe('string');
      expect(typeof SEO_CONFIG.socialMedia.facebook).toBe('string');
      expect(typeof SEO_CONFIG.socialMedia.linkedin).toBe('string');
    });

    it('应该包含分析工具配置', () => {
      expect(SEO_CONFIG.analytics).toHaveProperty('googleAnalyticsId');
      expect(SEO_CONFIG.analytics).toHaveProperty('googleSearchConsoleId');
      
      expect(typeof SEO_CONFIG.analytics.googleAnalyticsId).toBe('string');
      expect(typeof SEO_CONFIG.analytics.googleSearchConsoleId).toBe('string');
    });
  });

  describe('关键词配置验证', () => {
    it('应该包含三类关键词', () => {
      expect(SEO_CONFIG.keywords).toHaveProperty('primary');
      expect(SEO_CONFIG.keywords).toHaveProperty('secondary');
      expect(SEO_CONFIG.keywords).toHaveProperty('longTail');
    });

    it('主要关键词应该包含核心业务词汇', () => {
      const primaryKeywords = SEO_CONFIG.keywords.primary;
      expect(Array.isArray(primaryKeywords)).toBe(true);
      expect(primaryKeywords.length).toBeGreaterThan(0);
      expect(primaryKeywords).toContain('长截图分割');
      expect(primaryKeywords).toContain('截图切割');
      expect(primaryKeywords).toContain('图片分割工具');
    });

    it('次要关键词应该包含相关词汇', () => {
      const secondaryKeywords = SEO_CONFIG.keywords.secondary;
      expect(Array.isArray(secondaryKeywords)).toBe(true);
      expect(secondaryKeywords.length).toBeGreaterThan(0);
      expect(secondaryKeywords.some(keyword => keyword.includes('切割'))).toBe(true);
    });

    it('长尾关键词应该包含问题式关键词', () => {
      const longTailKeywords = SEO_CONFIG.keywords.longTail;
      expect(Array.isArray(longTailKeywords)).toBe(true);
      expect(longTailKeywords.length).toBeGreaterThan(0);
      expect(longTailKeywords.some(keyword => keyword.includes('如何') || keyword.includes('怎么'))).toBe(true);
    });
  });

  describe('默认图片配置验证', () => {
    it('应该包含所有必要的图片配置', () => {
      expect(SEO_CONFIG.defaultImages).toHaveProperty('ogImage');
      expect(SEO_CONFIG.defaultImages).toHaveProperty('twitterImage');
      expect(SEO_CONFIG.defaultImages).toHaveProperty('favicon');
      expect(SEO_CONFIG.defaultImages).toHaveProperty('appleTouchIcon');
    });

    it('图片路径应该以/开头', () => {
      Object.values(SEO_CONFIG.defaultImages).forEach(imagePath => {
        expect(imagePath).toMatch(/^\/.*\.(png|jpg|jpeg|ico|svg)$/);
      });
    });
  });

  describe('页面配置验证', () => {
    it('应该包含所有主要页面的配置', () => {
      const expectedPages = ['home', 'upload', 'split', 'export'];
      expectedPages.forEach(page => {
        expect(SEO_CONFIG.pages).toHaveProperty(page);
      });
    });

    it('每个页面应该有优先级和更新频率', () => {
      Object.values(SEO_CONFIG.pages).forEach(pageConfig => {
        expect(pageConfig).toHaveProperty('priority');
        expect(pageConfig).toHaveProperty('changeFrequency');
        
        expect(typeof pageConfig.priority).toBe('number');
        expect(pageConfig.priority).toBeGreaterThan(0);
        expect(pageConfig.priority).toBeLessThanOrEqual(1);
        
        expect(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
          .toContain(pageConfig.changeFrequency);
      });
    });

    it('首页应该有最高优先级', () => {
      expect(SEO_CONFIG.pages.home.priority).toBe(1.0);
    });
  });

  describe('结构化数据配置验证', () => {
    it('应该包含组织信息', () => {
      expect(SEO_CONFIG.structuredData).toHaveProperty('organization');
      
      const org = SEO_CONFIG.structuredData.organization;
      expect(org).toHaveProperty('name');
      expect(org).toHaveProperty('url');
      expect(org).toHaveProperty('logo');
      expect(org).toHaveProperty('description');
      
      expect(typeof org.name).toBe('string');
      expect(typeof org.url).toBe('string');
      expect(typeof org.logo).toBe('string');
      expect(typeof org.description).toBe('string');
    });

    it('应该包含Web应用信息', () => {
      expect(SEO_CONFIG.structuredData).toHaveProperty('webApplication');
      
      const webApp = SEO_CONFIG.structuredData.webApplication;
      expect(webApp).toHaveProperty('name');
      expect(webApp).toHaveProperty('description');
      expect(webApp).toHaveProperty('applicationCategory');
      expect(webApp).toHaveProperty('operatingSystem');
      expect(webApp).toHaveProperty('browserRequirements');
      
      expect(webApp.applicationCategory).toBe('UtilitiesApplication');
      expect(webApp.operatingSystem).toBe('Any');
    });
  });

  describe('类型安全验证', () => {
    it('SEOConfigType类型应该正确推导', () => {
      // 这个测试主要验证TypeScript类型推导是否正确
      const config: SEOConfigType = SEO_CONFIG;
      expect(config).toBeDefined();
    });

    it('SupportedLanguage类型应该只包含支持的语言', () => {
      const zhCN: SupportedLanguage = 'zh-CN';
      const en: SupportedLanguage = 'en';
      
      expect(zhCN).toBe('zh-CN');
      expect(en).toBe('en');
      
      // TypeScript编译时会检查这些类型，运行时我们验证值
      expect(['zh-CN', 'en']).toContain(zhCN);
      expect(['zh-CN', 'en']).toContain(en);
    });

    it('PageKey类型应该包含所有页面键', () => {
      const pageKeys: PageKey[] = ['home', 'upload', 'split', 'export'];
      
      pageKeys.forEach(key => {
        expect(SEO_CONFIG.pages).toHaveProperty(key);
      });
    });
  });

  describe('配置完整性验证', () => {
    it('所有必要的配置项都应该存在', () => {
      const requiredTopLevelKeys = [
        'siteName',
        'siteUrl',
        'defaultLanguage',
        'supportedLanguages',
        'socialMedia',
        'analytics',
        'keywords',
        'defaultImages',
        'pages',
        'structuredData'
      ];

      requiredTopLevelKeys.forEach(key => {
        expect(SEO_CONFIG).toHaveProperty(key);
      });
    });

    it('配置值不应该为空', () => {
      expect(SEO_CONFIG.siteName.length).toBeGreaterThan(0);
      expect(SEO_CONFIG.siteUrl.length).toBeGreaterThan(0);
      expect(SEO_CONFIG.supportedLanguages.length).toBeGreaterThan(0);
      expect(SEO_CONFIG.keywords.primary.length).toBeGreaterThan(0);
      expect(SEO_CONFIG.keywords.secondary.length).toBeGreaterThan(0);
      expect(SEO_CONFIG.keywords.longTail.length).toBeGreaterThan(0);
    });

    it('URL格式应该正确', () => {
      expect(SEO_CONFIG.siteUrl).toMatch(/^https?:\/\/.+/);
      expect(SEO_CONFIG.structuredData.organization.url).toMatch(/^https?:\/\/.+/);
      expect(SEO_CONFIG.structuredData.organization.logo).toMatch(/^https?:\/\/.+/);
    });
  });

  describe('SEO最佳实践验证', () => {
    it('站点名称长度应该适合SEO', () => {
      expect(SEO_CONFIG.siteName.length).toBeLessThanOrEqual(60);
      expect(SEO_CONFIG.siteName.length).toBeGreaterThan(10);
    });

    it('描述长度应该适合SEO', () => {
      const description = SEO_CONFIG.structuredData.organization.description;
      expect(description.length).toBeLessThanOrEqual(160);
      expect(description.length).toBeGreaterThan(120);
    });

    it('关键词应该避免重复', () => {
      const allKeywords = [
        ...SEO_CONFIG.keywords.primary,
        ...SEO_CONFIG.keywords.secondary,
        ...SEO_CONFIG.keywords.longTail
      ];
      
      const uniqueKeywords = new Set(allKeywords);
      expect(uniqueKeywords.size).toBe(allKeywords.length);
    });
  });
});