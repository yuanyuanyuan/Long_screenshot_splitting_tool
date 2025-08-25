/**
 * 智能语言检测器
 * 基于现有系统的最小化改动实现
 */

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  source: 'browser' | 'storage' | 'system' | 'default';
}

export class LanguageDetector {
  private static readonly STORAGE_KEY = 'preferred-language';
  private static readonly SUPPORTED_LANGUAGES = ['en', 'zh-CN'];
  
  /**
   * 检测用户首选语言
   */
  static detectLanguage(): LanguageDetectionResult {
    // 1. 优先检查用户已保存的偏好
    const storedLanguage = this.getStoredLanguage();
    if (storedLanguage) {
      return {
        language: storedLanguage,
        confidence: 1.0,
        source: 'storage'
      };
    }

    // 2. 检测浏览器语言
    const browserLanguage = this.getBrowserLanguage();
    if (browserLanguage) {
      return {
        language: browserLanguage,
        confidence: 0.9,
        source: 'browser'
      };
    }

    // 3. 系统语言检测
    const systemLanguage = this.getSystemLanguage();
    if (systemLanguage) {
      return {
        language: systemLanguage,
        confidence: 0.8,
        source: 'system'
      };
    }

    // 4. 默认语言
    return {
      language: 'en',
      confidence: 0.5,
      source: 'default'
    };
  }

  /**
   * 获取存储的语言偏好
   */
  private static getStoredLanguage(): string | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && this.SUPPORTED_LANGUAGES.includes(stored)) {
        return stored;
      }
    } catch (error) {
      console.warn('Failed to read stored language preference:', error);
    }
    return null;
  }

  /**
   * 检测浏览器语言
   */
  private static getBrowserLanguage(): string | null {
    const browserLangs = navigator.languages || [navigator.language];
    
    for (const lang of browserLangs) {
      // 直接匹配
      if (this.SUPPORTED_LANGUAGES.includes(lang)) {
        return lang;
      }
      
      // 匹配语言代码前缀
      const langCode = lang.split('-')[0];
      const matched = this.SUPPORTED_LANGUAGES.find(supported => 
        supported.startsWith(langCode)
      );
      if (matched) {
        return matched;
      }
    }
    
    return null;
  }

  /**
   * 获取系统语言（备用方案）
   */
  private static getSystemLanguage(): string | null {
    try {
      // 检查时区信息推断地区
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Beijing')) {
        return 'zh-CN';
      }
    } catch (error) {
      console.warn('Failed to detect system language:', error);
    }
    return null;
  }

  /**
   * 保存语言偏好
   */
  static saveLanguagePreference(language: string): void {
    if (this.SUPPORTED_LANGUAGES.includes(language)) {
      try {
        localStorage.setItem(this.STORAGE_KEY, language);
      } catch (error) {
        console.warn('Failed to save language preference:', error);
      }
    }
  }

  /**
   * 清除语言偏好
   */
  static clearLanguagePreference(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear language preference:', error);
    }
  }
}