import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from './useI18n';
import type { I18nHookReturn } from '../types';

// 创建i18n上下文
const I18nContext = createContext<I18nHookReturn | null>(null);

// i18n Provider组件
export function I18nProvider({ children }: { children: ReactNode }) {
  const i18nValue = useI18n();
  
  return (
    <I18nContext.Provider value={i18nValue}>
      {children}
    </I18nContext.Provider>
  );
}

// 使用i18n上下文的hook
export function useI18nContext(): I18nHookReturn {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18nContext must be used within an I18nProvider');
  }
  
  return context;
}

// 导出上下文供高级用法
export { I18nContext };