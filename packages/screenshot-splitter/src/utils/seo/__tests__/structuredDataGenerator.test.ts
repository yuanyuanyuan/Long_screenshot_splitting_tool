import {
  StructuredDataGenerator,
  structuredDataGenerator,
  generateStructuredData,
  generatePageStructuredData,
  validateStructuredData,
} from '../structuredDataGenerator';
import type {
  WebApplicationSchema,
  SoftwareApplicationSchema,
  BreadcrumbSchema,
  FAQSchema,
  HowToSchema,
  StructuredDataType,
  PageType,
  Language,
  SEOContext,
} from '../../../types/seo.types';

describe('StructuredDataGenerator', () => {
  let generator: StructuredDataGenerator;

  beforeEach(() => {
    generator = new StructuredDataGenerator();
  });

  describe('WebApplication Schema生成', () => {
    it('应该生成有效的WebApplication结构化数据', () => {
      const result = generator.generateWebApplication('home', 'zh-CN');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('WebApplication');
      expect(result.name).toBe('长截图分割工具');
      expect(result.description).toContain('免费的在线长截图分割工具');
      expect(result.url).toBe('https://screenshot-splitter.com');
      expect(result.applicationCategory).toBe('UtilitiesApplication');
      expect(result.operatingSystem).toBe('Web Browser');
      expect(result.browserRequirements).toBe('Requires JavaScript. Requires HTML5.');
    });

    it('应该支持英文内容生成', () => {
      const result = generator.generateWebApplication('home', 'en');

      expect(result.name).toBe('Long Screenshot Splitter');
      expect(result.description).toContain('Free online long screenshot splitting tool');
    });

    it('应该根据页面类型生成不同的描述', () => {
      const homeResult = generator.generateWebApplication('home', 'zh-CN');
      const uploadResult = generator.generateWebApplication('upload', 'zh-CN');
      const splitResult = generator.generateWebApplication('split', 'zh-CN');
      const exportResult = generator.generateWebApplication('export', 'zh-CN');

      expect(homeResult.description).toContain('免费的在线长截图分割工具');
      expect(uploadResult.description).toContain('上传您的长截图文件');
      expect(splitResult.description).toContain('调整分割设置并预览切片效果');
      expect(exportResult.description).toContain('下载分割后的图片切片');
    });

    it('应该根据上下文动态调整内容', () => {
      const context: SEOContext = {
        sliceCount: 5,
        selectedCount: 3,
      };

      const splitResult = generator.generateWebApplication('split', 'zh-CN', context);
      const exportResult = generator.generateWebApplication('export', 'zh-CN', context);

      expect(splitResult.description).toContain('当前已生成5个切片');
      expect(exportResult.description).toContain('已选择3个切片');
    });

    it('应该包含正确的价格信息', () => {
      const result = generator.generateWebApplication('home', 'zh-CN');

      expect(result.offers).toEqual({
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      });
    });

    it('应该包含功能特性列表', () => {
      const result = generator.generateWebApplication('home', 'zh-CN');

      expect(result.featureList).toBeInstanceOf(Array);
      expect(result.featureList).toContain('长截图自动分割');
      expect(result.featureList).toContain('多格式支持（PNG、JPG、JPEG）');
      expect(result.featureList).toContain('批量导出功能');
      expect(result.featureList).toContain('完全免费使用');
    });

    it('应该包含截图和评分信息', () => {
      const result = generator.generateWebApplication('home', 'zh-CN');

      expect(result.screenshot).toBeInstanceOf(Array);
      expect(result.screenshot?.length).toBeGreaterThan(0);
      expect(result.aggregateRating).toEqual({
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
      });
    });
  });

  describe('SoftwareApplication Schema生成', () => {
    it('应该生成有效的SoftwareApplication结构化数据', () => {
      const result = generator.generateSoftwareApplication('zh-CN');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('SoftwareApplication');
      expect(result.name).toBe('长截图分割工具');
      expect(result.operatingSystem).toBe('Web Browser');
      expect(result.applicationCategory).toBe('UtilitiesApplication');
      expect(result.softwareVersion).toBe('2.0.0');
      expect(result.fileSize).toBe('< 1MB');
      expect(result.downloadUrl).toBe('https://screenshot-splitter.com');
    });

    it('应该支持英文内容', () => {
      const result = generator.generateSoftwareApplication('en');

      expect(result.name).toBe('Long Screenshot Splitter');
      expect(result.description).toContain('Free online long screenshot splitting tool');
    });

    it('应该包含正确的价格和评分信息', () => {
      const result = generator.generateSoftwareApplication('zh-CN');

      expect(result.offers).toEqual({
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      });

      expect(result.aggregateRating).toEqual({
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
      });
    });
  });

  describe('Breadcrumb Schema生成', () => {
    it('应该生成首页面包屑', () => {
      const result = generator.generateBreadcrumb('home', 'zh-CN');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('BreadcrumbList');
      expect(result.itemListElement).toHaveLength(1);
      expect(result.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: 'https://screenshot-splitter.com',
      });
    });

    it('应该生成上传页面包屑', () => {
      const result = generator.generateBreadcrumb('upload', 'zh-CN');

      expect(result.itemListElement).toHaveLength(2);
      expect(result.itemListElement[0].name).toBe('首页');
      expect(result.itemListElement[1].name).toBe('上传图片');
    });

    it('应该生成分割页面包屑', () => {
      const result = generator.generateBreadcrumb('split', 'zh-CN');

      expect(result.itemListElement).toHaveLength(3);
      expect(result.itemListElement[0].name).toBe('首页');
      expect(result.itemListElement[1].name).toBe('上传图片');
      expect(result.itemListElement[2].name).toBe('分割设置');
    });

    it('应该生成导出页面包屑', () => {
      const result = generator.generateBreadcrumb('export', 'zh-CN');

      expect(result.itemListElement).toHaveLength(4);
      expect(result.itemListElement[0].name).toBe('首页');
      expect(result.itemListElement[1].name).toBe('上传图片');
      expect(result.itemListElement[2].name).toBe('分割设置');
      expect(result.itemListElement[3].name).toBe('导出结果');
    });

    it('应该支持英文面包屑', () => {
      const result = generator.generateBreadcrumb('upload', 'en');

      expect(result.itemListElement[0].name).toBe('Home');
      expect(result.itemListElement[1].name).toBe('Upload Image');
    });

    it('应该包含正确的URL', () => {
      const result = generator.generateBreadcrumb('split', 'zh-CN');

      expect(result.itemListElement[0].item).toBe('https://screenshot-splitter.com');
      expect(result.itemListElement[1].item).toBe('https://screenshot-splitter.com/upload');
      expect(result.itemListElement[2].item).toBe('https://screenshot-splitter.com/split');
    });
  });

  describe('FAQ Schema生成', () => {
    it('应该生成有效的FAQ结构化数据', () => {
      const result = generator.generateFAQ('zh-CN');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('FAQPage');
      expect(result.mainEntity).toBeInstanceOf(Array);
      expect(result.mainEntity.length).toBeGreaterThan(0);
    });

    it('应该包含正确的问答格式', () => {
      const result = generator.generateFAQ('zh-CN');
      const firstQuestion = result.mainEntity[0];

      expect(firstQuestion['@type']).toBe('Question');
      expect(firstQuestion.name).toBeTruthy();
      expect(firstQuestion.acceptedAnswer).toEqual({
        '@type': 'Answer',
        text: expect.any(String),
      });
    });

    it('应该包含常见问题', () => {
      const result = generator.generateFAQ('zh-CN');
      const questions = result.mainEntity.map(q => q.name);

      expect(questions).toContain('这个工具支持哪些图片格式？');
      expect(questions).toContain('分割后的图片质量会降低吗？');
      expect(questions).toContain('有文件大小限制吗？');
      expect(questions).toContain('这个工具是免费的吗？');
    });

    it('应该支持英文FAQ', () => {
      const result = generator.generateFAQ('en');
      const questions = result.mainEntity.map(q => q.name);

      expect(questions).toContain('What image formats does this tool support?');
      expect(questions).toContain('Will the image quality decrease after splitting?');
      expect(questions).toContain('Is this tool free?');
    });

    it('应该包含详细的回答', () => {
      const result = generator.generateFAQ('zh-CN');
      const answers = result.mainEntity.map(q => q.acceptedAnswer.text);

      expect(answers.some(answer => answer.includes('PNG、JPG、JPEG'))).toBe(true);
      expect(answers.some(answer => answer.includes('无损分割技术'))).toBe(true);
      expect(answers.some(answer => answer.includes('完全免费'))).toBe(true);
    });
  });

  describe('HowTo Schema生成', () => {
    it('应该生成有效的HowTo结构化数据', () => {
      const result = generator.generateHowTo('zh-CN');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('HowTo');
      expect(result.name).toBe('如何使用长截图分割工具');
      expect(result.description).toBeTruthy();
      expect(result.totalTime).toBe('PT5M');
    });

    it('应该包含成本信息', () => {
      const result = generator.generateHowTo('zh-CN');

      expect(result.estimatedCost).toEqual({
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: '0',
      });
    });

    it('应该包含所需材料和工具', () => {
      const result = generator.generateHowTo('zh-CN');

      expect(result.supply).toBeInstanceOf(Array);
      expect(result.tool).toBeInstanceOf(Array);
      expect(result.supply?.some(s => s.name === '长截图文件')).toBe(true);
      expect(result.tool?.some(t => t.name === '长截图分割工具')).toBe(true);
    });

    it('应该包含详细的步骤', () => {
      const result = generator.generateHowTo('zh-CN');

      expect(result.step).toBeInstanceOf(Array);
      expect(result.step).toHaveLength(4);

      const stepNames = result.step.map(s => s.name);
      expect(stepNames).toContain('上传图片');
      expect(stepNames).toContain('自动分割');
      expect(stepNames).toContain('选择切片');
      expect(stepNames).toContain('导出下载');
    });

    it('应该包含步骤的详细信息', () => {
      const result = generator.generateHowTo('zh-CN');
      const firstStep = result.step[0];

      expect(firstStep['@type']).toBe('HowToStep');
      expect(firstStep.name).toBe('上传图片');
      expect(firstStep.text).toContain('点击上传按钮或拖拽图片文件');
      expect(firstStep.image).toBeTruthy();
      expect(firstStep.url).toBe('https://screenshot-splitter.com/upload');
    });

    it('应该支持英文HowTo', () => {
      const result = generator.generateHowTo('en');

      expect(result.name).toBe('How to Use Long Screenshot Splitter');
      expect(result.description).toContain('Complete long screenshot splitting in 4 simple steps');

      const stepNames = result.step.map(s => s.name);
      expect(stepNames).toContain('Upload Image');
      expect(stepNames).toContain('Automatic Splitting');
      expect(stepNames).toContain('Select Slices');
      expect(stepNames).toContain('Export Download');
    });
  });

  describe('综合结构化数据生成', () => {
    it('应该根据指定类型生成结构化数据', () => {
      const result = generator.generateStructuredData(
        'home',
        'zh-CN',
        {},
        ['webApp', 'breadcrumb']
      );

      expect(result).toHaveLength(2);
      expect(result[0]['@type']).toBe('WebApplication');
      expect(result[1]['@type']).toBe('BreadcrumbList');
    });

    it('应该为不同页面生成相应的结构化数据组合', () => {
      const homeData = generator.generatePageStructuredData('home', 'zh-CN');
      const uploadData = generator.generatePageStructuredData('upload', 'zh-CN');
      const splitData = generator.generatePageStructuredData('split', 'zh-CN');
      const exportData = generator.generatePageStructuredData('export', 'zh-CN');

      // 首页：SoftwareApplication + Breadcrumb + FAQ
      expect(homeData).toHaveLength(3);
      expect(homeData.map(d => d['@type'])).toEqual(['SoftwareApplication', 'BreadcrumbList', 'FAQPage']);

      // 上传页：WebApplication + Breadcrumb + HowTo
      expect(uploadData).toHaveLength(3);
      expect(uploadData.map(d => d['@type'])).toEqual(['WebApplication', 'BreadcrumbList', 'HowTo']);

      // 分割页：WebApplication + Breadcrumb
      expect(splitData).toHaveLength(2);
      expect(splitData.map(d => d['@type'])).toEqual(['WebApplication', 'BreadcrumbList']);

      // 导出页：WebApplication + Breadcrumb
      expect(exportData).toHaveLength(2);
      expect(exportData.map(d => d['@type'])).toEqual(['WebApplication', 'BreadcrumbList']);
    });

    it('应该支持默认类型生成', () => {
      const result = generator.generateStructuredData('home', 'zh-CN');

      expect(result).toHaveLength(1);
      expect(result[0]['@type']).toBe('WebApplication');
    });
  });

  describe('数据验证功能', () => {
    it('应该验证有效的WebApplication数据', () => {
      const data = generator.generateWebApplication('home', 'zh-CN');
      const validation = generator.validateStructuredData(data);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该验证有效的BreadcrumbList数据', () => {
      const data = generator.generateBreadcrumb('home', 'zh-CN');
      const validation = generator.validateStructuredData(data);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该验证有效的FAQPage数据', () => {
      const data = generator.generateFAQ('zh-CN');
      const validation = generator.validateStructuredData(data);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该验证有效的HowTo数据', () => {
      const data = generator.generateHowTo('zh-CN');
      const validation = generator.validateStructuredData(data);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该检测缺少@context的错误', () => {
      const invalidData = {
        '@type': 'WebApplication',
        name: '测试应用',
      } as any;

      const validation = generator.validateStructuredData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('缺少@context字段');
    });

    it('应该检测缺少@type的错误', () => {
      const invalidData = {
        '@context': 'https://schema.org',
        name: '测试应用',
      } as any;

      const validation = generator.validateStructuredData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('缺少@type字段');
    });

    it('应该检测错误的@context值', () => {
      const invalidData = {
        '@context': 'https://example.com',
        '@type': 'WebApplication',
        name: '测试应用',
      } as any;

      const validation = generator.validateStructuredData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('@context必须是https://schema.org');
    });

    it('应该检测WebApplication缺少必需字段', () => {
      const invalidData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
      } as any;

      const validation = generator.validateStructuredData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('缺少name字段');
      expect(validation.errors).toContain('缺少description字段');
      expect(validation.errors).toContain('缺少offers字段');
    });

    it('应该检测BreadcrumbList缺少项目', () => {
      const invalidData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [],
      } as any;

      const validation = generator.validateStructuredData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('面包屑导航必须包含至少一个项目');
    });

    it('应该检测FAQPage缺少问题', () => {
      const invalidData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [],
      } as any;

      const validation = generator.validateStructuredData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('FAQ页面必须包含至少一个问题');
    });

    it('应该检测HowTo缺少步骤', () => {
      const invalidData = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: '测试教程',
        step: [],
      } as any;

      const validation = generator.validateStructuredData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('HowTo必须包含至少一个步骤');
    });

    it('应该检测URL格式警告', () => {
      const dataWithInvalidUrl = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: '测试应用',
        description: '测试描述',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'invalid-url',
      } as any;

      const validation = generator.validateStructuredData(dataWithInvalidUrl);

      expect(validation.warnings.some(w => w.includes('URL格式可能不正确'))).toBe(true);
    });
  });

  describe('单例实例和便捷函数', () => {
    it('应该提供单例实例', () => {
      expect(structuredDataGenerator).toBeInstanceOf(StructuredDataGenerator);
    });

    it('应该提供便捷的生成函数', () => {
      const result = generateStructuredData('home', 'zh-CN', {}, ['webApp']);

      expect(result).toHaveLength(1);
      expect(result[0]['@type']).toBe('WebApplication');
    });

    it('应该提供页面特定的生成函数', () => {
      const result = generatePageStructuredData('home', 'zh-CN');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]['@type']).toBeTruthy();
    });

    it('应该提供验证函数', () => {
      const data = generateStructuredData('home', 'zh-CN')[0];
      const validation = validateStructuredData(data);

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理未知页面类型', () => {
      const result = generator.generatePageStructuredData('unknown' as PageType, 'zh-CN');

      expect(result).toHaveLength(1);
      expect(result[0]['@type']).toBe('WebApplication');
    });

    it('应该处理空的上下文', () => {
      const result = generator.generateWebApplication('home', 'zh-CN', {});

      expect(result).toBeTruthy();
      expect(result['@type']).toBe('WebApplication');
    });

    it('应该处理部分上下文信息', () => {
      const context: SEOContext = { sliceCount: 5 };
      const result = generator.generateWebApplication('split', 'zh-CN', context);

      expect(result.description).toContain('当前已生成5个切片');
    });

    it('应该处理无效的语言代码', () => {
      const result = generator.generateWebApplication('home', 'invalid' as Language);

      // 应该回退到默认行为或处理错误
      expect(result).toBeTruthy();
      expect(result['@type']).toBe('WebApplication');
    });
  });

  describe('性能和内存测试', () => {
    it('应该能够处理大量数据生成', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        generator.generatePageStructuredData('home', 'zh-CN', { sliceCount: i });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 应该在合理时间内完成（1秒内）
      expect(duration).toBeLessThan(1000);
    });

    it('应该能够处理大量验证操作', () => {
      const data = generator.generatePageStructuredData('home', 'zh-CN');
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        data.forEach(item => generator.validateStructuredData(item));
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 验证操作应该很快（500ms内）
      expect(duration).toBeLessThan(500);
    });
  });
});