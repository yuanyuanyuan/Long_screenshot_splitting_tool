# [组件名] 组件

## 用途
一句话描述组件用途与场景。

## Props
| 名称 | 类型 | 必填 | 默认值 | 说明 |
| ---- | ---- | ---- | ------ | ---- |
| propA | string | 否 | '' | 示例 |

## 使用示例
```tsx
import { [组件名] } from '@shared/components';

export default function Demo() {
  return <[组件名] propA="value" />;
}
```

## 设计与交互
- 交互/状态/无障碍说明

## 样式
- 使用 CSS Modules：./[组件名].module.css
- 类名通过 styles['class'] 引用

## 测试
- 覆盖主要交互与边界情况（Vitest + RTL）

## 注意事项
- 性能/可访问性/国际化等