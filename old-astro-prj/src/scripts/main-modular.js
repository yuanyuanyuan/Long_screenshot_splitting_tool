// 模块化主入口文件
// 整合所有功能模块，替代原有的 main.js

import { 
  initializeAppState, 
  cleanupPreviousSession, 
  updateAppState, 
  getAppStateSnapshot 
} from './modules/appState.js';

import { 
  addThumbnailToList,
  initializeThumbnailInteraction,
  closePreviewInterface,
  selectAllSlicesInNewInterface,
  deselectAllSlicesInNewInterface,
  toggleNewExportButtons,
  updateNewSelectedCount
} from './modules/previewInterface.js';

import { 
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  loadImage,
  processImage
} from './modules/fileProcessor.js';

import { 
  exportAsZip,
  exportAsPdf
} from './modules/exportManager.js';

import { 
  testThumbnailFunction,
  testTask33,
  verifyTask33Completion,
  testTask34,
  executeExportTests,
  testZipExport,
  testPdfExport,
  showPreviewAndTest,
  getDebugSnapshot,
  testTask36,
  testTask36UserExperience,
  demoTask36Layout,
  checkSelectionButtons,
  forceShowSelectionButtons,
  checkImageCheckboxes
} from './modules/testUtils.js';

// 仅在浏览器环境中执行
if (typeof document !== 'undefined') {
  document.addEventListener("i18n:ready", () => {
    
    // 初始化应用状态
    const appState = initializeAppState();
    
    // 为了向后兼容，保持原有变量的引用
    let originalImage = appState.originalImage;
    let imageSlices = appState.imageSlices;
    const selectedSlices = appState.selectedSlices;

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
      thumbnailList: document.getElementById("thumbnail-list"),
      previewImage: document.getElementById("preview-image"),
      currentPreviewInfo: document.getElementById("current-preview-info"),

      newExportZipBtn: document.getElementById("export-zip-btn"),
      newExportPdfBtn: document.getElementById("export-pdf-btn"),
      newSelectedCount: document.getElementById("new-selected-count"),
      newSelectAllBtn: document.getElementById("new-select-all-btn"),
      newDeselectBtn: document.getElementById("new-deselect-btn")
    };

    // 事件监听器绑定
    function bindEventListeners() {
      domElements.uploadBtn.addEventListener("click", () => domElements.fileInput.click());
      domElements.fileInput.addEventListener("change", (e) => handleFileSelect(e, appState));
      domElements.dropZone.addEventListener("dragover", handleDragOver);
      domElements.dropZone.addEventListener("dragleave", handleDragLeave);
      domElements.dropZone.addEventListener("drop", (e) => handleDrop(e, appState));
      domElements.processBtn.addEventListener("click", () => processImage(appState));
      domElements.resetBtn.addEventListener("click", resetApp);
      domElements.exportZipBtn.addEventListener("click", () => exportAsZip(appState));
      domElements.exportPdfBtn.addEventListener("click", () => exportAsPdf(appState));
      domElements.selectAllBtn.addEventListener("click", selectAllSlices);
      domElements.deselectBtn.addEventListener("click", deselectAllSlices);
      
      // 新预览界面事件监听器（已移除关闭按钮）

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

    // 语言切换处理
    document.addEventListener("language:switched", () => {
      // 重新渲染预览
      if (imageSlices.length > 0) {
        updatePreviewsUI();
      }
      // 更新其他UI文本
      updateSelectedCount();
      // 如果文件名是默认值，则更新它
      if (
        domElements.fileNameInput.value === "分割结果" ||
        domElements.fileNameInput.value === "screenshot_slices"
      ) {
        domElements.fileNameInput.value = window.i18n.t("js.fileName.default");
      }
    });

    // 兼容性函数 - 用于支持原有的Canvas模式预览（如果需要）
    function createPreview(imageData, index, width, height) {
      const previewItem = document.createElement("div");
      previewItem.className = "thumbnail-item";
      previewItem.dataset.index = index;

      // 创建复选框
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "thumbnail-checkbox";
      checkbox.checked = selectedSlices.has(index);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedSlices.add(index);
        } else {
          selectedSlices.delete(index);
        }
        previewItem.classList.toggle("selected", checkbox.checked);
        updateSelectedCount();
      });

      const img = document.createElement("img");
      img.src = imageData;
      img.className = "thumbnail-img";
      img.alt = window.i18n.t("js.preview.alt", { index: index + 1 });
      img.addEventListener("click", () => {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change"));
      });

      const infoDiv = document.createElement("div");
      infoDiv.className = "thumbnail-info";
      infoDiv.innerHTML = `
        <div class="thumbnail-label"><strong>${window.i18n.t("js.preview.header", { index: index + 1 })}</strong></div>
        <div class="thumbnail-hint">${window.i18n.t("js.preview.dimensions", { width: width, height: height })}</div>
        <div class="thumbnail-hint">${window.i18n.t("js.preview.size", { size: Math.round(imageData.length / 1024) })}</div>
      `;

      previewItem.appendChild(checkbox);
      previewItem.appendChild(img);
      previewItem.appendChild(infoDiv);
      domElements.previewContainer.appendChild(previewItem);

      // 根据选择状态更新样式
      previewItem.classList.toggle("selected", selectedSlices.has(index));
    }

    // 创建并更新所有预览UI（兼容性函数）
    function updatePreviewsUI() {
      domElements.previewContainer.innerHTML = ""; // 清空现有预览
      imageSlices.forEach((slice) => {
        createPreview(slice.data, slice.index, slice.width, slice.height);
      });

      // 恢复之前的选择状态
      document.querySelectorAll(".thumbnail-checkbox").forEach((checkbox) => {
        const index = parseInt(checkbox.parentElement.dataset.index);
        const isSelected = selectedSlices.has(index);
        checkbox.checked = isSelected;
        checkbox.parentElement.classList.toggle("selected", isSelected);
      });
    }

    // 更新选中计数
    function updateSelectedCount() {
      if (domElements.selectedCount) {
        domElements.selectedCount.textContent = window.i18n.t("preview.selectedCount", {
          count: selectedSlices.size,
        });
      }
    }

    // 全选所有片段（兼容性函数）
    function selectAllSlices() {
      selectedSlices.clear();
      document.querySelectorAll(".thumbnail-checkbox").forEach((checkbox) => {
        checkbox.checked = true;
        const index = parseInt(checkbox.parentElement.dataset.index);
        selectedSlices.add(index);
        checkbox.parentElement.classList.add("selected");
      });
      updateSelectedCount();
    }

    // 取消所有选择（兼容性函数）
    function deselectAllSlices() {
      selectedSlices.clear();
      document.querySelectorAll(".thumbnail-checkbox").forEach((checkbox) => {
        checkbox.checked = false;
        checkbox.parentElement.classList.remove("selected");
      });
      updateSelectedCount();
    }

    // 重置应用
    function resetApp() {
      // 清理应用状态
      cleanupPreviousSession(appState);
      
      // 重置UI状态
      appState.originalImage = null;
      originalImage = null;
      imageSlices = [];
      selectedSlices.clear();

      domElements.fileInput.value = "";
      domElements.controls.classList.add("hidden");
      domElements.previewSection.classList.add("hidden");
      domElements.dropZone.style.display = "block";
      domElements.previewContainer.innerHTML = "";
      
      // 隐藏新预览界面
      const newPreviewSection = document.getElementById('preview-section');
      if (newPreviewSection) {
        newPreviewSection.classList.add('hidden');
      }
      
      updateSelectedCount();
    }

    // 初始化
    function initialize() {
      bindEventListeners();
      initializeThumbnailInteraction();
      updateSelectedCount();
      
      console.log('[ModularMain] 应用已初始化，使用模块化架构');
    }

    // 暴露测试函数到全局作用域
    function exposeTestFunctions() {
      // 状态管理
      window.appState = appState;
      window.getAppStateSnapshot = () => getAppStateSnapshot(appState);
      window.cleanupPreviousSession = () => cleanupPreviousSession(appState);
      
      // 测试函数
      window.testThumbnailFunction = () => testThumbnailFunction(appState);
      window.testTask33 = () => testTask33(appState);
      window.verifyTask33Completion = () => verifyTask33Completion(appState);
      window.testTask34 = () => testTask34(appState);
      window.executeExportTests = () => executeExportTests(appState);
      window.testZipExport = () => testZipExport(appState);
      window.testPdfExport = () => testPdfExport(appState);
      window.showPreviewAndTest = () => showPreviewAndTest(appState);
      
      // 导出函数
      window.exportAsZip = () => exportAsZip(appState);
      window.exportAsPdf = () => exportAsPdf(appState);
      
      // 预览界面控制
      window.selectAllSlicesInNewInterface = () => selectAllSlicesInNewInterface(appState);
      window.deselectAllSlicesInNewInterface = () => deselectAllSlicesInNewInterface(appState);
      window.updateNewSelectedCount = () => updateNewSelectedCount(appState);
      
      // 调试工具
      window.getDebugSnapshot = () => getDebugSnapshot(appState);
      
      // Task-3.6 验证函数
      window.testTask36 = () => testTask36();
      window.testTask36UserExperience = () => testTask36UserExperience();
      window.demoTask36Layout = () => demoTask36Layout();
      window.checkSelectionButtons = () => checkSelectionButtons();
      window.forceShowSelectionButtons = () => forceShowSelectionButtons();
      window.checkImageCheckboxes = () => checkImageCheckboxes();
    }

    // 启动应用
    initialize();
    exposeTestFunctions();
    
  });
}