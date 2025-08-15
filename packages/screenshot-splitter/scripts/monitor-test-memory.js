#!/usr/bin/env node

/**
 * 测试内存监控脚本
 * 在运行测试时监控内存使用情况
 */

import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 格式化内存大小
const formatMemory = (bytes) => {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
};

// 获取内存使用情况
const getMemoryUsage = () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    total: totalMem,
    used: usedMem,
    free: freeMem,
    usagePercent: (usedMem / totalMem) * 100
  };
};

// 获取进程内存使用情况
const getProcessMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss, // 常驻集大小
    heapTotal: usage.heapTotal, // 堆总大小
    heapUsed: usage.heapUsed, // 已使用堆大小
    external: usage.external, // 外部内存使用
    arrayBuffers: usage.arrayBuffers // ArrayBuffer 使用
  };
};

// 内存监控器
class MemoryMonitor {
  constructor() {
    this.startTime = Date.now();
    this.maxMemoryUsage = 0;
    this.maxProcessMemory = 0;
    this.samples = [];
    this.isMonitoring = false;
  }
  
  start() {
    this.isMonitoring = true;
    console.log('📊 开始内存监控...\n');
    
    // 每2秒采样一次
    this.interval = setInterval(() => {
      if (!this.isMonitoring) return;
      
      const systemMem = getMemoryUsage();
      const processMem = getProcessMemoryUsage();
      
      // 记录最大值
      this.maxMemoryUsage = Math.max(this.maxMemoryUsage, systemMem.used);
      this.maxProcessMemory = Math.max(this.maxProcessMemory, processMem.rss);
      
      // 保存样本
      this.samples.push({
        timestamp: Date.now(),
        system: systemMem,
        process: processMem
      });
      
      // 实时显示
      console.log(`[${new Date().toLocaleTimeString()}] 系统内存: ${formatMemory(systemMem.used)}/${formatMemory(systemMem.total)} (${systemMem.usagePercent.toFixed(1)}%) | 进程内存: ${formatMemory(processMem.rss)}`);
      
      // 内存警告
      if (systemMem.usagePercent > 90) {
        console.log('⚠️  系统内存使用率超过90%!');
      }
      
      if (processMem.rss > 2 * 1024 * 1024 * 1024) { // 2GB
        console.log('⚠️  进程内存使用超过2GB!');
      }
    }, 2000);
  }
  
  stop() {
    this.isMonitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    this.generateReport();
  }
  
  generateReport() {
    const duration = Date.now() - this.startTime;
    const durationMinutes = (duration / 1000 / 60).toFixed(1);
    
    console.log('\n📊 内存使用报告:');
    console.log('='.repeat(50));
    console.log(`测试持续时间: ${durationMinutes} 分钟`);
    console.log(`最大系统内存使用: ${formatMemory(this.maxMemoryUsage)}`);
    console.log(`最大进程内存使用: ${formatMemory(this.maxProcessMemory)}`);
    console.log(`内存采样次数: ${this.samples.length}`);
    
    if (this.samples.length > 0) {
      const avgSystemUsage = this.samples.reduce((sum, sample) => sum + sample.system.used, 0) / this.samples.length;
      const avgProcessUsage = this.samples.reduce((sum, sample) => sum + sample.process.rss, 0) / this.samples.length;
      
      console.log(`平均系统内存使用: ${formatMemory(avgSystemUsage)}`);
      console.log(`平均进程内存使用: ${formatMemory(avgProcessUsage)}`);
    }
    
    // 内存使用建议
    console.log('\n💡 优化建议:');
    if (this.maxProcessMemory > 1.5 * 1024 * 1024 * 1024) { // 1.5GB
      console.log('- 考虑使用更小的测试批次');
      console.log('- 启用测试分组模式');
      console.log('- 减少并发测试数量');
    }
    
    if (this.maxMemoryUsage / os.totalmem() > 0.8) {
      console.log('- 系统内存使用率较高，建议关闭其他应用');
      console.log('- 考虑增加系统内存');
    }
    
    console.log('='.repeat(50));
  }
}

// 主函数
const main = () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('用法: node monitor-test-memory.js "<测试命令>"');
    console.error('示例: node monitor-test-memory.js "npm run test"');
    process.exit(1);
  }
  
  const command = args[0];
  console.log(`🚀 执行命令: ${command}`);
  console.log(`📊 同时监控内存使用情况...\n`);
  
  // 创建内存监控器
  const monitor = new MemoryMonitor();
  monitor.start();
  
  // 解析命令
  const [cmd, ...cmdArgs] = command.split(' ');
  
  // 执行测试命令
  const child = spawn(cmd, cmdArgs, {
    stdio: 'inherit',
    shell: true
  });
  
  // 处理子进程事件
  child.on('close', (code) => {
    monitor.stop();
    
    console.log(`\n🏁 测试完成，退出码: ${code}`);
    process.exit(code);
  });
  
  child.on('error', (error) => {
    monitor.stop();
    console.error('❌ 命令执行错误:', error.message);
    process.exit(1);
  });
  
  // 处理进程退出信号
  process.on('SIGINT', () => {
    console.log('\n⏹️  收到中断信号，停止监控...');
    monitor.stop();
    child.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n⏹️  收到终止信号，停止监控...');
    monitor.stop();
    child.kill('SIGTERM');
    process.exit(0);
  });
};

// 执行主函数
main();