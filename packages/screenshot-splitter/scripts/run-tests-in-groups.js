#!/usr/bin/env node

/**
 * 分组运行测试脚本
 * 将测试文件分组运行，减少内存压力
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const MAX_FILES_PER_GROUP = 3;
const DELAY_BETWEEN_GROUPS = 2000; // 2秒

// 收集测试文件
const collectTestFiles = () => {
  const testDirs = [
    'src/components/__tests__',
    'src/hooks/__tests__',
    'src/utils/__tests__',
    'src/utils/analytics/__tests__',
    'src/utils/seo/__tests__',
    'src/config/__tests__',
    'src/types/__tests__'
  ];
  
  const allFiles = [];
  
  testDirs.forEach(dir => {
    const fullDir = path.join(process.cwd(), dir);
    if (fs.existsSync(fullDir)) {
      const files = fs.readdirSync(fullDir)
        .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
        .map(file => path.join(dir, file));
      
      allFiles.push(...files);
    }
  });
  
  return allFiles;
};

// 将文件分组
const groupFiles = (files, maxPerGroup) => {
  const groups = [];
  let currentGroup = [];
  
  files.forEach(file => {
    if (currentGroup.length >= maxPerGroup) {
      groups.push([...currentGroup]);
      currentGroup = [];
    }
    currentGroup.push(file);
  });
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
};

// 运行单个测试组
const runTestGroup = (group, groupIndex, totalGroups) => {
  return new Promise((resolve, reject) => {
    console.log(`\n[组 ${groupIndex + 1}/${totalGroups}] 运行测试文件:`);
    group.forEach(file => console.log(`  - ${file}`));
    
    const command = 'npx';
    const args = [
      'vitest',
      'run',
      '--config',
      'vitest.memory.config.ts',
      ...group
    ];
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=1024'
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 组 ${groupIndex + 1} 测试通过`);
        resolve(true);
      } else {
        console.error(`❌ 组 ${groupIndex + 1} 测试失败 (退出码: ${code})`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ 组 ${groupIndex + 1} 执行错误:`, error.message);
      reject(error);
    });
  });
};

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 主函数
const main = async () => {
  console.log('🧪 开始分组运行测试...\n');
  
  // 收集测试文件
  const testFiles = collectTestFiles();
  console.log(`找到 ${testFiles.length} 个测试文件`);
  
  if (testFiles.length === 0) {
    console.log('没有找到测试文件');
    process.exit(0);
  }
  
  // 分组
  const groups = groupFiles(testFiles, MAX_FILES_PER_GROUP);
  console.log(`将测试分为 ${groups.length} 组运行\n`);
  
  let passedGroups = 0;
  let failedGroups = 0;
  
  // 逐组运行测试
  for (let i = 0; i < groups.length; i++) {
    try {
      const success = await runTestGroup(groups[i], i, groups.length);
      
      if (success) {
        passedGroups++;
      } else {
        failedGroups++;
      }
      
      // 在组之间添加延迟，让系统释放资源
      if (i < groups.length - 1) {
        console.log(`\n等待 ${DELAY_BETWEEN_GROUPS / 1000} 秒让系统释放资源...`);
        await delay(DELAY_BETWEEN_GROUPS);
      }
    } catch (error) {
      console.error(`组 ${i + 1} 执行出错:`, error.message);
      failedGroups++;
    }
  }
  
  // 输出总结
  console.log('\n📊 测试运行总结:');
  console.log(`总组数: ${groups.length}`);
  console.log(`通过组数: ${passedGroups}`);
  console.log(`失败组数: ${failedGroups}`);
  console.log(`成功率: ${((passedGroups / groups.length) * 100).toFixed(1)}%`);
  
  // 根据结果设置退出码
  process.exit(failedGroups > 0 ? 1 : 0);
};

// 执行主函数
main().catch(error => {
  console.error('脚本执行出错:', error);
  process.exit(1);
});