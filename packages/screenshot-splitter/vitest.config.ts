import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // 限制并发测试数量，减少内存使用
    pool: 'forks',
    poolOptions: {
      forks: {
        // 限制最大进程数，根据系统CPU核心数调整
        maxForks: 2
      }
    },
    // 设置测试超时时间
    testTimeout: 10000,
    // 优化测试运行
    isolate: true,
    // 减少不必要的控制台输出
    silent: false
  },
});