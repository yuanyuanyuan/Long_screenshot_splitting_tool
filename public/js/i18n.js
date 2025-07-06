class I18nService {
  constructor(supportedLangs, defaultLang) {
    this.supportedLangs = supportedLangs;
    this.defaultLang = defaultLang;
    this.currentLang = this.defaultLang;
    this.translations = {};
  }

  /**
   * 简化的语言检测逻辑
   */
  detectLanguage() {
    // 1. URL 参数优先
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang");
    if (urlLang && this.supportedLangs.includes(urlLang)) {
      return urlLang;
    }

    // 2. 检查 localStorage
    const savedLang = localStorage.getItem("preferredLang");
    if (savedLang && this.supportedLangs.includes(savedLang)) {
      return savedLang;
    }

    // 3. 返回默认语言
    return this.defaultLang;
  }

  /**
   * 获取翻译文本，支持动态替换
   * @param {string} key - 翻译key
   * @param {object} replacements - 用于替换占位符的对象
   * @returns {string}
   */
  t(key, replacements = {}) {
    // 优先从加载的翻译中寻找，如果找不到，则直接返回 key
    let translation = this.translations[key] || key;
    for (const placeholder in replacements) {
      translation = translation.replace(
        `{${placeholder}}`,
        replacements[placeholder]
      );
    }
    return translation;
  }

  /**
   * 异步加载指定语言的翻译文件
   */
  async loadTranslations(lang) {
    try {
      const baseUrl = window.APP_BASE_URL || "/";
      // Astro's BASE_URL includes a trailing slash when not root, but we ensure it here for safety.
      const pathPrefix =
        baseUrl.length > 1 && !baseUrl.endsWith("/") ? baseUrl + "/" : baseUrl;
      const fetchUrl = `${pathPrefix}locales/${lang}.json`;

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} for ${fetchUrl}`
        );
      }
      this.translations = await response.json();
      return this.translations;
    } catch (error) {
      console.error(`Could not load translation file for ${lang}:`, error);
      // 如果加载失败，重置为一个空对象，避免使用旧的翻译
      this.translations = {};
      return null;
    }
  }

  /**
   * 将翻译应用到页面上
   */
  applyTranslations() {
    if (!this.translations) return;

    // 更新页面内容
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (this.translations[key]) {
        const targetAttr = el.dataset.i18nAttr;
        if (targetAttr) {
          el.setAttribute(targetAttr, this.translations[key]);
        } else {
          el.textContent = this.translations[key];
        }
      }
    });

    // 更新HTML内容
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.dataset.i18nHtml;
      if (this.translations[key]) {
        el.innerHTML = this.translations[key];
      }
    });

    // 更新meta标签
    if (this.translations["meta.title"]) {
      document.title = this.translations["meta.title"];
    }

    this.updateLanguageSwitcherUI();
  }

  /**
   * 切换语言
   */
  async switchLanguage(lang) {
    if (!this.supportedLangs.includes(lang) || lang === this.currentLang) {
      return;
    }

    this.currentLang = lang;
    localStorage.setItem("preferredLang", lang);
    document.documentElement.lang = lang;

    await this.loadTranslations(lang);

    this.applyTranslations();

    // 更新URL
    const url = new URL(window.location);
    url.searchParams.set("lang", lang);
    history.pushState({}, "", url);

    // 通知其他脚本语言已更改
    document.dispatchEvent(
      new CustomEvent("language:switched", { detail: { lang } })
    );
  }

  /**
   * 更新语言切换器UI，高亮当前语言
   */
  updateLanguageSwitcherUI() {
    const switcher = document.getElementById("lang-switcher");
    if (!switcher) return;

    switcher.querySelectorAll("a").forEach((link) => {
      const urlParams = new URLSearchParams(link.search);
      const lang = urlParams.get("lang");

      if (lang === this.currentLang) {
        link.classList.add("active");
        link.classList.remove("hover:underline");
      } else {
        link.classList.remove("active");
        link.classList.add("hover:underline");
      }
    });
  }

  /**
   * 设置语言切换事件
   */
  setupLanguageSwitcher() {
    const switcher = document.getElementById("lang-switcher");
    if (!switcher) return;

    switcher.addEventListener("click", async (e) => {
      const link = e.target.closest("a[href*='?lang=']");
      if (!link) return;

      e.preventDefault();
      const urlParams = new URLSearchParams(link.search);
      const lang = urlParams.get("lang");

      if (lang) {
        await this.switchLanguage(lang);
      }
    });
  }

  /**
   * 初始化
   */
  async init() {
    const lang = this.detectLanguage();
    this.currentLang = lang;
    document.documentElement.lang = lang;

    await this.loadTranslations(lang);
    this.applyTranslations();

    // 暴露到全局，以便 main.js 等其他脚本使用
    window.i18n = this;

    // 通知其他脚本 i18n 已准备就绪
    document.dispatchEvent(new CustomEvent("i18n:ready"));

    // 设置事件监听
    this.setupLanguageSwitcher();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const i18n = new I18nService(
    ["en", "zh-CN", "zh-TW"], // 支持的语言
    "zh-CN" // 默认语言
  );
  i18n.init();
});
