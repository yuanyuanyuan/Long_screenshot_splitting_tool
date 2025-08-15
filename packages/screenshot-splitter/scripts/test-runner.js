#!/usr/bin/env node

/**
 * 智能测试运行器
 * 根据不同场景选择最合适的测试方式
 */

import { execSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const LOW_MEMORY_THRESHOLD = 4 * 1024 * 1024 * 1024; // 4GB
const MEDIUM_MEMORY_THRESHOLD = 8 * 1024 * 1024 * 1024; // 8GB

// 格式化内存大小
const formatMemory = (bytes) => {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// 获取系统信息
const getSystemInfo = () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpus = os.cpus();
  
  return {
    totalMemory: totalMem,
    freeMemory: freeMem,
    cpuCount: cpus.length,
    cpuModel: cpus[0].model,
    platform: os.platform(),
    release: os.release()
  };
};

// 确定最佳测试模式
const determineBestTestMode = (systemInfo, testFiles) => {
  // 如果总内存小于阈值，使用低内存模式
  if (systemInfo.totalMemory < LOW_MEMORY_THRESHOLD) {
    return {
      mode: 'ultra-light',
      description: '超轻量模式 (单进程，最小内存)',
      command: 'NODE_OPTIONS=\'--max-old-space-size=512\' npx vitest run --config vitest.memory.config.ts',
      useGroups: true,
      maxFilesPerGroup: 1
    };
  }
  
  // 如果总内存在中等范围，使用轻量模式
  if (systemInfo.totalMemory < MEDIUM_MEMORY_THRESHOLD) {
    return {
      mode: 'light',
      description: '轻量模式 (有限进程，受限内存)',
      command: 'npm run test:light',
      useGroups: testFiles.length > 5,
      maxFilesPerGroup: 2
    };
  }
  
  // 如果测试文件很多，使用分组模式
  if (testFiles.length > 10) {
    return {
      mode: 'grouped',
      description: '分组模式 (标准内存，分批运行)',
      command: 'npm run test:run',
      useGroups: true,
      maxFilesPerGroup: 3
    };
  }
  
  // 默认使用标准模式
  return {
    mode: 'standard',
    description: '标准模式 (正常内存和进程)',
    command: 'npm run test:run',
    useGroups: false
  };
};

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

// 将测试文件分组
const groupTestFiles = (files, maxFilesPerGroup) => {
  const groups = [];
  let currentGroup = [];
  
  files.forEach(file => {
    if (currentGroup.length >= maxFilesPerGroup) {
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

// 运行测试组
const runTestGroup = (group, testMode, groupIndex, totalGroups) => {
  console.log(`\n[运行测试组 ${groupIndex + 1}/${totalGroups}]`);
  console.log(`测试文件: ${group.join(', ')}`);
  
  try {
    const command = `${testMode.command} ${group.join(' ')}`;
    console.log(`执行命令: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ 测试组 ${groupIndex + 1} 完成`);
    return true;
  } catch (error) {
    console.error(`\n❌ 测试组 ${groupIndex + 1} 失败`);
    return false;
  }
};

// 主函数
const main = () => {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const specificFiles = args.filter(arg => !arg.startsWith('--'));
  const options = args.filter(arg => arg.startsWith('--'));
  
  // 检查是否有特定选项
  const forceMode = options.find(opt => opt.startsWith('--mode='))?.split('=')[1];
  const withMonitoring = options.includes('--monitor');
  
  // 获取系统信息
  const systemInfo = getSystemInfo();
  console.log('\n💻 系统信息:');
  console.log(`- 操作系统: ${systemInfo.platform} ${systemInfo.release}`);
  console.log(`- CPU: ${systemInfo.cpuModel} (${systemInfo.cpuCount} 核心)`);
  console.log(`- 总内存: ${formatMemory(systemInfo.totalMemory)}`);
  console.log(`- 可用内存: ${formatMemory(systemInfo.freeMemory)}`);
  
  // 收集测试文件
  const testFiles = specificFiles.length > 0 ? specificFiles : collectTestFiles();
  console.log(`\n找到 ${testFiles.length} 个测试文件`);
  
  // 确定最佳测试模式
  let testMode;
  if (forceMode) {
    const modes = {
      'ultra-light': {
        mode: 'ultra-light',
        description: '超轻量模式 (单进程，最小内存)',
        command: 'NODE_OPTIONS=\'--max-old-space-size=512\' npx vitest run --config vitest.memory.config.ts',
        useGroups: true,
        maxFilesPerGroup: 1
      },
      'light': {
        mode: 'light',
        description: '轻量模式 (有限进程，受限内存)',
        command: 'npm run test:light',
        useGroups: testFiles.length > 5,
        maxFilesPerGroup: 2
      },
      'grouped': {
        mode: 'grouped',
        description: '分组模式 (标准内存，分批运行)',
        command: 'npm run test:run',
        useGroups: true,
        maxFilesPerGroup: 3
      },
      'standard': {
        mode: 'standard',
        description: '标准模式 (正常内存和进程)',
        command: 'npm run test:run',
        useGroups: false
      }
    };
    testMode = modes[forceMode] || determineBestTestMode(systemInfo, testFiles);
  } else {
    testMode = determineBestTestMode(systemInfo, testFiles);
  }
  
  console.log(`\n🧪 选择测试模式: ${testMode.mode} - ${testMode.description}`);
  
  // 如果需要监控，包装命令
  if (withMonitoring) {
    console.log('📊 启用内存监控');
    testMode.command = `node scripts/monitor-test-memory.js "${testMode.command}"`;
  }
  
  // 运行测试
  if (testMode.useGroups) {
    const groups = groupTestFiles(testFiles, testMode.maxFilesPerGroup || 3);
    console.log(`\n将测试分为 ${groups.length} 组运行`);
    
    let failedGroups = 0;
    
    groups.forEach((group, index) => {
      const success = runTestGroup(group, testMode, index, groups.length);
      if (!success) {
        failedGroups++;
      }
      
      // 在组之间添加短暂暂停，让系统释放资源
      if (index < groups.length - 1) {
        console.log('\n等待系统资源释放 (3秒)...');
        execSync('sleep 3');
      }
    });
    
    console.log('\n📊 测试运行总结:');
    console.log(`总测试组数: ${groups.length}`);
    console.log(`成功组数: ${groups.length - failedGroups}`);
    console.log(`失败组数: ${failedGroups}`);
    
    process.exit(failedGroups > 0 ? 1 : 0);
  } else {
    // 直接运行所有测试
    try {
      const command = `${testMode.command} ${testFiles.join(' ')}`;
      console.log(`\n执行命令: ${command}`);
      
      execSync(command, { stdio: 'inherit' });
      console.log('\n✅ 测试成功完成');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ 测试失败');
      process.exit(1);
    }
  }
};

// 执行主函数
main();