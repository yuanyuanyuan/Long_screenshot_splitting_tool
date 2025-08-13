#!/usr/bin/env node

import { createServer } from 'http';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

function logSuccess(message) {
  log(`✅ ${message}`, '\x1b[32m');
}

function logError(message) {
  log(`❌ ${message}`, '\x1b[31m');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, '\x1b[36m');
}

// 生成目录列表HTML
function generateDirectoryListing(dirPath, urlPath) {
  const items = readdirSync(dirPath).map(item => {
    const itemPath = join(dirPath, item);
    const isDir = statSync(itemPath).isDirectory();
    const href = urlPath === '/' ? `/${item}` : `${urlPath}/${item}`;
    
    return {
      name: item,
      href,
      isDir,
      size: isDir ? '-' : statSync(itemPath).size
    };
  });

  // 排序：目录在前，文件在后
  items.sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });

  const listItems = items.map(item => {
    const icon = item.isDir ? '📁' : '📄';
    const size = item.isDir ? '' : ` (${item.size} bytes)`;
    return `<li><a href="${item.href}">${icon} ${item.name}${size}</a></li>`;
  }).join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>目录列表 - ${urlPath}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        ul { list-style: none; padding: 0; }
        li { margin: 8px 0; }
        a { text-decoration: none; color: #0066cc; }
        a:hover { text-decoration: underline; }
        .back { margin-bottom: 20px; }
        .info { background: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="info">
        <strong>🚀 部署预览服务器</strong><br>
        当前路径: ${urlPath}<br>
        这是构建产物的预览，模拟GitHub Pages的部署环境
    </div>
    
    ${urlPath !== '/' ? '<div class="back"><a href="../">⬆️ 返回上级目录</a></div>' : ''}
    
    <h1>📂 ${urlPath}</h1>
    <ul>
        ${listItems}
    </ul>
    
    <hr>
    <p><small>部署预览服务器 - 模拟GitHub Pages环境</small></p>
</body>
</html>`;
}

// 创建HTTP服务器
function createPreviewServer(distDir, port = 8080) {
  const server = createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url);
    
    // 移除查询参数
    const queryIndex = urlPath.indexOf('?');
    if (queryIndex !== -1) {
      urlPath = urlPath.substring(0, queryIndex);
    }
    
    // 安全检查：防止路径遍历攻击
    if (urlPath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    
    const filePath = join(distDir, urlPath === '/' ? 'index.html' : urlPath.substring(1));
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      // 如果是SPA模式，尝试返回index.html
      const indexPath = join(distDir, 'index.html');
      if (existsSync(indexPath) && !urlPath.includes('.')) {
        const content = readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return;
      }
      
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    
    const stat = statSync(filePath);
    
    // 如果是目录，显示目录列表或查找index.html
    if (stat.isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } else {
        const listing = generateDirectoryListing(filePath, urlPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(listing);
      }
      return;
    }
    
    // 返回文件内容
    try {
      const content = readFileSync(filePath);
      const mimeType = getMimeType(filePath);
      
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });
  
  return server;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const component = args[0] || 'screenshot-splitter';
  const mode = args[1] || 'spa';
  const port = parseInt(args[2]) || 8080;
  
  // 确定构建目录
  let distDir;
  if (mode === 'single') {
    distDir = join(rootDir, `packages/${component}/dist-single`);
  } else {
    distDir = join(rootDir, `packages/${component}/dist`);
  }
  
  // 检查构建目录是否存在
  if (!existsSync(distDir)) {
    logError(`构建目录不存在: ${distDir}`);
    logInfo('请先运行构建命令:');
    logInfo(`  pnpm run build:${component}:${mode}`);
    process.exit(1);
  }
  
  // 创建并启动服务器
  const server = createPreviewServer(distDir, port);
  
  server.listen(port, () => {
    logSuccess(`部署预览服务器已启动！`);
    logInfo(`组件: ${component}`);
    logInfo(`模式: ${mode}`);
    logInfo(`目录: ${distDir}`);
    logInfo(`地址: http://localhost:${port}`);
    logInfo('');
    logInfo('按 Ctrl+C 停止服务器');
    
    // 尝试自动打开浏览器
    try {
      const command = process.platform === 'darwin' ? 'open' : 
                     process.platform === 'win32' ? 'start' : 'xdg-open';
      execSync(`${command} http://localhost:${port}`, { stdio: 'ignore' });
    } catch (error) {
      // 忽略打开浏览器的错误
    }
  });
  
  // 优雅关闭
  process.on('SIGINT', () => {
    logInfo('\n正在关闭服务器...');
    server.close(() => {
      logSuccess('服务器已关闭');
      process.exit(0);
    });
  });
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createPreviewServer };