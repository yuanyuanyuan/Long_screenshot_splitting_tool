# 国际化硬编码文本修复 - 实施任务清单

## 任务概述

基于需求文档和设计文档，将国际化硬编码文本修复工作分解为具体的代码实施任务。每个任务都是可执行的代码修改步骤，支持测试驱动开发和增量实施。

## 实施任务清单

### 1. 修复 ImagePreview.tsx 组件的硬编码文本
- [x] 1.1 在 `packages/screenshot-splitter/src/components/ImagePreview.tsx` 中引入 `useI18nContext` hook
  - 添加 `import { useI18nContext } from '../hooks/useI18nContext';`
  - 在组件内部调用 `const { t } = useI18nContext();`
  - 引用需求文档中的"切片预览界面文本国际化"要求

- [x] 1.2 替换 ImagePreview.tsx 中的所有硬编码中文文本为国际化函数调用
  - 将 `切片预览 ({slices.length}个)` 替换为 `t('preview.slicePreview', { count: slices.length })`
  - 将 `点击切片进行选择，选中的切片将用于导出` 替换为 `t('preview.selectInstruction')`
  - 将 `暂无图片预览` 替换为 `t('preview.noPreview')`
  - 将 `请先上传一张图片进行处理` 替换为 `t('preview.uploadFirst')`
  - 将 `全选`/`取消全选` 替换为 `t('preview.selectAll')`/`t('preview.deselectAll')`
  - 将 `切片 {index + 1}` 替换为 `t('preview.sliceNumber', { number: index + 1 })`
  - 将 `已选择 {selectedSlices.length} 个切片，可以进行导出操作` 替换为 `t('preview.selectionSummary', { count: selectedSlices.length })`
  - 引用需求文档中的"硬编码文本识别与修复"要求

### 2. 更新语言包文件添加新的翻译键
- [x] 2.1 在 `packages/screenshot-splitter/src/locales/zh-CN.json` 中添加 ImagePreview 相关的中文翻译键
  - 添加 `preview.slicePreview`: "切片预览 ({count}个)"
  - 添加 `preview.selectInstruction`: "点击切片进行选择，选中的切片将用于导出"
  - 添加 `preview.noPreview`: "暂无图片预览"
  - 添加 `preview.uploadFirst`: "请先上传一张图片进行处理"
  - 添加 `preview.selectAll`: "全选"
  - 添加 `preview.deselectAll`: "取消全选"
  - 添加 `preview.sliceNumber`: "切片 {number}"
  - 添加 `preview.selectionSummary`: "已选择 {count} 个切片，可以进行导出操作"
  - 引用需求文档中的"语言包完整性验证"要求

- [x] 2.2 在 `packages/screenshot-splitter/src/locales/en.json` 中添加对应的英文翻译键
  - 添加 `preview.slicePreview`: "Slice Preview ({count} slices)"
  - 添加 `preview.selectInstruction`: "Click slices to select, selected slices will be exported"
  - 添加 `preview.noPreview`: "No image preview available"
  - 添加 `preview.uploadFirst`: "Please upload an image first"
  - 添加 `preview.selectAll`: "Select All"
  - 添加 `preview.deselectAll`: "Deselect All"
  - 添加 `preview.sliceNumber`: "Slice {number}"
  - 添加 `preview.selectionSummary`: "Selected {count} slices, ready for export"
  - 引用需求文档中的"语言包完整性验证"要求

### 3. 编写 ImagePreview 组件的国际化测试用例
- [x] 3.1 创建或更新 `packages/screenshot-splitter/src/components/__tests__/ImagePreview.test.tsx` 文件
  - 编写测试验证中文环境下所有文本正确显示
  - 编写测试验证英文环境下所有文本正确显示
  - 编写测试验证参数化文本（{count}, {number}）正确渲染
  - 编写测试验证语言动态切换后DOM内容更新
  - 引用需求文档中的"测试覆盖率与实际效果一致性"要求

- [x] 3.2 确保测试用例验证实际DOM内容而非仅函数调用
  - 使用 `screen.getByText()` 验证实际渲染的文本内容
  - 使用 `waitFor()` 验证语言切换后的异步更新
  - 模拟真实的 I18nProvider 环境进行测试
  - 引用需求文档中的"测试覆盖率与实际效果一致性"要求

### 4. 修复 ExportControls.tsx 组件的硬编码文本
- [ ] 4.1 在 `packages/screenshot-splitter/src/components/ExportControls.tsx` 中引入国际化系统
  - 添加 `useI18nContext` hook 导入和调用
  - 将 `已选择 {selectedSlices.length} 个切片，选择导出格式和参数` 替换为国际化调用
  - 将 `请先选择要导出的切片` 替换为国际化调用
  - 引用需求文档中的"硬编码文本识别与修复"要求

- [ ] 4.2 更新语言包文件添加 ExportControls 相关翻译键
  - 在两个语言包中添加 `export.selectedSlicesInfo` 和 `export.selectSlicesFirst` 键值
  - 引用需求文档中的"语言包完整性验证"要求

### 5. 修复 DebugPanel.tsx 组件的硬编码文本
- [ ] 5.1 在 `packages/screenshot-splitter/src/components/DebugPanel.tsx` 中引入国际化系统
  - 添加 `useI18nContext` hook 导入和调用
  - 将调试相关的硬编码中文文本替换为国际化调用
  - 引用需求文档中的"硬编码文本识别与修复"要求

- [ ] 5.2 更新语言包文件添加 DebugPanel 相关翻译键
  - 在两个语言包中添加调试相关的翻译键值
  - 引用需求文档中的"语言包完整性验证"要求

### 6. 修复 ScreenshotSplitter.tsx 组件的硬编码文本
- [ ] 6.1 在 `packages/screenshot-splitter/src/components/ScreenshotSplitter.tsx` 中引入国际化系统
  - 添加 `useI18nContext` hook 导入和调用
  - 将状态显示相关的硬编码文本替换为国际化调用
  - 引用需求文档中的"硬编码文本识别与修复"要求

- [ ] 6.2 更新语言包文件添加 ScreenshotSplitter 相关翻译键
  - 在两个语言包中添加状态显示相关的翻译键值
  - 引用需求文档中的"语言包完整性验证"要求

### 7. 创建硬编码文本检测脚本
- [ ] 7.1 创建 `packages/screenshot-splitter/scripts/detect-hardcoded-text.js` 脚本文件
  - 实现扫描 `.tsx` 和 `.ts` 文件的功能
  - 实现检测中文字符串模式的正则表达式逻辑
  - 实现排除注释和测试文件的过滤逻辑
  - 实现生成详细检测报告的功能
  - 引用需求文档中的"国际化质量保证机制"要求

- [ ] 7.2 在 `packages/screenshot-splitter/package.json` 中添加检测脚本命令
  - 添加 `"check:i18n": "node scripts/detect-hardcoded-text.js"` 脚本命令
  - 集成到现有的构建和测试流程中
  - 引用需求文档中的"国际化质量保证机制"要求

### 8. 增强现有测试用例验证实际DOM内容
- [ ] 8.1 审查并修改现有的国际化相关测试用例
  - 修改测试用例使其验证实际DOM内容而非仅函数调用
  - 添加语言切换后DOM内容更新的验证
  - 添加参数化文本正确渲染的验证
  - 添加错误处理场景的测试（翻译键缺失等）
  - 引用需求文档中的"测试覆盖率与实际效果一致性"要求

### 9. 创建集成测试验证完整语言切换流程
- [ ] 9.1 创建端到端语言切换集成测试文件
  - 创建测试文件模拟完整的用户操作流程
  - 测试上传图片、分割图片、选择切片、切换语言的完整流程
  - 验证每个步骤中所有界面文本都正确切换
  - 使用自动化测试工具验证DOM内容变化
  - 引用需求文档中的"测试覆盖率与实际效果一致性"要求

## 任务执行说明

- 每个任务都是独立的代码修改步骤，可以单独执行和测试
- 任务按照依赖关系排序，建议按顺序执行
- 每个任务完成后都应该运行相关测试确保功能正常
- 所有任务完成后应该运行完整的测试套件验证整体功能
- 每个任务都明确引用了需求文档中的具体要求，确保实施的完整性
