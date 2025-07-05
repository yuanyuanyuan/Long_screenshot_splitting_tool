document.addEventListener("DOMContentLoaded", () => {
  const i18nHandler = {
    // 定义支持的语言列表和默认语言
    supportedLangs: ["en", "zh-CN", "zh-TW"],
    defaultLang: "en",
    translations: {}, // 存储当前语言的翻译

    /**
     * 语言检测逻辑
     * 优先级: URL 参数 'lang' > Cookie 'lang' > localStorage 'preferred-language' > 浏览器默认语言
     */
    detectLanguage() {
      // 1. URL 参数
      const urlLang = new URLSearchParams(window.location.search).get("lang");
      if (urlLang && this.supportedLangs.includes(urlLang)) {
        return urlLang;
      }

      // 2. Cookie
      const cookieLang = (document.cookie.match(/lang=([^;]+)/) || [])[1];
      if (cookieLang && this.supportedLangs.includes(cookieLang)) {
        return cookieLang;
      }

      // 3. LocalStorage
      const localLang = localStorage.getItem("preferred-language");
      if (localLang && this.supportedLangs.includes(localLang)) {
        return localLang;
      }

      // 4. 浏览器语言
      const browserLang = navigator.language || navigator.userLanguage;
      if (this.supportedLangs.includes(browserLang)) {
        return browserLang;
      }
      if (browserLang.startsWith("zh")) {
        if (browserLang.includes("TW") || browserLang.includes("HK"))
          return "zh-TW";
        return "zh-CN";
      }
      if (browserLang.startsWith("en")) {
        return "en";
      }

      // 5. 默认语言
      return this.defaultLang;
    },

    /**
     * 异步加载指定语言的翻译文件
     * @param {string} lang - 语言代码 (e.g., 'en')
     */
    async loadTranslations(lang) {
      try {
        // 智能定位：找到 i18n.js 脚本自身，以计算正确的 locales 文件夹路径
        const i18nScript = document.querySelector('script[src*="js/i18n.js"]');
        if (!i18nScript) {
          throw new Error(
            "Could not find the i18n script tag to determine asset path."
          );
        }

        // 动态构建到 locales 文件的正确 URL
        const localeUrl = new URL(`../locales/${lang}.json`, i18nScript.src);

        const response = await fetch(localeUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.translations = data; // 加载后存储翻译
        return data;
      } catch (error) {
        console.error(`Could not load translation file for ${lang}:`, error);
        return null; // 加载失败则返回 null
      }
    },

    /**
     * 获取翻译文本，支持动态替换
     * @param {string} key - 翻译key
     * @param {object} replacements - 用于替换占位符的对象, e.g. { count: 5 }
     * @returns {string}
     */
    t(key, replacements = {}) {
      let translation = this.translations[key] || key;
      for (const placeholder in replacements) {
        translation = translation.replace(
          `{${placeholder}}`,
          replacements[placeholder]
        );
      }
      return translation;
    },

    /**
     * 将翻译应用到页面上
     * @param {object} translations - 包含键值对的翻译对象
     */
    applyTranslations(translations) {
      if (!translations) return;

      // 更新页面主体内容 - textContent
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (translations[key]) {
          const targetAttr = el.dataset.i18nAttr;
          if (targetAttr) {
            el.setAttribute(targetAttr, translations[key]);
          } else {
            el.textContent = translations[key];
          }
        }
      });

      // 更新需要保留HTML的内容 - innerHTML
      document.querySelectorAll("[data-i18n-html]").forEach((el) => {
        const key = el.dataset.i18nHtml;
        if (translations[key]) {
          el.innerHTML = translations[key];
        }
      });

      // 更新 SEO 相关的 <head> 标签内容
      this.updateMeta(
        "meta.title",
        document.title,
        (value) => (document.title = value),
        translations
      );
      this.updateMeta(
        "meta.description",
        'meta[name="description"]',
        (el, value) => el.setAttribute("content", value),
        translations
      );
      this.updateMeta(
        "meta.keywords",
        'meta[name="keywords"]',
        (el, value) => el.setAttribute("content", value),
        translations
      );
      this.updateMeta(
        "meta.og.title",
        'meta[property="og:title"]',
        (el, value) => el.setAttribute("content", value),
        translations
      );
      this.updateMeta(
        "meta.og.description",
        'meta[property="og:description"]',
        (el, value) => el.setAttribute("content", value),
        translations
      );
      this.updateMeta(
        "meta.twitter.title",
        'meta[name="twitter:title"]',
        (el, value) => el.setAttribute("content", value),
        translations
      );
      this.updateMeta(
        "meta.twitter.description",
        'meta[name="twitter:description"]',
        (el, value) => el.setAttribute("content", value),
        translations
      );
    },

    /**
     * 辅助函数：安全地更新元数据
     */
    updateMeta(key, selector, action, translations) {
      if (translations[key]) {
        if (selector === document.title) {
          action(translations[key]);
        } else {
          const element = document.querySelector(selector);
          if (element) {
            action(element, translations[key]);
          }
        }
      }
    },

    /**
     * 更新UI元素，例如语言切换器的显示文本
     * @param {string} lang - 当前语言
     */
    updateUI(lang) {
      const langText = {
        en: "EN",
        "zh-CN": "简",
        "zh-TW": "繁",
      };
      const currentLangEl = document.getElementById("current-lang-text");
      if (currentLangEl) {
        currentLangEl.textContent = langText[lang] || "EN";
      }
    },

    /**
     * 设置持久化存储
     * @param {string} lang - 要保存的语言
     */
    persistLanguage(lang) {
      localStorage.setItem("preferred-language", lang);
      document.cookie = `lang=${lang};path=/;max-age=31536000;samesite=lax`; // 有效期一年
    },

    /**
     * 初始化整个 i18n 流程
     */
    async init() {
      const lang = this.detectLanguage();

      this.persistLanguage(lang);
      document.documentElement.lang = lang;

      const translations = await this.loadTranslations(lang);
      this.applyTranslations(translations);
      this.updateUI(lang); // UI更新应在翻译加载后

      // 将 i18n 实例暴露到 window，以便其他脚本使用
      window.i18n = this;
    },
  };

  // 语言切换菜单的交互逻辑
  const langSwitcher = document.getElementById("lang-switcher");
  if (langSwitcher) {
    const menuButton = document.getElementById("lang-menu-button");
    const menu = document.getElementById("lang-menu");

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      if (!menu.classList.contains("hidden")) {
        menu.classList.add("hidden");
      }
    });
  }

  // 启动 i18n 处理器
  i18nHandler.init();
});
