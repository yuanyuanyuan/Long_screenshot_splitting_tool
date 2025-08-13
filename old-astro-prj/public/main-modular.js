// 简化版模块化主入口文件
// 为了在 public 目录中运行，将所有依赖内联

// 引入模块
// 注意：由于这些是普通的 JavaScript 文件，函数会自动暴露到全局作用域

// 全局应用状态
let appState = null;

// 仅在浏览器环境中执行
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[Main] DOM 加载完成，开始初始化应用...');
    
    // 初始化应用状态
    appState = window.initializeAppState();
    
    // 获取DOM元素
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const dropZone = document.getElementById('dropZone');
    const processBtn = document.getElementById('processBtn');
    
    // 新预览界面的按钮
    const selectAllBtn = document.getElementById('new-select-all-btn');
    const deselectAllBtn = document.getElementById('new-deselect-btn');
    const exportZipBtn = document.getElementById('export-zip-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    
    // 绑定文件选择事件
    if (fileInput) {
      fileInput.addEventListener('change', (e) => window.handleFileSelect(e, appState));
    }
    
    // 绑定上传按钮点击事件
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => {
        fileInput.click();
      });
    }
    
    // 绑定拖放事件
    if (dropZone) {
      dropZone.addEventListener('dragover', window.handleDragOver);
      dropZone.addEventListener('dragleave', window.handleDragLeave);
      dropZone.addEventListener('drop', (e) => window.handleDrop(e, appState));
    }
    
    // 绑定处理按钮事件
    if (processBtn) {
      processBtn.addEventListener('click', () => window.processImage(appState));
    }
    
    // 绑定新预览界面的按钮事件
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => window.selectAllSlices(appState));
    }
    
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => window.deselectAllSlices(appState));
    }
    
    if (exportZipBtn) {
      exportZipBtn.addEventListener('click', () => window.exportAsZip(appState));
    }
    
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => window.exportAsPdf(appState));
    }
    
    // 初始化缩略图交互
    window.initializeThumbnailInteraction(appState);
    
    console.log('[Main] 应用初始化完成');
  });
}