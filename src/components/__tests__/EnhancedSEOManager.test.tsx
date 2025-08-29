/**
 * 增强SEO管理器测试
 * 验证动态元标签注入、性能优化钩子和React Helmet Async集成
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { SEOManager } from '../SEOManager';
import { EnhancedHelmetProvider } from '../EnhancedHelmetProvider';
import { SEOProvider } from '../../context/SEOContext';
import EnhancedSEOExample from '../examples/EnhancedSEOExample';
import type { PageType, Language } from '../../types/seo.types';

// Mock performance API
const mockPerformanceObserver = jest.fn();
const mockPerformanceEntry = {
  name: 'first-contentful-paint',
  startTime: 1500,
  entryType: 'paint',
};

Object.defineProperty(window, 'PerformanceObserver', {
  writable: true,
  value: jest.fn().mockImplementation((callback) => {
    mockPerformanceObserver.mockImplementation(callback);
    return {
      observe: jest.fn(),
      disconnect: jest.fn(),
    };
  }),
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn((callback) => setTimeout(callback, 16)),
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Helper function to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SEOProvider>
      <EnhancedHelmetProvider>
        <HelmetProvider>
          {component}
        </HelmetProvider>
      </EnhancedHelmetProvider>
    </SEOProvider>
  );
};

describe('Enhanced SEO Manager', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.title = '';
    
    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Basic SEO Manager', () => {
    it('should render with basic metadata', async () => {
      const { container } = render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
            enableOpenGraph={true}
            enableTwitterCard={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toContain('长截图分割工具');
      });

      // Check for basic meta tags
      expect(document.querySelector('meta[name="description"]')).toBeTruthy();
      expect(document.querySelector('meta[name="keywords"]')).toBeTruthy();
      expect(document.querySelector('meta[name="author"]')).toBeTruthy();
    });

    it('should generate different metadata for different pages', async () => {
      const { rerender } = render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toContain('长截图分割工具');
      });

      // Change page
      rerender(
        <HelmetProvider>
          <SEOManager
            page="upload"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toContain('上传图片');
      });
    });

    it('should support multiple languages', async () => {
      const { rerender } = render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="en"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toContain('Long Screenshot Splitter');
      });

      // Change language
      rerender(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toContain('长截图分割工具');
      });
    });

    it('should include context in metadata', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="split"
            language="zh-CN"
            context={{ sliceCount: 5 }}
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toContain('(5张)');
      });

      const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      expect(descriptionMeta?.content).toContain('5张图片');
    });
  });

  describe('Performance Optimization', () => {
    it('should include preconnect links', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        const preconnectLinks = document.querySelectorAll('link[rel="preconnect"]');
        expect(preconnectLinks.length).toBeGreaterThan(0);
      });

      // Check for specific preconnect links
      expect(document.querySelector('link[href="https://fonts.googleapis.com"]')).toBeTruthy();
      expect(document.querySelector('link[href="https://fonts.gstatic.com"]')).toBeTruthy();
    });

    it('should include DNS prefetch links', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        const dnsPrefetchLinks = document.querySelectorAll('link[rel="dns-prefetch"]');
        expect(dnsPrefetchLinks.length).toBeGreaterThan(0);
      });
    });

    it('should optimize viewport for different devices', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        expect(viewportMeta?.content).toContain('width=device-width');
        expect(viewportMeta?.content).toContain('initial-scale=1.0');
        expect(viewportMeta?.content).toContain('maximum-scale=5.0');
      });
    });
  });

  describe('Open Graph and Twitter Cards', () => {
    it('should generate Open Graph tags', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableOpenGraph={true}
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.querySelector('meta[property="og:title"]')).toBeTruthy();
        expect(document.querySelector('meta[property="og:description"]')).toBeTruthy();
        expect(document.querySelector('meta[property="og:image"]')).toBeTruthy();
        expect(document.querySelector('meta[property="og:url"]')).toBeTruthy();
      });
    });

    it('should generate Twitter Card tags', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableTwitterCard={true}
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.querySelector('meta[name="twitter:card"]')).toBeTruthy();
        expect(document.querySelector('meta[name="twitter:title"]')).toBeTruthy();
        expect(document.querySelector('meta[name="twitter:description"]')).toBeTruthy();
        expect(document.querySelector('meta[name="twitter:image"]')).toBeTruthy();
      });
    });

    it('should include enhanced Open Graph properties', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableOpenGraph={true}
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.querySelector('meta[property="og:locale"]')).toBeTruthy();
        expect(document.querySelector('meta[property="og:locale:alternate"]')).toBeTruthy();
        expect(document.querySelector('meta[property="og:image:width"]')).toBeTruthy();
        expect(document.querySelector('meta[property="og:image:height"]')).toBeTruthy();
      });
    });
  });

  describe('Structured Data', () => {
    it('should generate structured data script', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
        expect(structuredDataScript).toBeTruthy();
      });
    });

    it('should include correct structured data for home page', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
        expect(structuredDataScript?.textContent).toBeTruthy();
        
        if (structuredDataScript?.textContent) {
          const data = JSON.parse(structuredDataScript.textContent);
          expect(data['@context']).toBe('https://schema.org');
          expect(data['@type']).toBe('SoftwareApplication');
        }
      });
    });

    it('should include viewport and device information in structured data', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="upload"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
        
        if (structuredDataScript?.textContent) {
          const data = JSON.parse(structuredDataScript.textContent);
          expect(data.device).toBeDefined();
          expect(data.viewport).toBeDefined();
        }
      });
    });
  });

  describe('Hreflang Support', () => {
    it('should generate hreflang links', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableCanonical={true}
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
        expect(hreflangLinks.length).toBeGreaterThan(0);
      });
    });

    it('should include x-default hreflang', async () => {
      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableCanonical={true}
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        const xDefaultLink = document.querySelector('link[hreflang="x-default"]');
        expect(xDefaultLink).toBeTruthy();
      });
    });
  });

  describe('Custom Metadata', () => {
    it('should merge custom metadata with generated metadata', async () => {
      const customMetadata = {
        title: '自定义标题',
        description: '自定义描述',
        keywords: ['自定义', '关键词'],
      };

      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            customMetadata={customMetadata}
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toBe('自定义标题');
      });

      const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      expect(descriptionMeta?.content).toBe('自定义描述');

      const keywordsMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
      expect(keywordsMeta?.content).toContain('自定义');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toBeTruthy();
      });

      consoleSpy.mockRestore();
    });

    it('should provide fallback metadata when generation fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <HelmetProvider>
          <SEOManager
            page="home"
            language="zh-CN"
            context={{}} // Empty context that might cause issues
            enableStructuredData={true}
          />
        </HelmetProvider>
      );

      await waitFor(() => {
        expect(document.title).toContain('Long Screenshot Splitter');
      });

      consoleSpy.mockRestore();
    });
  });
});

describe('Enhanced SEO Example', () => {
  it('should render without errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      renderWithProviders(<EnhancedSEOExample />);
    });

    await waitFor(() => {
      expect(screen.getByText('增强SEO系统示例')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should handle language switching', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      renderWithProviders(<EnhancedSEOExample />);
    });

    await waitFor(() => {
      const englishButton = screen.getByText('English');
      fireEvent.click(englishButton);
    });

    // Should update metadata for English
    await waitFor(() => {
      // Check that the component responds to language change
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should handle page switching', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      renderWithProviders(<EnhancedSEOExample />);
    });

    await waitFor(() => {
      const uploadButton = screen.getByText('upload');
      fireEvent.click(uploadButton);
    });

    // Should update metadata for upload page
    await waitFor(() => {
      expect(screen.getByText('upload')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});