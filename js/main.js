document.addEventListener("DOMContentLoaded", () => {
  // 全局变量
  let originalImage = null;
  let imageSlices = [];
  let selectedSlices = new Set();

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

      // 创建预览
      createPreview(imageData, i, originalImage.width, sliceActualHeight);
    }

    previewSection.classList.remove("hidden");
    updateSelectedCount();
  }

  // 创建预览元素
  function createPreview(imageData, index, width, height) {
    const previewItem = document.createElement("div");
    previewItem.className = "preview-item";
    previewItem.dataset.index = index;

    // 创建复选框
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "preview-checkbox";
    checkbox.checked = true;
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

    // 初始选中状态
    previewItem.classList.add("selected");
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
});
