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