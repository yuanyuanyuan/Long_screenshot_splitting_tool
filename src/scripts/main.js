// 仅在浏览器环境中执行
if (typeof document !== 'undefined') {
  document.addEventListener("i18n:ready", () => {
  // 全局变量
  let originalImage = null;
  let imageSlices = [];
  let selectedSlices = new Set();
  
  // TODO: 在 task-3.x 中实现实际的 Worker 集成逻辑

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

  // task-2.3: 实现缩略图动态添加函数
  /**
   * 添加缩略图到预览列表
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
    thumbnailItem.className = 'flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200';
    thumbnailItem.dataset.index = index;
    thumbnailItem.dataset.imageUrl = imageUrl;

    // 创建缩略图图片
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'w-16 h-16 object-cover rounded-md shadow-sm';
    img.alt = `切片 ${index + 1}`;
    
    // 创建文字信息
    const textInfo = document.createElement('div');
    textInfo.className = 'ml-3 flex-1';
    textInfo.innerHTML = `
      <div class="text-sm font-medium text-gray-900">切片 ${index + 1}</div>
      <div class="text-xs text-gray-500">点击查看大图</div>
    `;

    // 组装缩略图项
    thumbnailItem.appendChild(img);
    thumbnailItem.appendChild(textInfo);

    // 添加点击事件：点击缩略图更新大图预览（为 task-2.4 预留）
    thumbnailItem.addEventListener('click', () => {
      // 移除其他缩略图的选中状态
      document.querySelectorAll('#thumbnail-list > div').forEach(item => {
        item.classList.remove('bg-blue-100', 'border-blue-300');
        item.classList.add('bg-gray-50', 'border-gray-200');
      });
      
      // 添加当前缩略图的选中状态
      thumbnailItem.classList.remove('bg-gray-50', 'border-gray-200');
      thumbnailItem.classList.add('bg-blue-100', 'border-blue-300');
      
      // 更新大图预览（为 task-2.4 预留接口）
      updatePreviewImage(imageUrl, index);
    });

    // 将缩略图添加到列表中
    thumbnailList.appendChild(thumbnailItem);

    console.log(`[task-2.3] 成功添加缩略图 ${index + 1} 到列表`);
  }

  /**
   * 更新大图预览（为 task-2.4 预留的接口）
   * @param {string} imageUrl - 图片的 Object URL
   * @param {number} index - 切片索引
   */
  function updatePreviewImage(imageUrl, index) {
    if (previewImage) {
      previewImage.src = imageUrl;
      previewImage.style.display = 'block';
      
      // 隐藏占位符
      const placeholder = document.getElementById('preview-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    }
    
    if (currentPreviewInfo) {
      currentPreviewInfo.textContent = `切片 ${index + 1}`;
    }
    
    console.log(`[task-2.3] 更新大图预览为切片 ${index + 1}`);
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

  // 处理图片分割
  function processImage() {
    if (!originalImage) return;

    const sliceHeight = parseInt(sliceHeightInput.value);
    if (isNaN(sliceHeight) || sliceHeight < 100 || sliceHeight > 5000) {
      alert(window.i18n.t("js.alert.invalidSliceHeight"));
      return;
    }

    imageSlices = [];
    selectedSlices.clear();
    previewContainer.innerHTML = "";
    updateSelectedCount();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = originalImage.width;

    // 计算需要分割的片段数量
    const numSlices = Math.ceil(originalImage.height / sliceHeight);

    // 分割图片
    for (let i = 0; i < numSlices; i++) {
      const startY = i * sliceHeight;
      const sliceActualHeight = Math.min(
        sliceHeight,
        originalImage.height - startY
      );

      // 设置canvas高度为当前片段高度
      canvas.height = sliceActualHeight;

      // 绘制图片片段
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        originalImage,
        0,
        startY,
        originalImage.width,
        sliceActualHeight,
        0,
        0,
        originalImage.width,
        sliceActualHeight
      );

      // 获取图片数据URL
      const imageData = canvas.toDataURL("image/jpeg", 0.9);
      imageSlices.push({
        data: imageData,
        width: originalImage.width,
        height: sliceActualHeight,
        index: i,
      });

      // 默认选择所有片段
      selectedSlices.add(i);
    }

    updatePreviewsUI();
    previewSection.classList.remove("hidden");
    updateSelectedCount();
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

  // task-2.3: 添加简单的测试入口 - 显示预览界面并添加测试缩略图
  function showPreviewAndTest() {
    // 显示预览界面
    const previewSection = document.getElementById('preview-section');
    if (previewSection) {
      previewSection.classList.remove('hidden');
      console.log('[task-2.3] 预览界面已显示');
      
      // 清空现有缩略图
      if (thumbnailList) {
        thumbnailList.innerHTML = '';
      }
      
      // 添加测试缩略图
      setTimeout(() => {
        testThumbnailFunction();
      }, 100);
    } else {
      console.error('[task-2.3] 预览界面元素未找到');
    }
  }

  // 暴露测试入口
  window.showPreviewAndTest = showPreviewAndTest;

  });
}
