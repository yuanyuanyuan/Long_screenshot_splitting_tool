// 简化版模块化主入口文件
// 为了在 public 目录中运行，将所有依赖内联

// 应用状态管理
function initializeAppState() {
  const appState = {
    originalImage: null,
    imageSlices: [],
    selectedSlices: new Set(),
    isProcessing: false,
    currentPreviewIndex: 0
  };
  
  console.log('[AppState] 应用状态已初始化');
  return appState;
}

function cleanupPreviousSession(appState) {
  appState.originalImage = null;
  appState.imageSlices = [];
  appState.selectedSlices.clear();
  appState.isProcessing = false;
  appState.currentPreviewIndex = 0;
  
  console.log('[AppState] 上一次会话数据已清理');
}

function updateAppState(appState, updates) {
  Object.assign(appState, updates);
  console.log('[AppState] 状态已更新:', updates);
}

function getAppStateSnapshot(appState) {
  return {
    hasOriginalImage: !!appState.originalImage,
    slicesCount: appState.imageSlices.length,
    selectedCount: appState.selectedSlices.size,
    isProcessing: appState.isProcessing,
    currentPreviewIndex: appState.currentPreviewIndex
  };
}

// 文件处理功能
function handleFileSelect(event, appState) {
  const file = event.target.files[0];
  if (file) {
    loadImage(file, appState);
  }
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event, appState) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    loadImage(files[0], appState);
  }
}

function loadImage(file, appState) {
  if (!file.type.startsWith('image/')) {
    alert(window.i18n ? window.i18n.t('js.error.invalidFile') : '请选择有效的图片文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      appState.originalImage = {
        data: e.target.result,
        width: img.width,
        height: img.height,
        name: file.name
      };
      
      document.getElementById('dropZone').style.display = 'none';
      document.getElementById('controls').classList.remove('hidden');
      
      // 设置默认文件名
      const fileNameInput = document.getElementById('fileName');
      if (fileNameInput) {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        fileNameInput.value = baseName || (window.i18n ? window.i18n.t('js.fileName.default') : 'screenshot_slices');
      }
      
      console.log('[FileProcessor] 图片已加载:', appState.originalImage);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function processImage(appState) {
  if (!appState.originalImage) {
    alert(window.i18n ? window.i18n.t('js.error.noImage') : '请先选择图片');
    return;
  }

  const sliceHeightInput = document.getElementById('sliceHeight');
  const sliceHeight = parseInt(sliceHeightInput.value) || 800;
  
  appState.isProcessing = true;
  
  // 使用 Web Worker 处理图片
  const worker = new Worker('/Long_screenshot_splitting_tool/split.worker.js');
  
  worker.postMessage({
    imageData: appState.originalImage.data,
    sliceHeight: sliceHeight
  });
  
  worker.onmessage = function(e) {
    const { slices, error } = e.data;
    
    if (error) {
      console.error('[ProcessImage] Worker 错误:', error);
      alert(window.i18n ? window.i18n.t('js.error.processing') : '图片处理失败');
      appState.isProcessing = false;
      return;
    }
    
    appState.imageSlices = slices.map((slice, index) => ({
      ...slice,
      index: index
    }));
    
    // 默认选中所有片段
    appState.selectedSlices.clear();
    appState.imageSlices.forEach((_, index) => {
      appState.selectedSlices.add(index);
    });
    
    // 显示预览
    showPreview(appState);
    
    appState.isProcessing = false;
    worker.terminate();
  };
  
  worker.onerror = function(error) {
    console.error('[ProcessImage] Worker 错误:', error);
    alert(window.i18n ? window.i18n.t('js.error.processing') : '图片处理失败');
    appState.isProcessing = false;
  };
}

// 预览界面功能
function showPreview(appState) {
  const previewSection = document.getElementById('preview-section');
  const thumbnailList = document.getElementById('thumbnail-list');
  
  if (!previewSection || !thumbnailList) {
    console.error('[Preview] 预览界面元素未找到');
    return;
  }
  
  // 清空现有内容
  thumbnailList.innerHTML = '';
  
  // 创建缩略图
  appState.imageSlices.forEach((slice, index) => {
    addThumbnailToList(slice, index, appState);
  });
  
  // 显示预览界面
  previewSection.classList.remove('hidden');
  
  // 更新计数和按钮状态
  updateNewSelectedCount(appState);
  toggleNewExportButtons(appState);
  
  console.log('[Preview] 预览界面已显示，共', appState.imageSlices.length, '个片段');
}

function addThumbnailToList(slice, index, appState) {
  const thumbnailList = document.getElementById('thumbnail-list');
  if (!thumbnailList) return;
  
  const thumbnailItem = document.createElement('div');
  thumbnailItem.className = 'thumbnail-item';
  thumbnailItem.dataset.index = index;
  
  const isSelected = appState.selectedSlices.has(index);
  if (isSelected) {
    thumbnailItem.classList.add('selected');
  }
  
  thumbnailItem.innerHTML = `
    <div class="thumbnail-checkbox-container">
      <input type="checkbox" class="thumbnail-checkbox" ${isSelected ? 'checked' : ''}>
    </div>
    <img src="${slice.data}" alt="Slice ${index + 1}" class="thumbnail-img">
    <div class="thumbnail-info">
      <div class="thumbnail-label">${window.i18n ? window.i18n.t('js.preview.header', { index: index + 1 }) : `片段 ${index + 1}`}</div>
      <div class="thumbnail-hint">${slice.width} × ${slice.height}</div>
    </div>
  `;
  
  // 添加点击事件
  const checkbox = thumbnailItem.querySelector('.thumbnail-checkbox');
  const img = thumbnailItem.querySelector('.thumbnail-img');
  
  function toggleSelection() {
    const isCurrentlySelected = appState.selectedSlices.has(index);
    if (isCurrentlySelected) {
      appState.selectedSlices.delete(index);
      thumbnailItem.classList.remove('selected');
      checkbox.checked = false;
    } else {
      appState.selectedSlices.add(index);
      thumbnailItem.classList.add('selected');
      checkbox.checked = true;
    }
    
    updateNewSelectedCount(appState);
    toggleNewExportButtons(appState);
  }
  
  checkbox.addEventListener('change', toggleSelection);
  img.addEventListener('click', toggleSelection);
  
  // 添加预览功能
  img.addEventListener('click', () => {
    showImagePreview(slice, index);
  });
  
  thumbnailList.appendChild(thumbnailItem);
}

function showImagePreview(slice, index) {
  const previewImage = document.getElementById('preview-image');
  const currentPreviewInfo = document.getElementById('current-preview-info');
  
  if (previewImage) {
    previewImage.src = slice.data;
  }
  
  if (currentPreviewInfo) {
    currentPreviewInfo.textContent = window.i18n ? 
      window.i18n.t('js.preview.current', { index: index + 1 }) : 
      `当前预览: 片段 ${index + 1}`;
  }
}

function selectAllSlicesInNewInterface(appState) {
  appState.selectedSlices.clear();
  appState.imageSlices.forEach((_, index) => {
    appState.selectedSlices.add(index);
  });
  
  // 更新UI
  document.querySelectorAll('.thumbnail-item').forEach((item, index) => {
    item.classList.add('selected');
    const checkbox = item.querySelector('.thumbnail-checkbox');
    if (checkbox) checkbox.checked = true;
  });
  
  updateNewSelectedCount(appState);
  toggleNewExportButtons(appState);
}

function deselectAllSlicesInNewInterface(appState) {
  appState.selectedSlices.clear();
  
  // 更新UI
  document.querySelectorAll('.thumbnail-item').forEach(item => {
    item.classList.remove('selected');
    const checkbox = item.querySelector('.thumbnail-checkbox');
    if (checkbox) checkbox.checked = false;
  });
  
  updateNewSelectedCount(appState);
  toggleNewExportButtons(appState);
}

function updateNewSelectedCount(appState) {
  const countElement = document.getElementById('new-selected-count');
  if (countElement) {
    countElement.textContent = window.i18n ? 
      window.i18n.t('preview.selectedCount', { count: appState.selectedSlices.size }) :
      `已选择 ${appState.selectedSlices.size} 个片段`;
  }
}

function toggleNewExportButtons(appState) {
  const exportZipBtn = document.getElementById('export-zip-btn');
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  
  const hasSelection = appState.selectedSlices.size > 0;
  
  if (exportZipBtn) {
    exportZipBtn.disabled = !hasSelection;
  }
  
  if (exportPdfBtn) {
    exportPdfBtn.disabled = !hasSelection;
  }
}

// 导出功能
function exportAsZip(appState) {
  if (appState.selectedSlices.size === 0) {
    alert(window.i18n ? window.i18n.t('js.error.noSelection') : '请至少选择一个片段');
    return;
  }
  
  // 这里应该实现 ZIP 导出逻辑
  console.log('[Export] ZIP 导出功能需要实现');
  alert('ZIP 导出功能正在开发中');
}

function exportAsPdf(appState) {
  if (appState.selectedSlices.size === 0) {
    alert(window.i18n ? window.i18n.t('js.error.noSelection') : '请至少选择一个片段');
    return;
  }
  
  // 这里应该实现 PDF 导出逻辑
  console.log('[Export] PDF 导出功能需要实现');
  alert('PDF 导出功能正在开发中');
}

// 仅在浏览器环境中执行
if (typeof document !== 'undefined') {
  document.addEventListener("i18n:ready", () => {
    
    // 初始化应用状态
    const appState = initializeAppState();
    
    // DOM元素引用
    const domElements = {
      dropZone: document.getElementById("dropZone"),
      fileInput: document.getElementById("fileInput"),
      uploadBtn: document.getElementById("uploadBtn"),
      controls: document.getElementById("controls"),
      processBtn: document.getElementById("processBtn"),
      resetBtn: document.getElementById("resetBtn"),
      previewSection: document.getElementById("previewSection"),
      previewContainer: document.getElementById("previewContainer"),
      exportZipBtn: document.getElementById("exportZipBtn"),
      exportPdfBtn: document.getElementById("exportPdfBtn"),
      sliceHeightInput: document.getElementById("sliceHeight"),
      fileNameInput: document.getElementById("fileName"),
      selectedCount: document.getElementById("selectedCount"),
      selectAllBtn: document.getElementById("selectAllBtn"),
      deselectBtn: document.getElementById("deselectBtn"),
      
      // 新预览界面元素
      newExportZipBtn: document.getElementById("export-zip-btn"),
      newExportPdfBtn: document.getElementById("export-pdf-btn"),
      newSelectedCount: document.getElementById("new-selected-count"),
      newSelectAllBtn: document.getElementById("new-select-all-btn"),
      newDeselectBtn: document.getElementById("new-deselect-btn")
    };

    // 事件监听器绑定
    function bindEventListeners() {
      if (domElements.uploadBtn) {
        domElements.uploadBtn.addEventListener("click", () => domElements.fileInput.click());
      }
      if (domElements.fileInput) {
        domElements.fileInput.addEventListener("change", (e) => handleFileSelect(e, appState));
      }
      if (domElements.dropZone) {
        domElements.dropZone.addEventListener("dragover", handleDragOver);
        domElements.dropZone.addEventListener("dragleave", handleDragLeave);
        domElements.dropZone.addEventListener("drop", (e) => handleDrop(e, appState));
      }
      if (domElements.processBtn) {
        domElements.processBtn.addEventListener("click", () => processImage(appState));
      }
      if (domElements.resetBtn) {
        domElements.resetBtn.addEventListener("click", resetApp);
      }
      if (domElements.exportZipBtn) {
        domElements.exportZipBtn.addEventListener("click", () => exportAsZip(appState));
      }
      if (domElements.exportPdfBtn) {
        domElements.exportPdfBtn.addEventListener("click", () => exportAsPdf(appState));
      }
      
      // 新预览界面事件监听器
      if (domElements.newExportZipBtn) {
        domElements.newExportZipBtn.addEventListener("click", () => exportAsZip(appState));
      }
      
      if (domElements.newExportPdfBtn) {
        domElements.newExportPdfBtn.addEventListener("click", () => exportAsPdf(appState));
      }

      if (domElements.newSelectAllBtn) {
        domElements.newSelectAllBtn.addEventListener("click", () => selectAllSlicesInNewInterface(appState));
      }
      
      if (domElements.newDeselectBtn) {
        domElements.newDeselectBtn.addEventListener("click", () => deselectAllSlicesInNewInterface(appState));
      }
    }

    // 重置应用
    function resetApp() {
      // 清理应用状态
      cleanupPreviousSession(appState);
      
      if (domElements.fileInput) domElements.fileInput.value = "";
      if (domElements.controls) domElements.controls.classList.add("hidden");
      if (domElements.previewSection) domElements.previewSection.classList.add("hidden");
      if (domElements.dropZone) domElements.dropZone.style.display = "block";
      if (domElements.previewContainer) domElements.previewContainer.innerHTML = "";
      
      // 隐藏新预览界面
      const newPreviewSection = document.getElementById('preview-section');
      if (newPreviewSection) {
        newPreviewSection.classList.add('hidden');
      }
    }

    // 初始化
    function initialize() {
      bindEventListeners();
      console.log('[ModularMain] 简化版应用已初始化');
    }

    // 暴露到全局作用域
    window.appState = appState;
    window.exportAsZip = () => exportAsZip(appState);
    window.exportAsPdf = () => exportAsPdf(appState);
    window.selectAllSlicesInNewInterface = () => selectAllSlicesInNewInterface(appState);
    window.deselectAllSlicesInNewInterface = () => deselectAllSlicesInNewInterface(appState);
    
    // 启动应用
    initialize();
    
  });
}