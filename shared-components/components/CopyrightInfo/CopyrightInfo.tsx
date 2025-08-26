import React, { useState, useEffect } from 'react';
import { CopyrightInfoProps, CopyrightTranslations } from './types';
import { defaultCopyrightConfig } from './config/defaultConfig';

// 组件翻译资源缓存
const translationsCache = new Map<string, CopyrightTranslations>();

/**
 * 加载组件的国际化资源
 */
async function loadTranslations(language: 'zh-CN' | 'en'): Promise<CopyrightTranslations> {
  // 检查缓存
  if (translationsCache.has(language)) {
    return translationsCache.get(language)!;
  }

  try {
    // 动态导入对应的语言文件
    const module = await import(`./locales/${language}.json`);
    const translations = module.default || module;
    
    // 缓存翻译
    translationsCache.set(language, translations);
    return translations;
  } catch (error) {
    console.warn(`[CopyrightInfo] 无法加载 ${language} 语言资源:`, error);
    
    // 回退到英文
    if (language !== 'en') {
      return loadTranslations('en');
    }
    
    // 如果英文也加载失败，返回默认的英文翻译
    return {
      copyright: '© {year} {author}. All rights reserved.',
      contact: 'Contact: {email}',
      website: 'Website: {url}',
      poweredBy: 'Powered by {toolName}',
      license: 'Licensed under {license}',
      attribution: 'Attribution required: {attributionText}'
    };
  }
}

/**
 * 文本插值函数
 */
function interpolate(template: string, params: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * 检测浏览器语言
 */
function detectLanguage(): 'zh-CN' | 'en' {
  const browserLang = navigator.language;
  return browserLang.startsWith('zh') ? 'zh-CN' : 'en';
}

export const CopyrightInfo: React.FC<CopyrightInfoProps> = ({
  author = defaultCopyrightConfig.author,
  email = defaultCopyrightConfig.email,
  website = defaultCopyrightConfig.website,
  toolName = defaultCopyrightConfig.toolName,
  license = defaultCopyrightConfig.license,
  attributionText = defaultCopyrightConfig.attributionText,
  year = defaultCopyrightConfig.year,
  showCopyrightSymbol = defaultCopyrightConfig.showCopyrightSymbol,
  showContactInfo = defaultCopyrightConfig.showContactInfo,
  showWebsiteLink = defaultCopyrightConfig.showWebsiteLink,
  showPoweredBy = defaultCopyrightConfig.showPoweredBy,
  showLicense = defaultCopyrightConfig.showLicense,
  showAttribution = defaultCopyrightConfig.showAttribution,
  className = defaultCopyrightConfig.className,
  language,
  onClick
}) => {
  const [translations, setTranslations] = useState<CopyrightTranslations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载国际化资源
  useEffect(() => {
    const loadResources = async () => {
      const targetLanguage = language || detectLanguage();
      const loadedTranslations = await loadTranslations(targetLanguage);
      setTranslations(loadedTranslations);
      setIsLoading(false);
    };

    loadResources();
  }, [language]);

  if (isLoading || !translations) {
    return (
      <div className={`copyright-info-loading ${className}`}>
        <span>Loading copyright information...</span>
      </div>
    );
  }

  // 构建显示的内容
  const contentParts: string[] = [];

  if (showCopyrightSymbol) {
    contentParts.push(interpolate(translations.copyright, { year, author }));
  }

  if (showContactInfo && email) {
    contentParts.push(interpolate(translations.contact, { email }));
  }

  if (showWebsiteLink && website) {
    contentParts.push(interpolate(translations.website, { url: website }));
  }

  if (showPoweredBy && toolName) {
    contentParts.push(interpolate(translations.poweredBy, { toolName }));
  }

  if (showLicense && license) {
    contentParts.push(interpolate(translations.license, { license }));
  }

  if (showAttribution && attributionText) {
    contentParts.push(interpolate(translations.attribution, { attributionText }));
  }

  return (
    <div 
      className={`copyright-info ${className}`}
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#666',
        textAlign: 'right',
        padding: '8px',
        userSelect: 'text'
      }}
    >
      {contentParts.map((part, index) => (
        <div key={index}>{part}</div>
      ))}
    </div>
  );
};

// 导出默认配置
export { defaultCopyrightConfig };