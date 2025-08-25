import { useI18nContext } from '../hooks/useI18nContext';

/**
 * 智能语言切换组件
 * 基于现有系统的最小化改动实现
 */
export function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage, supportedLanguages, isLoading } = useI18nContext();

  const handleLanguageChange = async (language: string) => {
    if (language !== currentLanguage && !isLoading) {
      await changeLanguage(language);
    }
  };

  const getLanguageDisplayName = (lang: string): string => {
    const displayNames: Record<string, string> = {
      'zh-CN': '简体中文',
      'en': 'English'
    };
    return displayNames[lang] || lang;
  };

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="sr-only">
        {t('lang.current')}
      </label>
      
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isLoading}
        className="
          px-3 py-1 
          text-sm 
          border border-gray-300 
          rounded-md 
          bg-white 
          hover:border-gray-400 
          focus:outline-none 
          focus:ring-2 
          focus:ring-blue-500 
          focus:border-transparent
          disabled:opacity-50 
          disabled:cursor-not-allowed
          transition-colors
        "
        title={t('lang.current')}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {getLanguageDisplayName(lang)}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <span className="ml-2 text-xs text-gray-500">
          {t('app.loading')}
        </span>
      )}
    </div>
  );
}

/**
 * 紧凑版语言切换器（用于导航栏等空间受限的地方）
 */
export function CompactLanguageSwitcher() {
  const { t, currentLanguage, changeLanguage, isLoading } = useI18nContext();

  const toggleLanguage = async () => {
    if (!isLoading) {
      const nextLanguage = currentLanguage === 'zh-CN' ? 'en' : 'zh-CN';
      await changeLanguage(nextLanguage);
    }
  };

  const getCurrentLanguageDisplay = (): string => {
    return currentLanguage === 'zh-CN' ? '中' : 'EN';
  };

  // 获取下一个语言的显示名称
  const getNextLanguageTitle = (): string => {
    if (currentLanguage === 'zh-CN') {
      return t('lang.switcher.en');
    } else {
      return t('lang.switcher.zh-CN');
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isLoading}
      className="
        px-2 py-1 
        text-sm font-medium
        border border-gray-300 
        rounded 
        bg-white 
        hover:bg-gray-50 
        focus:outline-none 
        focus:ring-2 
        focus:ring-blue-500 
        disabled:opacity-50 
        disabled:cursor-not-allowed
        transition-colors
        min-w-[40px]
      "
      title={getNextLanguageTitle()}
    >
      {isLoading ? '...' : getCurrentLanguageDisplay()}
    </button>
  );
}