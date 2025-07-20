// 预览界面管理模块
// 管理缩略图列表、大图预览和用户交互

/**
 * 添加缩略图到列表
 * @param {string} dataUrl - 图片数据URL
 * @param {number} index - 切片索引
 * @param {Object} appState - 应用状态对象
 */
function addThumbnailToList(dataUrl, index, appState) {
  const thumbnailList = document.getElementById('thumbnail-list');
  if (!thumbnailList) {
    console.warn('[PreviewInterface] 缩略图列表容器未找到');
    return;
  }

  // 如果是第一个缩略图，清空占位符内容
  if (index === 0) {
    thumbnailList.innerHTML = '';
  }

  // 创建缩略图容器
  const thumbnailItem = document.createElement('div');
  thumbnailItem.className = 'thumbnail-item';
  thumbnailItem.dataset.index = index;

  // 创建复选框
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'thumbnail-checkbox';
  checkbox.checked = appState.selectedSlices.has(index);
  
  // 创建图片元素
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = `切片 ${index + 1}`;
  img.className = 'thumbnail-img thumbnail-image'; // 同时添加两个类名以兼容样式和事件
  img.loading = 'lazy';

  // 创建信息容器
  const infoDiv = document.createElement('div');
  infoDiv.className = 'thumbnail-info';
  
  // 创建标签
  const label = document.createElement('div');
  label.className = 'thumbnail-label';
  label.textContent = `切片 ${index + 1}`;
  
  // 创建提示文本
  const hint = document.createElement('div');
  hint.className = 'thumbnail-hint';
  hint.textContent = '点击图片预览，点击其他区域选择';
  
  // 组装信息容器
  infoDiv.appendChild(label);
  infoDiv.appendChild(hint);

  // 组装缩略图项
  thumbnailItem.appendChild(checkbox);
  thumbnailItem.appendChild(img);
  thumbnailItem.appendChild(infoDiv);
  
  // 添加到列表
  thumbnailList.appendChild(thumbnailItem);

  console.log(`[PreviewInterface] 添加缩略图 ${index + 1}`);
}

/**
 * 选中缩略图并更新大图预览
 * @param {number} index - 切片索引
 * @param {Object} appState - 应用状态对象
 */
function selectThumbnail(index, appState) {
  // 更新选中状态
  if (appState.selectedSlices.has(index)) {
    appState.selectedSlices.delete(index);
  } else {
    appState.selectedSlices.add(index);
  }

  // 更新复选框状态
  const thumbnailItem = document.querySelector(`[data-index="${index}"]`);
  if (thumbnailItem) {
    const checkbox = thumbnailItem.querySelector('.thumbnail-checkbox');
    if (checkbox) {
      checkbox.checked = appState.selectedSlices.has(index);
    }
    
    // 更新视觉状态
    if (appState.selectedSlices.has(index)) {
      thumbnailItem.classList.add('selected');
    } else {
      thumbnailItem.classList.remove('selected');
    }
  }

  // 更新选中计数和导出按钮状态
  updateSelectedCount(appState);
  toggleExportButtons(appState);

  console.log(`[PreviewInterface] 切片 ${index + 1} 选中状态: ${appState.selectedSlices.has(index)}`);
}

/**
 * 更新大图预览
 * @param {string} dataUrl - 图片数据URL
 * @param {number} index - 切片索引
 */
function updatePreviewImage(dataUrl, index) {
  const previewImage = document.getElementById('preview-image');
  const previewPlaceholder = document.getElementById('preview-placeholder');
  const currentPreviewInfo = document.getElementById('current-preview-info');
  
  if (!previewImage) {
    console.warn('[PreviewInterface] 预览图片元素未找到');
    return;
  }

  // 显示加载状态
  if (previewPlaceholder) {
    previewPlaceholder.style.display = 'block';
    previewPlaceholder.textContent = '加载中...';
  }
  
  previewImage.style.display = 'none';

  // 加载图片
  previewImage.onload = function() {
    if (previewPlaceholder) {
      previewPlaceholder.style.display = 'none';
    }
    previewImage.style.display = 'block';
    
    // 更新当前预览信息
    if (currentPreviewInfo) {
      currentPreviewInfo.textContent = `切片 ${index + 1}`;
    }
    
    console.log(`[PreviewInterface] 大图预览已更新: 切片 ${index + 1}`);
  };

  previewImage.onerror = function() {
    if (previewPlaceholder) {
      previewPlaceholder.style.display = 'block';
      previewPlaceholder.textContent = '图片加载失败';
    }
    previewImage.style.display = 'none';
    console.error(`[PreviewInterface] 大图预览加载失败: 切片 ${index + 1}`);
  };

  previewImage.src = dataUrl;
}

/**
 * 初始化缩略图交互
 * @param {Object} appState - 应用状态对象
 */
function initializeThumbnailInteraction(appState) {
  const thumbnailList = document.getElementById('thumbnail-list');
  if (!thumbnailList) {
    console.warn('[PreviewInterface] 缩略图列表容器未找到，无法初始化交互');
    return;
  }

  // 使用事件委托处理缩略图交互
  thumbnailList.addEventListener('click', function(event) {
    const thumbnailItem = event.target.closest('.thumbnail-item');
    if (!thumbnailItem) return;

    const index = parseInt(thumbnailItem.dataset.index);
    if (isNaN(index)) return;

    // 如果点击的是图片，显示大图预览
    if (event.target.classList.contains('thumbnail-image')) {
      event.stopPropagation(); // 阻止事件冒泡，避免触发选择
      const img = event.target;
      updatePreviewImage(img.src, index);
      return;
    }

    // 如果点击的是复选框，让其自然处理
    if (event.target.classList.contains('thumbnail-checkbox')) {
      // 复选框的状态变化会在下面的 change 事件中处理
      return;
    }

    // 其他区域点击时切换选择状态
    selectThumbnail(index, appState);
  });

  // 处理复选框状态变化
  thumbnailList.addEventListener('change', function(event) {
    if (event.target.classList.contains('thumbnail-checkbox')) {
      const thumbnailItem = event.target.closest('.thumbnail-item');
      if (thumbnailItem) {
        const index = parseInt(thumbnailItem.dataset.index);
        if (!isNaN(index)) {
          // 根据复选框状态更新选中状态
          if (event.target.checked) {
            appState.selectedSlices.add(index);
          } else {
            appState.selectedSlices.delete(index);
          }
          
          // 更新视觉状态
          if (appState.selectedSlices.has(index)) {
            thumbnailItem.classList.add('selected');
          } else {
            thumbnailItem.classList.remove('selected');
          }
          
          // 更新选中计数和导出按钮状态
          updateSelectedCount(appState);
          toggleExportButtons(appState);
          
          console.log(`[PreviewInterface] 复选框变化: 切片 ${index + 1} 选中状态: ${appState.selectedSlices.has(index)}`);
        }
      }
    }
  });

  console.log('[PreviewInterface] 缩略图交互已初始化');
}

/**
 * 更新选中计数显示
 * @param {Object} appState - 应用状态对象
 */
function updateSelectedCount(appState) {
  const selectedCountElement = document.getElementById('new-selected-count');
  if (selectedCountElement) {
    selectedCountElement.textContent = `已选择 ${appState.selectedSlices.size} 个片段`;
  }
}

/**
 * 切换导出按钮的启用状态
 * @param {Object} appState - 应用状态对象
 */
function toggleExportButtons(appState) {
  const hasSelection = appState.selectedSlices.size > 0;
  
  const zipButton = document.getElementById('export-zip-btn');
  const pdfButton = document.getElementById('export-pdf-btn');
  
  if (zipButton) {
    zipButton.disabled = !hasSelection;
  }
  
  if (pdfButton) {
    pdfButton.disabled = !hasSelection;
  }
}

/**
 * 全选所有切片
 * @param {Object} appState - 应用状态对象
 */
function selectAllSlices(appState) {
  // 使用 blobs 数组的长度来确定切片数量
  for (let i = 0; i < appState.blobs.length; i++) {
    appState.selectedSlices.add(i);
  }
  
  // 更新所有复选框状态
  const checkboxes = document.querySelectorAll('.thumbnail-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    const thumbnailItem = checkbox.closest('.thumbnail-item');
    if (thumbnailItem) {
      thumbnailItem.classList.add('selected');
    }
  });
  
  updateSelectedCount(appState);
  toggleExportButtons(appState);
  
  console.log('[PreviewInterface] 已全选所有切片');
}

/**
 * 取消选择所有切片
 * @param {Object} appState - 应用状态对象
 */
function deselectAllSlices(appState) {
  appState.selectedSlices.clear();
  
  // 更新所有复选框状态
  const checkboxes = document.querySelectorAll('.thumbnail-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    const thumbnailItem = checkbox.closest('.thumbnail-item');
    if (thumbnailItem) {
      thumbnailItem.classList.remove('selected');
    }
  });
  
  updateSelectedCount(appState);
  toggleExportButtons(appState);
  
  console.log('[PreviewInterface] 已取消选择所有切片');
}

// 暴露函数到全局作用域
window.addThumbnailToList = addThumbnailToList;
window.selectThumbnail = selectThumbnail;
window.updatePreviewImage = updatePreviewImage;
window.initializeThumbnailInteraction = initializeThumbnailInteraction;
window.updateSelectedCount = updateSelectedCount;
window.toggleExportButtons = toggleExportButtons;
window.selectAllSlices = selectAllSlices;
window.deselectAllSlices = deselectAllSlices;