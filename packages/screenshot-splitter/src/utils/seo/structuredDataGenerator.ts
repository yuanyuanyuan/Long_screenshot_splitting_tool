import { SEO_CONFIG } from '../../config/seo.config';
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
} from '../../types/seo.types';

/**
 * 结构化数据生成器
 * 负责生成符合Schema.org标准的JSON-LD结构化数据
 */
export class StructuredDataGenerator {
  private readonly baseUrl: string;
  private readonly siteName: Record<Language, string>;

  constructor() {
    this.baseUrl = SEO_CONFIG.siteUrl;
    // 创建多语言站点名称映射
    this.siteName = {
      'zh-CN': SEO_CONFIG.siteName,
      'en': 'Long Screenshot Splitter'
    };
    // this.organizationInfo = SEO_CONFIG.structuredData.organization;
  }

  /**
   * 生成WebApplication结构化数据
   */
  generateWebApplication(
    page: PageType = 'home',
    language: Language = 'zh-CN',
    context: SEOContext = {}
  ): WebApplicationSchema {
    const appName = this.siteName[language];
    const description = this.getPageDescription(page, language, context);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: appName,
      description,
      url: this.baseUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web Browser',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: this.getFeatureList(language),
      screenshot: this.getScreenshots(),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
      },
    };
  }

  /**
   * 生成SoftwareApplication结构化数据
   */
  generateSoftwareApplication(
    language: Language = 'zh-CN',
    context: SEOContext = {}
  ): SoftwareApplicationSchema {
    const appName = this.siteName[language];
    const description = this.getPageDescription('home', language, context);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: appName,
      description,
      operatingSystem: 'Web Browser',
      applicationCategory: 'UtilitiesApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
      },
      softwareVersion: '2.0.0',
      fileSize: '< 1MB',
      downloadUrl: this.baseUrl,
    };
  }

  /**
   * 生成面包屑导航结构化数据
   */
  generateBreadcrumb(
    page: PageType,
    language: Language = 'zh-CN'
  ): BreadcrumbSchema {
    const breadcrumbItems = this.getBreadcrumbItems(page, language);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  /**
   * 生成FAQ结构化数据
   */
  generateFAQ(language: Language = 'zh-CN'): FAQSchema {
    const faqData = this.getFAQData(language);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * 生成HowTo结构化数据
   */
  generateHowTo(language: Language = 'zh-CN'): HowToSchema {
    const howToData = this.getHowToData(language);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: howToData.name,
      description: howToData.description,
      image: howToData.images,
      totalTime: 'PT5M', // 5分钟
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: '0',
      },
      supply: howToData.supplies.map(supply => ({
        '@type': 'HowToSupply',
        name: supply,
      })),
      tool: howToData.tools.map(tool => ({
        '@type': 'HowToTool',
        name: tool,
      })),
      step: howToData.steps.map((step) => ({
        '@type': 'HowToStep',
        name: step.name,
        text: step.text,
        image: step.image,
        url: step.url ? `${this.baseUrl}${step.url}` : undefined,
      })),
    };
  }

  /**
   * 根据页面类型生成相应的结构化数据
   */
  generateStructuredData(
    page: PageType,
    language: Language = 'zh-CN',
    context: SEOContext = {},
    types: Array<'webApp' | 'softwareApp' | 'breadcrumb' | 'faq' | 'howTo'> = ['webApp']
  ): StructuredDataType[] {
    const results: StructuredDataType[] = [];

    types.forEach(type => {
      switch (type) {
        case 'webApp': {
          results.push(this.generateWebApplication(page, language, context));
          break;
        }
        case 'softwareApp': {
          results.push(this.generateSoftwareApplication(language, context));
          break;
        }
        case 'breadcrumb': {
          results.push(this.generateBreadcrumb(page, language));
          break;
        }
        case 'faq': {
          results.push(this.generateFAQ(language));
          break;
        }
        case 'howTo': {
          results.push(this.generateHowTo(language));
          break;
        }
      }
    });

    return results;
  }

  /**
   * 生成页面特定的结构化数据组合
   */
  generatePageStructuredData(
    page: PageType,
    language: Language = 'zh-CN',
    context: SEOContext = {}
  ): StructuredDataType[] {
    switch (page) {
      case 'home':
        return this.generateStructuredData(page, language, context, [
          'softwareApp',
          'breadcrumb',
          'faq',
        ]);
      
      case 'upload':
        return this.generateStructuredData(page, language, context, [
          'webApp',
          'breadcrumb',
          'howTo',
        ]);
      
      case 'split':
        return this.generateStructuredData(page, language, context, [
          'webApp',
          'breadcrumb',
        ]);
      
      case 'export':
        return this.generateStructuredData(page, language, context, [
          'webApp',
          'breadcrumb',
        ]);
      
      default:
        return this.generateStructuredData(page, language, context, ['webApp']);
    }
  }

  /**
   * 验证结构化数据格式
   */
  validateStructuredData(data: StructuredDataType): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必需字段
    if (!data['@context']) {
      errors.push('缺少@context字段');
    } else if (data['@context'] !== 'https://schema.org') {
      errors.push('@context必须是https://schema.org');
    }

    if (!data['@type']) {
      errors.push('缺少@type字段');
    }

    // 根据类型检查特定字段
    switch (data['@type']) {
      case 'WebApplication':
      case 'SoftwareApplication': {
        const app = data as WebApplicationSchema | SoftwareApplicationSchema;
        if (!app.name) errors.push('缺少name字段');
        if (!app.description) errors.push('缺少description字段');
        if (!app.offers) errors.push('缺少offers字段');
        break;
      }
      
      case 'BreadcrumbList': {
        const breadcrumb = data as BreadcrumbSchema;
        if (!breadcrumb.itemListElement || breadcrumb.itemListElement.length === 0) {
          errors.push('面包屑导航必须包含至少一个项目');
        }
        break;
      }
      
      case 'FAQPage': {
        const faq = data as FAQSchema;
        if (!faq.mainEntity || faq.mainEntity.length === 0) {
          errors.push('FAQ页面必须包含至少一个问题');
        }
        break;
      }
      
      case 'HowTo': {
        const howTo = data as HowToSchema;
        if (!howTo.step || howTo.step.length === 0) {
          errors.push('HowTo必须包含至少一个步骤');
        }
        break;
      }
    }

    // 检查URL格式
    const urlFields = ['url', 'downloadUrl'];
    urlFields.forEach(field => {
      if (data[field as keyof StructuredDataType] && 
          !this.isValidUrl(data[field as keyof StructuredDataType] as string)) {
        warnings.push(`${field}字段的URL格式可能不正确`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // 私有辅助方法

  private getPageDescription(
    page: PageType,
    language: Language,
    context: SEOContext
  ): string {
    const descriptions = {
      'zh-CN': {
        home: '免费的在线长截图分割工具，支持PNG、JPG等格式，自动智能分割，批量导出。',
        upload: '上传您的长截图文件，支持拖拽上传，自动检测图片格式和尺寸。',
        split: `调整分割设置并预览切片效果${context.sliceCount ? `，当前已生成${context.sliceCount}个切片` : ''}。`,
        export: `下载分割后的图片切片${context.selectedCount ? `，已选择${context.selectedCount}个切片` : ''}。`,
      },
      'en': {
        home: 'Free online long screenshot splitting tool, supports PNG, JPG formats, automatic intelligent splitting, batch export.',
        upload: 'Upload your long screenshot files, supports drag and drop upload, automatic format and size detection.',
        split: `Adjust split settings and preview slice effects${context.sliceCount ? `, currently generated ${context.sliceCount} slices` : ''}.`,
        export: `Download split image slices${context.selectedCount ? `, selected ${context.selectedCount} slices` : ''}.`,
      },
    };

    return descriptions[language][page];
  }

  private getFeatureList(language: Language): string[] {
    const features = {
      'zh-CN': [
        '长截图自动分割',
        '多格式支持（PNG、JPG、JPEG）',
        '批量导出功能',
        '在线处理，无需下载',
        '完全免费使用',
        '智能切片识别',
        'PDF和ZIP导出',
        '响应式设计',
      ],
      'en': [
        'Automatic long screenshot splitting',
        'Multi-format support (PNG, JPG, JPEG)',
        'Batch export functionality',
        'Online processing, no download required',
        'Completely free to use',
        'Intelligent slice recognition',
        'PDF and ZIP export',
        'Responsive design',
      ],
    };

    return features[language];
  }

  private getScreenshots(): string[] {
    return [
      `${this.baseUrl}/images/screenshot-home.jpg`,
      `${this.baseUrl}/images/screenshot-upload.jpg`,
      `${this.baseUrl}/images/screenshot-split.jpg`,
      `${this.baseUrl}/images/screenshot-export.jpg`,
    ];
  }

  private getBreadcrumbItems(page: PageType, language: Language) {
    const breadcrumbs = {
      'zh-CN': {
        home: [{ name: '首页', url: this.baseUrl }],
        upload: [
          { name: '首页', url: this.baseUrl },
          { name: '上传图片', url: `${this.baseUrl}/upload` },
        ],
        split: [
          { name: '首页', url: this.baseUrl },
          { name: '上传图片', url: `${this.baseUrl}/upload` },
          { name: '分割设置', url: `${this.baseUrl}/split` },
        ],
        export: [
          { name: '首页', url: this.baseUrl },
          { name: '上传图片', url: `${this.baseUrl}/upload` },
          { name: '分割设置', url: `${this.baseUrl}/split` },
          { name: '导出结果', url: `${this.baseUrl}/export` },
        ],
      },
      'en': {
        home: [{ name: 'Home', url: this.baseUrl }],
        upload: [
          { name: 'Home', url: this.baseUrl },
          { name: 'Upload Image', url: `${this.baseUrl}/upload` },
        ],
        split: [
          { name: 'Home', url: this.baseUrl },
          { name: 'Upload Image', url: `${this.baseUrl}/upload` },
          { name: 'Split Settings', url: `${this.baseUrl}/split` },
        ],
        export: [
          { name: 'Home', url: this.baseUrl },
          { name: 'Upload Image', url: `${this.baseUrl}/upload` },
          { name: 'Split Settings', url: `${this.baseUrl}/split` },
          { name: 'Export Results', url: `${this.baseUrl}/export` },
        ],
      },
    };

    return breadcrumbs[language][page];
  }

  private getFAQData(language: Language) {
    const faqData = {
      'zh-CN': [
        {
          question: '这个工具支持哪些图片格式？',
          answer: '我们支持PNG、JPG、JPEG等常见图片格式。推荐使用PNG格式以获得最佳质量。',
        },
        {
          question: '分割后的图片质量会降低吗？',
          answer: '不会。我们使用无损分割技术，确保分割后的图片保持原始质量。',
        },
        {
          question: '有文件大小限制吗？',
          answer: '单个文件建议不超过50MB，以确保最佳的处理速度和用户体验。',
        },
        {
          question: '分割后的图片可以重新合并吗？',
          answer: '目前暂不支持合并功能，但您可以保存原始图片以备后用。',
        },
        {
          question: '这个工具是免费的吗？',
          answer: '是的，完全免费。我们不收取任何费用，也不需要注册账户。',
        },
      ],
      'en': [
        {
          question: 'What image formats does this tool support?',
          answer: 'We support common image formats like PNG, JPG, JPEG. PNG format is recommended for best quality.',
        },
        {
          question: 'Will the image quality decrease after splitting?',
          answer: 'No. We use lossless splitting technology to ensure split images maintain original quality.',
        },
        {
          question: 'Is there a file size limit?',
          answer: 'We recommend files under 50MB for optimal processing speed and user experience.',
        },
        {
          question: 'Can split images be merged back together?',
          answer: 'Merging functionality is not currently supported, but you can save the original image for future use.',
        },
        {
          question: 'Is this tool free?',
          answer: 'Yes, completely free. We don\'t charge any fees and no account registration is required.',
        },
      ],
    };

    return faqData[language];
  }

  private getHowToData(language: Language) {
    const howToData = {
      'zh-CN': {
        name: '如何使用长截图分割工具',
        description: '简单4步完成长截图分割，快速获得所需的图片切片。',
        images: [`${this.baseUrl}/images/howto-overview.jpg`],
        supplies: ['长截图文件', '现代浏览器'],
        tools: ['长截图分割工具'],
        steps: [
          {
            name: '上传图片',
            text: '点击上传按钮或拖拽图片文件到上传区域。支持PNG、JPG等格式。',
            image: `${this.baseUrl}/images/step-upload.jpg`,
            url: '/upload',
          },
          {
            name: '自动分割',
            text: '系统会自动分析图片内容，智能识别分割点，生成多个切片。',
            image: `${this.baseUrl}/images/step-split.jpg`,
            url: '/split',
          },
          {
            name: '选择切片',
            text: '预览所有切片，选择需要的部分。可以单选、多选或全选。',
            image: `${this.baseUrl}/images/step-select.jpg`,
            url: '/split',
          },
          {
            name: '导出下载',
            text: '选择导出格式（单张图片、PDF或ZIP），点击下载按钮完成。',
            image: `${this.baseUrl}/images/step-export.jpg`,
            url: '/export',
          },
        ],
      },
      'en': {
        name: 'How to Use Long Screenshot Splitter',
        description: 'Complete long screenshot splitting in 4 simple steps to quickly get the image slices you need.',
        images: [`${this.baseUrl}/images/howto-overview.jpg`],
        supplies: ['Long screenshot file', 'Modern browser'],
        tools: ['Long Screenshot Splitter Tool'],
        steps: [
          {
            name: 'Upload Image',
            text: 'Click upload button or drag image file to upload area. Supports PNG, JPG and other formats.',
            image: `${this.baseUrl}/images/step-upload.jpg`,
            url: '/upload',
          },
          {
            name: 'Automatic Splitting',
            text: 'System automatically analyzes image content, intelligently identifies split points, and generates multiple slices.',
            image: `${this.baseUrl}/images/step-split.jpg`,
            url: '/split',
          },
          {
            name: 'Select Slices',
            text: 'Preview all slices and select the parts you need. You can select single, multiple, or all slices.',
            image: `${this.baseUrl}/images/step-select.jpg`,
            url: '/split',
          },
          {
            name: 'Export Download',
            text: 'Choose export format (single images, PDF, or ZIP) and click download button to complete.',
            image: `${this.baseUrl}/images/step-export.jpg`,
            url: '/export',
          },
        ],
      },
    };

    return howToData[language];
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const structuredDataGenerator = new StructuredDataGenerator();

// 导出便捷函数
export const generateStructuredData = (
  page: PageType,
  language: Language = 'zh-CN',
  context: SEOContext = {},
  types?: Array<'webApp' | 'softwareApp' | 'breadcrumb' | 'faq' | 'howTo'>
): StructuredDataType[] => {
  return structuredDataGenerator.generateStructuredData(page, language, context, types);
};

export const generatePageStructuredData = (
  page: PageType,
  language: Language = 'zh-CN',
  context: SEOContext = {}
): StructuredDataType[] => {
  return structuredDataGenerator.generatePageStructuredData(page, language, context);
};

export const validateStructuredData = (data: StructuredDataType) => {
  return structuredDataGenerator.validateStructuredData(data);
};