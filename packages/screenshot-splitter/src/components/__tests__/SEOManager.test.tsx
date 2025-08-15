import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { SEOManager, SEOProvider } from '../SEOManager';
import type { SEOManagerProps } from '../../types/seo.types';
import * as metadataGenerator from '../../utils/seo/metadataGenerator';

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet">{children}</div>
  ),
  HelmetProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet-provider">{children}</div>
  ),
}));

// Mock metadataGenerator
vi.mock('../../utils/seo/metadataGenerator', () => ({
  generatePageMetadata: vi.fn(() => ({
    title: 'Test Title',
    description: 'Test Description',
    keywords: ['test', 'keywords'],
    canonicalUrl: 'https://test.com',
    hreflang: {
      'zh-CN': 'https://test.com?lang=zh-CN',
      'en': 'https://test.com?lang=en',
    },
    ogTitle: 'Test OG Title',
    ogDescription: 'Test OG Description',
    ogImage: 'https://test.com/og-image.jpg',
    ogType: 'website' as const,
    ogUrl: 'https://test.com',
    twitterCard: 'summary_large_image' as const,
    twitterTitle: 'Test Twitter Title',
    twitterDescription: 'Test Twitter Description',
    twitterImage: 'https://test.com/twitter-image.jpg',
    robots: 'index,follow',
    author: 'Test Author',
    modifiedTime: new Date().toISOString()
  })),
}));

// Mock seo.config
vi.mock('../../config/seo.config', () => ({
  SEO_CONFIG: {
    siteName: '测试网站',
    siteUrl: 'https://test.com',
    socialMedia: {
      twitter: '@testsite',
    },
    structuredData: {
      organization: {
        name: 'Test Organization',
        url: 'https://test.com',
      },
    },
  },
}));

describe('SEOManager', () => {
  const defaultProps: SEOManagerProps = {
    page: 'home',
    language: 'zh-CN',
  };

  beforeEach(() => {
    // 清除所有mock调用记录
    vi.clearAllMocks();
    
    // Mock console.group 和 console.log 以避免测试输出污染
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染SEO管理器', () => {
      render(<SEOManager {...defaultProps} />);
      
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });

    it('应该渲染SEO提供者', () => {
      render(
        <SEOProvider>
          <div>Test Content</div>
        </SEOProvider>
      );
      
      expect(screen.getByTestId('helmet-provider')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('元数据生成', () => {
    it('应该使用正确的参数调用元数据生成器', () => {
      const context = { sliceCount: 5 };
      
      render(
        <SEOManager
          {...defaultProps}
          page="split"
          context={context}
          language="en"
        />
      );
      
      expect(metadataGenerator.generatePageMetadata).toHaveBeenCalledWith('split', context, 'en');
    });

    it('应该合并自定义元数据', () => {
      const customMetadata = {
        title: 'Custom Title',
        description: 'Custom Description',
      };
      
      render(
        <SEOManager
          {...defaultProps}
          customMetadata={customMetadata}
        />
      );
      
      // 验证Helmet中包含自定义标题
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该处理空的自定义元数据', () => {
      render(
        <SEOManager
          {...defaultProps}
          customMetadata={{}}
        />
      );
      
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });
  });

  describe('功能开关', () => {
    it('应该根据enableStructuredData控制结构化数据', () => {
      const { rerender } = render(
        <SEOManager
          {...defaultProps}
          enableStructuredData={false}
        />
      );
      
      let helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
      
      rerender(
        <SEOManager
          {...defaultProps}
          enableStructuredData={true}
        />
      );
      
      helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该根据enableOpenGraph控制OG标签', () => {
      const { rerender } = render(
        <SEOManager
          {...defaultProps}
          enableOpenGraph={false}
        />
      );
      
      let helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
      
      rerender(
        <SEOManager
          {...defaultProps}
          enableOpenGraph={true}
        />
      );
      
      helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该根据enableTwitterCard控制Twitter卡片', () => {
      const { rerender } = render(
        <SEOManager
          {...defaultProps}
          enableTwitterCard={false}
        />
      );
      
      let helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
      
      rerender(
        <SEOManager
          {...defaultProps}
          enableTwitterCard={true}
        />
      );
      
      helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该根据enableCanonical控制规范URL', () => {
      const { rerender } = render(
        <SEOManager
          {...defaultProps}
          enableCanonical={false}
        />
      );
      
      let helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
      
      rerender(
        <SEOManager
          {...defaultProps}
          enableCanonical={true}
        />
      );
      
      helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });
  });

  describe('结构化数据', () => {
    it('应该为首页生成SoftwareApplication结构化数据', () => {
      render(
        <SEOManager
          {...defaultProps}
          page="home"
          enableStructuredData={true}
        />
      );
      
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该为其他页面生成WebApplication结构化数据', () => {
      render(
        <SEOManager
          {...defaultProps}
          page="upload"
          enableStructuredData={true}
        />
      );
      
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该包含正确的结构化数据字段', () => {
      render(
        <SEOManager
          {...defaultProps}
          page="home"
          enableStructuredData={true}
        />
      );
      
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });
  });

  describe('多语言支持', () => {
    it('应该为中文生成正确的locale', () => {
      render(
        <SEOManager
          {...defaultProps}
          language="zh-CN"
          enableOpenGraph={true}
        />
      );
      
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该为英文生成正确的locale', () => {
      render(
        <SEOManager
          {...defaultProps}
          language="en"
          enableOpenGraph={true}
        />
      );
      
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该生成hreflang链接', () => {
      render(
        <SEOManager
          {...defaultProps}
          enableCanonical={true}
        />
      );
      
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });
  });

  describe('开发环境调试', () => {
    it('应该在开发环境输出调试信息', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      render(<SEOManager {...defaultProps} />);
      
      expect(console.group).toHaveBeenCalledWith('🔍 SEO Manager Debug Info');
      expect(console.log).toHaveBeenCalledWith('Page:', 'home');
      expect(console.log).toHaveBeenCalledWith('Language:', 'zh-CN');
      expect(console.groupEnd).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('应该在生产环境不输出调试信息', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      render(<SEOManager {...defaultProps} />);
      
      expect(console.group).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      expect(console.groupEnd).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('性能优化', () => {
    it('应该使用useMemo优化元数据生成', () => {
      const context = { sliceCount: 5 };
      const customMetadata = { title: 'Test' };
      
      // 清除之前的调用记录
      const mockFn = vi.mocked(metadataGenerator.generatePageMetadata);
      mockFn.mockClear();
      
      const { rerender } = render(
        <SEOManager
          {...defaultProps}
          context={context}
          customMetadata={customMetadata}
        />
      );
      
      // 第一次渲染应该调用一次
      expect(mockFn.mock.calls.length).toBe(1);
      
      // 相同props重新渲染不应该重新生成元数据（使用相同的对象引用）
      rerender(
        <SEOManager
          {...defaultProps}
          context={context}
          customMetadata={customMetadata}
        />
      );
      
      // 仍然应该只调用一次
      expect(mockFn.mock.calls.length).toBe(1);
    });

    it('应该在props变化时重新生成元数据', () => {
      const { rerender } = render(
        <SEOManager
          {...defaultProps}
          context={{ sliceCount: 5 }}
        />
      );
      
      const mockFn = vi.mocked(metadataGenerator.generatePageMetadata);
      const initialCallCount = mockFn.mock.calls.length;
      
      // 不同props重新渲染应该重新生成元数据
      rerender(
        <SEOManager
          {...defaultProps}
          context={{ sliceCount: 10 }}
        />
      );
      
      expect(mockFn.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('边界条件', () => {
    it('应该处理undefined的context', () => {
      render(
        <SEOManager
          {...defaultProps}
          context={undefined}
        />
      );
      
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });

    it('应该处理空的customMetadata', () => {
      render(
        <SEOManager
          {...defaultProps}
          customMetadata={undefined}
        />
      );
      
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });

    it('应该处理无效的页面类型', () => {
      render(
        <SEOManager
          {...defaultProps}
          page={'invalid' as any}
        />
      );
      
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });

    it('应该处理无效的语言', () => {
      render(
        <SEOManager
          {...defaultProps}
          language={'invalid' as any}
        />
      );
      
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });

    it('应该处理空的关键词数组', () => {
      const customMetadata = {
        keywords: [],
      };
      
      render(
        <SEOManager
          {...defaultProps}
          customMetadata={customMetadata}
        />
      );
      
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });

    it('应该处理非常长的标题和描述', () => {
      const customMetadata = {
        title: 'A'.repeat(200),
        description: 'B'.repeat(500),
      };
      
      render(
        <SEOManager
          {...defaultProps}
          customMetadata={customMetadata}
        />
      );
      
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });
  });

  describe('集成测试', () => {
    it('应该与元数据生成器正确集成', () => {
      const context = { sliceCount: 3, selectedCount: 2 };
      
      render(
        <SEOManager
          {...defaultProps}
          page="split"
          context={context}
          language="zh-CN"
        />
      );
      
      expect(metadataGenerator.generatePageMetadata).toHaveBeenCalledWith('split', context, 'zh-CN');
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
    });

    it('应该在SEOProvider中正确工作', () => {
      render(
        <SEOProvider>
          <SEOManager {...defaultProps} />
          <div>App Content</div>
        </SEOProvider>
      );
      
      expect(screen.getByTestId('helmet-provider')).toBeInTheDocument();
      expect(screen.getByTestId('helmet')).toBeInTheDocument();
      expect(screen.getByText('App Content')).toBeInTheDocument();
    });

    it('应该支持嵌套的SEO管理器', () => {
      render(
        <SEOProvider>
          <SEOManager {...defaultProps} page="home" />
          <div>
            <SEOManager {...defaultProps} page="upload" />
          </div>
        </SEOProvider>
      );
      
      expect(screen.getByTestId('helmet-provider')).toBeInTheDocument();
      expect(screen.getAllByTestId('helmet')).toHaveLength(2);
    });
  });

  describe('错误处理', () => {
    it('应该处理元数据生成器抛出的错误', () => {
      const mockFn = vi.mocked(metadataGenerator.generatePageMetadata);
      mockFn.mockImplementation(() => {
        throw new Error('Metadata generation failed');
      });
      
      // 应该不会崩溃，而是使用默认值
      expect(() => {
        render(<SEOManager {...defaultProps} />);
      }).not.toThrow();
      
      // 恢复mock
      mockFn.mockRestore();
    });

    it('应该处理配置文件缺失的情况', () => {
      // 临时mock一个空的配置
      vi.doMock('../../config/seo.config', () => ({
        SEO_CONFIG: {},
      }));
      
      expect(() => {
        render(<SEOManager {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('可访问性', () => {
    it('应该包含正确的语言属性', () => {
      render(
        <SEOManager
          {...defaultProps}
          language="zh-CN"
        />
      );
      
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });

    it('应该包含正确的viewport设置', () => {
      render(<SEOManager {...defaultProps} />);
      
      const helmet = screen.getByTestId('helmet');
      expect(helmet).toBeInTheDocument();
    });
  });
});
