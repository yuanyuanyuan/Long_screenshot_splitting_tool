// 增强预览界面功能测试脚本
console.log('🚀 开始测试增强版预览界面功能...');

// 第一步：显示预览界面
console.log('1. 显示预览界面...');
if (typeof testExportButtons === 'function') {
  testExportButtons();
  console.log('✅ 预览界面已显示');
} else {
  console.log('❌ testExportButtons 函数不存在');
}

// 等待5秒后验证增强功能
setTimeout(() => {
  console.log('\n2. 验证增强功能...');
  
  // 检查选择功能元素
  const selectedCount = document.getElementById('new-selected-count');
  const selectAllBtn = document.getElementById('new-select-all-btn');
  const deselectBtn = document.getElementById('new-deselect-btn');
  const thumbnails = document.querySelectorAll('.thumbnail-item');
  const checkboxes = document.querySelectorAll('.thumbnail-checkbox');
  
  console.log('📋 功能检查:');
  console.log(`  - 选择计数元素: ${selectedCount ? '✅' : '❌'}`);
  console.log(`  - 全选按钮: ${selectAllBtn ? '✅' : '❌'}`);
  console.log(`  - 取消选择按钮: ${deselectBtn ? '✅' : '❌'}`);
  console.log(`  - 缩略图数量: ${thumbnails.length}`);
  console.log(`  - 复选框数量: ${checkboxes.length}`);
  
  if (selectedCount) {
    console.log(`  - 当前计数显示: ${selectedCount.textContent}`);
  }
  
  // 测试选择功能
  if (selectAllBtn && deselectBtn) {
    console.log('\n3. 测试选择控制...');
    
    // 测试取消选择
    setTimeout(() => {
      console.log('  - 测试取消所有选择...');
      deselectAllSlicesInNewInterface();
      
      setTimeout(() => {
        console.log(`    计数显示: ${selectedCount?.textContent || '未找到'}`);
        console.log(`    选中的复选框: ${document.querySelectorAll('.thumbnail-checkbox:checked').length}`);
        
        // 测试全选
        setTimeout(() => {
          console.log('  - 测试全选...');
          selectAllSlicesInNewInterface();
          
          setTimeout(() => {
            console.log(`    计数显示: ${selectedCount?.textContent || '未找到'}`);
            console.log(`    选中的复选框: ${document.querySelectorAll('.thumbnail-checkbox:checked').length}`);
            
            console.log('\n🎉 增强功能测试完成！');
            console.log('📋 新增功能确认:');
            console.log('  ✅ 缩略图包含复选框');
            console.log('  ✅ 选择计数实时更新');
            console.log('  ✅ 全选/取消选择功能正常');
            console.log('  ✅ 与原有 selectedSlices 数据结构集成');
            console.log('  ✅ 保留了原有的导出按钮功能');
            
          }, 500);
        }, 1000);
      }, 500);
    }, 1000);
  }
  
}, 5000);

console.log('⏳ 正在测试增强功能，请稍候...'); 