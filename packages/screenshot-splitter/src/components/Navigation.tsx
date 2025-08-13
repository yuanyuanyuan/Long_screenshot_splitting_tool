/**
 * 导航组件 - 提供路由导航和面包屑功能
 */

import React from 'react';
import { useRouter } from '../hooks/useRouter';
import './Navigation.css';

interface NavigationItem {
  path: string;
  name: string;
  icon?: string;
  disabled?: boolean;
}

interface NavigationProps {
  items?: NavigationItem[];
  showBreadcrumb?: boolean;
  className?: string;
}

// 默认导航项
const defaultNavigationItems: NavigationItem[] = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/upload', name: '上传', icon: '📤' },
  { path: '/split', name: '分割', icon: '✂️' },
  { path: '/export', name: '导出', icon: '💾' }
];

export const Navigation: React.FC<NavigationProps> = ({
  items = defaultNavigationItems,
  showBreadcrumb = true,
  className = ''
}) => {
  const { currentPath, push, isActive } = useRouter();

  const handleNavClick = (path: string, disabled?: boolean) => {
    if (!disabled) {
      push(path);
    }
  };

  // 生成面包屑
  const generateBreadcrumb = () => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    const breadcrumbItems = [{ path: '/', name: '首页' }];

    let currentBreadcrumbPath = '';
    pathSegments.forEach(segment => {
      currentBreadcrumbPath += `/${segment}`;
      const item = items.find(item => item.path === currentBreadcrumbPath);
      if (item) {
        breadcrumbItems.push({
          path: currentBreadcrumbPath,
          name: item.name
        });
      }
    });

    return breadcrumbItems;
  };

  return (
    <nav className={`navigation ${className}`}>
      {/* 面包屑导航 */}
      {showBreadcrumb && (
        <div className="breadcrumb">
          {generateBreadcrumb().map((item, index, array) => (
            <React.Fragment key={item.path}>
              <button
                className={`breadcrumb-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                disabled={isActive(item.path)}
              >
                {item.name}
              </button>
              {index < array.length - 1 && (
                <span className="breadcrumb-separator">›</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 主导航 */}
      <div className="nav-items">
        {items.map(item => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => handleNavClick(item.path, item.disabled)}
            disabled={item.disabled}
            title={item.name}
          >
            {item.icon && <span className="nav-icon">{item.icon}</span>}
            <span className="nav-text">{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;