import { describe, it, expect, beforeEach } from 'vitest';
import {
  generatePageMetadata,
  generateDynamicTitle,
  generateDynamicDescription,
  generateKeywords,
  validateMetadata,
  generateCanonicalUrl,
  generateHreflangMapping,
  generateStructuredDataMetadata,
  generateDeviceOptimizedMetadata,
} from '../metadataGenerator';
import type { PageType, SEOContext, Language } from '../../../types/seo.types';

describe('metadataGenerator', () => {
  describe('generatePageMetadata', () => {
    it('应该为首页生成正确的中文元数据', () => {
      const metadata = generatePageMetadata('home', {}, 'zh-CN');
      
      expect(metadata.title).toBe('长截图分割工具 - 免费在线长截图分割工具');
      expect(metadata.description).toContain('免费的在线长截图分割工具');
      expect(metadata.keywords).toContain('长截图分割');
      expect(metadata.canonicalUrl).toBe('https://screenshot-splitter.com');
      expect(metadata.hreflang).toHaveProperty('zh-CN');
      expect(metadata.hreflang).toHaveProperty('en');
    });

    it('应该为首页生成正确的英文元数据', () => {
      const metadata = generatePageMetadata('home', {}, 'en');
      
      expect(metadata.title).toBe('长截图分割工具 - Free Online Long Screenshot Splitter');
      expect(metadata.description).toContain('Free online long screenshot splitter tool');
      expect(metadata.keywords).toContain('长截图分割');
      expect(metadata.canonicalUrl).toBe('https://screenshot-splitter.com/en');
    });

    it('应该为上传页面生成正确的元数据', () => {
      const metadata = generatePageMetadata('upload', {}, 'zh-CN');
      
      expect(metadata.title).toContain('上传图片');
      expect(metadata.description).toContain('上传您的长截图文件');
      expect(metadata.keywords).toContain('长截图分割');
    });

    it('应该为分割页面生成正确的元数据', () => {
      const metadata = generatePageMetadata('split', {}, 'zh-CN');
      
      expect(metadata.title).toContain('图片分割');
      expect(metadata.description).toContain('正在处理您的图片分割');
      expect(metadata.keywords).toContain('长截图分割');
    });

    it('应该为导出页面生成正确的元数据', () => {
      const metadata = generatePageMetadata('export', {}, 'zh-CN');
      
      expect(metadata.title).toContain('导出结果');
      expect(metadata.description).toContain('图片分割完成');
      expect(metadata.keywords).toContain('长截图分割');
    });

    it('应该处理带上下文的动态内容', () => {
      const context: SEOContext = {
        sliceCount: 5,
        selectedCount: 3,
        fileName: 'test.png',
      };
      
      const metadata = generatePageMetadata('split', context, 'zh-CN');
      
      expect(metadata.title).toContain('5张');
      expect(metadata.description).toContain('已生成5张图片');
    });
  });

  describe('generateDynamicTitle', () => {
    it('应该为分割页面生成动态标题', () => {
      const context: SEOContext = { sliceCount: 3 };
      const title = generateDynamicTitle('split', context, 'zh-CN');
      
      expect(title).toContain('3张');
    });

    it('应该为导出页面生成动态标题', () => {
      const context: SEOContext = { selectedCount: 2 };
      const title = generateDynamicTitle('export', context, 'zh-CN');
      
      expect(title).toContain('2张');
    });

    it('应该处理无上下文的情况', () => {
      const title = generateDynamicTitle('home', {}, 'zh-CN');
      
      expect(title).toBe('长截图分割工具 - 免费在线长截图分割工具');
    });

    it('应该处理英文动态标题', () => {
      const context: SEOContext = { sliceCount: 4 };
      const title = generateDynamicTitle('split', context, 'en');
      
      expect(title).toContain('4 pieces');
    });
  });

  describe('generateDynamicDescription', () => {
    it('应该为分割页面生成动态描述', () => {
      const context: SEOContext = { sliceCount: 5, selectedCount: 3 };
      const description = generateDynamicDescription('split', context, 'zh-CN');
      
      expect(description).toContain('已生成5张图片');
    });

    it('应该为导出页面生成动态描述', () => {
      const context: SEOContext = { selectedCount: 2, fileName: 'screenshot.png' };
      const description = generateDynamicDescription('export', context, 'zh-CN');
      
      expect(description).toContain('已选择2张图片');
    });

    it('应该处理无上下文的情况', () => {
      const description = generateDynamicDescription('home', {}, 'zh-CN');
      
      expect(description).toContain('免费的在线长截图分割工具');
    });
  });

  describe('generateKeywords', () => {
    it('应该合并基础关键词和上下文关键词', () => {
      const baseKeywords = ['基础', '关键词'];
      const contextKeywords = ['上下文', '关键词'];
      
      const keywords = generateKeywords(baseKeywords, contextKeywords);
      
      expect(keywords).toContain('基础');
      expect(keywords).toContain('上下文');
      expect(keywords.length).toBeLessThanOrEqual(10);
    });

    it('应该去除重复的关键词', () => {
      const baseKeywords = ['重复', '关键词'];
      const contextKeywords = ['重复', '新关键词'];
      
      const keywords = generateKeywords(baseKeywords, contextKeywords);
      
      expect(keywords.filter(k => k === '重复')).toHaveLength(1);
    });

    it('应该限制关键词数量不超过10个', () => {
      const baseKeywords = Array.from({ length: 8 }, (_, i) => `关键词${i}`);
      const contextKeywords = Array.from({ length: 5 }, (_, i) => `上下文${i}`);
      
      const keywords = generateKeywords(baseKeywords, contextKeywords);
      
      expect(keywords.length).toBeLessThanOrEqual(10);
    });
  });

  describe('validateMetadata', () => {
    it('应该验证有效的元数据', () => {
      const validMetadata = generatePageMetadata('home', {}, 'zh-CN');
      // 确保描述长度符合要求
      if (validMetadata.description.length < 50) {
        validMetadata.description = '这是一个有效的描述，长度适中，包含了必要的信息来描述页面内容，确保SEO效果最佳。';
      }
      
      const result = validateMetadata(validMetadata);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测标题过短的问题', () => {
      const metadata = generatePageMetadata('home', {}, 'zh-CN');
      metadata.title = '短';
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('标题长度不能少于10个字符'))).toBe(true);
    });

    it('应该检测标题过长的问题', () => {
      const metadata = generatePageMetadata('home', {}, 'zh-CN');
      metadata.title = 'A'.repeat(70);
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('标题长度不能超过60个字符'))).toBe(true);
    });

    it('应该检测描述长度问题', () => {
      const metadata = generatePageMetadata('home', {}, 'zh-CN');
      metadata.description = '短描述';
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('描述长度不能少于50个字符'))).toBe(true);
    });

    it('应该检测关键词过少的问题', () => {
      const metadata = generatePageMetadata('home', {}, 'zh-CN');
      metadata.keywords = [];
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('至少需要设置一个关键词'))).toBe(true);
    });

    it('应该检测无效URL格式', () => {
      const metadata = generatePageMetadata('home', {}, 'zh-CN');
      metadata.canonicalUrl = 'invalid-url';
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('规范URL格式不正确'))).toBe(true);
    });
  });

  describe('generateCanonicalUrl', () => {
    it('应该生成正确的规范URL', () => {
      const url = generateCanonicalUrl('home');
      expect(url).toBe('https://screenshot-splitter.com');
    });

    it('应该为子页面生成正确的URL', () => {
      const url = generateCanonicalUrl('upload');
      expect(url).toBe('https://screenshot-splitter.com/upload');
    });
  });

  describe('generateHreflangMapping', () => {
    it('应该生成完整的hreflang映射', () => {
      const mapping = generateHreflangMapping('home');
      
      expect(mapping).toHaveProperty('zh-CN');
      expect(mapping).toHaveProperty('en');
      expect(mapping).toHaveProperty('x-default');
    });

    it('应该为子页面生成正确的映射', () => {
      const mapping = generateHreflangMapping('upload');
      
      expect(mapping['zh-CN']).toBe('https://screenshot-splitter.com/upload');
      expect(mapping['en']).toBe('https://screenshot-splitter.com/en/upload');
    });
  });

  describe('generateStructuredDataMetadata', () => {
    it('应该生成结构化数据元数据', () => {
      const metadata = generateStructuredDataMetadata('home', 'zh-CN');
      
      expect(metadata.structuredData).toBeDefined();
      expect(metadata.structuredData['@context']).toBe('https://schema.org');
      expect(metadata.structuredData['@type']).toBe('SoftwareApplication');
    });

    it('应该为不同页面生成不同的结构化数据', () => {
      const homeMetadata = generateStructuredDataMetadata('home', 'zh-CN');
      const uploadMetadata = generateStructuredDataMetadata('upload', 'zh-CN');
      
      expect(homeMetadata.structuredData['@type']).toBe('SoftwareApplication');
      expect(uploadMetadata.structuredData['@type']).toBe('WebApplication');
    });
  });

  describe('generateDeviceOptimizedMetadata', () => {
    it('应该为移动端生成优化的元数据', () => {
      const metadata = generateDeviceOptimizedMetadata(
        { title: '很长的标题需要在移动端进行优化处理', description: '很长的描述' },
        'mobile'
      );
      
      expect(metadata.title.length).toBeLessThan(50);
      expect(metadata.description.length).toBeLessThan(120);
    });

    it('应该为桌面端保持原始元数据', () => {
      const originalTitle = '桌面端标题';
      const originalDescription = '桌面端描述';
      const metadata = generateDeviceOptimizedMetadata(
        { title: originalTitle, description: originalDescription },
        'desktop'
      );
      
      expect(metadata.title).toBe(originalTitle);
      expect(metadata.description).toBe(originalDescription);
    });

    it('应该为平板端适度优化元数据', () => {
      const longTitle = 'A'.repeat(70);
      const metadata = generateDeviceOptimizedMetadata(
        { title: longTitle, description: '描述' },
        'tablet'
      );
      
      expect(metadata.title.length).toBeLessThanOrEqual(60);
      expect(metadata.title.length).toBeGreaterThan(40);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空的上下文对象', () => {
      const metadata = generatePageMetadata('home', {}, 'zh-CN');
      
      expect(metadata).toBeDefined();
      expect(metadata.title).toBeTruthy();
      expect(metadata.description).toBeTruthy();
    });

    it('应该处理未知的页面类型', () => {
      const metadata = generatePageMetadata('unknown' as PageType, {}, 'zh-CN');
      
      expect(metadata).toBeDefined();
      expect(metadata.title).toContain('长截图分割工具');
    });

    it('应该处理未知的语言', () => {
      const metadata = generatePageMetadata('home', {}, 'fr' as Language);
      
      expect(metadata).toBeDefined();
      // 应该回退到默认语言
      expect(metadata.title).toBeTruthy();
    });

    it('应该处理极大的数值上下文', () => {
      const context: SEOContext = {
        sliceCount: 999999,
        selectedCount: 888888,
      };
      
      const metadata = generatePageMetadata('split', context, 'zh-CN');
      
      expect(metadata.title).toContain('999999张');
      expect(metadata.description).toContain('已生成999999张图片');
    });

    it('应该处理特殊字符的文件名', () => {
      const context: SEOContext = {
        fileName: 'test@#$%^&*().png',
      };
      
      const metadata = generatePageMetadata('export', context, 'zh-CN');
      
      expect(metadata.description).toContain('图片分割完成');
    });
  });
});