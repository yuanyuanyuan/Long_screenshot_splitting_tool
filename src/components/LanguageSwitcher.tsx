/**
 * 智能语言切换组件 - 移动端优化版
 * 响应式设计，支持触摸友好界面
 */

import React, { useCallback } from 'react';
import { useI18nContext } from '../hooks/useI18nContext';
import { useViewport } from '../hooks/useViewport';

/**
 * 智能语言切换组件
 * 基于现有系统的最小化改动实现
 */
export function LanguageSwitcher() {
  const { t, currentLanguage, changeLanguage, supportedLanguages, isLoading } = useI18nContext();
  const viewport = useViewport();

  // 触摸反馈
  const triggerHapticFeedback = useCallback(() => {
    if (viewport.isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [viewport.isMobile]);

  const handleLanguageChange = async (language: string) => {
    if (language !== currentLanguage && !isLoading) {
      triggerHapticFeedback();
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

  // 移动端样式
  const mobileOptimizedClass = viewport.isMobile ? 'mobile-language-switcher' : '';

  return (
    <div className={`language-switcher ${mobileOptimizedClass}`}>
      <label 
        htmlFor="language-select" 
        className={`${
          viewport.isMobile ? 'text-base font-medium text-gray-800 mb-2 block' : 'sr-only'
        }`}
      >
        {t('lang.current')}
      </label>
      
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isLoading}
        className={`
          ${viewport.isMobile 
            ? 'px-4 py-3 text-base min-h-[44px] w-full rounded-lg' 
            : 'px-3 py-1 text-sm rounded-md'
          }
          border border-gray-300 
          bg-white 
          hover:border-gray-400 
          focus:outline-none 
          focus:ring-2 
          focus:ring-blue-500 
          focus:border-transparent
          disabled:opacity-50 
          disabled:cursor-not-allowed
          transition-colors
          appearance-none
          ${viewport.isMobile ? 'font-medium' : ''}
        `}
        style={{
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        title={t('lang.current')}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {getLanguageDisplayName(lang)}
          </option>
        ))}
      </select>
      
      {/* 移动端下拉箭头 */}
      {viewport.isMobile && !isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-gray-500">
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      
      {isLoading && (
        <span className={`${
          viewport.isMobile ? 'block mt-2 text-base' : 'ml-2 text-xs'
        } text-gray-500`}>
          {viewport.isMobile ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              {t('app.loading')}
            </div>
          ) : (
            t('app.loading')
          )}
        </span>
      )}

      {/* 移动端语言信息提示 */}
      {viewport.isMobile && !isLoading && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="flex items-center">
            <span className="mr-1">🌐</span>
            {t('lang.description', { current: getLanguageDisplayName(currentLanguage) })}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 紧凑版语言切换器 - 移动端优化版
 * 用于导航栏等空间受限的地方
 */
export function CompactLanguageSwitcher() {
  const { t, currentLanguage, changeLanguage, isLoading } = useI18nContext();
  const viewport = useViewport();

  // 触摸反馈
  const triggerHapticFeedback = useCallback(() => {
    if (viewport.isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [viewport.isMobile]);

  const toggleLanguage = async () => {
    if (!isLoading) {
      triggerHapticFeedback();
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
      className={`
        ${viewport.isMobile 
          ? 'px-4 py-3 text-base font-semibold min-h-[44px] min-w-[60px] rounded-lg' 
          : 'px-2 py-1 text-sm font-medium min-w-[40px] rounded'
        }
        border border-gray-300 
        bg-white 
        hover:bg-gray-50 
        active:bg-gray-100
        focus:outline-none 
        focus:ring-2 
        focus:ring-blue-500 
        disabled:opacity-50 
        disabled:cursor-not-allowed
        transition-colors
        ${viewport.isMobile ? 'shadow-sm' : ''}
      `}
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      title={getNextLanguageTitle()}
    >
      {isLoading ? (
        <div className={`flex items-center justify-center ${viewport.isMobile ? 'space-x-1' : ''}`}>
          <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${
            viewport.isMobile ? 'h-4 w-4' : 'h-3 w-3'
          }`}></div>
          {viewport.isMobile && <span className="text-xs">...</span>}
        </div>
      ) : (
        <span className="flex items-center justify-center">
          {getCurrentLanguageDisplay()}
          {viewport.isMobile && (
            <span className="ml-1 text-xs opacity-70">
              {currentLanguage === 'zh-CN' ? '🇨🇳' : '🇺🇸'}
            </span>
          )}
        </span>
      )}
    </button>
  );
}