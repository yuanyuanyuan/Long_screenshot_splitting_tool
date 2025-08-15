import { defineConfig } from 'vite';
import { createBaseConfig } from '../../vite.config.base.js';

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const isSingleFile = mode === 'singlefile';
  
  const baseConfig = createBaseConfig({ 
    mode, 
    component: 'screenshot-splitter',
    customConfig: {
      // 组件特定配置
      // 单文件模式下不复制public目录，避免生成不必要的workers目录
      publicDir: isSingleFile ? false : 'public',
      server: {
        port: 3000,
        open: true
      }
    }
  });

  return baseConfig;
});