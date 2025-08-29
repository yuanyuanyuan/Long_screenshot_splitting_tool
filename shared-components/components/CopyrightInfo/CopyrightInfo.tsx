import React, { useState, useEffect } from 'react';
import styles from './CopyrightInfo.module.css';
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
  const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return browserLang.startsWith('zh') ? 'zh-CN' : 'en';
}

function normalizeUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, '')}`;
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
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    const loadingClasses = [styles['copyright-info-loading'], className]
      .filter(Boolean)
      .join(' ');
    return (
      <div className={loadingClasses}>
        <span>Loading copyright information...</span>
      </div>
    );
  }

  // 移动端显示简化版本，桌面端显示完整版本
  const contentNodes: React.ReactNode[] = [];

  if (isMobile) {
    // 移动端只显示 "Powered by StarkYuan" 并支持点击跳转
    if (showPoweredBy && toolName && website) {
      const websiteUrl = normalizeUrl(website);
      contentNodes.push(
        <a 
          href={websiteUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="Visit StarkYuan's website"
          className={styles['mobile-powered-link']}
        >
          Powered by {author || 'StarkYuan'}
        </a>
      );
    } else if (showPoweredBy && toolName) {
      contentNodes.push(`Powered by ${author || 'StarkYuan'}`);
    }
  } else {
    // 桌面端显示完整版本
    if (showCopyrightSymbol) {
      contentNodes.push(interpolate(translations.copyright, { year, author }));
    }

    if (showContactInfo && email) {
      contentNodes.push(interpolate(translations.contact, { email }));
    }

    if (showWebsiteLink && website) {
      const websiteUrl = normalizeUrl(website);
      const label = translations.website.replace(/\{url\}/, '').trim();
      contentNodes.push(
        <>
          {label ? `${label} ` : ''}
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" aria-label="website">
            Long_screenshot_splitting_tool官网
          </a>
        </>
      );
    }

    if (showPoweredBy && toolName) {
      contentNodes.push(interpolate(translations.poweredBy, { toolName }));
    }

    if (showLicense && license) {
      contentNodes.push(interpolate(translations.license, { license }));
    }

    if (showAttribution && attributionText) {
      contentNodes.push(interpolate(translations.attribution, { attributionText }));
    }
  }

  const containerClasses = [
    styles['copyright-info'],
    onClick ? styles['copyright-info-clickable'] : '',
    className
  ].filter(Boolean).join(' ');

  // 调试日志：检查生效值
  console.log('[CopyrightInfo effective]', { author, email, website, toolName, year });

  return (
    <div 
      className={containerClasses}
      onClick={onClick}
    >
      {contentNodes.map((node, index) => (
        <div key={index}>{node}</div>
      ))}
    </div>
  );
};

// 导出默认配置
export { defaultCopyrightConfig };