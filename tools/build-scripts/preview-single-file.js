#!/usr/bin/env node

/**
 * 单文件HTML预览工具
 * 用于测试单文件构建结果是否能正常工作
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 启动预览服务器
 * @param {string} filePath - HTML文件路径
 * @param {number} port - 端口号
 */
function startPreviewServer(filePath, port = 8080) {
  if (!existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  const server = createServer((req, res) => {
    try {
      // 设置CORS头
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // 读取HTML文件
      const html = readFileSync(filePath, 'utf-8');
      
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      
      res.end(html);
      
      console.log(`📄 服务请求: ${req.url}`);
      
    } catch (error) {
      console.error('❌ 服务器错误:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  server.listen(port, () => {
    console.log(`🚀 单文件HTML预览服务器启动成功!`);
    console.log(`📁 文件: ${filePath}`);
    console.log(`🌐 访问地址: http://localhost:${port}`);
    console.log(`⏹️  按 Ctrl+C 停止服务器`);
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  });
}

// 命令行参数处理
const args = process.argv.slice(2);
const component = args[0] || 'screenshot-splitter';
const port = parseInt(args[1]) || 8080;

const filePath = resolve(__dirname, `../../packages/${component}/dist/index.html`);

console.log(`🔍 预览组件: ${component}`);
startPreviewServer(filePath, port);