#!/usr/bin/env node

/**
 * 测试内存泄漏检测脚本
 * 用于检测测试过程中可能存在的内存泄漏问题
 */

import { spawn } from 'child_process';
import fs from 'fs';
// import path from 'path';

// 配置
const MEMORY_SAMPLES = 10; // 内存采样次数
const SAMPLE_INTERVAL = 1000; // 采样间隔（毫秒）
const LEAK_THRESHOLD = 10; // 内存增长阈值（MB）
const OUTPUT_FILE = path.join(process.cwd(), 'memory-leak-report.json');

// 格式化内存大小
const formatMemory = bytes => {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// 运行测试并检测内存泄漏
const detectMemoryLeaks = async testFile => {
  console.log(`\n🔍 开始检测内存泄漏: ${testFile}`);

  // 创建测试进程
  const testProcess = spawn(
    'node',
    [
      '--expose-gc', // 启用垃圾回收API
      '--max-old-space-size=2048', // 限制内存使用
      './node_modules/.bin/vitest',
      'run',
      testFile,
      '--no-watch',
    ],
    {
      stdio: ['inherit', 'pipe', 'pipe'],
    }
  );

  // 收集内存样本
  const memorySamples = [];

  // 收集测试输出
  testProcess.stdout.on('data', data => {
    const output = data.toString();
    testOutput += output;
    process.stdout.write(output);
  });

  testProcess.stderr.on('data', data => {
    const error = data.toString();
    testError += error;
    process.stderr.write(error);
  });

  // 采集内存样本
  for (let i = 0; i < MEMORY_SAMPLES; i++) {
    await new Promise(resolve => setTimeout(resolve, SAMPLE_INTERVAL));

    // 获取进程内存使用
    const memoryUsage = process.memoryUsage();
    memorySamples.push({
      timestamp: Date.now(),
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers || 0,
    });

    // 强制垃圾回收
    if (global.gc) {
      global.gc();
      console.log(
        `[${i + 1}/${MEMORY_SAMPLES}] 强制垃圾回收后内存: ${formatMemory(memoryUsage.heapUsed)}`
      );
    } else {
      console.log(`[${i + 1}/${MEMORY_SAMPLES}] 内存样本: ${formatMemory(memoryUsage.heapUsed)}`);
    }
  }

  // 分析内存样本
  const analysis = analyzeMemorySamples(memorySamples);

  // 等待测试完成
  const exitCode = await new Promise(resolve => {
    testProcess.on('close', code => resolve(code));
  });

  // 生成报告
  const report = {
    testFile,
    exitCode,
    memorySamples,
    analysis,
    hasLeak: analysis.heapGrowthRate > LEAK_THRESHOLD,
    timestamp: Date.now(),
  };

  // 保存报告
  saveReport(report);

  // 显示结果
  console.log('\n📊 内存泄漏分析结果:');
  console.log(`- 初始堆内存: ${formatMemory(analysis.initialHeapUsed)}`);
  console.log(`- 最终堆内存: ${formatMemory(analysis.finalHeapUsed)}`);
  console.log(`- 内存增长率: ${analysis.heapGrowthRate.toFixed(2)}%`);
  console.log(`- 内存增长趋势: ${analysis.growthTrend}`);
  console.log(`- 内存泄漏可能性: ${report.hasLeak ? '⚠️ 高' : '✅ 低'}`);

  if (report.hasLeak) {
    console.log('\n⚠️ 警告: 检测到可能的内存泄漏!');
    console.log('建议检查以下几点:');
    console.log('1. 测试中是否有未清理的定时器或事件监听器');
    console.log('2. 是否有大型对象在测试间共享且未释放');
    console.log('3. 是否有闭包导致的意外引用保留');
    console.log(`\n详细报告已保存至: ${OUTPUT_FILE}`);
  }

  return report;
};

// 分析内存样本
const analyzeMemorySamples = samples => {
  if (samples.length < 2) {
    return { growthTrend: 'unknown', heapGrowthRate: 0 };
  }

  const initialHeapUsed = samples[0].heapUsed;
  const finalHeapUsed = samples[samples.length - 1].heapUsed;
  const heapDifference = finalHeapUsed - initialHeapUsed;
  const heapGrowthRate = (heapDifference / initialHeapUsed) * 100;

  // 计算趋势
  let growthTrend = 'stable';
  if (heapGrowthRate > LEAK_THRESHOLD) {
    growthTrend = 'increasing';
  } else if (heapGrowthRate < -5) {
    growthTrend = 'decreasing';
  }

  // 计算线性回归以检测持续增长
  const xValues = samples.map((_, i) => i);
  const yValues = samples.map(sample => sample.heapUsed);
  const { slope } = linearRegression(xValues, yValues);

  return {
    initialHeapUsed,
    finalHeapUsed,
    heapDifference,
    heapGrowthRate,
    growthTrend,
    regressionSlope: slope,
    isConsistentGrowth: slope > 0 && growthTrend === 'increasing',
  };
};

// 线性回归计算
const linearRegression = (x, y) => {
  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

// 保存报告
const saveReport = report => {
  // 读取现有报告或创建新报告
  let allReports = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      allReports = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (error) {
      console.error('读取现有报告失败:', error);
    }
  }

  // 添加新报告
  allReports.push(report);

  // 保存报告
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allReports, null, 2));
};

// 收集测试文件
const collectTestFiles = dir => {
  const testDirs = [
    'src/components/__tests__',
    'src/hooks/__tests__',
    'src/utils/__tests__',
    'src/utils/analytics/__tests__',
    'src/utils/seo/__tests__',
    'src/config/__tests__',
    'src/types/__tests__',
  ];

  if (dir) {
    // 如果指定了目录，只收集该目录下的测试文件
    const fullDir = path.join(process.cwd(), dir);
    if (fs.existsSync(fullDir)) {
      return fs
        .readdirSync(fullDir)
        .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
        .map(file => path.join(dir, file));
    }
    return [];
  }

  // 收集所有测试目录下的测试文件
  const allFiles = [];
  testDirs.forEach(dir => {
    const fullDir = path.join(process.cwd(), dir);
    if (fs.existsSync(fullDir)) {
      const files = fs
        .readdirSync(fullDir)
        .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
        .map(file => path.join(dir, file));

      allFiles.push(...files);
    }
  });

  return allFiles;
};

// 主函数
const main = async () => {
  // 获取命令行参数
  const args = process.argv.slice(2);

  // 检查是否有特定的测试文件或目录
  let testFiles = [];
  if (args.length > 0) {
    const specifiedPath = args[0];
    if (specifiedPath.endsWith('.test.ts') || specifiedPath.endsWith('.test.tsx')) {
      // 单个测试文件
      testFiles = [specifiedPath];
    } else {
      // 目录
      testFiles = collectTestFiles(specifiedPath);
    }
  } else {
    // 收集所有测试文件
    testFiles = collectTestFiles();
  }

  if (testFiles.length === 0) {
    console.error('❌ 错误: 未找到测试文件');
    process.exit(1);
  }

  console.log(`🧪 找到 ${testFiles.length} 个测试文件`);

  // 检查是否启用了垃圾回收API
  if (!global.gc) {
    console.warn('⚠️ 警告: 未启用垃圾回收API，无法强制垃圾回收');
    console.warn('请使用 --expose-gc 标志运行此脚本:');
    console.warn('node --expose-gc scripts/detect-memory-leaks.js');
    process.exit(1);
  }

  // 检测每个测试文件的内存泄漏
  const leakyFiles = [];

  for (const testFile of testFiles) {
    const report = await detectMemoryLeaks(testFile);
    if (report.hasLeak) {
      leakyFiles.push(testFile);
    }

    // 在测试文件之间添加短暂暂停，让系统释放资源
    if (testFile !== testFiles[testFiles.length - 1]) {
      console.log('\n等待系统资源释放 (3秒)...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // 显示总结
  console.log('\n📊 内存泄漏检测总结:');
  console.log(`- 测试文件总数: ${testFiles.length}`);
  console.log(`- 可能存在内存泄漏的文件: ${leakyFiles.length}`);

  if (leakyFiles.length > 0) {
    console.log('\n⚠️ 以下文件可能存在内存泄漏:');
    leakyFiles.forEach(file => console.log(`- ${file}`));
    console.log(`\n详细报告已保存至: ${OUTPUT_FILE}`);
  } else {
    console.log('\n✅ 未检测到明显的内存泄漏问题');
  }
};

// 执行主函数
main().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
