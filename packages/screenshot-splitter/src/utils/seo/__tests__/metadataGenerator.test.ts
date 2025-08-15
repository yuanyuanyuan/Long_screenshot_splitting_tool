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
      
      expect(metadata.title).toBe('长截图分割工具 - 免费在线图片切割工具');
      expect(metadata.description).toContain('免费的在线长截图分割工具');
      expect(metadata.keywords).toContain('长截图分割');
      expect(metadata.canonicalUrl).toBe('https://screenshot-splitter.com/');
      expect(metadata.hreflang).toHaveProperty('zh-CN');
      expect(metadata.hreflang).toHaveProperty('en');
    });

    it('应该为首页生成正确的英文元数据', () => {
      const metadata = generatePageMetadata('home', {}, 'en');
      
      expect(metadata.title).toBe('Long Screenshot Splitter - Free Online Image Cutting Tool');
      expect(metadata.description).toContain('Free online long screenshot splitting tool');
      expect(metadata.keywords).toContain('screenshot splitter');
      expect(metadata.canonicalUrl).toBe('https://screenshot-splitter.com/');
    });

    it('应该为上传页面生成正确的元数据', () => {
      const metadata = generatePageMetadata('upload', {}, 'zh-CN');
      
      expect(metadata.title).toContain('上传截图');
      expect(metadata.description).toContain('上传您的长截图');
      expect(metadata.keywords).toContain('上传截图');
    });

    it('应该为分割页面生成正确的元数据', () => {
      const metadata = generatePageMetadata('split', {}, 'zh-CN');
      
      expect(metadata.title).toContain('图片分割');
      expect(metadata.description).toContain('调整分割设置');
      expect(metadata.keywords).toContain('图片分割');
    });

    it('应该为导出页面生成正确的元数据', () => {
      const metadata = generatePageMetadata('export', {}, 'zh-CN');
      
      expect(metadata.title).toContain('导出结果');
      expect(metadata.description).toContain('下载分割后的图片');
      expect(metadata.keywords).toContain('图片导出');
    });

    it('应该处理带上下文的动态内容', () => {
      const context: SEOContext = {
        sliceCount: 5,
        selectedCount: 3,
        fileName: 'test.png',
      };
      
      const metadata = generatePageMetadata('split', context, 'zh-CN');
      
      expect(metadata.title).toContain('5个切片');
      expect(metadata.description).toContain('当前已生成5个切片');
    });
  });

  describe('generateDynamicTitle', () => {
    it('应该为分割页面生成动态标题', () => {
      const context: SEOContext = { sliceCount: 3 };
      const title = generateDynamicTitle('split', context, 'zh-CN');
      
      expect(title).toContain('3个切片');
    });

    it('应该为导出页面生成动态标题', () => {
      const context: SEOContext = { selectedCount: 2 };
      const title = generateDynamicTitle('export', context, 'zh-CN');
      
      expect(title).toContain('2个选中');
    });

    it('应该处理无上下文的情况', () => {
      const title = generateDynamicTitle('home', {}, 'zh-CN');
      
      expect(title).toBe('长截图分割工具 - 免费在线图片切割工具');
    });

    it('应该处理英文动态标题', () => {
      const context: SEOContext = { sliceCount: 4 };
      const title = generateDynamicTitle('split', context, 'en');
      
      expect(title).toContain('4 slices');
    });
  });

  describe('generateDynamicDescription', () => {
    it('应该为分割页面生成动态描述', () => {
      const context: SEOContext = { sliceCount: 5, selectedCount: 3 };
      const description = generateDynamicDescription('split', context, 'zh-CN');
      
      expect(description).toContain('当前已生成5个切片');
      expect(description).toContain('已选择3个');
    });

    it('应该为导出页面生成动态描述', () => {
      const context: SEOContext = { selectedCount: 2, fileName: 'screenshot.png' };
      const description = generateDynamicDescription('export', context, 'zh-CN');
      
      expect(description).toContain('2个选中的切片');
      expect(description).toContain('screenshot.png');
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
      const validMetadata = {
        title: '有效的标题',
        description: '这是一个有效的描述，长度适中，包含了必要的信息来描述页面内容。',
        keywords: ['关键词1', '关键词2'],
        canonicalUrl: 'https://example.com/page',
        hreflang: { 'zh-CN': 'https://example.com/page?lang=zh-CN' },
      };
      
      const result = validateMetadata(validMetadata);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测标题过短的问题', () => {
      const metadata = {
        title: '短',
        description: '这是一个有效的描述，长度适中。',
        keywords: ['关键词'],
        canonicalUrl: 'https://example.com',
        hreflang: {},
      };
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('标题过短'))).toBe(true);
    });

    it('应该检测标题过长的问题', () => {
      const longTitle = 'A'.repeat(70);
      const metadata = {
        title: longTitle,
        description: '有效的描述',
        keywords: ['关键词'],
        canonicalUrl: 'https://example.com',
        hreflang: {},
      };
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('标题过长'))).toBe(true);
    });

    it('应该检测描述长度问题', () => {
      const shortDescription = '短描述';
      const metadata = {
        title: '有效标题',
        description: shortDescription,
        keywords: ['关键词'],
        canonicalUrl: 'https://example.com',
        hreflang: {},
      };
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('描述过短'))).toBe(true);
    });

    it('应该检测关键词过多的问题', () => {
      const tooManyKeywords = Array.from({ length: 12 }, (_, i) => `关键词${i}`);
      const metadata = {
        title: '有效标题',
        description: '这是一个有效的描述，长度适中。',
        keywords: tooManyKeywords,
        canonicalUrl: 'https://example.com',
        hreflang: {},
      };
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('关键词过多'))).toBe(true);
    });

    it('应该检测无效URL格式', () => {
      const metadata = {
        title: '有效标题',
        description: '这是一个有效的描述，长度适中。',
        keywords: ['关键词'],
        canonicalUrl: 'invalid-url',
        hreflang: {},
      };
      
      const result = validateMetadata(metadata);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('URL格式无效'))).toBe(true);
    });
  });

  describe('generateCanonicalUrl', () => {
    it('应该生成正确的规范URL', () => {
      const url = generateCanonicalUrl('home');
      expect(url).toBe('https://screenshot-splitter.com/');
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
      expect(mapping['zh-CN']).toContain('lang=zh-CN');
      expect(mapping['en']).toContain('lang=en');
    });

    it('应该为子页面生成正确的映射', () => {
      const mapping = generateHreflangMapping('upload');
      
      expect(mapping['zh-CN']).toContain('/upload?lang=zh-CN');
      expect(mapping['en']).toContain('/upload?lang=en');
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
      
      expect(metadata.title.length).toBeLessThan(60);
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
      
      expect(metadata.title).toContain('999999');
      expect(metadata.description).toContain('888888');
    });

    it('应该处理特殊字符的文件名', () => {
      const context: SEOContext = {
        fileName: 'test@#$%^&*().png',
      };
      
      const metadata = generatePageMetadata('export', context, 'zh-CN');
      
      expect(metadata.description).toContain('test@#$%^&*().png');
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内生成元数据', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        generatePageMetadata('home', { sliceCount: i }, 'zh-CN');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 100次调用应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it('应该正确缓存重复的元数据生成', () => {
      const context = { sliceCount: 5 };
      
      const metadata1 = generatePageMetadata('split', context, 'zh-CN');
      const metadata2 = generatePageMetadata('split', context, 'zh-CN');
      
      expect(metadata1).toEqual(metadata2);
    });
  });
});