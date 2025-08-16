/**
 * SEO类型定义的单元测试
 */

import { describe, it, expect } from 'vitest';
import type {
  SEOMetadata,
  PageSEO,
  SEOConfig,
  WebApplicationSchema,
  SoftwareApplicationSchema,
  BreadcrumbSchema,
  FAQSchema,
  HowToSchema,
  PerformanceMetrics,
  SEOPerformanceReport,
  SEOIssue,
  KeywordDensity,
  ContentOptimizationResult,
  SEOManagerProps,
  StructuredDataGenerator,
  PerformanceOptimizer,
  ContentOptimizer,
  SEOMonitor,
  StructuredDataType,
  SEOComponentProps,
  SEOAnalyticsEvent,
} from '../seo.types';

describe('SEO类型定义测试', () => {
  describe('基础SEO接口测试', () => {
    it('SEOMetadata接口应该包含所有必要字段', () => {
      const mockMetadata: SEOMetadata = {
        title: '测试标题',
        description: '测试描述',
        keywords: ['关键词1', '关键词2'],
        ogTitle: 'OG标题',
        ogDescription: 'OG描述',
        ogImage: 'https://example.com/image.jpg',
        ogType: 'website',
        ogUrl: 'https://example.com',
        twitterCard: 'summary_large_image',
        canonicalUrl: 'https://example.com',
        hreflang: {
          'zh-CN': 'https://example.com/zh-cn',
          en: 'https://example.com/en',
        },
      };

      expect(mockMetadata.title).toBe('测试标题');
      expect(mockMetadata.description).toBe('测试描述');
      expect(Array.isArray(mockMetadata.keywords)).toBe(true);
      expect(mockMetadata.ogType).toBe('website');
      expect(mockMetadata.twitterCard).toBe('summary_large_image');
      expect(typeof mockMetadata.hreflang).toBe('object');
    });

    it('PageSEO接口应该支持多语言配置', () => {
      const mockPageSEO: PageSEO = {
        path: '/test',
        title: {
          'zh-CN': '中文标题',
          en: 'English Title',
        },
        description: {
          'zh-CN': '中文描述',
          en: 'English Description',
        },
        keywords: ['keyword1', 'keyword2'],
        priority: 0.8,
        changeFrequency: 'weekly',
        lastModified: new Date(),
      };

      expect(mockPageSEO.title['zh-CN']).toBe('中文标题');
      expect(mockPageSEO.title['en']).toBe('English Title');
      expect(mockPageSEO.changeFrequency).toBe('weekly');
      expect(mockPageSEO.priority).toBe(0.8);
    });

    it('SEOConfig接口应该包含完整配置', () => {
      const mockConfig: SEOConfig = {
        siteName: '测试站点',
        siteUrl: 'https://test.com',
        defaultLanguage: 'zh-CN',
        supportedLanguages: ['zh-CN', 'en'],
        socialMedia: {
          twitter: '@test',
          facebook: 'test',
          linkedin: 'test',
        },
        analytics: {
          googleAnalyticsId: 'GA-TEST',
          googleSearchConsoleId: 'GSC-TEST',
        },
        keywords: {
          primary: ['主关键词'],
          secondary: ['次关键词'],
          longTail: ['长尾关键词'],
        },
        defaultImages: {
          ogImage: '/og.png',
          twitterImage: '/twitter.png',
          favicon: '/favicon.ico',
          appleTouchIcon: '/apple-touch-icon.png',
        },
      };

      expect(mockConfig.siteName).toBe('测试站点');
      expect(Array.isArray(mockConfig.supportedLanguages)).toBe(true);
      expect(mockConfig.socialMedia).toHaveProperty('twitter');
      expect(mockConfig.analytics).toHaveProperty('googleAnalyticsId');
    });
  });

  describe('结构化数据Schema测试', () => {
    it('WebApplicationSchema应该符合Schema.org规范', () => {
      const mockSchema: WebApplicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: '测试应用',
        description: '测试描述',
        url: 'https://test.com',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      };

      expect(mockSchema['@context']).toBe('https://schema.org');
      expect(mockSchema['@type']).toBe('WebApplication');
      expect(mockSchema.offers['@type']).toBe('Offer');
      expect(mockSchema.offers.price).toBe('0');
    });

    it('BreadcrumbSchema应该包含正确的列表结构', () => {
      const mockBreadcrumb: BreadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '首页',
            item: 'https://test.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '上传',
            item: 'https://test.com/upload',
          },
        ],
      };

      expect(mockBreadcrumb['@type']).toBe('BreadcrumbList');
      expect(Array.isArray(mockBreadcrumb.itemListElement)).toBe(true);
      expect(mockBreadcrumb.itemListElement[0].position).toBe(1);
      expect(mockBreadcrumb.itemListElement[1].position).toBe(2);
    });

    it('FAQSchema应该包含问答结构', () => {
      const mockFAQ: FAQSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '如何使用这个工具？',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '上传图片，然后点击分割按钮。',
            },
          },
        ],
      };

      expect(mockFAQ['@type']).toBe('FAQPage');
      expect(Array.isArray(mockFAQ.mainEntity)).toBe(true);
      expect(mockFAQ.mainEntity[0]['@type']).toBe('Question');
      expect(mockFAQ.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    });
  });

  describe('性能监控接口测试', () => {
    it('PerformanceMetrics应该包含Core Web Vitals指标', () => {
      const mockMetrics: PerformanceMetrics = {
        fcp: 1200,
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        ttfb: 800,
        inp: 200,
      };

      expect(typeof mockMetrics.fcp).toBe('number');
      expect(typeof mockMetrics.lcp).toBe('number');
      expect(typeof mockMetrics.fid).toBe('number');
      expect(typeof mockMetrics.cls).toBe('number');
      expect(typeof mockMetrics.ttfb).toBe('number');
      expect(mockMetrics.inp).toBeDefined();
    });

    it('SEOPerformanceReport应该包含完整的报告信息', () => {
      const mockReport: SEOPerformanceReport = {
        url: 'https://test.com',
        timestamp: new Date(),
        metrics: {
          fcp: 1200,
          lcp: 2500,
          fid: 100,
          cls: 0.1,
          ttfb: 800,
        },
        seoScore: 85,
        issues: [],
        recommendations: ['优化图片加载', '减少JavaScript执行时间'],
      };

      expect(mockReport.url).toBe('https://test.com');
      expect(mockReport.seoScore).toBe(85);
      expect(Array.isArray(mockReport.issues)).toBe(true);
      expect(Array.isArray(mockReport.recommendations)).toBe(true);
    });

    it('SEOIssue应该包含问题分类和严重程度', () => {
      const mockIssue: SEOIssue = {
        type: 'warning',
        category: 'metadata',
        message: '缺少meta描述',
        element: 'meta[name="description"]',
        severity: 'medium',
        fix: '添加meta描述标签',
      };

      expect(['error', 'warning', 'info']).toContain(mockIssue.type);
      expect(['metadata', 'structured-data', 'performance', 'content', 'technical']).toContain(
        mockIssue.category
      );
      expect(['low', 'medium', 'high', 'critical']).toContain(mockIssue.severity);
    });
  });

  describe('内容优化接口测试', () => {
    it('KeywordDensity应该包含关键词分析数据', () => {
      const mockDensity: KeywordDensity = {
        长截图分割: {
          count: 5,
          density: 2.5,
          isOptimal: true,
          positions: [10, 25, 50, 75, 90],
        },
        图片处理: {
          count: 3,
          density: 1.5,
          isOptimal: true,
          positions: [15, 35, 80],
        },
      };

      expect(mockDensity['长截图分割'].count).toBe(5);
      expect(mockDensity['长截图分割'].density).toBe(2.5);
      expect(mockDensity['长截图分割'].isOptimal).toBe(true);
      expect(Array.isArray(mockDensity['长截图分割'].positions)).toBe(true);
    });

    it('ContentOptimizationResult应该包含完整的内容分析', () => {
      const mockResult: ContentOptimizationResult = {
        title: {
          length: 45,
          isOptimal: true,
          suggestions: [],
        },
        description: {
          length: 155,
          isOptimal: true,
          suggestions: [],
        },
        headings: {
          h1Count: 1,
          h2Count: 3,
          h3Count: 5,
          structure: [
            {
              level: 1,
              text: '主标题',
              hasKeywords: true,
            },
          ],
          issues: [],
        },
        keywords: {},
        readability: {
          score: 75,
          level: '中等',
          suggestions: ['使用更简单的词汇'],
        },
        internalLinks: {
          count: 5,
          links: [
            {
              text: '上传页面',
              href: '/upload',
              isOptimal: true,
            },
          ],
        },
      };

      expect(mockResult.title.length).toBe(45);
      expect(mockResult.headings.h1Count).toBe(1);
      expect(mockResult.readability.score).toBe(75);
      expect(mockResult.internalLinks.count).toBe(5);
    });
  });

  describe('组件Props接口测试', () => {
    it('SEOManagerProps应该包含页面和语言配置', () => {
      const mockProps: SEOManagerProps = {
        page: 'home',
        imageCount: 5,
        selectedCount: 3,
        language: 'zh-CN',
        customMetadata: {
          title: '自定义标题',
        },
        enableStructuredData: true,
        enablePerformanceMonitoring: true,
      };

      expect(['home', 'upload', 'split', 'export']).toContain(mockProps.page);
      expect(['zh-CN', 'en']).toContain(mockProps.language);
      expect(mockProps.imageCount).toBe(5);
      expect(mockProps.selectedCount).toBe(3);
    });
  });

  describe('服务接口测试', () => {
    it('StructuredDataGenerator接口应该定义所有生成方法', () => {
      // 这里我们测试接口的结构，实际实现会在具体的类中
      const mockGenerator: Partial<StructuredDataGenerator> = {
        generateWebApplication: () => ({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Test',
          description: 'Test',
          url: 'https://test.com',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          browserRequirements: 'JavaScript',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        }),
      };

      expect(typeof mockGenerator.generateWebApplication).toBe('function');

      if (mockGenerator.generateWebApplication) {
        const result = mockGenerator.generateWebApplication();
        expect(result['@type']).toBe('WebApplication');
      }
    });

    it('SEOMonitor接口应该定义监控方法', () => {
      const mockMonitor: Partial<SEOMonitor> = {
        checkMetaTags: () => true,
        checkStructuredData: () => true,
      };

      expect(typeof mockMonitor.checkMetaTags).toBe('function');
      expect(typeof mockMonitor.checkStructuredData).toBe('function');

      if (mockMonitor.checkMetaTags && mockMonitor.checkStructuredData) {
        expect(mockMonitor.checkMetaTags()).toBe(true);
        expect(mockMonitor.checkStructuredData()).toBe(true);
      }
    });
  });

  describe('联合类型测试', () => {
    it('StructuredDataType应该包含所有Schema类型', () => {
      const webAppSchema: StructuredDataType = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Test',
        description: 'Test',
        url: 'https://test.com',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      };

      const breadcrumbSchema: StructuredDataType = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [],
      };

      expect(webAppSchema['@type']).toBe('WebApplication');
      expect(breadcrumbSchema['@type']).toBe('BreadcrumbList');
    });

    it('SEOAnalyticsEvent应该包含事件分类', () => {
      const mockEvent: SEOAnalyticsEvent = {
        name: 'seo_optimization_complete',
        category: 'SEO',
        value: 100,
        metadata: {
          page: 'home',
          optimizations: ['meta-tags', 'structured-data'],
        },
      };

      expect(['SEO', 'Performance', 'User Interaction']).toContain(mockEvent.category);
      expect(mockEvent.name).toBe('seo_optimization_complete');
      expect(mockEvent.value).toBe(100);
      expect(typeof mockEvent.metadata).toBe('object');
    });
  });

  describe('类型兼容性测试', () => {
    it('SEOComponentProps应该与SEOManagerProps兼容', () => {
      const props: SEOManagerProps = {
        page: 'upload',
        language: 'en',
      };

      const componentProps: SEOComponentProps = props;

      expect(componentProps.page).toBe('upload');
      expect(componentProps.language).toBe('en');
    });
  });
});
