#!/usr/bin/env node

/**
 * HTML资源路径处理脚本
 * 用于在构建后修改HTML文件中的资源引用路径
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { componentConfig } from '../component.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const HTML_FILE = path.join(__dirname, '..', 'dist', 'index.html');
const ASSETS_BASE_PATH = componentConfig.deploy.assets?.basePath || '/assets/';

/**
 * 处理HTML文件中的资源路径
 */
function processHtmlAssets() {
  try {
    // 读取HTML文件
    let htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
    
    console.log('🔧 开始处理HTML资源路径...');
    console.log(`📁 资源基础路径: ${ASSETS_BASE_PATH}`);
    
    // 获取配置中的具体路径
    const jsPath = componentConfig.deploy.assets?.jsPath || ASSETS_BASE_PATH;
    const cssPath = componentConfig.deploy.assets?.cssPath || ASSETS_BASE_PATH;

    // 替换资源路径
    const replacements = [
      // 替换脚本标签 (处理绝对路径 /assets/)
      {
        pattern: /<script type="module" crossorigin="anonymous" src="\/assets\/([^"]+)"><\/script>/g,
        replacement: `<script type="module" crossorigin="anonymous" src="${jsPath}$1"></script>`
      },
      // 替换模块预加载标签 (处理绝对路径 /assets/)
      {
        pattern: /<link rel="modulepreload" crossorigin="anonymous" href="\/assets\/([^"]+)">/g,
        replacement: `<link rel="modulepreload" crossorigin="anonymous" href="${jsPath}$1">`
      },
      // 替换样式标签 (处理可能已经修改过的路径)
      {
        pattern: /<link rel="stylesheet" href="\/assets\/([^"]+)">/g,
        replacement: `<link rel="stylesheet" href="${cssPath}$1">`
      }
    ];
    
    let modified = false;
    let replacementCount = 0;
    
    // 执行所有替换
    replacements.forEach(({ pattern, replacement }) => {
      const newContent = htmlContent.replace(pattern, replacement);
      if (newContent !== htmlContent) {
        modified = true;
        replacementCount += (htmlContent.match(pattern) || []).length;
        htmlContent = newContent;
      }
    });
    
    if (modified) {
      // 写入修改后的内容
      fs.writeFileSync(HTML_FILE, htmlContent, 'utf8');
      console.log(`✅ 成功替换了 ${replacementCount} 处资源路径`);
      console.log(`📄 HTML文件已更新: ${HTML_FILE}`);
    } else {
      console.log('ℹ️  未找到需要替换的资源路径');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 处理HTML资源路径时出错:', error.message);
    return false;
  }
}

// 执行处理
if (process.argv.includes('--test')) {
  console.log('🧪 测试模式: 显示替换效果但不实际修改文件');
  // 测试逻辑可以在这里添加
} else {
  const success = processHtmlAssets();
  process.exit(success ? 0 : 1);
}