import { defineConfig } from 'vite';
import { createBaseConfig } from '../../vite.config.base.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const baseConfig = createBaseConfig({ 
    mode, 
    component: 'screenshot-splitter',
    customConfig: {
      // 组件特定配置
      publicDir: 'public', // 启用public目录用于worker文件
      server: {
        port: 3000,
        open: true
      }
    }
  });

  return baseConfig;
});
