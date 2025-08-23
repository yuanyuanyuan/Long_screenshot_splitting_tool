#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 执行命令的工具函数
function runCommand(command, options = {}) {
  const { cwd = rootDir, silent = false } = options;
  
  if (!silent) {
    log(`执行命令: ${command }`, 'blue');
  }
  
  try {
    const result = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

// 清理构建目录
function cleanBuildDirs() {
  logStep('CLEAN', '清理构建目录...');
  
  const dirsToClean = [
    'dist',
    'packages/screenshot-splitter/dist'
  ];
  
  dirsToClean.forEach(dir => {
    const fullPath = join(rootDir, dir);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true });
      log(`已清理: ${dir}`, 'yellow');
    }
  });
  
  logSuccess('构建目录清理完成');
}

// 类型检查
function typeCheck() {
  logStep('TYPE-CHECK', '执行TypeScript类型检查...');
  
  const result = runCommand('pnpm run type-check');
  if (!result.success) {
    logError('TypeScript类型检查失败');
    return false;
  }
  
  logSuccess('TypeScript类型检查通过');
  return true;
}

// 代码检查
function lintCheck() {
  logStep('LINT', '执行ESLint代码检查...');
  
  const result = runCommand('pnpm run lint');
  if (!result.success) {
    logWarning('ESLint检查发现问题，但继续构建...');
    // 不阻止构建，只是警告
 } else {
    logSuccess('ESLint检查通过');
  }
  return true;
}

// 构建单个组件
function buildComponent(componentName) {
  logStep('BUILD', `构建组件: ${componentName}`);
  
  const result = runCommand(`pnpm run build:${componentName}`);
  
  if (result.success) {
    logSuccess(`${componentName} 构建成功`);
  } else {
    logError(`${componentName} 构建失败`);
  }
  
  return { success: result.success };
}

// 构建所有组件
function buildAll() {
  logStep('BUILD-ALL', '构建所有组件...');
  
  const components = ['screenshot-splitter'];
  const results = {};
  
  for (const component of components) {
    results[component] = buildComponent(component);
  }
  
  return results;
}

// 生成构建报告
function generateBuildReport(results ) {
  logStep('REPORT', '生成构建报告...');
  
  log('\n📊 构建报告', 'bright');
  log('=' * 50, 'blue');
  
  Object.entries(results).forEach(([component, modes]) => {
    log(`\n${component}:`, 'cyan');
    Object.entries(modes).forEach(([mode, success]) => {
      const status = success ? '✅ 成功' : '❌ 失败';
      log(`  ${mode}: ${status}`);
    });
  });
  
  log('\n' + '=' * 50, 'blue');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'build';
  
  log('🚀 构建管理器启动', 'bright');
  log(`命令: ${command}`, 'blue');
  
  try {
    switch (command) {
      case 'clean':
        cleanBuildDirs();
        break;
        
      case 'check':
        if (!typeCheck()) process.exit(1);
        lintCheck();
        break;
        
      case 'build':
        const component = args[1];
        
        if (component) {
          // 构建特定组件
          const results = buildComponent(component);
          if (!results.success) process.exit(1);
        } else {
          // 构建所有组件
          const results = buildAll();
          generateBuildReport(results);
          
          // 检查是否有构建失败
          const hasFailure = Object.values(results).some(result => !result.success);
          if (hasFailure) process.exit(1);
        }
        break;
        
      case 'full':
        // 完整构建流程
        cleanBuildDirs();
        if (!typeCheck()) process.exit(1);
        lintCheck();
        const fullResults = buildAll();
        generateBuildReport(fullResults);
        
        const hasFullFailure = Object.values(fullResults).some(result => !result.success);
        if (hasFullFailure) process.exit(1);
        
        logSuccess('🎉 完整构建流程完成！');
        break;
        
      default:
        log('使用方法:', 'yellow');
        log('  node build-manager.js clean          # 清理构建目录');
        log('  node build-manager.js check          # 类型和代码检查');
        log('  node build-manager.js build          # 构建所有组件');
        log('  node build-manager.js build <组件>    # 构建特定组件');
        log('  node build-manager.js full           # 完整构建流程');
        break;
    }
  } catch (error) {
    logError(`构建过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { buildComponent, buildAll, cleanBuildDirs, typeCheck, lintCheck };