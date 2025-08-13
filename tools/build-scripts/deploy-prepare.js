#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// 读取组件配置
function loadComponentConfig(componentName) {
  const configPath = join(rootDir, `packages/${componentName}/component.config.js`);
  
  if (!existsSync(configPath)) {
    logWarning(`组件配置文件不存在: ${configPath}`);
    return null;
  }
  
  try {
    // 动态导入配置文件
    return import(configPath).then(module => module.componentConfig || module.default);
  } catch (error) {
    logError(`读取组件配置失败: ${error.message}`);
    return null;
  }
}

// 生成独立的index.html
function generateStandaloneHTML(componentName, config) {
  const template = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config?.meta?.seo?.title || config?.displayName || componentName}</title>
    <meta name="description" content="${config?.meta?.seo?.description || config?.description || ''}">
    <meta name="keywords" content="${config?.meta?.seo?.keywords || ''}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${config?.meta?.seo?.title || config?.displayName || componentName}">
    <meta property="og:description" content="${config?.meta?.seo?.description || config?.description || ''}">
    <meta property="og:type" content="website">
    ${config?.meta?.seo?.ogImage ? `<meta property="og:image" content="${config.meta.seo.ogImage}">` : ''}
    
    <!-- 图标 -->
    <link rel="icon" type="image/svg+xml" href="/vite.svg">
    
    <!-- 预加载CDN资源 -->
    <link rel="preconnect" href="https://unpkg.com">
    <link rel="dns-prefetch" href="https://unpkg.com">
    
    <style>
        /* 加载动画 */
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .loading::after {
            content: '加载中...';
            animation: loading 1.5s infinite;
        }
        @keyframes loading {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading"></div>
    </div>
    
    <!-- 组件脚本将在构建时注入 -->
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

  return template;
}

// 生成部署配置文件
function generateDeployConfig(componentName, config) {
  const deployConfig = {
    name: componentName,
    displayName: config?.displayName || componentName,
    version: config?.version || '1.0.0',
    buildTime: new Date().toISOString(),
    
    // 构建信息
    build: {
      spa: {
        path: `packages/${componentName}/dist`,
        entry: 'index.html',
        assets: 'assets/'
      },
      single: {
        path: `packages/${componentName}/dist-single`,
        entry: 'index.html'
      }
    },
    
    // 部署路径
    deploy: config?.deploy || {
      paths: {
        spa: '/',
        single: `/components/${componentName}/`,
        standalone: `/${componentName}/`
      }
    },
    
    // 功能特性
    features: config?.features || {},
    
    // 元数据
    meta: config?.meta || {}
  };
  
  return deployConfig;
}

// 主函数
async function main() {
  const componentName = process.argv[2];
  
  if (!componentName) {
    logError('请指定组件名称');
    logInfo('使用方法: node deploy-prepare.js <组件名称>');
    process.exit(1);
  }
  
  logInfo(`准备部署组件: ${componentName}`);
  
  // 检查组件目录
  const componentDir = join(rootDir, `packages/${componentName}`);
  if (!existsSync(componentDir)) {
    logError(`组件目录不存在: ${componentDir}`);
    process.exit(1);
  }
  
  try {
    // 加载组件配置
    const config = await loadComponentConfig(componentName);
    
    // 创建部署目录
    const deployDir = join(componentDir, 'deploy');
    if (!existsSync(deployDir)) {
      mkdirSync(deployDir, { recursive: true });
    }
    
    // 生成独立HTML文件
    const standaloneHTML = generateStandaloneHTML(componentName, config);
    const standaloneHTMLPath = join(componentDir, 'standalone.html');
    writeFileSync(standaloneHTMLPath, standaloneHTML, 'utf8');
    logSuccess(`生成独立HTML文件: ${standaloneHTMLPath}`);
    
    // 生成部署配置
    const deployConfig = generateDeployConfig(componentName, config);
    const deployConfigPath = join(deployDir, 'deploy.json');
    writeFileSync(deployConfigPath, JSON.stringify(deployConfig, null, 2), 'utf8');
    logSuccess(`生成部署配置: ${deployConfigPath}`);
    
    // 复制必要文件
    const filesToCopy = [
      'package.json',
      'component.config.js'
    ];
    
    filesToCopy.forEach(file => {
      const srcPath = join(componentDir, file);
      const destPath = join(deployDir, file);
      
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath);
        logSuccess(`复制文件: ${file}`);
      }
    });
    
    logSuccess(`组件 ${componentName} 部署准备完成！`);
    logInfo(`部署目录: ${deployDir}`);
    
    // 显示下一步操作
    log('\n📋 下一步操作:', 'blue');
    log(`1. 构建组件: pnpm --filter ${componentName} build`);
    log(`2. 预览SPA版本: pnpm --filter ${componentName} preview:spa`);
    log(`3. 预览单文件版本: pnpm --filter ${componentName} preview:single`);
    log(`4. 独立运行: pnpm --filter ${componentName} standalone`);
    
  } catch (error) {
    logError(`部署准备失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateStandaloneHTML, generateDeployConfig, loadComponentConfig };