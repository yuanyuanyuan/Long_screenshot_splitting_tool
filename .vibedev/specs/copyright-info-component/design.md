# 版权信息组件设计文档

## 概述
版权信息组件是一个可配置的React组件，用于在页面右上角显示著作权保留信息和联系信息，支持中英文切换，主要用于引流和版权声明。

## 架构设计

### 组件结构
```
packages/shared-components/src/
├── components/
│   └── CopyrightInfo/
│       ├── CopyrightInfo.tsx          # 主组件
│       ├── CopyrightInfo.module.css   # 样式文件
│       ├── CopyrightInfo.test.tsx     # 测试文件
│       ├── index.ts                   # 组件导出
│       └── types.ts                   # 类型定义
├── config/
│   └── defaultConfig.ts               # 默认配置
└── locales/                           # 国际化资源
    ├── en.json
    └── zh-CN.json
```

### 技术栈
- **框架**: React 18+ with TypeScript
- **样式**: Tailwind CSS + CSS Modules
- **国际化**: 独立i18n系统（不依赖screenshot-splitter的i18n）
- **测试**: Jest + React Testing Library
- **架构**: 遵循shared-components的组件接口规范

### 技术栈
- **框架**: React 18+ with TypeScript
- **样式**: Tailwind CSS + CSS Modules
- **国际化**: 集成现有i18n系统
- **测试**: Jest + React Testing Library

## 组件接口设计

### Props接口
```typescript
interface CopyrightInfoProps extends Partial<IComponent> {
  // 基础配置
  config?: Partial<CopyrightConfig>;
  className?: string;
  
  // 显示控制
  showByDefault?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  // 交互控制
  onLinkClick?: (linkType: string, url: string) => void;
  onVisibilityChange?: (visible: boolean) => void;
  
  // 组件通信
  componentId?: string;
  onMessage?: (message: ComponentMessage) => void;
  onEvent?: (event: ComponentEvent) => void;
}
```

### 配置接口
```typescript
interface CopyrightConfig extends ComponentConfig {
  // 版权信息
  copyright: {
    text: string;
    year: number;
    company: string;
  };
  
  // 联系信息
  contact: {
    website?: string;
    email?: string;
    social?: Array<{
      platform: string;
      url: string;
      icon: string;
    }>;
  };
  
  // 显示选项
  display: {
    showCopyright: boolean;
    showContact: boolean;
    showSocial: boolean;
    compactMode: boolean;
  };
  
  // 样式配置
  style: {
    theme: 'light' | 'dark' | 'auto';
    backgroundColor: string;
    textColor: string;
    linkColor: string;
  };
}
```

## 数据模型

### 国际化数据结构
在现有的locales文件中添加：

**en.json**
```json
{
  "copyright.title": "Copyright",
  "copyright.text": "© {year} {company}. All rights reserved.",
  "contact.website": "Visit our website",
  "contact.email": "Contact us",
  "social.follow": "Follow us"
}
```

**zh-CN.json**
```json
{
  "copyright.title": "版权信息",
  "copyright.text": "© {year} {company} 版权所有",
  "contact.website": "访问网站",
  "contact.email": "联系我们",
  "social.follow": "关注我们"
}
```

### 默认配置
```typescript
const defaultConfig: CopyrightConfig = {
  copyright: {
    text: "copyright.text",
    year: new Date().getFullYear(),
    company: "Your Company"
  },
  contact: {
    website: "https://example.com",
    email: "contact@example.com"
  },
  display: {
    showCopyright: true,
    showContact: true,
    showSocial: false,
    compactMode: false
  },
  style: {
    theme: "auto",
    backgroundColor: "bg-white dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    linkColor: "text-blue-600 dark:text-blue-400"
  }
};
```

## 组件设计

### 主组件结构
```tsx
function CopyrightInfo({
  config = {},
  className = "",
  showByDefault = true,
  position = "top-right",
  onLinkClick,
  onVisibilityChange,
  componentId = 'copyright-info',
  onMessage,
  onEvent
}: CopyrightInfoProps) {
  const [isVisible, setIsVisible] = useState(showByDefault);
  const [isHovered, setIsHovered] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('zh-CN');
  
  // 合并配置
  const mergedConfig = useMemo(() => ({
    ...defaultConfig,
    ...config
  }), [config]);
  
  // 处理链接点击
  const handleLinkClick = useCallback((linkType: string, url: string) => {
    onLinkClick?.(linkType, url);
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // 发送事件通知
    onEvent?.({
      type: 'link_click',
      source: componentId,
      payload: { linkType, url },
      timestamp: Date.now()
    });
  }, [onLinkClick, onEvent, componentId]);
  
  // 国际化处理函数
  const t = useCallback((key: string, params?: Record<string, any>) => {
    const translations = currentLanguage === 'zh-CN' ? zhCN : en;
    let text = translations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, String(value));
      });
    }
    
    return text;
  }, [currentLanguage]);
  
  // 渲染逻辑...
}
```

### 响应式设计
```css
/* 桌面端 */
.copyright-container {
  position: fixed;
  z-index: 1000;
  padding: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 移动端 */
@media (max-width: 768px) {
  .copyright-container {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
```

## 错误处理

### 错误类型
1. **配置错误**: 无效的配置参数
2. **国际化错误**: 缺少翻译键
3. **渲染错误**: 组件渲染失败

### 错误处理策略
```typescript
const useCopyrightInfo = (config: Partial<CopyrightConfig>) => {
  try {
    // 验证配置
    validateConfig(config);
    
    // 处理国际化
    const translatedConfig = translateConfig(config);
    
    return { config: translatedConfig, error: null };
  } catch (error) {
    console.error('CopyrightInfo configuration error:', error);
    return { config: defaultConfig, error };
  }
};
```

## 测试策略

### 单元测试覆盖
```typescript
describe('CopyrightInfo', () => {
  it('应该正确渲染版权信息', () => {});
  it('应该支持中英文切换', () => {});
  it('应该处理配置错误', () => {});
  it('应该响应点击事件', () => {});
  it('应该适应不同屏幕尺寸', () => {});
});

describe('CopyrightConfig', () => {
  it('应该验证配置有效性', () => {});
  it('应该合并默认配置', () => {});
  it('应该处理国际化文本', () => {});
});
```

### 集成测试
- 与现有i18n系统的集成
- 与现有样式系统的集成
- 与现有导航结构的集成

## 性能优化

### 优化策略
1. **React.memo**: 避免不必要的重渲染
2. **useMemo**: 缓存配置计算结果
3. **useCallback**: 缓存事件处理函数
4. **懒加载**: 支持动态导入

### 性能监控
```typescript
const CopyrightInfo = memo((props: CopyrightInfoProps) => {
  // 组件实现
}, (prevProps, nextProps) => {
  // 自定义比较逻辑
  return prevProps.config === nextProps.config &&
         prevProps.className === nextProps.className;
});
```

## 集成方案

### 在App.tsx中的集成
```tsx
import { CopyrightInfo } from './components/CopyrightInfo';

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 现有内容 */}
      <CopyrightInfo
        position="top-right"
        config={{
          copyright: {
            company: "Tencent"
          },
          contact: {
            website: "https://cloud.tencent.com",
            email: "contact@tencent.com"
          }
        }}
      />
    </div>
  );
}
```

### 配置管理
支持通过环境变量或配置文件进行自定义：
```typescript
// 从环境变量读取配置
const config = {
  copyright: {
    company: process.env.VITE_APP_COMPANY_NAME || 'Tencent',
    year: parseInt(process.env.VITE_APP_COPYRIGHT_YEAR) || new Date().getFullYear()
  }
};
```

## 部署考虑

### 构建优化
- 代码分割支持
- Tree shaking友好
- 类型安全保证

### 浏览器兼容性
- 支持现代浏览器
- 渐进增强设计
- 无障碍访问支持

## 安全考虑

1. **XSS防护**: 对用户输入进行转义
2. **链接安全**: 使用rel="noopener noreferrer"
3. **数据验证**: 验证配置参数有效性

这个设计文档涵盖了版权信息组件的所有关键方面，确保了组件的可配置性、国际化支持和无缝集成。