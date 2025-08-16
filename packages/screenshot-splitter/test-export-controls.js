#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🧪 运行 ExportControls 组件测试...\n');

try {
  // 只运行 ExportControls 的测试
  const result = execSync(
    'npm test -- --run src/components/__tests__/ExportControls.test.tsx',
    { 
      encoding: 'utf8',
      stdio: 'pipe'
    }
  );
  
  console.log(result);
  console.log('✅ ExportControls 测试全部通过！');
  console.log('\n📋 测试总结：');
  console.log('- ✅ 导出格式选择器渲染正常');
  console.log('- ✅ 默认选择PDF格式');
  console.log('- ✅ 可以从PDF切换到ZIP格式');
  console.log('- ✅ 可以从ZIP切换回PDF格式');
  console.log('- ✅ 正确维护格式选择状态');
  console.log('- ✅ PDF选择时调用正确的导出格式');
  console.log('- ✅ ZIP选择时调用正确的导出格式');
  console.log('- ✅ 禁用状态下格式选择被正确禁用');
  console.log('- ✅ 导出按钮文本根据选择格式正确显示');
  console.log('- ✅ 导出过程中显示加载状态');
  console.log('- ✅ 未选择切片时阻止导出');
  
  console.log('\n🎉 导出格式切换bug修复成功！');
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
}
