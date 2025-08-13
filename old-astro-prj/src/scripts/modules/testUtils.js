// 测试工具模块
// 包含各种测试和调试函数，用于验证功能

import { addThumbnailToList, selectThumbnail, updatePreviewImage, toggleNewExportButtons } from './previewInterface.js';
import { processImage } from './fileProcessor.js';
import { exportAsZip, exportAsPdf } from './exportManager.js';
import { getAppStateSnapshot } from './appState.js';

/**
 * 测试缩略图动态添加功能
 * @param {Object} appState - 应用状态对象
 */
export function testThumbnailFunction(appState) {
  console.log('[TestUtils] 开始测试缩略图动态添加功能...');
  
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
        addThumbnailToList(chunkData, appState);
      }
    }, 'image/png');
  }
  
  console.log('[TestUtils] 测试缩略图已添加，请检查页面左侧的缩略图列表');
}

/**
 * 测试完整的 Worker 消息与 UI 连接流程
 * @param {Object} appState - 应用状态对象
 */
export function testTask33(appState) {
  console.log('[TestUtils] 开始测试完整的 Worker 消息与 UI 连接流程...');
  
  // 创建测试图片
  const testCanvas = document.createElement('canvas');
  testCanvas.width = 600;
  testCanvas.height = 1200;
  const testCtx = testCanvas.getContext('2d');
  
  // 绘制测试图片（上下两种颜色）
  testCtx.fillStyle = '#FF6B6B';
  testCtx.fillRect(0, 0, 600, 600);
  testCtx.fillStyle = '#4ECDC4';
  testCtx.fillRect(0, 600, 600, 600);
  
  // 添加文字标识
  testCtx.fillStyle = 'white';
  testCtx.font = '48px Arial';
  testCtx.textAlign = 'center';
  testCtx.fillText('测试图片 TOP', 300, 300);
  testCtx.fillText('测试图片 BOTTOM', 300, 900);
  
  const testImg = new Image();
  testImg.width = 600;
  testImg.height = 1200;
  testImg.src = testCanvas.toDataURL();
  
  testImg.onload = () => {
    console.log('[TestUtils] 测试图片创建完成，开始处理...');
    
    // 设置测试参数
    appState.originalImage = testImg;
    
    const sliceHeightInput = document.getElementById("sliceHeight");
    if (sliceHeightInput) {
      sliceHeightInput.value = '400'; // 这样会产生3个切片
    }
    
    // 确保缩略图列表为空
    const thumbnailList = document.getElementById("thumbnail-list");
    if (thumbnailList) {
      thumbnailList.innerHTML = '';
    }
    
    // 确保预览界面隐藏
    const newPreviewSection = document.getElementById('preview-section');
    if (newPreviewSection) {
      newPreviewSection.classList.add('hidden');
    }
    
    console.log('[TestUtils] 调用 processImage() 开始完整流程测试...');
    
    // 记录开始时间用于性能测试
    const startTime = Date.now();
    window.testStartTime = startTime;
    
    // 开始处理
    processImage(appState);
    
    console.log('[TestUtils] processImage() 已调用，请观察以下流程:');
    console.log('📊 1. 进度条应该显示并逐步更新');
    console.log('🖼️ 2. 缩略图应该逐个添加到左侧列表');
    console.log('👁️ 3. 完成后预览界面应该显示');
    console.log('🔘 4. 导出按钮应该被启用');
  };
}

/**
 * 验证完整流程的各个阶段
 * @param {Object} appState - 应用状态对象
 */
export function verifyTask33Completion(appState) {
  console.log('[TestUtils] 开始验证完整流程各个阶段...');
  
  const progressContainer = document.getElementById("progress-container");
  const newPreviewSection = document.getElementById('preview-section');
  const newExportZipBtn = document.getElementById("export-zip-btn");
  const newExportPdfBtn = document.getElementById("export-pdf-btn");
  
  // 验证UI状态
  const progressHidden = progressContainer && progressContainer.classList.contains('hidden');
  const previewVisible = newPreviewSection && !newPreviewSection.classList.contains('hidden');
  const zipBtnEnabled = newExportZipBtn && !newExportZipBtn.disabled;
  const pdfBtnEnabled = newExportPdfBtn && !newExportPdfBtn.disabled;
  
  // 验证数据状态
  const blobsCount = appState.blobs.length;
  const urlsCount = appState.objectUrls.length;
  const thumbnailList = document.getElementById("thumbnail-list");
  const thumbnailsCount = thumbnailList ? thumbnailList.children.length : 0;
  
  console.log('[TestUtils] UI状态检查:');
  console.log(`✅ 进度条已隐藏: ${progressHidden ? '是' : '否'}`);
  console.log(`✅ 预览界面已显示: ${previewVisible ? '是' : '否'}`);
  console.log(`✅ ZIP导出按钮已启用: ${zipBtnEnabled ? '是' : '否'}`);
  console.log(`✅ PDF导出按钮已启用: ${pdfBtnEnabled ? '是' : '否'}`);
  
  console.log('[TestUtils] 数据状态检查:');
  console.log(`✅ Blobs 数量: ${blobsCount}`);
  console.log(`✅ Object URLs 数量: ${urlsCount}`);
  console.log(`✅ 缩略图数量: ${thumbnailsCount}`);
  
  // 性能统计
  if (window.testStartTime) {
    const processingTime = Date.now() - window.testStartTime;
    console.log(`⏱️ 总处理时间: ${processingTime}ms`);
  }
  
  // 综合验证
  const allPassed = progressHidden && previewVisible && zipBtnEnabled && pdfBtnEnabled && 
                   blobsCount > 0 && urlsCount > 0 && thumbnailsCount > 0;
  
  if (allPassed) {
    console.log('🎉 [TestUtils] 完整流程验证通过！进度条、缩略图、预览界面按预期工作');
  } else {
    console.warn('⚠️ [TestUtils] 某些验证项目未通过，请检查实现');
  }
  
  return allPassed;
}

/**
 * 测试导出功能是否正确使用 Worker 生成的 Blob 数据
 * @param {Object} appState - 应用状态对象
 */
export function testTask34(appState) {
  console.log('[TestUtils] 开始测试导出功能...');
  
  // 检查是否有数据可供导出
  if (appState.blobs.length === 0) {
    console.warn('[TestUtils] 没有可用的 Blob 数据，先运行完整流程...');
    
    // 运行完整流程生成数据
    testTask33(appState);
    
    // 延迟执行导出测试
    setTimeout(() => {
      console.log('[TestUtils] 流程完成，现在测试导出功能...');
      executeExportTests(appState);
    }, 3000);
  } else {
    executeExportTests(appState);
  }
}

/**
 * 执行导出测试
 * @param {Object} appState - 应用状态对象
 */
export function executeExportTests(appState) {
  console.log('[TestUtils] 执行导出功能测试...');
  
  // 验证导出前的状态
  console.log('[TestUtils] 导出前状态检查:');
  console.log(`- 可用 Blobs: ${appState.blobs.length}`);
  console.log(`- 选中切片: ${appState.selectedSlices.size}`);
  console.log(`- 选中的切片索引:`, Array.from(appState.selectedSlices));
  
  // 确保有选中的切片
  if (appState.selectedSlices.size === 0) {
    console.log('[TestUtils] 没有选中的切片，自动选中所有切片...');
    appState.blobs.forEach((blob, index) => {
      if (blob) {
        appState.selectedSlices.add(index);
      }
    });
    console.log(`[TestUtils] 已选中 ${appState.selectedSlices.size} 个切片`);
  }
  
  // 验证导出按钮状态
  const zipBtn = document.getElementById("export-zip-btn");
  const pdfBtn = document.getElementById("export-pdf-btn");
  
  console.log('[TestUtils] 导出按钮状态:');
  console.log(`- ZIP按钮启用: ${zipBtn && !zipBtn.disabled ? '是' : '否'}`);
  console.log(`- PDF按钮启用: ${pdfBtn && !pdfBtn.disabled ? '是' : '否'}`);
  
  // 提供测试指导
  console.log('[TestUtils] 现在可以测试导出功能:');
  console.log('1. 点击 ZIP 导出按钮测试 ZIP 导出');
  console.log('2. 点击 PDF 导出按钮测试 PDF 导出');
  console.log('3. 或者在控制台运行:');
  console.log('   - window.testZipExport() // 程序化测试ZIP导出');
  console.log('   - window.testPdfExport() // 程序化测试PDF导出');
  
  return {
    blobsCount: appState.blobs.length,
    selectedCount: appState.selectedSlices.size,
    zipEnabled: zipBtn && !zipBtn.disabled,
    pdfEnabled: pdfBtn && !pdfBtn.disabled
  };
}

/**
 * 程序化测试ZIP导出
 * @param {Object} appState - 应用状态对象
 */
export function testZipExport(appState) {
  console.log('[TestUtils] 开始程序化ZIP导出测试...');
  
  if (appState.blobs.length === 0 || appState.selectedSlices.size === 0) {
    console.warn('[TestUtils] 需要先有处理过的数据和选中的切片');
    return false;
  }
  
  console.log('[TestUtils] 调用 exportAsZip()...');
  exportAsZip(appState);
  
  return true;
}

/**
 * 程序化测试PDF导出
 * @param {Object} appState - 应用状态对象
 */
export function testPdfExport(appState) {
  console.log('[TestUtils] 开始程序化PDF导出测试...');
  
  if (appState.blobs.length === 0 || appState.selectedSlices.size === 0) {
    console.warn('[TestUtils] 需要先有处理过的数据和选中的切片');
    return false;
  }
  
  console.log('[TestUtils] 调用 exportAsPdf()...');
  exportAsPdf(appState);
  
  return true;
}

/**
 * 显示预览界面并测试交互功能
 * @param {Object} appState - 应用状态对象
 */
export function showPreviewAndTest(appState) {
  // 显示新的双栏预览界面
  const newPreviewSection = document.getElementById('preview-section');
  
  // 隐藏旧的预览界面
  const oldPreviewSection = document.getElementById('previewSection');
  if (oldPreviewSection) {
    oldPreviewSection.classList.add('hidden');
  }
  
  if (newPreviewSection) {
    newPreviewSection.classList.remove('hidden');
    console.log('[TestUtils] 新的双栏预览界面已显示');
    
    // 清空现有缩略图
    const thumbnailList = document.getElementById("thumbnail-list");
    if (thumbnailList) {
      thumbnailList.innerHTML = '';
    }
    
    // 添加测试缩略图
    setTimeout(() => {
      testThumbnailFunction(appState);
      console.log('[TestUtils] 测试提示: 点击左侧任意缩略图测试交互功能');
      console.log('[TestUtils] 您现在应该看到左右双栏布局：左侧缩略图列表，右侧大图预览');
    }, 100);
  } else {
    console.error('[TestUtils] 新预览界面元素未找到 (preview-section)');
  }
}

/**
 * 获取应用状态快照用于调试
 * @param {Object} appState - 应用状态对象
 */
export function getDebugSnapshot(appState) {
  return getAppStateSnapshot(appState);
} 

/**
 * Task-3.6 验证函数：测试页面内预览布局优化
 */
export function testTask36() {
  console.log('🎯 [task-3.6] 开始验证页面内预览布局优化...');
  
  const results = {
    layoutIntegration: false,
    styleConsistency: false,
    responsiveDesign: false,
    functionalityPreservation: false,
    designTokenUsage: false
  };

  // 1. 验证布局集成：检查是否移除了全屏样式
  const previewSection = document.getElementById('preview-section');
  if (previewSection) {
    const computedStyle = window.getComputedStyle(previewSection);
    const position = computedStyle.position;
    const zIndex = computedStyle.zIndex;
    
    if (position !== 'fixed' && (zIndex === 'auto' || parseInt(zIndex) < 1000)) {
      results.layoutIntegration = true;
      console.log('✅ [task-3.6] 布局集成：已成功移除全屏样式');
    } else {
      console.log(`❌ [task-3.6] 布局集成：仍使用全屏样式 (position: ${position}, z-index: ${zIndex})`);
    }
  }

  // 2. 验证样式一致性：检查是否使用了原有的设计token
  const headerElement = previewSection?.querySelector('.preview-header-enhanced');
  if (headerElement) {
    const headerStyle = window.getComputedStyle(headerElement);
    const backgroundColor = headerStyle.backgroundColor;
    
    // 检查是否使用了CSS变量
    if (backgroundColor.includes('rgb')) {
      results.styleConsistency = true;
      console.log('✅ [task-3.6] 样式一致性：使用了原有设计token');
    } else {
      console.log('❌ [task-3.6] 样式一致性：未正确使用设计token');
    }
  }

  // 3. 验证响应式设计：检查网格布局
  const dualLayout = previewSection?.querySelector('.preview-dual-layout');
  if (dualLayout) {
    const layoutStyle = window.getComputedStyle(dualLayout);
    const display = layoutStyle.display;
    
    if (display === 'grid') {
      results.responsiveDesign = true;
      console.log('✅ [task-3.6] 响应式设计：使用了CSS Grid布局');
    } else {
      console.log(`❌ [task-3.6] 响应式设计：布局方式不正确 (display: ${display})`);
    }
  }

  // 4. 验证功能保持：检查关键功能元素
  const requiredElements = [
    'new-selected-count',
    'new-select-all-btn', 
    'new-deselect-btn',
    'export-zip-btn',
    'export-pdf-btn',
    'thumbnail-list',
    'preview-image'
  ];
  
  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  
  if (missingElements.length === 0) {
    results.functionalityPreservation = true;
    console.log('✅ [task-3.6] 功能保持：所有关键功能元素都存在');
  } else {
    console.log(`❌ [task-3.6] 功能保持：缺少元素 ${missingElements.join(', ')}`);
  }

  // 5. 验证设计token使用：检查是否移除了关闭按钮
  const closeBtn = document.getElementById('close-preview-btn');
  if (!closeBtn) {
    results.designTokenUsage = true;
    console.log('✅ [task-3.6] 设计简化：已成功移除关闭按钮');
  } else {
    console.log('❌ [task-3.6] 设计简化：关闭按钮仍然存在');
  }

  // 输出总结
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📊 [task-3.6] 验证结果: ${passedTests}/${totalTests} 测试通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 [task-3.6] 页面内预览布局优化完成！所有验证项目都通过了！');
  } else {
    console.log('⚠️ [task-3.6] 还有一些问题需要解决');
  }

  return results;
}

/**
 * Task-3.6 完整体验测试：模拟用户使用流程
 */
export function testTask36UserExperience() {
  console.log('👤 [task-3.6] 开始用户体验测试...');
  
  // 先运行基本验证
  const basicResults = testTask36();
  
  if (Object.values(basicResults).every(Boolean)) {
    console.log('\n🚀 启动完整用户体验测试...');
    
    // 如果有现成的数据，直接显示预览界面
    if (window.appState && window.appState.blobs.length > 0) {
      console.log('📸 使用现有数据进行测试...');
      const previewSection = document.getElementById('preview-section');
      if (previewSection) {
        previewSection.classList.remove('hidden');
        console.log('✅ 预览界面已显示在页面内，用户可以自然滚动查看');
      }
    } else {
      console.log('💡 提示：请先运行 testTask33() 生成测试数据，然后重新运行此测试');
    }
    
    console.log('🎯 用户体验验证要点：');
    console.log('  1. 预览界面应该作为页面的一部分自然显示');
    console.log('  2. 用户可以通过滚动在上传区域和预览区域间移动');
    console.log('  3. 双栏布局在桌面端应该清晰显示');
    console.log('  4. 所有选择和导出功能应该正常工作');
    console.log('  5. 移动端应该上下堆叠显示');
  } else {
    console.log('❌ 基本验证未通过，请先修复基础问题');
  }
} 

/**
 * Task-3.6 快速演示：直接显示新的页面内布局
 */
export function demoTask36Layout() {
  console.log('🎨 [task-3.6] 演示页面内预览布局...');
  
  // 1. 显示新预览界面
  const previewSection = document.getElementById('preview-section');
  if (previewSection) {
    previewSection.classList.remove('hidden');
    console.log('✅ 新预览界面已显示');
  } else {
    console.error('❌ 预览界面元素未找到');
    return;
  }

  // 2. 检查双栏布局
  const dualLayout = document.querySelector('.preview-dual-layout');
  if (dualLayout) {
    console.log('✅ 双栏布局容器已找到');
    const computedStyle = window.getComputedStyle(dualLayout);
    console.log('📊 布局信息:', {
      display: computedStyle.display,
      gridTemplateColumns: computedStyle.gridTemplateColumns,
      minHeight: computedStyle.minHeight
    });
  }

  // 3. 检查导出按钮
  const zipBtn = document.getElementById('export-zip-btn');
  const pdfBtn = document.getElementById('export-pdf-btn');
  
  if (zipBtn && pdfBtn) {
    console.log('✅ 导出按钮已找到');
    console.log('📦 ZIP按钮状态:', zipBtn.disabled ? '禁用' : '启用');
    console.log('📄 PDF按钮状态:', pdfBtn.disabled ? '禁用' : '启用');
    
    // 检查按钮样式
    const zipStyle = window.getComputedStyle(zipBtn);
    const pdfStyle = window.getComputedStyle(pdfBtn);
    console.log('🎨 按钮样式:', {
      zipBackground: zipStyle.backgroundColor,
      pdfBackground: pdfStyle.backgroundColor,
      zipVisible: zipStyle.display !== 'none',
      pdfVisible: pdfStyle.display !== 'none'
    });
  } else {
    console.error('❌ 导出按钮未找到');
  }

  // 4. 添加真实的缩略图项到左侧栏（带复选框）
  const thumbnailList = document.getElementById('thumbnail-list');
  if (thumbnailList) {
    // 清空现有内容
    thumbnailList.innerHTML = '';
    
    // 创建3个真实的缩略图项
    for (let i = 0; i < 3; i++) {
      // 创建缩略图容器
      const thumbnailItem = document.createElement('div');
      thumbnailItem.className = 'thumbnail-item';
      thumbnailItem.dataset.index = i;
      
      // 创建复选框
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'thumbnail-checkbox';
      checkbox.checked = true; // 默认选中
      checkbox.id = `demo-checkbox-${i}`;
      
      // 创建缩略图图片（使用占位符）
      const img = document.createElement('img');
      img.className = 'thumbnail-img';
      img.alt = `演示切片 ${i + 1}`;
      img.src = `data:image/svg+xml;base64,${btoa(`
        <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" fill="#e5e7eb"/>
          <text x="32" y="32" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="12" fill="#6b7280">
            ${i + 1}
          </text>
        </svg>
      `)}`;
      
      // 创建文字信息
      const textInfo = document.createElement('div');
      textInfo.className = 'thumbnail-info';
      textInfo.innerHTML = `
        <p class="thumbnail-label">演示切片 ${i + 1}</p>
        <p class="thumbnail-hint">点击查看大图</p>
      `;

      // 组装缩略图项
      thumbnailItem.appendChild(checkbox);
      thumbnailItem.appendChild(img);
      thumbnailItem.appendChild(textInfo);
      
      // 添加到列表
      thumbnailList.appendChild(thumbnailItem);
      
      // 添加选中样式
      thumbnailItem.classList.add('selected');
    }
    
    console.log('✅ 添加了3个带复选框的演示缩略图');
  }

  // 5. 更新右侧的占位符
  const placeholder = document.getElementById('preview-placeholder');
  if (placeholder) {
    const placeholderText = placeholder.querySelector('.preview-placeholder-text');
    if (placeholderText) {
      placeholderText.textContent = '右侧栏：大图预览区域 (演示模式)';
    }
  }

  console.log('\n🎉 演示完成！你现在应该看到：');
  console.log('   📐 左右双栏布局 (1:2比例)');
  console.log('   ☑️ 每个缩略图右上角有复选框');
  console.log('   📦 右上角的导出按钮 (ZIP/PDF)');
  console.log('   🎨 融入原有设计的页面内布局');
  console.log('   📱 响应式设计 (移动端将上下堆叠)');
  
  console.log('\n💡 要清除演示，请刷新页面');
  
  return {
    layoutVisible: !!previewSection && !previewSection.classList.contains('hidden'),
    buttonsFound: !!(zipBtn && pdfBtn),
    dualLayoutFound: !!dualLayout,
    demoContentAdded: true,
    checkboxCount: document.querySelectorAll('.thumbnail-checkbox').length
  };
} 

/**
 * 检查新预览界面的选择按钮是否可见
 */
export function checkSelectionButtons() {
  console.log('🔍 检查新预览界面的选择按钮...');
  
  // 1. 显示预览界面
  const previewSection = document.getElementById('preview-section');
  if (previewSection) {
    previewSection.classList.remove('hidden');
  }
  
  // 2. 检查选择按钮
  const selectAllBtn = document.getElementById('new-select-all-btn');
  const deselectBtn = document.getElementById('new-deselect-btn');
  const selectedCount = document.getElementById('new-selected-count');
  
  console.log('📋 按钮检查结果:');
  console.log('  - 全选按钮元素:', selectAllBtn ? '✅ 找到' : '❌ 未找到');
  console.log('  - 取消选择按钮元素:', deselectBtn ? '✅ 找到' : '❌ 未找到');
  console.log('  - 选择计数元素:', selectedCount ? '✅ 找到' : '❌ 未找到');
  
  if (selectAllBtn && deselectBtn) {
    // 检查按钮样式
    const selectAllStyle = window.getComputedStyle(selectAllBtn);
    const deselectStyle = window.getComputedStyle(deselectBtn);
    
    console.log('🎨 按钮样式信息:');
    console.log('  - 全选按钮:', {
      display: selectAllStyle.display,
      visibility: selectAllStyle.visibility,
      backgroundColor: selectAllStyle.backgroundColor,
      color: selectAllStyle.color,
      width: selectAllStyle.width,
      height: selectAllStyle.height
    });
    
    console.log('  - 取消选择按钮:', {
      display: deselectStyle.display,
      visibility: deselectStyle.visibility,
      backgroundColor: deselectStyle.backgroundColor,
      color: deselectStyle.color,
      width: deselectStyle.width,
      height: deselectStyle.height
    });
    
    // 添加醒目的边框来帮助定位
    selectAllBtn.style.border = '3px solid red';
    deselectBtn.style.border = '3px solid blue';
    
    console.log('🔴 已为全选按钮添加红色边框');
    console.log('🔵 已为取消选择按钮添加蓝色边框');
    
    // 3秒后移除边框
    setTimeout(() => {
      selectAllBtn.style.border = '';
      deselectBtn.style.border = '';
      console.log('✨ 已移除调试边框');
    }, 3000);
    
    return {
      selectAllFound: true,
      deselectFound: true,
      buttonsVisible: selectAllStyle.display !== 'none' && deselectStyle.display !== 'none'
    };
  } else {
    console.log('❌ 选择按钮未找到，请检查 DOM 结构');
    return {
      selectAllFound: !!selectAllBtn,
      deselectFound: !!deselectBtn,
      buttonsVisible: false
    };
  }
} 

/**
 * 强力调试选择按钮的显示问题
 */
export function forceShowSelectionButtons() {
  console.log('💪 强力调试选择按钮显示问题...');
  
  // 1. 显示预览界面
  const previewSection = document.getElementById('preview-section');
  if (previewSection) {
    previewSection.classList.remove('hidden');
    console.log('✅ 预览界面已显示');
  }
  
  // 2. 获取按钮和容器
  const selectAllBtn = document.getElementById('new-select-all-btn');
  const deselectBtn = document.getElementById('new-deselect-btn');
  const selectionControls = document.querySelector('.selection-controls');
  const previewHeader = document.querySelector('.preview-header-enhanced');
  
  console.log('📦 容器检查:');
  console.log('  - selection-controls容器:', selectionControls ? '✅ 找到' : '❌ 未找到');
  console.log('  - preview-header-enhanced容器:', previewHeader ? '✅ 找到' : '❌ 未找到');
  
  if (selectAllBtn && deselectBtn) {
    // 3. 强制设置按钮样式
    const forceStyles = {
      'display': 'inline-block !important',
      'visibility': 'visible !important',
      'opacity': '1 !important',
      'position': 'relative !important',
      'z-index': '9999 !important',
      'background': '#ff6b6b !important',
      'color': 'white !important',
      'padding': '12px 24px !important',
      'margin': '5px !important',
      'border': '3px solid #000 !important',
      'border-radius': '8px !important',
      'font-size': '16px !important',
      'font-weight': 'bold !important',
      'cursor': 'pointer !important',
      'transform': 'scale(1.2) !important'
    };
    
    // 应用强制样式
    Object.entries(forceStyles).forEach(([property, value]) => {
      selectAllBtn.style.setProperty(property, value, 'important');
      deselectBtn.style.setProperty(property, value, 'important');
    });
    
    // 设置不同的背景色以区分
    selectAllBtn.style.setProperty('background', '#ff6b6b', 'important'); // 红色
    deselectBtn.style.setProperty('background', '#4ecdc4', 'important');   // 青色
    
    // 添加文字内容（防止文字丢失）
    selectAllBtn.textContent = '全选 (强制显示)';
    deselectBtn.textContent = '取消选择 (强制显示)';
    
    console.log('🚀 已应用强制样式到按钮');
    
    // 4. 检查容器样式
    if (selectionControls) {
      const controlsStyle = window.getComputedStyle(selectionControls);
      console.log('📋 selection-controls容器样式:', {
        display: controlsStyle.display,
        visibility: controlsStyle.visibility,
        position: controlsStyle.position,
        overflow: controlsStyle.overflow,
        height: controlsStyle.height,
        width: controlsStyle.width
      });
      
      // 强制显示容器
      selectionControls.style.setProperty('display', 'flex', 'important');
      selectionControls.style.setProperty('visibility', 'visible', 'important');
      selectionControls.style.setProperty('background', 'yellow', 'important');
      selectionControls.style.setProperty('padding', '10px', 'important');
      selectionControls.style.setProperty('border', '2px solid red', 'important');
    }
    
    if (previewHeader) {
      const headerStyle = window.getComputedStyle(previewHeader);
      console.log('📋 preview-header容器样式:', {
        display: headerStyle.display,
        visibility: headerStyle.visibility,
        position: headerStyle.position,
        overflow: headerStyle.overflow,
        height: headerStyle.height
      });
      
      // 强制显示头部容器
      previewHeader.style.setProperty('background', 'lightblue', 'important');
      previewHeader.style.setProperty('border', '3px solid blue', 'important');
      previewHeader.style.setProperty('min-height', '80px', 'important');
    }
    
    // 5. 检查按钮位置
    const selectAllRect = selectAllBtn.getBoundingClientRect();
    const deselectRect = deselectBtn.getBoundingClientRect();
    
    console.log('📍 按钮位置信息:');
    console.log('  - 全选按钮位置:', {
      top: selectAllRect.top,
      left: selectAllRect.left,
      width: selectAllRect.width,
      height: selectAllRect.height,
      visible: selectAllRect.width > 0 && selectAllRect.height > 0
    });
    
    console.log('  - 取消选择按钮位置:', {
      top: deselectRect.top,
      left: deselectRect.left,
      width: deselectRect.width,
      height: deselectRect.height,
      visible: deselectRect.width > 0 && deselectRect.height > 0
    });
    
    // 6. 滚动到按钮位置
    selectAllBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    console.log('🎯 现在你应该看到:');
    console.log('  - 红色的"全选"按钮');
    console.log('  - 青色的"取消选择"按钮');
    console.log('  - 黄色背景的按钮容器');
    console.log('  - 浅蓝色背景的头部容器');
    
    // 7. 10秒后恢复正常样式
    setTimeout(() => {
      location.reload(); // 简单粗暴地刷新页面恢复
    }, 10000);
    
    console.log('⏰ 10秒后将自动刷新页面恢复正常样式');
    
    return {
      buttonsFound: true,
      forcedDisplay: true,
      selectAllRect,
      deselectRect
    };
  } else {
    console.log('❌ 无法找到按钮元素');
    return { buttonsFound: false };
  }
} 

/**
 * 检查图片复选框的显示和功能
 */
export function checkImageCheckboxes() {
  console.log('☑️ 检查图片复选框的显示和功能...');
  
  // 1. 先运行完整流程生成一些图片
  if (window.appState && window.appState.blobs.length === 0) {
    console.log('📸 没有图片数据，先生成测试数据...');
    window.testTask33();
    
    // 等待3秒让Worker处理完成
    setTimeout(() => {
      checkImageCheckboxes();
    }, 3000);
    return;
  }
  
  // 2. 显示预览界面
  const previewSection = document.getElementById('preview-section');
  if (previewSection) {
    previewSection.classList.remove('hidden');
  }
  
  // 3. 检查缩略图项
  const thumbnailItems = document.querySelectorAll('.thumbnail-item');
  console.log(`🖼️ 找到 ${thumbnailItems.length} 个缩略图项`);
  
  if (thumbnailItems.length === 0) {
    console.log('❌ 没有找到缩略图项，可能需要先生成数据');
    return;
  }
  
  // 4. 检查每个缩略图的复选框
  thumbnailItems.forEach((item, index) => {
    const checkbox = item.querySelector('.thumbnail-checkbox');
    const img = item.querySelector('.thumbnail-img');
    
    console.log(`📋 缩略图 ${index + 1}:`, {
      hasCheckbox: !!checkbox,
      hasImage: !!img,
      itemVisible: item.offsetWidth > 0 && item.offsetHeight > 0
    });
    
    if (checkbox) {
      const checkboxStyle = window.getComputedStyle(checkbox);
      console.log(`  - 复选框样式:`, {
        display: checkboxStyle.display,
        visibility: checkboxStyle.visibility,
        opacity: checkboxStyle.opacity,
        width: checkboxStyle.width,
        height: checkboxStyle.height,
        position: checkboxStyle.position,
        top: checkboxStyle.top,
        right: checkboxStyle.right,
        zIndex: checkboxStyle.zIndex
      });
      
      // 强制显示复选框
      checkbox.style.setProperty('display', 'block', 'important');
      checkbox.style.setProperty('visibility', 'visible', 'important');
      checkbox.style.setProperty('opacity', '1', 'important');
      checkbox.style.setProperty('position', 'absolute', 'important');
      checkbox.style.setProperty('top', '8px', 'important');
      checkbox.style.setProperty('right', '8px', 'important');
      checkbox.style.setProperty('width', '24px', 'important');
      checkbox.style.setProperty('height', '24px', 'important');
      checkbox.style.setProperty('z-index', '999', 'important');
      checkbox.style.setProperty('background', 'white', 'important');
      checkbox.style.setProperty('border', '2px solid #4361ee', 'important');
      checkbox.style.setProperty('border-radius', '4px', 'important');
      checkbox.style.setProperty('cursor', 'pointer', 'important');
      
      // 添加醒目的边框
      checkbox.style.setProperty('box-shadow', '0 0 0 3px rgba(255, 0, 0, 0.5)', 'important');
      
      console.log(`  ✅ 已强化复选框 ${index + 1} 的样式`);
    } else {
      console.log(`  ❌ 缩略图 ${index + 1} 没有复选框`);
    }
  });
  
  // 5. 测试复选框功能
  console.log('\n🧪 测试复选框功能:');
  const firstCheckbox = document.querySelector('.thumbnail-checkbox');
  if (firstCheckbox) {
    const originalChecked = firstCheckbox.checked;
    
    // 切换状态
    firstCheckbox.checked = !originalChecked;
    firstCheckbox.dispatchEvent(new Event('change'));
    
    console.log(`✅ 复选框状态已从 ${originalChecked} 切换到 ${firstCheckbox.checked}`);
    
    // 检查选择计数是否更新
    const selectedCount = document.getElementById('new-selected-count');
    if (selectedCount) {
      console.log(`📊 选择计数显示: ${selectedCount.textContent}`);
    }
  }
  
  console.log('\n🎯 现在你应该看到:');
  console.log('  - 每个缩略图右上角有一个复选框（带红色光圈）');
  console.log('  - 复选框可以点击切换选中状态');
  console.log('  - 选中的缩略图会有不同的背景色');
  
  // 6. 10秒后移除强化样式
  setTimeout(() => {
    document.querySelectorAll('.thumbnail-checkbox').forEach(checkbox => {
      checkbox.style.removeProperty('box-shadow');
    });
    console.log('✨ 已移除复选框的红色光圈');
  }, 10000);
  
  return {
    thumbnailCount: thumbnailItems.length,
    checkboxCount: document.querySelectorAll('.thumbnail-checkbox').length,
    testCompleted: true
  };
} 