import { useState, useCallback, useEffect } from 'react';
import type { I18nHookReturn } from '../types';

// 支持的语言
const SUPPORTED_LANGUAGES = ['zh-CN', 'en'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// 语言资源缓存
const languageCache = new Map<string, Record<string, string>>();

// 获取浏览器默认语言
function getDefaultLanguage(): SupportedLanguage {
  const browserLang = navigator.language;

  // 精确匹配
  if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }

  // 语言代码匹配（如 zh-TW -> zh-CN）
  const langCode = browserLang.split('-')[0];
  const matchedLang = SUPPORTED_LANGUAGES.find(lang => lang.startsWith(langCode));

  return matchedLang || 'zh-CN'; // 默认中文
}

// 从localStorage获取保存的语言设置
function getSavedLanguage(): SupportedLanguage {
  try {
    // 首先尝试从新的持久化系统获取
    const persistedState = JSON.parse(localStorage.getItem('screenshot-splitter-state') || '{}');
    if (
      persistedState.language &&
      SUPPORTED_LANGUAGES.includes(persistedState.language as SupportedLanguage)
    ) {
      return persistedState.language as SupportedLanguage;
    }

    // 回退到旧的语言设置
    const saved = localStorage.getItem('app-language');
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      return saved as SupportedLanguage;
    }
  } catch (error) {
    console.warn('[I18n] 无法读取保存的语言设置:', error);
  }
  return getDefaultLanguage();
}

// 保存语言设置到localStorage
function saveLanguage(language: SupportedLanguage) {
  try {
    localStorage.setItem('app-language', language);
  } catch (error) {
    console.warn('[I18n] 无法保存语言设置:', error);
  }
}

// 加载语言资源
async function loadLanguageResource(language: SupportedLanguage): Promise<Record<string, string>> {
  // 检查缓存
  if (languageCache.has(language)) {
    return languageCache.get(language)!;
  }

  try {
    // 动态导入语言文件
    const module = await import(`../locales/${language}.json`);
    const resource = module.default || module;

    // 缓存资源
    languageCache.set(language, resource);

    console.log(`[I18n] 已加载语言资源: ${language}`);
    return resource;
  } catch (error) {
    console.error(`[I18n] 加载语言资源失败: ${language}`, error);

    // 回退到中文
    if (language !== 'zh-CN') {
      return loadLanguageResource('zh-CN');
    }

    // 如果中文也加载失败，返回空对象
    return {};
  }
}

// 文本插值函数
function interpolate(template: string, params: Record<string, any> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export function useI18n(): I18nHookReturn {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(getSavedLanguage());
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 翻译函数
  const t = useCallback(
    (key: string, params?: Record<string, any>): string => {
      const translation = translations[key];

      if (!translation) {
        console.warn(`[I18n] 翻译键未找到: ${key}`);
        return key; // 返回键名作为回退
      }

      return params ? interpolate(translation, params) : translation;
    },
    [translations]
  );

  // 切换语言
  const changeLanguage = useCallback(
    async (language: string) => {
      if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
        console.warn(`[I18n] 不支持的语言: ${language}`);
        return;
      }

      const newLanguage = language as SupportedLanguage;

      if (newLanguage === currentLanguage) {
        return; // 语言相同，无需切换
      }

      setIsLoading(true);

      try {
        // 加载新语言资源
        const newTranslations = await loadLanguageResource(newLanguage);

        // 更新状态
        setCurrentLanguage(newLanguage);
        setTranslations(newTranslations);

        // 保存到localStorage
        saveLanguage(newLanguage);

        console.log(`[I18n] 语言已切换到: ${newLanguage}`);
      } catch (error) {
        console.error(`[I18n] 切换语言失败: ${newLanguage}`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage]
  );

  // 初始化加载当前语言资源
  useEffect(() => {
    let isMounted = true;

    const initializeI18n = async () => {
      try {
        const initialTranslations = await loadLanguageResource(currentLanguage);

        if (isMounted) {
          setTranslations(initialTranslations);
          setIsLoading(false);
          console.log(`[I18n] 初始化完成，当前语言: ${currentLanguage}`);
        }
      } catch (error) {
        console.error('[I18n] 初始化失败:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeI18n();

    return () => {
      isMounted = false;
    };
  }, [currentLanguage]);

  return {
    t,
    currentLanguage,
    changeLanguage,
    isLoading,
    supportedLanguages: [...SUPPORTED_LANGUAGES],
  };
}

// 导出工具函数供其他地方使用
export { SUPPORTED_LANGUAGES, getSavedLanguage, getDefaultLanguage };
