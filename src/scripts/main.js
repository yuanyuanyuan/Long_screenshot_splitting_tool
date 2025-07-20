// 仅在浏览器环境中执行
if (typeof document !== 'undefined') {
  document.addEventListener("i18n:ready", () => {
  // task-3.1: 初始化应用状态管理器
  // 统一的应用状态管理器，整合所有状态变量
  let appState = {
    // Worker 相关状态
    worker: null,
    blobs: [],           // 存储 Worker 生成的切片 Blob 对象
    objectUrls: [],      // 存储临时 Object URL，用于内存管理
    
    // 现有状态（保持向后兼容）
    originalImage: null,
    imageSlices: [],     // 保留现有的图片数据结构
    selectedSlices: new Set(), // 用户选择的切片索引
    
    // 处理状态
    isProcessing: false,
    
    // 元数据
    splitHeight: 1200,
    fileName: "分割结果"
  };

  // 为了向后兼容，保持原有变量的引用（将逐步迁移）
  let originalImage = appState.originalImage;
  let imageSlices = appState.imageSlices;
  let selectedSlices = appState.selectedSlices;

  // DOM元素
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const controls = document.getElementById("controls");
  const processBtn = document.getElementById("processBtn");
  const resetBtn = document.getElementById("resetBtn");
  const previewSection = document.getElementById("previewSection");
  const previewContainer = document.getElementById("previewContainer");
  const exportZipBtn = document.getElementById("exportZipBtn");
  const exportPdfBtn = document.getElementById("exportPdfBtn");
  const sliceHeightInput = document.getElementById("sliceHeight");
  const fileNameInput = document.getElementById("fileName");
  const selectedCount = document.getElementById("selectedCount");
  const selectAllBtn = document.getElementById("selectAllBtn");
  const deselectBtn = document.getElementById("deselectBtn");

  // 新增：获取新预览界面的DOM元素
  const thumbnailList = document.getElementById("thumbnail-list");
  const previewImage = document.getElementById("preview-image");
  const currentPreviewInfo = document.getElementById("current-preview-info");
  const closePreviewBtn = document.getElementById("close-preview-btn");

  // task-2.5: 获取新预览界面的导出按钮
  const newExportZipBtn = document.getElementById("export-zip-btn");
  const newExportPdfBtn = document.getElementById("export-pdf-btn");

  // 新增：获取新预览界面的选择控制元素
  const newSelectedCount = document.getElementById("new-selected-count");
  const newSelectAllBtn = document.getElementById("new-select-all-btn");
  const newDeselectBtn = document.getElementById("new-deselect-btn");

  // 事件监听器
  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);
  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("dragleave", handleDragLeave);
  dropZone.addEventListener("drop", handleDrop);
  processBtn.addEventListener("click", processImage);
  resetBtn.addEventListener("click", resetApp);
  exportZipBtn.addEventListener("click", exportAsZip);
  exportPdfBtn.addEventListener("click", exportAsPdf);
  selectAllBtn.addEventListener("click", selectAllSlices);
  deselectBtn.addEventListener("click", deselectAllSlices);
  
  // task-2.4: 添加预览界面关闭按钮事件监听器
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener("click", closePreviewInterface);
  }

  // task-2.5: 添加新预览界面导出按钮事件监听器
  if (newExportZipBtn) {
    newExportZipBtn.addEventListener("click", exportAsZip);
  }
  
  if (newExportPdfBtn) {
    newExportPdfBtn.addEventListener("click", exportAsPdf);
  }

  // 新增：添加新预览界面的选择控制按钮事件监听器
  if (newSelectAllBtn) {
    newSelectAllBtn.addEventListener("click", selectAllSlicesInNewInterface);
  }
  
  if (newDeselectBtn) {
    newDeselectBtn.addEventListener("click", deselectAllSlicesInNewInterface);
  }

  // task-3.1: 应用状态管理辅助函数
  
  /**
   * 清理之前会话的所有资源
   */
  function cleanupPreviousSession() {
    console.log('[AppState] 开始清理之前的会话资源...');
    
    // 释放所有 Object URLs
    appState.objectUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
        console.log('[AppState] 已释放 Object URL:', url.substring(0, 50) + '...');
      } catch (error) {
        console.warn('[AppState] 释放 Object URL 失败:', error);
      }
    });
    
    // 清空状态数组
    appState.blobs = [];
    appState.objectUrls = [];
    appState.imageSlices = [];
    appState.selectedSlices.clear();
    
    // 终止现有 Worker
    if (appState.worker) {
      try {
        appState.worker.terminate();
        console.log('[AppState] 已终止现有 Worker');
      } catch (error) {
        console.warn('[AppState] 终止 Worker 失败:', error);
      }
      appState.worker = null;
    }
    
    // 重置处理状态
    appState.isProcessing = false;
    
    console.log('[AppState] 会话清理完成');
  }

  /**
   * 更新应用状态，保持数据同步
   * @param {Object} updates - 要更新的状态字段
   */
  function updateAppState(updates) {
    Object.assign(appState, updates);
    
    // 同步到兼容变量（将在后续任务中逐步移除）
    originalImage = appState.originalImage;
    imageSlices = appState.imageSlices;
    selectedSlices = appState.selectedSlices;
    
    console.log('[AppState] 状态已更新:', updates);
  }

  /**
   * 获取当前应用状态的快照（用于调试）
   */
  function getAppStateSnapshot() {
    return {
      hasOriginalImage: !!appState.originalImage,
      blobsCount: appState.blobs.length,
      objectUrlsCount: appState.objectUrls.length,
      imageSlicesCount: appState.imageSlices.length,
      selectedSlicesCount: appState.selectedSlices.size,
      isProcessing: appState.isProcessing,
      hasWorker: !!appState.worker,
      splitHeight: appState.splitHeight,
      fileName: appState.fileName
    };
  }

  // 将状态管理函数暴露到全局（用于调试）
  window.appState = appState;
  window.getAppStateSnapshot = getAppStateSnapshot;
  window.cleanupPreviousSession = cleanupPreviousSession;

  // task-2.3: 实现缩略图动态添加函数
  /**
   * 添加缩略图到预览列表（增强版：支持选择功能）
   * @param {Object} chunkData - Worker 发来的 chunk 数据
   * @param {Blob} chunkData.blob - 图片切片的 Blob 对象
   * @param {number} chunkData.index - 切片的索引（从0开始）
   */
  function addThumbnailToList(chunkData) {
    const { blob, index } = chunkData;
    
    if (!thumbnailList) {
      console.error('thumbnail-list element not found');
      return;
    }

    // 创建 Object URL 用于图片显示
    const imageUrl = URL.createObjectURL(blob);
    
    // 创建缩略图容器
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    thumbnailItem.dataset.index = index;
    thumbnailItem.dataset.imageUrl = imageUrl;

    // 创建复选框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'thumbnail-checkbox';
    checkbox.checked = true; // 默认选中
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedSlices.add(index);
        thumbnailItem.classList.add('selected');
      } else {
        selectedSlices.delete(index);
        thumbnailItem.classList.remove('selected');
      }
      updateNewSelectedCount();
    });

    // 创建缩略图图片
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'thumbnail-img';
    img.alt = `切片 ${index + 1}`;
    
    // 创建文字信息
    const textInfo = document.createElement('div');
    textInfo.className = 'thumbnail-info';
    textInfo.innerHTML = `
      <p class="thumbnail-label">切片 ${index + 1}</p>
      <p class="thumbnail-hint">点击查看大图</p>
    `;

    // 组装缩略图项
    thumbnailItem.appendChild(checkbox);
    thumbnailItem.appendChild(img);
    thumbnailItem.appendChild(textInfo);

    // 将缩略图添加到列表中
    thumbnailList.appendChild(thumbnailItem);

    // 默认选中这个切片
    selectedSlices.add(index);
    thumbnailItem.classList.add('selected');

    console.log(`[task-2.3] 成功添加缩略图 ${index + 1} 到列表`);
    
    // 更新选择计数
    updateNewSelectedCount();
    
    // task-2.4: 如果这是第一个缩略图，自动选中并显示大图
    if (index === 0) {
      selectThumbnail(thumbnailItem);
    }
  }

  // task-2.4: 实现大图预览与交互功能
  
  /**
   * 选中指定的缩略图并更新大图预览
   * @param {HTMLElement} thumbnailItem - 要选中的缩略图元素
   */
  function selectThumbnail(thumbnailItem) {
    if (!thumbnailItem) return;
    
    // 移除所有缩略图的选中状态
    document.querySelectorAll('.thumbnail-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // 添加当前缩略图的选中状态
    thumbnailItem.classList.add('selected');
    
    // 获取缩略图信息并更新大图预览
    const imageUrl = thumbnailItem.dataset.imageUrl;
    const index = parseInt(thumbnailItem.dataset.index);
    
    if (imageUrl && !isNaN(index)) {
      updatePreviewImage(imageUrl, index);
    }
    
    console.log(`[task-2.4] 选中缩略图 ${index + 1}`);
  }
  
  /**
   * 更新大图预览
   * @param {string} imageUrl - 图片的 Object URL
   * @param {number} index - 切片索引
   */
  function updatePreviewImage(imageUrl, index) {
    if (!previewImage) {
      console.error('[task-2.4] preview-image element not found');
      return;
    }
    
    try {
      previewImage.src = imageUrl;
      previewImage.style.display = 'block';
      
      // 隐藏占位符
      const placeholder = document.getElementById('preview-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      
      // 更新预览信息
      if (currentPreviewInfo) {
        currentPreviewInfo.textContent = `切片 ${index + 1}`;
      }
      
      // 添加图片加载错误处理
      previewImage.onerror = () => {
        console.error(`[task-2.4] 加载大图预览失败: 切片 ${index + 1}`);
        if (placeholder) {
          placeholder.style.display = 'block';
          placeholder.innerHTML = `
            <div class="text-center text-gray-500">
              <div class="text-6xl mb-4">❌</div>
              <p class="text-lg">图片加载失败</p>
              <p class="text-sm">切片 ${index + 1}</p>
            </div>
          `;
        }
      };
      
      // 图片加载成功处理
      previewImage.onload = () => {
        console.log(`[task-2.4] 成功更新大图预览为切片 ${index + 1}`);
      };
      
    } catch (error) {
      console.error(`[task-2.4] 更新大图预览时发生错误:`, error);
    }
  }
  
  /**
   * 初始化缩略图事件委托（task-2.4 核心功能）
   */
  function initializeThumbnailInteraction() {
    if (!thumbnailList) {
      console.error('[task-2.4] thumbnail-list element not found');
      return;
    }
    
    // 在 thumbnail-list 上使用事件委托
    thumbnailList.addEventListener('click', (event) => {
      // 找到被点击的缩略图元素
      const thumbnailItem = event.target.closest('.thumbnail-item');
      
      if (thumbnailItem) {
        selectThumbnail(thumbnailItem);
        
        // 可选：平滑滚动到选中的缩略图（如果列表很长）
        thumbnailItem.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    });
    
    console.log('[task-2.4] 缩略图交互事件委托已初始化');
  }
  
  /**
   * 关闭预览界面，返回主界面
   */
  function closePreviewInterface() {
    const newPreviewSection = document.getElementById('preview-section');
    if (newPreviewSection) {
      newPreviewSection.classList.add('hidden');
      console.log('[task-2.4] 预览界面已关闭，返回主界面');
    }
  }

  // task-2.5: 导出按钮状态管理函数
  /**
   * 启用或禁用新预览界面的导出按钮
   * @param {boolean} enabled - 是否启用按钮
   */
  function toggleNewExportButtons(enabled) {
    if (newExportZipBtn) {
      newExportZipBtn.disabled = !enabled;
      console.log(`[task-2.5] ZIP导出按钮已${enabled ? '启用' : '禁用'}`);
    }
    
    if (newExportPdfBtn) {
      newExportPdfBtn.disabled = !enabled;
      console.log(`[task-2.5] PDF导出按钮已${enabled ? '启用' : '禁用'}`);
    }
  }

  // 新增：新预览界面的选择管理函数
  /**
   * 更新新预览界面的选择计数显示
   */
  function updateNewSelectedCount() {
    if (newSelectedCount) {
      newSelectedCount.textContent = `已选择 ${selectedSlices.size} 个片段`;
    }
  }

  /**
   * 新预览界面：全选所有片段
   */
  function selectAllSlicesInNewInterface() {
    document.querySelectorAll('.thumbnail-item').forEach((item) => {
      const index = parseInt(item.dataset.index);
      const checkbox = item.querySelector('.thumbnail-checkbox');
      
      if (checkbox && !isNaN(index)) {
        checkbox.checked = true;
        selectedSlices.add(index);
        item.classList.add('selected');
      }
    });
    updateNewSelectedCount();
    console.log('[新预览界面] 已全选所有片段');
  }

  /**
   * 新预览界面：取消所有选择
   */
  function deselectAllSlicesInNewInterface() {
    document.querySelectorAll('.thumbnail-item').forEach((item) => {
      const checkbox = item.querySelector('.thumbnail-checkbox');
      
      if (checkbox) {
        checkbox.checked = false;
        item.classList.remove('selected');
      }
    });
    selectedSlices.clear();
    updateNewSelectedCount();
    console.log('[新预览界面] 已取消所有选择');
  }

  // 当语言切换时，刷新UI
  document.addEventListener("language:switched", () => {
    // 重新渲染预览
    if (imageSlices.length > 0) {
      updatePreviewsUI();
    }
    // 更新其他UI文本
    updateSelectedCount();
    // 如果文件名是默认值，则更新它
    if (
      fileNameInput.value === "分割结果" ||
      fileNameInput.value === "screenshot_slices"
    ) {
      fileNameInput.value = window.i18n.t("js.fileName.default");
    }
  });

  // 处理文件选择
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.match("image.*")) {
      loadImage(file);
    }
  }

  // 处理拖放事件
  function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  }

  function handleDragLeave() {
    dropZone.classList.remove("drag-over");
  }

  function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    if (file && file.type.match("image.*")) {
      loadImage(file);
    }
  }

  // 加载图片
  function loadImage(file) {
    if (file.size > 10 * 1024 * 1024) {
      alert(window.i18n.t("js.alert.fileTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        originalImage = img;
        controls.classList.remove("hidden");
        dropZone.style.display = "none";

        // 设置合适的默认分割高度（屏幕高度的80%）
        const defaultHeight = Math.min(
          1200,
          Math.floor(window.innerHeight * 0.8)
        );
        sliceHeightInput.value = defaultHeight;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // task-3.2: 改造主上传逻辑与资源清理
  function processImage() {
    if (!originalImage) return;

    const sliceHeight = parseInt(sliceHeightInput.value);
    if (isNaN(sliceHeight) || sliceHeight < 100 || sliceHeight > 5000) {
      alert(window.i18n.t("js.alert.invalidSliceHeight"));
      return;
    }

    // 1. 执行清理函数：清理之前会话的所有资源
    console.log('[task-3.2] 开始资源清理...');
    cleanupPreviousSession();

    // 2. 显示进度条容器
    const progressContainer = document.getElementById("progress-container");
    if (progressContainer) {
      progressContainer.classList.remove("hidden");
      console.log('[task-3.2] 进度条容器已显示');
    }

    // 3. 实例化 Worker 并发送初始化消息
    try {
      // 创建新的 Worker 实例
      appState.worker = new Worker('/src/scripts/split.worker.js');
      console.log('[task-3.2] Worker 实例已创建');

      // 设置 Worker 消息监听器 (在 task-3.3 中完整实现)
      appState.worker.onmessage = function(event) {
        console.log('[task-3.2] 收到 Worker 消息:', event.data);
        // TODO: task-3.3 将在这里实现完整的消息处理逻辑
      };

      // 设置 Worker 错误监听器
      appState.worker.onerror = function(error) {
        console.error('[task-3.2] Worker 错误:', error);
        alert(`处理过程中发生错误: ${error.message}`);
        
        // 隐藏进度条
        if (progressContainer) {
          progressContainer.classList.add("hidden");
        }
      };

      // 更新应用状态
      updateAppState({
        isProcessing: true,
        splitHeight: sliceHeight,
        fileName: fileNameInput.value || "分割结果"
      });

      // 创建 File 对象从 originalImage
      const canvas = document.createElement('canvas');
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);

      // 将 canvas 转换为 Blob，然后创建 File 对象
      canvas.toBlob((blob) => {
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        
        // 发送初始化消息给 Worker
        appState.worker.postMessage({
          file: file,
          splitHeight: sliceHeight
        });
        
        console.log('[task-3.2] 已发送初始化消息给 Worker');
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('[task-3.2] Worker 初始化失败:', error);
      alert(`初始化处理器失败: ${error.message}`);
      
      // 隐藏进度条
      if (progressContainer) {
        progressContainer.classList.add("hidden");
      }
    }
  }

  // 创建并更新所有预览UI
  function updatePreviewsUI() {
    previewContainer.innerHTML = ""; // 清空现有预览
    imageSlices.forEach((slice) => {
      createPreview(slice.data, slice.index, slice.width, slice.height);
    });

    // 恢复之前的选择状态
    document.querySelectorAll(".preview-checkbox").forEach((checkbox) => {
      const index = parseInt(checkbox.parentElement.dataset.index);
      const isSelected = selectedSlices.has(index);
      checkbox.checked = isSelected;
      checkbox.parentElement.classList.toggle("selected", isSelected);
    });
  }

  // 创建单个预览元素
  function createPreview(imageData, index, width, height) {
    const previewItem = document.createElement("div");
    previewItem.className = "preview-item";
    previewItem.dataset.index = index;

    // 创建复选框
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "preview-checkbox";
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
    img.className = "preview-img";
    img.alt = window.i18n.t("js.preview.alt", { index: index + 1 });
    img.addEventListener("click", () => {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event("change"));
    });

    const infoDiv = document.createElement("div");
    infoDiv.className = "preview-info";
    infoDiv.innerHTML = `
                <div><strong>${window.i18n.t("js.preview.header", {
                  index: index + 1,
                })}</strong></div>
                <div>${window.i18n.t("js.preview.dimensions", {
                  width: width,
                  height: height,
                })}</div>
                <div>${window.i18n.t("js.preview.size", {
                  size: Math.round(imageData.length / 1024),
                })}</div>
            `;

    previewItem.appendChild(checkbox);
    previewItem.appendChild(img);
    previewItem.appendChild(infoDiv);
    previewContainer.appendChild(previewItem);

    // 根据选择状态更新样式
    previewItem.classList.toggle("selected", selectedSlices.has(index));
  }

  // 更新选中计数
  function updateSelectedCount() {
    selectedCount.textContent = window.i18n.t("preview.selectedCount", {
      count: selectedSlices.size,
    });
  }

  // 全选所有片段
  function selectAllSlices() {
    selectedSlices.clear();
    document.querySelectorAll(".preview-checkbox").forEach((checkbox) => {
      checkbox.checked = true;
      const index = parseInt(checkbox.parentElement.dataset.index);
      selectedSlices.add(index);
      checkbox.parentElement.classList.add("selected");
    });
    updateSelectedCount();
  }

  // 取消所有选择
  function deselectAllSlices() {
    selectedSlices.clear();
    document.querySelectorAll(".preview-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.parentElement.classList.remove("selected");
    });
    updateSelectedCount();
  }

  // 导出为ZIP
  function exportAsZip() {
    if (selectedSlices.size === 0) {
      alert(window.i18n.t("js.alert.noSlicesSelected"));
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder("screenshot_slices");

    imageSlices.forEach((slice, index) => {
      if (selectedSlices.has(index)) {
        const base64Data = slice.data.split(",")[1];
        folder.file(`slice_${index + 1}.jpg`, base64Data, { base64: true });
      }
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, `${fileNameInput.value || "screenshot_slices"}.zip`);
    });
  }

  // 导出为PDF
  function exportAsPdf() {
    if (selectedSlices.size === 0) {
      alert(window.i18n.t("js.alert.noSlicesSelected"));
      return;
    }

    const { jsPDF } = window.jspdf;
    const selectedSlicesArray = imageSlices.filter((slice, index) =>
      selectedSlices.has(index)
    );

    if (selectedSlicesArray.length === 0) return;

    const doc = new jsPDF({
      orientation:
        selectedSlicesArray[0].width > selectedSlicesArray[0].height
          ? "l"
          : "p",
      unit: "px",
      format: [selectedSlicesArray[0].width, selectedSlicesArray[0].height],
    });

    selectedSlicesArray.forEach((slice, index) => {
      if (index > 0) doc.addPage();

      // 计算缩放比例以适合PDF页面
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      const widthRatio = pdfWidth / slice.width;
      const heightRatio = pdfHeight / slice.height;
      const ratio = Math.min(widthRatio, heightRatio);

      const scaledWidth = slice.width * ratio;
      const scaledHeight = slice.height * ratio;

      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;

      doc.addImage(slice.data, "JPEG", x, y, scaledWidth, scaledHeight);
    });

    doc.save(`${fileNameInput.value || "screenshot"}.pdf`);
  }

  // 重置应用
  function resetApp() {
    originalImage = null;
    imageSlices = [];
    selectedSlices.clear();

    fileInput.value = "";
    controls.classList.add("hidden");
    previewSection.classList.add("hidden");
    dropZone.style.display = "block";
    previewContainer.innerHTML = "";
    updateSelectedCount();
  }

  // 初始化时更新一次计数文本
  updateSelectedCount();
  
  // task-2.4: 初始化缩略图交互功能
  initializeThumbnailInteraction();

  // task-2.3: 测试函数 - 创建模拟的缩略图数据进行验证
  function testThumbnailFunction() {
    console.log('[task-2.3] 开始测试缩略图动态添加功能...');
    
    // 创建一个简单的测试图片 Blob (1x1 像素的红色 PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // 创建三个测试缩略图，每个颜色不同
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
    
    for (let i = 0; i < 3; i++) {
      // 绘制不同颜色的矩形
      ctx.fillStyle = colors[i];
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, 50, 55);
      
      // 转换为 Blob
      canvas.toBlob((blob) => {
        if (blob) {
          const chunkData = { blob, index: i };
          addThumbnailToList(chunkData);
        }
      }, 'image/png');
    }
    
    console.log('[task-2.3] 测试缩略图已添加，请检查页面左侧的缩略图列表');
  }

  // 将测试函数暴露到全局作用域，便于在控制台调用
  window.testThumbnailFunction = testThumbnailFunction;

  // task-3.2: 验证测试函数
  /**
   * 测试资源清理和 Worker 初始化功能
   */
  function testTask32() {
    console.log('[task-3.2 测试] 开始验证资源清理和 Worker 初始化...');
    
    // 模拟创建一些之前的资源
    console.log('[task-3.2 测试] 1. 模拟创建之前会话的资源...');
    
    // 创建一些模拟的 Object URLs
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 100;
    mockCanvas.height = 100;
    const mockCtx = mockCanvas.getContext('2d');
    mockCtx.fillStyle = '#FF0000';
    mockCtx.fillRect(0, 0, 100, 100);
    
    mockCanvas.toBlob((blob) => {
      const mockUrl1 = URL.createObjectURL(blob);
      const mockUrl2 = URL.createObjectURL(blob);
      
      // 手动添加到 appState 模拟之前的会话
      appState.objectUrls.push(mockUrl1, mockUrl2);
      appState.blobs.push(blob, blob);
      appState.selectedSlices.add(0);
      appState.selectedSlices.add(1);
      
      console.log('[task-3.2 测试] 模拟资源已创建:', {
        objectUrls: appState.objectUrls.length,
        blobs: appState.blobs.length,
        selectedSlices: appState.selectedSlices.size
      });
      
      // 创建模拟的 originalImage
      const mockImg = new Image();
      mockImg.width = 800;
      mockImg.height = 1600;
      mockImg.src = mockCanvas.toDataURL();
      
      mockImg.onload = () => {
        originalImage = mockImg;
        appState.originalImage = mockImg;
        
        // 设置分割高度
        if (sliceHeightInput) {
          sliceHeightInput.value = '400';
        }
        
        console.log('[task-3.2 测试] 2. 调用 processImage() 测试资源清理...');
        
        // 记录清理前的状态
        const beforeCleanup = {
          objectUrls: appState.objectUrls.length,
          blobs: appState.blobs.length,
          selectedSlices: appState.selectedSlices.size,
          hasWorker: !!appState.worker
        };
        
        console.log('[task-3.2 测试] 清理前状态:', beforeCleanup);
        
        // 调用 processImage
        processImage();
        
        // 验证清理后的状态 (延迟检查，因为 cleanupPreviousSession 是异步的)
        setTimeout(() => {
          const afterCleanup = {
            objectUrls: appState.objectUrls.length,
            blobs: appState.blobs.length,
            selectedSlices: appState.selectedSlices.size,
            hasWorker: !!appState.worker,
            isProcessing: appState.isProcessing
          };
          
          console.log('[task-3.2 测试] 清理后状态:', afterCleanup);
          
          // 验证清理效果
          console.log('[task-3.2 测试] 3. 验证清理效果:');
          console.log(`✅ Object URLs 已清空: ${afterCleanup.objectUrls === 0 ? '是' : '否'}`);
          console.log(`✅ Blobs 已清空: ${afterCleanup.blobs === 0 ? '是' : '否'}`);
          console.log(`✅ 选择状态已重置: ${afterCleanup.selectedSlices === 0 ? '是' : '否'}`);
          console.log(`✅ Worker 已创建: ${afterCleanup.hasWorker ? '是' : '否'}`);
          console.log(`✅ 处理状态已设置: ${afterCleanup.isProcessing ? '是' : '否'}`);
          
          // 验证进度条是否显示
          const progressContainer = document.getElementById("progress-container");
          const progressVisible = progressContainer && !progressContainer.classList.contains('hidden');
          console.log(`✅ 进度条已显示: ${progressVisible ? '是' : '否'}`);
          
          console.log('[task-3.2 测试] 验证完成！');
          
          if (afterCleanup.objectUrls === 0 && 
              afterCleanup.blobs === 0 && 
              afterCleanup.selectedSlices === 0 && 
              afterCleanup.hasWorker && 
              afterCleanup.isProcessing && 
              progressVisible) {
            console.log('🎉 [task-3.2] 所有验证项目都通过了！');
          } else {
            console.warn('⚠️ [task-3.2] 某些验证项目未通过，请检查实现');
          }
          
        }, 500);
      };
    });
  }

  // 暴露测试函数
  window.testTask32 = testTask32;

  /**
   * 测试第二次上传时的资源清理效果 (task-3.2 验证标准)
   */
  function testSecondUpload() {
    console.log('[task-3.2 第二次上传测试] 开始测试第二次上传的资源清理效果...');
    
    // 模拟第一次上传产生的资源
    console.log('[第二次上传测试] 1. 模拟第一次上传产生的资源...');
    
    const firstCanvas = document.createElement('canvas');
    firstCanvas.width = 200;
    firstCanvas.height = 200;
    const firstCtx = firstCanvas.getContext('2d');
    firstCtx.fillStyle = '#0000FF';
    firstCtx.fillRect(0, 0, 200, 200);
    
    firstCanvas.toBlob((firstBlob) => {
      // 模拟第一次上传的结果
      const firstUrl1 = URL.createObjectURL(firstBlob);
      const firstUrl2 = URL.createObjectURL(firstBlob);
      
      appState.objectUrls.push(firstUrl1, firstUrl2);
      appState.blobs.push(firstBlob, firstBlob);
      appState.selectedSlices.add(0);
      appState.selectedSlices.add(1);
      
      // 模拟创建第一个 Worker
      try {
        appState.worker = new Worker('/src/scripts/split.worker.js');
        console.log('[第二次上传测试] 第一个 Worker 已创建');
      } catch (error) {
        console.log('[第二次上传测试] Worker 创建失败，继续测试...');
      }
      
      console.log('[第二次上传测试] 第一次上传模拟完成:', {
        objectUrls: appState.objectUrls.length,
        blobs: appState.blobs.length,
        selectedSlices: appState.selectedSlices.size,
        hasWorker: !!appState.worker
      });
      
      // 模拟第二次上传的图片
      console.log('[第二次上传测试] 2. 准备第二次上传...');
      
      const secondCanvas = document.createElement('canvas');
      secondCanvas.width = 300;
      secondCanvas.height = 600;
      const secondCtx = secondCanvas.getContext('2d');
      secondCtx.fillStyle = '#00FF00';
      secondCtx.fillRect(0, 0, 300, 600);
      
      const secondImg = new Image();
      secondImg.width = 300;
      secondImg.height = 600;
      secondImg.src = secondCanvas.toDataURL();
      
      secondImg.onload = () => {
        originalImage = secondImg;
        appState.originalImage = secondImg;
        
        if (sliceHeightInput) {
          sliceHeightInput.value = '200';
        }
        
        // 记录第二次上传前的状态
        const beforeSecondUpload = {
          objectUrls: appState.objectUrls.length,
          blobs: appState.blobs.length,
          selectedSlices: appState.selectedSlices.size,
          hasWorker: !!appState.worker
        };
        
        console.log('[第二次上传测试] 第二次上传前状态:', beforeSecondUpload);
        
        // 执行第二次上传
        console.log('[第二次上传测试] 3. 执行第二次上传 (processImage)...');
        processImage();
        
        // 验证清理效果
        setTimeout(() => {
          const afterSecondUpload = {
            objectUrls: appState.objectUrls.length,
            blobs: appState.blobs.length,
            selectedSlices: appState.selectedSlices.size,
            hasWorker: !!appState.worker,
            isProcessing: appState.isProcessing
          };
          
          console.log('[第二次上传测试] 第二次上传后状态:', afterSecondUpload);
          
          // 验证关键指标 (task-3.2 验证标准)
          console.log('[第二次上传测试] 4. 验证清理效果:');
          
          const objectUrlsCleared = afterSecondUpload.objectUrls === 0;
          const blobsCleared = afterSecondUpload.blobs === 0;
          const selectedSlicesCleared = afterSecondUpload.selectedSlices === 0;
          const workerRecreated = afterSecondUpload.hasWorker;
          const processingStarted = afterSecondUpload.isProcessing;
          
          console.log(`✅ 前一次的 Object URLs 被释放: ${objectUrlsCleared ? '是' : '否'}`);
          console.log(`✅ 前一次的 Blobs 被清空: ${blobsCleared ? '是' : '否'}`);
          console.log(`✅ 前一次的选择状态被重置: ${selectedSlicesCleared ? '是' : '否'}`);
          console.log(`✅ Worker 被重新创建: ${workerRecreated ? '是' : '否'}`);
          console.log(`✅ 新的处理流程已开始: ${processingStarted ? '是' : '否'}`);
          
          if (objectUrlsCleared && blobsCleared && selectedSlicesCleared && workerRecreated && processingStarted) {
            console.log('🎉 [task-3.2] 第二次上传测试通过！前一次的 Object URL 被释放，appState 被重置');
          } else {
            console.warn('⚠️ [task-3.2] 第二次上传测试未完全通过，请检查资源清理逻辑');
          }
          
        }, 600);
      };
    });
  }

  // 暴露第二次上传测试函数
  window.testSecondUpload = testSecondUpload;

  // task-2.4: 更新测试入口 - 显示正确的预览界面并测试交互功能
  function showPreviewAndTest() {
    // 显示新的双栏预览界面 (注意：这里使用 preview-section，不是 previewSection)
    const newPreviewSection = document.getElementById('preview-section');
    
    // 隐藏旧的预览界面
    const oldPreviewSection = document.getElementById('previewSection');
    if (oldPreviewSection) {
      oldPreviewSection.classList.add('hidden');
    }
    
    if (newPreviewSection) {
      newPreviewSection.classList.remove('hidden');
      console.log('[task-2.4] 新的双栏预览界面已显示');
      
      // 清空现有缩略图
      if (thumbnailList) {
        thumbnailList.innerHTML = '';
      }
      
      // 添加测试缩略图
      setTimeout(() => {
        testThumbnailFunction();
        console.log('[task-2.4] 测试提示: 点击左侧任意缩略图测试交互功能');
        console.log('[task-2.4] 您现在应该看到左右双栏布局：左侧缩略图列表，右侧大图预览');
      }, 100);
    } else {
      console.error('[task-2.4] 新预览界面元素未找到 (preview-section)');
    }
  }

  // task-2.4: 添加专门测试交互功能的函数
  function testThumbnailInteraction() {
    console.log('[task-2.4] 开始测试缩略图交互功能...');
    
    const thumbnailItems = document.querySelectorAll('.thumbnail-item');
    
    if (thumbnailItems.length === 0) {
      console.warn('[task-2.4] 没有找到缩略图，请先运行 showPreviewAndTest()');
      return;
    }
    
    console.log(`[task-2.4] 找到 ${thumbnailItems.length} 个缩略图`);
    
    // 自动测试：依次选中每个缩略图
    let currentIndex = 0;
    const autoSelectNext = () => {
      if (currentIndex < thumbnailItems.length) {
        const item = thumbnailItems[currentIndex];
        console.log(`[task-2.4] 自动选中缩略图 ${currentIndex + 1}`);
        selectThumbnail(item);
        currentIndex++;
        
        // 延迟1秒后选中下一个
        setTimeout(autoSelectNext, 1000);
      } else {
        console.log('[task-2.4] 自动测试完成！现在可以手动点击缩略图测试交互');
      }
    };
    
    autoSelectNext();
  }

  // 暴露测试入口
  window.showPreviewAndTest = showPreviewAndTest;
  window.testThumbnailInteraction = testThumbnailInteraction;

  // task-2.5: 添加导出按钮测试函数
  /**
   * 测试导出按钮功能
   */
  function testExportButtons() {
    console.log('[task-2.5] 开始测试导出按钮功能...');
    
    // 首先显示预览界面
    showPreviewAndTest();
    
    // 延迟启用导出按钮以模拟处理完成
    setTimeout(() => {
      console.log('[task-2.5] 模拟图片处理完成，启用导出按钮...');
      toggleNewExportButtons(true);
      
      // 检查按钮状态
      if (newExportZipBtn && newExportPdfBtn) {
        console.log(`[task-2.5] ZIP按钮状态: ${newExportZipBtn.disabled ? '禁用' : '启用'}`);
        console.log(`[task-2.5] PDF按钮状态: ${newExportPdfBtn.disabled ? '禁用' : '启用'}`);
        console.log('[task-2.5] 测试提示: 现在可以点击导出按钮测试导出功能');
      } else {
        console.error('[task-2.5] 导出按钮未找到');
      }
    }, 2000);
  }

  // 暴露导出按钮测试函数
  window.testExportButtons = testExportButtons;

  // task-2.5: 暴露导出函数和状态管理函数到全局作用域，便于测试
  window.exportAsZip = exportAsZip;
  window.exportAsPdf = exportAsPdf;
  window.toggleNewExportButtons = toggleNewExportButtons;

  // 新增：暴露新预览界面的选择管理函数
  window.selectAllSlicesInNewInterface = selectAllSlicesInNewInterface;
  window.deselectAllSlicesInNewInterface = deselectAllSlicesInNewInterface;
  window.updateNewSelectedCount = updateNewSelectedCount;

  });
}
