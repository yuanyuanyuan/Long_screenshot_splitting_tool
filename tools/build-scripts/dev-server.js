#!/usr/bin/env node

/**
 * 开发环境启动脚本
 */

import { spawn } from 'child_process';
import { program } from 'commander';

program
  .option('-p, --package <name>', '指定要启动的包名', 'screenshot-splitter')
  .option('--port <port>', '指定端口号', '3000')
  .parse();

const options = program.opts();
const packageName = options.package;
const port = options.port;

console.log(`🚀 启动开发服务器: ${packageName}`);
console.log(`🌐 端口: ${port}\n`);

const devProcess = spawn('pnpm', ['--filter', packageName, 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: port,
  },
});

devProcess.on('close', code => {
  console.log(`\n开发服务器已停止，退出码: ${code}`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n正在停止开发服务器...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  devProcess.kill('SIGTERM');
});
