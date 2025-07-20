# Task-2.5 导出按钮功能验证指南

## 验证目标
确认在新预览界面中已成功添加"导出为 ZIP"和"导出为 PDF"按钮，并验证其功能正常。

## 快速验证步骤

### 第一步：打开应用
1. 访问：http://localhost:4321/Long_screenshot_splitting_tool/
2. 打开浏览器开发者工具（F12）

### 第二步：验证按钮存在
在控制台中运行：
```javascript
// 检查导出按钮是否存在
const zipBtn = document.getElementById('export-zip-btn');
const pdfBtn = document.getElementById('export-pdf-btn');

console.log('ZIP按钮存在:', !!zipBtn);
console.log('PDF按钮存在:', !!pdfBtn);
console.log('ZIP按钮初始状态:', zipBtn?.disabled ? '禁用' : '启用');
console.log('PDF按钮初始状态:', pdfBtn?.disabled ? '禁用' : '启用');
```

**预期结果：**
- ZIP按钮存在: true
- PDF按钮存在: true  
- ZIP按钮初始状态: 禁用
- PDF按钮初始状态: 禁用

### 第三步：测试按钮状态管理
```javascript
// 测试按钮状态管理函数
if (typeof toggleNewExportButtons === 'function') {
  console.log('✅ 状态管理函数存在');
  
  // 启用按钮
  toggleNewExportButtons(true);
  console.log('启用后 - ZIP:', !zipBtn.disabled, 'PDF:', !pdfBtn.disabled);
  
  // 禁用按钮
  toggleNewExportButtons(false);
  console.log('禁用后 - ZIP:', zipBtn.disabled, 'PDF:', pdfBtn.disabled);
} else {
  console.log('❌ toggleNewExportButtons 函数不存在');
}
```

**预期结果：**
- 状态管理函数存在
- 启用后两个按钮都变为启用状态
- 禁用后两个按钮都变为禁用状态

### 第四步：测试事件监听器绑定
```javascript
// 测试事件监听器
toggleNewExportButtons(true); // 先启用按钮

// 检查事件监听器是否绑定
let zipClicked = false;
let pdfClicked = false;

// 临时覆盖函数来检测调用
const originalZip = window.exportAsZip;
const originalPdf = window.exportAsPdf;

exportAsZip = () => { zipClicked = true; console.log('ZIP导出被调用'); };
exportAsPdf = () => { pdfClicked = true; console.log('PDF导出被调用'); };

// 模拟点击
zipBtn.click();
pdfBtn.click();

// 恢复原函数
exportAsZip = originalZip;
exportAsPdf = originalPdf;

console.log('事件测试结果 - ZIP:', zipClicked, 'PDF:', pdfClicked);
```

**预期结果：**
- ZIP导出被调用
- PDF导出被调用
- 事件测试结果 - ZIP: true PDF: true

### 第五步：测试完整预览界面
```javascript
// 运行完整测试
if (typeof testExportButtons === 'function') {
  console.log('运行完整测试...');
  testExportButtons();
} else {
  console.log('❌ testExportButtons 函数不存在');
}
```

**预期结果：**
- 预览界面显示
- 测试缩略图添加
- 导出按钮启用
- 控制台显示成功信息

## 视觉验证

### 1. 按钮位置验证
- 导出按钮应位于预览界面右侧栏的顶部
- 按钮应在"图片预览"标题旁边
- 两个按钮应水平排列，有适当间距

### 2. 按钮样式验证
- ZIP按钮：蓝色背景 (#4361ee)
- PDF按钮：绿色背景 (#10b981)
- 禁用状态：透明度 0.6，鼠标指针为 not-allowed
- 启用状态：正常透明度，悬停效果正常

### 3. 按钮文字验证
- ZIP按钮显示："导出为 ZIP"
- PDF按钮显示："导出为 PDF"

## 验收标准确认

根据 implementation-plan.md 的要求：

✅ **描述完成：** 在 `Previewer.astro` 中添加"导出为 ZIP"和"导出为 PDF"两个按钮  
✅ **动作完成：** 确保按钮有明确的 ID，初始状态为禁用  
✅ **验证完成：** 页面上能看到这两个按钮

## 故障排除

如果验证失败，检查：

1. **按钮不存在：** 确认 Previewer.astro 组件已正确引入页面
2. **函数不存在：** 确认 main.js 已正确加载
3. **事件不触发：** 检查事件监听器绑定代码
4. **样式异常：** 检查 CSS 作用域和样式冲突

## 成功标志

当所有验证步骤都通过时，Task-2.5 已成功完成：
- 导出按钮正确添加到预览界面
- 按钮有明确的 ID 和合适的初始状态
- 事件监听器正确绑定
- 状态管理功能正常工作 