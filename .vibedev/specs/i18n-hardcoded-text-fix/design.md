# 国际化硬编码文本修复 - 技术设计文档

## 概述

本设计文档详细描述了如何彻底解决长截图分割工具中英语语言切换不完全的问题。通过系统性分析，我们发现问题的根本原因是多个组件中存在硬编码的中文文本，这些文本没有通过国际化系统进行处理。

### 问题分析

**发现的硬编码文本位置**：
1. `ImagePreview.tsx` - 主要问题源头
2. `ExportControls.tsx` - 部分硬编码文本
3. `DebugPanel.tsx` - 调试相关文本
4. `ScreenshotSplitter.tsx` - 状态显示文本

**根本原因**：
- 组件没有引入国际化系统 (`useI18nContext`)
- 测试用例只验证函数调用，未验证实际DOM渲染内容
- 缺乏硬编码文本检测机制

## 架构设计

### 现有国际化架构
```mermaid
graph TD
    A[I18nProvider] --> B[useI18nContext Hook]
    B --> C[t() 翻译函数]
    C --> D[语言包 en.json/zh-CN.json]
    
    E[组件] --> F{是否使用useI18nContext?}
    F -->|是| G[正确国际化]
    F -->|否| H[硬编码文本问题]
```

### 修复后的架构
```mermaid
graph TD
    A[I18nProvider] --> B[useI18nContext Hook]
    B --> C[t() 翻译函数]
    C --> D[语言包 en.json/zh-CN.json]
    
    E[所有组件] --> B
    F[硬编码检测工具] --> G[构建时验证]
    H[测试用例] --> I[DOM内容验证]
    J[开发指南] --> K[防止新问题]
```

## 组件和接口设计

### 1. ImagePreview.tsx 修复

**当前问题**：
```typescript
// 硬编码文本
<h3>切片预览 ({slices.length}个)</h3>
<p>点击切片进行选择，选中的切片将用于导出</p>
```

**修复方案**：
```typescript
// 国际化处理
const { t } = useI18nContext();
<h3>{t('preview.slicePreview', { count: slices.length })}</h3>
<p>{t('preview.selectInstruction')}</p>
```

**需要添加的语言包键值**：
```json
// zh-CN.json
{
  "preview.slicePreview": "切片预览 ({count}个)",
  "preview.selectInstruction": "点击切片进行选择，选中的切片将用于导出",
  "preview.noPreview": "暂无图片预览",
  "preview.uploadFirst": "请先上传一张图片进行处理",
  "preview.selectAll": "全选",
  "preview.deselectAll": "取消全选",
  "preview.sliceNumber": "切片 {number}",
  "preview.selectionSummary": "已选择 {count} 个切片，可以进行导出操作"
}

// en.json
{
  "preview.slicePreview": "Slice Preview ({count} slices)",
  "preview.selectInstruction": "Click slices to select, selected slices will be exported",
  "preview.noPreview": "No image preview available",
  "preview.uploadFirst": "Please upload an image first",
  "preview.selectAll": "Select All",
  "preview.deselectAll": "Deselect All", 
  "preview.sliceNumber": "Slice {number}",
  "preview.selectionSummary": "Selected {count} slices, ready for export"
}
```

### 2. 其他组件修复

**ExportControls.tsx**：
- `已选择 {count} 个切片` → `t('export.selectedCount', { count })`
- `请先选择要导出的切片` → `t('export.selectFirst')`

**DebugPanel.tsx**：
- `切片数量` → `t('debug.sliceCount')`
- `暂无切片数据` → `t('debug.noSliceData')`

## 数据模型

### 国际化键值结构
```typescript
interface I18nKeys {
  preview: {
    slicePreview: string;
    selectInstruction: string;
    noPreview: string;
    uploadFirst: string;
    selectAll: string;
    deselectAll: string;
    sliceNumber: string;
    selectionSummary: string;
  };
  export: {
    selectedCount: string;
    selectFirst: string;
  };
  debug: {
    sliceCount: string;
    noSliceData: string;
  };
}
```

### 组件接口更新
```typescript
// ImagePreview.tsx 不需要接口变更，只需内部实现修复
interface ImagePreviewProps {
  // 保持现有接口不变
  originalImage: HTMLImageElement | null;
  slices: ImageSlice[];
  selectedSlices: number[];
  onSelectionChange: (selectedIndices: number[]) => void;
  className?: string;
}
```

## 错误处理

### 1. 国际化上下文缺失处理
```typescript
export function useI18nContext(): I18nHookReturn {
  const context = useContext(I18nContext);
  
  if (!context) {
    // 提供更详细的错误信息
    throw new Error(
      'useI18nContext must be used within an I18nProvider. ' +
      'Make sure your component is wrapped with I18nProvider.'
    );
  }
  
  return context;
}
```

### 2. 翻译键缺失处理
```typescript
// 在 useI18n hook 中添加
const t = useCallback((key: string, params?: Record<string, any>) => {
  const translation = getNestedValue(currentMessages, key);
  
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key; // 返回键名作为后备
  }
  
  return interpolate(translation, params);
}, [currentMessages]);
```

### 3. 参数插值错误处理
```typescript
function interpolate(template: string, params?: Record<string, any>): string {
  if (!params) return template;
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    if (value === undefined || value === null) {
      console.warn(`Parameter missing for interpolation: ${key} in template: ${template}`);
      return match; // 保留原始占位符
    }
    return String(value);
  });
}
```

## 测试策略

### 1. 单元测试增强

**当前问题**：测试只验证函数调用，不验证实际渲染内容

**解决方案**：
```typescript
// ImagePreview.test.tsx
describe('ImagePreview 国际化', () => {
  it('应该正确显示中文文本', () => {
    const { container } = render(
      <I18nProvider>
        <ImagePreview slices={mockSlices} {...otherProps} />
      </I18nProvider>
    );
    
    // 验证实际DOM内容
    expect(screen.getByText('切片预览 (3个)')).toBeInTheDocument();
    expect(screen.getByText('点击切片进行选择，选中的切片将用于导出')).toBeInTheDocument();
  });
  
  it('应该正确显示英文文本', () => {
    const { container } = render(
      <I18nProvider initialLanguage="en">
        <ImagePreview slices={mockSlices} {...otherProps} />
      </I18nProvider>
    );
    
    // 验证英文内容
    expect(screen.getByText('Slice Preview (3 slices)')).toBeInTheDocument();
    expect(screen.getByText('Click slices to select, selected slices will be exported')).toBeInTheDocument();
  });
  
  it('应该支持语言动态切换', async () => {
    const { rerender } = render(
      <I18nProvider initialLanguage="zh-CN">
        <ImagePreview slices={mockSlices} {...otherProps} />
      </I18nProvider>
    );
    
    expect(screen.getByText('切片预览 (3个)')).toBeInTheDocument();
    
    // 切换语言
    rerender(
      <I18nProvider initialLanguage="en">
        <ImagePreview slices={mockSlices} {...otherProps} />
      </I18nProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Slice Preview (3 slices)')).toBeInTheDocument();
    });
  });
});
```

### 2. 集成测试

**语言切换端到端测试**：
```typescript
describe('语言切换集成测试', () => {
  it('应该在整个应用中正确切换语言', async () => {
    render(<App />);
    
    // 上传图片并分割
    await uploadAndSplitImage();
    
    // 验证中文显示
    expect(screen.getByText(/切片预览/)).toBeInTheDocument();
    
    // 切换到英语
    const languageSwitcher = screen.getByRole('button', { name: /language/i });
    fireEvent.click(languageSwitcher);
    fireEvent.click(screen.getByText('English'));
    
    // 验证英文显示
    await waitFor(() => {
      expect(screen.getByText(/Slice Preview/)).toBeInTheDocument();
    });
  });
});
```

### 3. 硬编码文本检测测试

```typescript
describe('硬编码文本检测', () => {
  it('不应该包含硬编码的中文文本', () => {
    const componentSource = fs.readFileSync('./src/components/ImagePreview.tsx', 'utf8');
    
    // 检测常见的硬编码中文模式
    const hardcodedPatterns = [
      /['"`][\u4e00-\u9fff]+.*['"`]/g, // 中文字符串
      /切片预览/g,
      /点击切片/g,
      /全选/g,
      /取消全选/g
    ];
    
    hardcodedPatterns.forEach(pattern => {
      const matches = componentSource.match(pattern);
      if (matches) {
        fail(`发现硬编码文本: ${matches.join(', ')}`);
      }
    });
  });
});
```

## 质量保证机制

### 1. 构建时检查

**创建硬编码检测脚本**：
```javascript
// scripts/detect-hardcoded-text.js
const fs = require('fs');
const path = require('path');

function detectHardcodedText(dir) {
  const files = fs.readdirSync(dir);
  const issues = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      issues.push(...detectHardcodedText(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检测硬编码中文
      const chineseRegex = /['"`][\u4e00-\u9fff]+.*['"`]/g;
      const matches = content.match(chineseRegex);
      
      if (matches) {
        issues.push({
          file: filePath,
          matches: matches
        });
      }
    }
  });
  
  return issues;
}

const issues = detectHardcodedText('./src');
if (issues.length > 0) {
  console.error('发现硬编码文本:');
  issues.forEach(issue => {
    console.error(`${issue.file}: ${issue.matches.join(', ')}`);
  });
  process.exit(1);
}
```

### 2. 开发指南

**国际化最佳实践**：
1. 所有用户可见文本必须使用 `t()` 函数
2. 组件必须引入 `useI18nContext`
3. 新增文本必须同时添加到所有语言包
4. 使用参数化模板处理动态内容
5. 提交前运行硬编码检测脚本

### 3. 代码审查检查清单

- [ ] 组件是否正确引入 `useI18nContext`
- [ ] 所有文本是否使用 `t()` 函数
- [ ] 语言包是否包含所有必要的键值
- [ ] 参数化模板是否正确实现
- [ ] 测试是否验证实际DOM内容

## 实施计划

### 阶段1：核心组件修复
1. 修复 `ImagePreview.tsx` 中的硬编码文本
2. 更新语言包添加缺失的键值
3. 编写针对性的单元测试

### 阶段2：其他组件修复
1. 修复 `ExportControls.tsx`
2. 修复 `DebugPanel.tsx` 
3. 修复 `ScreenshotSplitter.tsx`

### 阶段3：质量保证
1. 创建硬编码检测脚本
2. 集成到构建流程
3. 编写开发指南

### 阶段4：测试完善
1. 增强现有测试用例
2. 添加集成测试
3. 添加端到端语言切换测试

## 性能考虑

1. **懒加载语言包**：当前已实现，保持现状
2. **翻译函数缓存**：`useCallback` 优化翻译函数
3. **组件重渲染优化**：使用 `React.memo` 包装国际化组件
4. **参数插值优化**：缓存编译后的模板

## 向后兼容性

1. 保持现有组件接口不变
2. 保持现有国际化架构
3. 渐进式修复，不影响现有功能
4. 保持现有的语言包结构

## 风险评估

**低风险**：
- 组件接口保持不变
- 现有功能不受影响
- 渐进式修复策略

**中等风险**：
- 大量文本修改可能引入翻译错误
- 需要全面测试验证

**缓解措施**：
- 详细的测试覆盖
- 分阶段实施
- 代码审查机制