/**
 * SEO配置文件
 * 包含网站的基础SEO信息和配置
 */

export const SEO_CONFIG = {
  // 网站基础信息
  siteName: '长截图分割工具',
  siteUrl: 'https://screenshot-splitter.com',
  defaultLanguage: 'zh-CN',
  supportedLanguages: ['zh-CN', 'en'],
  
  // 社交媒体信息
  socialMedia: {
    twitter: '@screenshot_tool',
    facebook: 'screenshot-splitter',
    linkedin: 'screenshot-splitter'
  },
  
  // 分析工具配置
  analytics: {
    googleAnalyticsId: 'G-XXXXXXXXXX', // 需要替换为实际的GA ID
    googleSearchConsoleId: 'XXXXXXXXXX' // 需要替换为实际的GSC ID
  },
  
  // 关键词配置
  keywords: {
    primary: [
      '长截图分割',
      '截图切割',
      '图片分割工具',
      '在线截图工具',
      '免费图片处理'
    ],
    secondary: [
      '长图切割',
      '截图处理',
      '图片编辑',
      '在线工具',
      '图片分割器'
    ],
    longTail: [
      '如何分割长截图',
      '长截图怎么切割',
      '免费在线图片分割工具',
      '手机长截图分割方法',
      '网页截图分割工具'
    ]
  },
  
  // 默认图片配置
  defaultImages: {
    ogImage: '/og-image.png',
    twitterImage: '/twitter-card.png',
    favicon: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png'
  },
  
  // 页面特定配置
  pages: {
    home: {
      priority: 1.0,
      changeFrequency: 'weekly' as const
    },
    upload: {
      priority: 0.8,
      changeFrequency: 'monthly' as const
    },
    split: {
      priority: 0.6,
      changeFrequency: 'monthly' as const
    },
    export: {
      priority: 0.6,
      changeFrequency: 'monthly' as const
    }
  },
  
  // 结构化数据配置
  structuredData: {
    organization: {
      name: '长截图分割工具',
      url: 'https://screenshot-splitter.com',
      logo: 'https://screenshot-splitter.com/logo.png',
      description: '免费的在线长截图分割工具，支持将长图片自动切割成多个部分'
    },
    webApplication: {
      name: '长截图分割工具',
      description: '免费的在线长截图分割工具，支持将长图片自动切割成多个部分',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.'
    }
  }
} as const;

// 导出类型
export type SEOConfigType = typeof SEO_CONFIG;
export type SupportedLanguage = typeof SEO_CONFIG.supportedLanguages[number];
export type PageKey = keyof typeof SEO_CONFIG.pages;
export type ChangeFrequency = typeof SEO_CONFIG.pages[PageKey]['changeFrequency'];