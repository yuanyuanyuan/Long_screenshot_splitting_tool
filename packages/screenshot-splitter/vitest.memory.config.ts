/**
 * 低内存消耗的Vitest配置
 * 用于在资源受限环境中运行测试
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // 使用最小化配置
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1 // 只使用一个进程
      }
    },
    testTimeout: 15000, // 增加超时时间
    isolate: true,
    silent: true, // 减少输出
    coverage: {
      enabled: false // 禁用覆盖率报告以节省内存
    },
    // 减少并行测试数量
    fileParallelism: false,
    // 禁用监视模式
    watch: false
  },
});