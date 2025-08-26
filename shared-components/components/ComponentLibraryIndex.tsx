/**
 * 组件库索引页面
 * 展示所有可用组件的信息和演示
 */

import React, { useState, useEffect } from 'react';
import { ComponentInfo } from '../interfaces/ComponentInterface';
import './ComponentLibraryIndex.css';

interface ComponentDemo {
  id: string;
  info: ComponentInfo;
  demoUrl?: string;
  sourceUrl?: string;
  documentationUrl?: string;
  tags: string[];
  category: string;
  screenshots?: string[];
}

const ComponentLibraryIndex: React.FC = () => {
  const [components, setComponents] = useState<ComponentDemo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // 模拟组件数据
  useEffect(() => {
    const mockComponents: ComponentDemo[] = [
      {
        id: 'screenshot-splitter',
        info: {
          id: 'screenshot-splitter',
          name: '长截图分割工具',
          version: '1.0.0',
          description: '智能分割长截图为多个部分，支持自动检测分割点和手动调整',
          author: 'CodeBuddy',
          dependencies: ['react', 'typescript']
        },
        demoUrl: '/screenshot-splitter',
        sourceUrl: 'https://github.com/your-repo/packages/screenshot-splitter',
        documentationUrl: '/docs/screenshot-splitter',
        tags: ['图片处理', '工具', '截图'],
        category: 'utilities',
        screenshots: ['/assets/screenshot-splitter-demo.png']
      },
      {
        id: 'shared-components',
        info: {
          id: 'shared-components',
          name: '共享组件库',
          version: '1.0.0',
          description: '提供组件间通信、状态管理等基础功能的共享组件库',
          author: 'CodeBuddy',
          dependencies: ['typescript']
        },
        sourceUrl: 'https://github.com/your-repo/packages/shared-components',
        documentationUrl: '/docs/shared-components',
        tags: ['基础库', '通信', '状态管理'],
        category: 'infrastructure'
      }
    ];

    setTimeout(() => {
      setComponents(mockComponents);
      setLoading(false);
    }, 1000);
  }, []);

  // 获取所有分类
  const categories = ['all', ...Array.from(new Set(components.map(c => c.category)))];

  // 过滤组件
  const filteredComponents = components.filter(component => {
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      component.info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.info.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const getCategoryDisplayName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'all': '全部',
      'utilities': '工具类',
      'infrastructure': '基础设施',
      'ui': 'UI组件',
      'business': '业务组件'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="component-library-loading">
        <div className="loading-spinner"></div>
        <p>正在加载组件库...</p>
      </div>
    );
  }

  return (
    <div className="component-library-index">
      <header className="library-header">
        <h1>组件库索引</h1>
        <p className="library-description">
          探索我们的组件库，每个组件都经过精心设计，支持独立使用和组合开发
        </p>
      </header>

      <div className="library-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="搜索组件..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-section">
          <label>分类筛选：</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryDisplayName(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="components-grid">
        {filteredComponents.length === 0 ? (
          <div className="no-components">
            <p>没有找到匹配的组件</p>
          </div>
        ) : (
          filteredComponents.map(component => (
            <div key={component.id} className="component-card">
              <div className="component-header">
                <h3 className="component-name">{component.info.name}</h3>
                <span className="component-version">v{component.info.version}</span>
              </div>

              <div className="component-description">
                <p>{component.info.description}</p>
              </div>

              <div className="component-tags">
                {component.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <div className="component-meta">
                <div className="meta-item">
                  <strong>作者：</strong> {component.info.author}
                </div>
                <div className="meta-item">
                  <strong>分类：</strong> {getCategoryDisplayName(component.category)}
                </div>
                {component.info.dependencies && (
                  <div className="meta-item">
                    <strong>依赖：</strong> {component.info.dependencies.join(', ')}
                  </div>
                )}
              </div>

              <div className="component-actions">
                {component.demoUrl && (
                  <a
                    href={component.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button demo-button"
                  >
                    在线演示
                  </a>
                )}
                {component.sourceUrl && (
                  <a
                    href={component.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button source-button"
                  >
                    查看源码
                  </a>
                )}
                {component.documentationUrl && (
                  <a
                    href={component.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button docs-button"
                  >
                    查看文档
                  </a>
                )}
              </div>

              {component.screenshots && component.screenshots.length > 0 && (
                <div className="component-screenshots">
                  {component.screenshots.map((screenshot, index) => (
                    <img
                      key={index}
                      src={screenshot}
                      alt={`${component.info.name} 截图 ${index + 1}`}
                      className="screenshot"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <footer className="library-footer">
        <div className="stats">
          <div className="stat-item">
            <strong>{components.length}</strong>
            <span>总组件数</span>
          </div>
          <div className="stat-item">
            <strong>{categories.length - 1}</strong>
            <span>分类数</span>
          </div>
          <div className="stat-item">
            <strong>{filteredComponents.length}</strong>
            <span>当前显示</span>
          </div>
        </div>
        
        <div className="footer-links">
          <a href="/docs" className="footer-link">开发文档</a>
          <a href="/contributing" className="footer-link">贡献指南</a>
          <a href="https://github.com/your-repo" className="footer-link">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default ComponentLibraryIndex;