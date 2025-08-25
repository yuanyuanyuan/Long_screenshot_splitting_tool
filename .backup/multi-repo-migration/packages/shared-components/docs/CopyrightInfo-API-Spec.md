# CopyrightInfo 组件 API 规范

## 组件概述

**CopyrightInfo** 是一个用于显示版权信息和联系信息的React组件，支持中英文国际化配置。

## 组件标识

- **组件名称**: CopyrightInfo
- **包名**: shared-components
- **版本**: 1.0.0
- **类型**: React Function Component

## Props 接口规范

### 基础信息属性

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `author` | `string` | 否 | - | 作者/组织名称 |
| `email` | `string` | 否 | - | 联系邮箱 |
| `website` | `string` | 否 | - | 官方网站URL |
| `toolName` | `string` | 否 | - | 工具/应用名称 |
| `license` | `string` | 否 | - | 许可协议名称 |
| `attributionText` | `string` | 否 | - | 署名要求文本 |
| `year` | `number` | 否 | 当前年份 | 版权年份 |

### 显示控制属性

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `showCopyrightSymbol` | `boolean` | 否 | `true` | 是否显示版权符号 © |
| `showContactInfo` | `boolean` | 否 | `true` | 是否显示联系信息 |
| `showWebsiteLink` | `boolean` | 否 | `true` | 是否显示网站链接 |
| `showPoweredBy` | `boolean` | 否 | `true` | 是否显示技术支持信息 |
| `showLicense` | `boolean` | 否 | `false` | 是否显示许可协议 |
| `showAttribution` | `boolean` | 否 | `false` | 是否显示署名要求 |

### 样式和交互属性

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `className` | `string` | 否 | - | 自定义CSS类名 |
| `language` | `'zh-CN' \| 'en'` | 否 | 自动检测 | 显示语言 |
| `onClick` | `(event: React.MouseEvent) => void` | 否 | - | 点击事件回调 |

## 类型定义

```typescript
export interface CopyrightInfoProps {
  // 基础信息
  author?: string;
  email?: string;
  website?: string;
  toolName?: string;
  license?: string;
  attributionText?: string;
  year?: number;
  
  // 显示控制
  showCopyrightSymbol?: boolean;
  showContactInfo?: boolean;
  showWebsiteLink?: boolean;
  showPoweredBy?: boolean;
  showLicense?: boolean;
  showAttribution?: boolean;
  
  // 样式和交互
  className?: string;
  language?: 'zh-CN' | 'en';
  onClick?: (event: React.MouseEvent) => void;
}
```

## 国际化资源规范

### 中文资源 (zh-CN.json)
```json
{
  "copyright": "版权所有 © {year} {author}",
  "contact": "联系: {email}",
  "website": "网站: {website}",
  "poweredBy": "技术支持: {toolName}",
  "license": "许可协议: {license}",
  "attribution": "署名要求: {attributionText}"
}
```

### 英文资源 (en.json)
```json
{
  "copyright": "Copyright © {year} {author}",
  "contact": "Contact: {email}",
  "website": "Website: {website}",
  "poweredBy": "Powered by: {toolName}",
  "license": "License: {license}",
  "attribution": "Attribution: {attributionText}"
}
```

## 默认配置

```typescript
export const defaultCopyrightConfig: Partial<CopyrightInfoProps> = {
  showCopyrightSymbol: true,
  showContactInfo: true,
  showWebsiteLink: true,
  showPoweredBy: true,
  showLicense: false,
  showAttribution: false,
  year: new Date().getFullYear(),
  language: 'en'
};
```

## 组件方法

### 静态方法
无静态方法，组件为纯展示组件。

### 实例方法
无实例方法，组件使用函数式组件实现。

## 事件接口

### onClick 事件
- **类型**: `(event: React.MouseEvent) => void`
- **描述**: 当用户点击组件时触发
- **参数**: 标准的React鼠标事件对象

## 样式接口

### CSS 类名结构
```css
.copyright-info          /* 根容器 */
.copyright-info__text    /* 版权文本 */
.copyright-info__contact /* 联系信息 */
.copyright-info__website /* 网站链接 */
.copyright-info__powered /* 技术支持信息 */
.copyright-info__license /* 许可协议信息 */
.copyright-info__attribution /* 署名要求信息 */
```

### 自定义样式示例
```css
.custom-copyright {
  font-size: 12px;
  color: #666;
  opacity: 0.8;
}

.custom-copyright:hover {
  opacity: 1;
}
```

## 错误处理

### 输入验证
- 所有属性均为可选
- 空值或未定义属性将被忽略
- 无效的URL格式不会导致错误，但链接可能无法正常工作

### 边界情况处理
- 如果未提供作者信息，版权信息将不显示
- 如果未提供邮箱，联系信息将不显示
- 如果未提供网站URL，网站链接将不显示

## 性能考虑

### 渲染优化
- 使用React.memo进行记忆化渲染
- 仅在props发生变化时重新渲染
- 轻量级DOM结构

### 内存使用
- 无内部状态管理
- 无副作用操作
- 最小化的依赖关系

## 浏览器兼容性

### 支持的浏览器
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

### 功能特性
- 支持现代CSS特性
- 响应式设计
- 无障碍访问支持

## 测试规范

### 单元测试覆盖
- Props传递验证
- 国际化功能测试
- 显示/隐藏逻辑测试
- 点击事件测试

### 集成测试
- 与其他组件集成测试
- 样式应用测试
- 性能基准测试

## 版本历史

### v1.0.0 (2025-08-25)
- 初始版本发布
- 支持基础版权信息显示
- 中英文国际化支持
- 可配置的显示选项

## 依赖关系

### 运行时依赖
- React ^19.1.1
- React-DOM ^19.1.1

### 开发依赖
- TypeScript ~5.8.3
- @types/react ^19.1.9

## 使用限制

### 技术限制
- 仅支持React 19+版本
- 需要支持ES6+的浏览器环境

### 功能限制
- 不支持服务端渲染(SSR)
- 不支持动态语言切换（需要重新渲染）

## 扩展建议

### 未来功能
- 支持更多语言
- 支持主题定制
- 支持服务端渲染
- 支持动画效果

### 自定义扩展
开发者可以通过包装组件或创建高阶组件来扩展功能。