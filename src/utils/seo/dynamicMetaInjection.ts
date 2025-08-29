/**
 * 动态元标签注入工具
 * 支持实时更新页面元数据和结构化数据
 */

import type { 
  SEOMetadata, 
  StructuredDataType,
  PageType,
  Language,
  ViewportInfo
} from '../../types/seo.types';

/**
 * 动态元标签注入器
 */
export class DynamicMetaInjector {
  private injectedTags: Set<string> = new Set();
  private observer: MutationObserver | null = null;

  constructor() {
    this.initializeMutationObserver();
  }

  /**
   * 初始化变化观察器
   */
  private initializeMutationObserver(): void {
    if (typeof window === 'undefined' || !window.MutationObserver) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // 检测到DOM变化时，可以触发元数据重新评估
          this.validateInjectedTags();
        }
      });
    });

    this.observer.observe(document.head, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 注入基础元数据标签
   */
  injectBasicMetaTags(metadata: SEOMetadata): void {
    const tags = [
      { name: 'title', content: metadata.title },
      { name: 'description', content: metadata.description },
      { name: 'keywords', content: metadata.keywords.join(', ') },
      { name: 'author', content: metadata.author || '' },
      { name: 'robots', content: metadata.robots || 'index,follow' },
    ];

    tags.forEach(tag => this.updateOrCreateTag(tag.name, tag.content));
  }

  /**
   * 注入Open Graph标签
   */
  injectOpenGraphTags(metadata: SEOMetadata): void {
    const ogTags = [
      { property: 'og:title', content: metadata.ogTitle },
      { property: 'og:description', content: metadata.ogDescription },
      { property: 'og:image', content: metadata.ogImage },
      { property: 'og:url', content: metadata.ogUrl },
      { property: 'og:type', content: metadata.ogType },
    ];

    ogTags.forEach(tag => 
      this.updateOrCreateMetaProperty(tag.property, tag.content)
    );
  }

  /**
   * 注入Twitter Card标签
   */
  injectTwitterCardTags(metadata: SEOMetadata): void {
    const twitterTags = [
      { name: 'twitter:card', content: metadata.twitterCard },
      { name: 'twitter:title', content: metadata.twitterTitle || metadata.title },
      { name: 'twitter:description', content: metadata.twitterDescription || metadata.description },
      { name: 'twitter:image', content: metadata.twitterImage || metadata.ogImage },
    ];

    twitterTags.forEach(tag => 
      this.updateOrCreateTag(tag.name, tag.content)
    );
  }

  /**
   * 注入结构化数据
   */
  injectStructuredData(structuredData: StructuredDataType | Record<string, unknown>): void {
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    
    if (existingScript) {
      existingScript.textContent = JSON.stringify(structuredData, null, 2);
    } else {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData, null, 2);
      document.head.appendChild(script);
    }

    this.injectedTags.add('structured-data');
  }

  /**
   * 注入hreflang标签
   */
  injectHreflangTags(hreflangMap: Record<string, string>): void {
    // 移除现有的hreflang标签
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => {
      if (this.injectedTags.has(`hreflang-${link.getAttribute('hreflang')}`)) {
        link.remove();
      }
    });

    // 添加新的hreflang标签
    Object.entries(hreflangMap).forEach(([lang, url]) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = url;
      document.head.appendChild(link);
      this.injectedTags.add(`hreflang-${lang}`);
    });
  }

  /**
   * 注入性能优化标签
   */
  injectPerformanceTags(viewportInfo: ViewportInfo): void {
    // DNS预解析
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
    ];

    preconnectDomains.forEach(domain => {
      if (!document.querySelector(`link[href="${domain}"][rel="preconnect"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        if (domain.includes('gstatic')) {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
        this.injectedTags.add(`preconnect-${domain}`);
      }
    });

    // 响应式视口优化
    const viewportContent = this.generateViewportContent(viewportInfo);
    this.updateOrCreateTag('viewport', viewportContent);
  }

  /**
   * 批量注入所有元数据
   */
  injectAllMetadata(
    metadata: SEOMetadata,
    structuredData: StructuredDataType | Record<string, unknown> | null,
    viewportInfo: ViewportInfo
  ): void {
    this.injectBasicMetaTags(metadata);
    this.injectOpenGraphTags(metadata);
    this.injectTwitterCardTags(metadata);
    
    if (structuredData) {
      this.injectStructuredData(structuredData);
    }
    
    if (metadata.hreflang && Object.keys(metadata.hreflang).length > 0) {
      this.injectHreflangTags(metadata.hreflang);
    }
    
    this.injectPerformanceTags(viewportInfo);
  }

  /**
   * 清理注入的标签
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    // 清理注入的标签
    this.injectedTags.forEach(tagId => {
      const elements = document.querySelectorAll(`[data-injected="${tagId}"]`);
      elements.forEach(el => el.remove());
    });

    this.injectedTags.clear();
  }

  /**
   * 更新或创建meta标签
   */
  public updateOrCreateTag(name: string, content: string): void {
    if (!content) return;

    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    
    if (meta) {
      meta.content = content;
    } else {
      meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      meta.setAttribute('data-injected', name);
      document.head.appendChild(meta);
    }

    this.injectedTags.add(name);
  }

  /**
   * 更新或创建meta property标签
   */
  private updateOrCreateMetaProperty(property: string, content: string): void {
    if (!content) return;

    let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    
    if (meta) {
      meta.content = content;
    } else {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.content = content;
      meta.setAttribute('data-injected', property);
      document.head.appendChild(meta);
    }

    this.injectedTags.add(property);
  }

  /**
   * 生成视口内容
   */
  private generateViewportContent(viewportInfo: ViewportInfo): string {
    const baseViewport = 'width=device-width, initial-scale=1.0';
    
    // 根据设备类型调整视口设置
    switch (viewportInfo.deviceType) {
      case 'mobile':
        return `${baseViewport}, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover`;
      case 'tablet':
        return `${baseViewport}, maximum-scale=3.0, user-scalable=yes`;
      default:
        return `${baseViewport}, maximum-scale=2.0`;
    }
  }

  /**
   * 验证注入的标签
   */
  private validateInjectedTags(): void {
    // 检查注入的标签是否仍然存在
    const existingTags = new Set<string>();
    
    this.injectedTags.forEach(tagId => {
      const element = document.querySelector(`[data-injected="${tagId}"]`);
      if (element) {
        existingTags.add(tagId);
      }
    });

    this.injectedTags = existingTags;
  }
}

/**
 * 实时元数据更新器
 */
export class RealTimeMetadataUpdater {
  private injector: DynamicMetaInjector;
  private updateQueue: Array<() => void> = [];
  private isProcessing = false;

  constructor() {
    this.injector = new DynamicMetaInjector();
  }

  /**
   * 队列化更新请求
   */
  queueUpdate(updateFn: () => void): void {
    this.updateQueue.push(updateFn);
    this.processQueue();
  }

  /**
   * 实时更新页面标题
   */
  updateTitle(title: string): void {
    this.queueUpdate(() => {
      document.title = title;
      this.injector.injectBasicMetaTags({ 
        title,
        description: '',
        keywords: [],
        ogTitle: title,
        ogDescription: '',
        ogImage: '',
        ogType: 'website',
        ogUrl: '',
        twitterCard: 'summary',
        canonicalUrl: '',
        hreflang: {}
      });
    });
  }

  /**
   * 实时更新描述
   */
  updateDescription(description: string): void {
    this.queueUpdate(() => {
      this.injector.updateOrCreateTag('description', description);
    });
  }

  /**
   * 实时更新关键词
   */
  updateKeywords(keywords: string[]): void {
    this.queueUpdate(() => {
      this.injector.updateOrCreateTag('keywords', keywords.join(', '));
    });
  }

  /**
   * 批量更新元数据
   */
  updateMetadata(metadata: Partial<SEOMetadata>): void {
    this.queueUpdate(() => {
      if (metadata.title) {
        document.title = metadata.title;
      }
      
      const fullMetadata: SEOMetadata = {
        title: metadata.title || document.title,
        description: metadata.description || '',
        keywords: metadata.keywords || [],
        ogTitle: metadata.ogTitle || metadata.title || document.title,
        ogDescription: metadata.ogDescription || metadata.description || '',
        ogImage: metadata.ogImage || '',
        ogType: metadata.ogType || 'website',
        ogUrl: metadata.ogUrl || '',
        twitterCard: metadata.twitterCard || 'summary',
        canonicalUrl: metadata.canonicalUrl || '',
        hreflang: metadata.hreflang || {}
      };

      this.injector.injectBasicMetaTags(fullMetadata);
      this.injector.injectOpenGraphTags(fullMetadata);
      this.injector.injectTwitterCardTags(fullMetadata);
    });
  }

  /**
   * 处理更新队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 批量处理更新，避免频繁DOM操作
      const updates = this.updateQueue.splice(0);
      
      // 使用 requestAnimationFrame 确保在合适的时机更新
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          updates.forEach(updateFn => {
            try {
              updateFn();
            } catch (error) {
              console.warn('Meta update failed:', error);
            }
          });
          resolve(void 0);
        });
      });
    } finally {
      this.isProcessing = false;
      
      // 如果队列中还有更新，继续处理
      if (this.updateQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.updateQueue = [];
    this.injector.cleanup();
  }
}

// 全局实例
export const metaInjector = new DynamicMetaInjector();
export const realTimeUpdater = new RealTimeMetadataUpdater();

// 导出便利函数
export const updatePageTitle = (title: string) => realTimeUpdater.updateTitle(title);
export const updatePageDescription = (description: string) => realTimeUpdater.updateDescription(description);
export const updatePageKeywords = (keywords: string[]) => realTimeUpdater.updateKeywords(keywords);
export const updatePageMetadata = (metadata: Partial<SEOMetadata>) => realTimeUpdater.updateMetadata(metadata);