// 导出管理模块
// 管理ZIP和PDF导出功能，使用Worker生成的Blob数据

/**
 * 导出为ZIP - 使用 Worker 生成的 Blob 数据
 * @param {Object} appState - 应用状态对象
 */
function exportAsZip(appState) {
  // 检查 JSZip 库是否已加载
  if (typeof JSZip === 'undefined') {
    console.error('[Export] JSZip 库未加载');
    alert('JSZip 库正在加载中，请稍后再试');
    return;
  }

  if (appState.selectedSlices.size === 0) {
    alert(window.i18n ? window.i18n.t("js.alert.noSlicesSelected") : '请至少选择一个片段');
    return;
  }

  // 检查是否有 Worker 生成的 Blob 数据
  if (appState.blobs.length === 0) {
    console.warn('[ExportManager] 没有可用的 Blob 数据，可能需要先处理图片');
    alert('请先处理图片后再导出');
    return;
  }

  console.log('[ExportManager] 开始ZIP导出，选中片段数:', appState.selectedSlices.size);
  console.log('[ExportManager] 可用Blob数量:', appState.blobs.length);

  const zip = new JSZip();
  const folder = zip.folder("screenshot_slices");

  // 使用 appState.blobs 中的数据
  const exportPromises = [];
  
  appState.blobs.forEach((blob, index) => {
    if (appState.selectedSlices.has(index) && blob) {
      console.log(`[ExportManager] 添加切片 ${index + 1} 到ZIP, Blob大小: ${blob.size} bytes`);
      
      // 将 Blob 转换为 ArrayBuffer 然后添加到 ZIP
      const promise = blob.arrayBuffer().then(arrayBuffer => {
        folder.file(`slice_${index + 1}.jpg`, arrayBuffer);
        return `slice_${index + 1}.jpg`;
      });
      
      exportPromises.push(promise);
    }
  });

  // 等待所有文件添加完成，然后生成ZIP
  Promise.all(exportPromises).then(fileNames => {
    console.log('[ExportManager] 所有文件已添加到ZIP:', fileNames);
    
    return zip.generateAsync({ type: "blob" });
  }).then((content) => {
    const fileNameInput = document.getElementById("fileName");
    const fileName = `${appState.fileName || fileNameInput?.value || "screenshot_slices"}.zip`;
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = fileName;
    link.click();
    
    // 清理URL对象
    URL.revokeObjectURL(link.href);
    
    console.log(`[ExportManager] ZIP导出成功: ${fileName}, 包含 ${exportPromises.length} 个文件`);
  }).catch(error => {
    console.error('[ExportManager] ZIP导出失败:', error);
    alert(`ZIP导出失败: ${error.message}`);
  });
}

/**
 * 导出为PDF - 使用 Worker 生成的 Blob 数据
 * @param {Object} appState - 应用状态对象
 */
function exportAsPdf(appState) {
  // 检查 jsPDF 库是否已加载
  if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    console.error('[Export] jsPDF 库未加载');
    alert('jsPDF 库正在加载中，请稍后再试');
    return;
  }

  if (appState.selectedSlices.size === 0) {
    alert(window.i18n ? window.i18n.t("js.alert.noSlicesSelected") : '请至少选择一个片段');
    return;
  }

  // 检查是否有 Worker 生成的 Blob 数据
  if (appState.blobs.length === 0) {
    console.warn('[ExportManager] 没有可用的 Blob 数据，可能需要先处理图片');
    alert('请先处理图片后再导出');
    return;
  }

  console.log('[ExportManager] 开始PDF导出，选中片段数:', appState.selectedSlices.size);
  console.log('[ExportManager] 可用Blob数量:', appState.blobs.length);

  const { jsPDF } = window.jspdf;
  
  // 收集选中的 Blob 数据并转换为 Object URLs
  const selectedBlobsWithIndex = [];
  appState.blobs.forEach((blob, index) => {
    if (appState.selectedSlices.has(index) && blob) {
      selectedBlobsWithIndex.push({ blob, index });
    }
  });

  if (selectedBlobsWithIndex.length === 0) {
    console.warn('[ExportManager] 没有选中的有效 Blob 数据');
    return;
  }

  // 先创建第一个图片来确定PDF页面尺寸
  const firstBlob = selectedBlobsWithIndex[0].blob;
  const firstImageUrl = URL.createObjectURL(firstBlob);
  
  const firstImg = new Image();
  firstImg.onload = function() {
    console.log(`[ExportManager] 第一个图片加载完成，尺寸: ${firstImg.width} x ${firstImg.height}`);
    
    // 创建PDF文档
    const doc = new jsPDF({
      orientation: firstImg.width > firstImg.height ? "l" : "p",
      unit: "px", 
      format: [firstImg.width, firstImg.height],
    });

    console.log('[ExportManager] PDF文档已创建，开始添加图片...');

    // 处理所有选中的图片
    let processedCount = 0;
    const totalCount = selectedBlobsWithIndex.length;

    selectedBlobsWithIndex.forEach((item, docIndex) => {
      const { blob, index } = item;
      const imageUrl = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = function() {
        console.log(`[ExportManager] 处理图片 ${index + 1}/${totalCount}，尺寸: ${img.width} x ${img.height}`);
        
        if (docIndex > 0) {
          doc.addPage([img.width, img.height], img.width > img.height ? "l" : "p");
        }

        // 计算缩放比例以适合PDF页面
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        const widthRatio = pdfWidth / img.width;
        const heightRatio = pdfHeight / img.height;
        const ratio = Math.min(widthRatio, heightRatio);

        const scaledWidth = img.width * ratio;
        const scaledHeight = img.height * ratio;

        const x = (pdfWidth - scaledWidth) / 2;
        const y = (pdfHeight - scaledHeight) / 2;

        // 将 Blob URL 直接作为图片源添加到PDF
        doc.addImage(imageUrl, "JPEG", x, y, scaledWidth, scaledHeight);
        
        // 释放 Object URL
        URL.revokeObjectURL(imageUrl);
        
        processedCount++;
        
        // 所有图片处理完成后保存PDF
        if (processedCount === totalCount) {
          const fileNameInput = document.getElementById("fileName");
          const fileName = `${appState.fileName || fileNameInput?.value || "screenshot"}.pdf`;
          doc.save(fileName);
          
          console.log(`[ExportManager] PDF导出成功: ${fileName}, 包含 ${totalCount} 页`);
        }
      };
      
      img.onerror = function() {
        console.error(`[ExportManager] 图片 ${index + 1} 加载失败`);
        URL.revokeObjectURL(imageUrl);
        
        processedCount++;
        if (processedCount === totalCount) {
          alert('PDF导出过程中某些图片加载失败');
        }
      };
      
      img.src = imageUrl;
    });
    
    // 释放第一个图片的 Object URL
    URL.revokeObjectURL(firstImageUrl);
  };
  
  firstImg.onerror = function() {
    console.error('[ExportManager] 第一个图片加载失败');
    URL.revokeObjectURL(firstImageUrl);
    alert('PDF导出失败：无法加载图片');
  };
  
  firstImg.src = firstImageUrl;
}

// 暴露函数到全局作用域
window.exportAsZip = exportAsZip;
window.exportAsPdf = exportAsPdf;