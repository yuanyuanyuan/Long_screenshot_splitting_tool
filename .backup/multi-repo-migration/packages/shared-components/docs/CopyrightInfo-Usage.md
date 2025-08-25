# CopyrightInfo 组件使用文档

## 概述

CopyrightInfo 是一个用于显示版权信息和联系信息的React组件，支持中英文国际化配置，可用于著作权保留、引流和品牌展示。

## 安装和导入

### 安装依赖
```bash
pnpm add shared-components
```

### 导入组件
```typescript
import { CopyrightInfo } from 'shared-components';
```

## 基本用法

### 最简单的用法
```typescript
<CopyrightInfo 
  author="Your Name"
  toolName="Your App Name"
/>
```

### 完整配置示例
```typescript
<CopyrightInfo
  author="Tencent"
  email="contact@example.com"
  website="https://example.com"
  toolName="Screenshot Splitter Tool"
  license="MIT License"
  attributionText="Please include attribution when sharing"
  year={2025}
  showCopyrightSymbol={true}
  showContactInfo={true}
  showWebsiteLink={true}
  showPoweredBy={true}
  showLicense={false}
  showAttribution={false}
  language="en"
  className="custom-copyright"
  onClick={(e) => console.log('Copyright info clicked', e)}
/>
```

## Props 配置

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `author` | `string` | - | 作者名称 |
| `email` | `string` | - | 作者邮箱 |
| `website` | `string` | - | 网站URL |
| `toolName` | `string` | - | 工具/应用名称 |
| `license` | `string` | - | 许可协议名称 |
| `attributionText` | `string` | - | 署名要求文本 |
| `year` | `number` | 当前年份 | 版权年份 |
| `showCopyrightSymbol` | `boolean` | `true` | 是否显示版权符号 © |
| `showContactInfo` | `boolean` | `true` | 是否显示联系信息 |
| `showWebsiteLink` | `boolean` | `true` | 是否显示网站链接 |
| `showPoweredBy` | `boolean` | `true` | 是否显示技术支持信息 |
| `showLicense` | `boolean` | `false` | 是否显示许可协议 |
| `showAttribution` | `boolean` | `false` | 是否显示署名要求 |
| `language` | `'zh-CN' \| 'en'` | 自动检测 | 显示语言 |
| `className` | `string` | - | 自定义CSS类名 |
| `onClick` | `(event: React.MouseEvent) => void` | - | 点击事件回调 |

## 国际化支持

组件内置中英文支持：

- **中文 (zh-CN)**: 显示中文文本
- **英文 (en)**: 显示英文文本

### 语言检测规则
1. 优先使用 `language` prop 指定的语言
2. 如果没有指定，自动检测浏览器语言
3. 默认使用英文

## 样式定制

### 默认样式
组件使用CSS模块，包含以下CSS类：
- `.copyright-info`: 容器
- `.copyright-text`: 版权文本
- `.contact-info`: 联系信息
- `.website-link`: 网站链接
- `.powered-by`: 技术支持信息

### 自定义样式
```css
.custom-copyright {
  font-size: 12px;
  color: #666;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.custom-copyright:hover {
  opacity: 1;
}
```

## 最佳实践

### 在页面右上角显示
```typescript
<header className="relative">
  <div className="absolute top-4 right-4 z-10">
    <CopyrightInfo
      author="Your Company"
      email="contact@example.com"
      website="https://example.com"
      toolName="Your App"
      showLicense={false}
      showAttribution={false}
    />
  </div>
  {/* 页面其他内容 */}
</header>
```

### 页脚显示
```typescript
<footer className="text-center py-4">
  <CopyrightInfo
    author="Your Company"
    website="https://example.com"
    toolName="Your App"
    showContactInfo={false}
    showWebsiteLink={true}
  />
</footer>
```

## 示例配置

### 简约配置
```typescript
<CopyrightInfo
  author="Tencent"
  toolName="Screenshot Splitter"
  showContactInfo={false}
  showWebsiteLink={false}
/>
```

### 完整配置
```typescript
<CopyrightInfo
  author="Tencent"
  email="contact@tencent.com"
  website="https://tencent.com"
  toolName="Screenshot Splitter Tool"
  license="Apache 2.0"
  attributionText="Made with ❤️ by Tencent"
  showCopyrightSymbol={true}
  showContactInfo={true}
  showWebsiteLink={true}
  showPoweredBy={true}
  showLicense={true}
  showAttribution={true}
  language="zh-CN"
/>
```

## 注意事项

1. **SEO友好**: 组件使用语义化HTML标签，有利于搜索引擎优化
2. **无障碍访问**: 包含适当的ARIA标签和键盘导航支持
3. **响应式设计**: 适配不同屏幕尺寸
4. **性能优化**: 使用React.memo进行性能优化

## 故障排除

### 常见问题

1. **类型错误**: 确保正确安装和导入shared-components
2. **样式不生效**: 检查CSS类名是否正确应用
3. **国际化不工作**: 确认语言配置是否正确

### 技术支持

如有问题，请联系开发团队或查看项目文档。