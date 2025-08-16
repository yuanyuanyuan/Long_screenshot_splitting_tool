# 修复 TypeScript 构建错误

## Core Features

- 修复 PerformanceOptimizer.tsx 类型错误

- 修复 performanceMonitor.ts 类型错误

- 确保构建成功

- 保持功能完整性

## Tech Stack

{
  "Web": {
    "arch": "react",
    "component": null
  },
  "language": "TypeScript",
  "build_tool": "Vite",
  "package_manager": "pnpm"
}

## Design

无需 UI 设计，专注于代码修复

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] 检查并分析 PerformanceOptimizer.tsx 文件中的具体 TypeScript 错误

[X] 修复 PerformanceOptimizer.tsx 中的 lazyItem.error 属性类型问题

[X] 修复 PerformanceOptimizer.tsx 中的 ref 类型转换问题

[X] 检查并分析 performanceMonitor.ts 文件中的具体 TypeScript 错误

[X] 修复 performanceMonitor.ts 中的 INPMetric 类型不匹配问题

[X] 修复 performanceMonitor.ts 中的 Record<string, unknown> 类型转换问题

[X] 修复 performanceMonitor.ts 中的 Navigator 类型断言问题

[X] 验证修复后的代码类型正确性

[X] 执行 pnpm run build 验证构建成功
