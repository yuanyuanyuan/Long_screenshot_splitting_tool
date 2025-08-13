// 预览界面模块
// 管理缩略图列表、大图预览、用户交互等功能

/**
 * 添加缩略图到预览列表（增强版：支持选择功能）
 * @param {Object} chunkData - Worker 发来的 chunk 数据
 * @param {Blob} chunkData.blob - 图片切片的 Blob 对象
 * @param {number} chunkData.index - 切片的索引（从0开始）
 * @param {Object} appState - 应用状态对象
 */
export function addThumbnailToList(chunkData, appState) {
  const { blob, index } = chunkData;
  
  const thumbnailList = document.getElementById("thumbnail-list");
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
      appState.selectedSlices.add(index);
      thumbnailItem.classList.add('selected');
    } else {
      appState.selectedSlices.delete(index);
      thumbnailItem.classList.remove('selected');
    }
    updateNewSelectedCount(appState);
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
  appState.selectedSlices.add(index);
  thumbnailItem.classList.add('selected');

  console.log(`[PreviewInterface] 成功添加缩略图 ${index + 1} 到列表`);
  
  // 更新选择计数
  updateNewSelectedCount(appState);
  
  // 如果这是第一个缩略图，自动选中并显示大图
  if (index === 0) {
    selectThumbnail(thumbnailItem);
  }
}

/**
 * 选中指定的缩略图并更新大图预览
 * @param {HTMLElement} thumbnailItem - 要选中的缩略图元素
 */
export function selectThumbnail(thumbnailItem) {
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
  
  console.log(`[PreviewInterface] 选中缩略图 ${index + 1}`);
}

/**
 * 更新大图预览
 * @param {string} imageUrl - 图片的 Object URL
 * @param {number} index - 切片索引
 */
export function updatePreviewImage(imageUrl, index) {
  const previewImage = document.getElementById("preview-image");
  if (!previewImage) {
    console.error('[PreviewInterface] preview-image element not found');
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
    const currentPreviewInfo = document.getElementById("current-preview-info");
    if (currentPreviewInfo) {
      currentPreviewInfo.textContent = `切片 ${index + 1}`;
    }
    
    // 添加图片加载错误处理
    previewImage.onerror = () => {
      console.error(`[PreviewInterface] 加载大图预览失败: 切片 ${index + 1}`);
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
      console.log(`[PreviewInterface] 成功更新大图预览为切片 ${index + 1}`);
    };
    
  } catch (error) {
    console.error(`[PreviewInterface] 更新大图预览时发生错误:`, error);
  }
}

/**
 * 初始化缩略图事件委托
 */
export function initializeThumbnailInteraction() {
  const thumbnailList = document.getElementById("thumbnail-list");
  if (!thumbnailList) {
    console.error('[PreviewInterface] thumbnail-list element not found');
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
  
  console.log('[PreviewInterface] 缩略图交互事件委托已初始化');
}

/**
 * 关闭预览界面，返回主界面
 * 注意：task-3.6后此函数已弃用，因为新布局不再需要关闭按钮
 * 保留此函数仅为向后兼容
 */
export function closePreviewInterface() {
  const newPreviewSection = document.getElementById('preview-section');
  if (newPreviewSection) {
    newPreviewSection.classList.add('hidden');
    console.log('[PreviewInterface] 预览界面已关闭，返回主界面');
  }
}

/**
 * 更新新预览界面的选择计数显示
 * @param {Object} appState - 应用状态对象
 */
export function updateNewSelectedCount(appState) {
  const newSelectedCount = document.getElementById("new-selected-count");
  if (newSelectedCount) {
    newSelectedCount.textContent = `已选择 ${appState.selectedSlices.size} 个片段`;
  }
}

/**
 * 新预览界面：全选所有片段
 * @param {Object} appState - 应用状态对象
 */
export function selectAllSlicesInNewInterface(appState) {
  document.querySelectorAll('.thumbnail-item').forEach((item) => {
    const index = parseInt(item.dataset.index);
    const checkbox = item.querySelector('.thumbnail-checkbox');
    
    if (checkbox && !isNaN(index)) {
      checkbox.checked = true;
      appState.selectedSlices.add(index);
      item.classList.add('selected');
    }
  });
  updateNewSelectedCount(appState);
  console.log('[PreviewInterface] 已全选所有片段');
}

/**
 * 新预览界面：取消所有选择
 * @param {Object} appState - 应用状态对象
 */
export function deselectAllSlicesInNewInterface(appState) {
  document.querySelectorAll('.thumbnail-item').forEach((item) => {
    const checkbox = item.querySelector('.thumbnail-checkbox');
    
    if (checkbox) {
      checkbox.checked = false;
      item.classList.remove('selected');
    }
  });
  appState.selectedSlices.clear();
  updateNewSelectedCount(appState);
  console.log('[PreviewInterface] 已取消所有选择');
}

/**
 * 启用或禁用新预览界面的导出按钮
 * @param {boolean} enabled - 是否启用按钮
 */
export function toggleNewExportButtons(enabled) {
  const newExportZipBtn = document.getElementById("export-zip-btn");
  const newExportPdfBtn = document.getElementById("export-pdf-btn");
  
  if (newExportZipBtn) {
    newExportZipBtn.disabled = !enabled;
    console.log(`[PreviewInterface] ZIP导出按钮已${enabled ? '启用' : '禁用'}`);
  }
  
  if (newExportPdfBtn) {
    newExportPdfBtn.disabled = !enabled;
    console.log(`[PreviewInterface] PDF导出按钮已${enabled ? '启用' : '禁用'}`);
  }
} 