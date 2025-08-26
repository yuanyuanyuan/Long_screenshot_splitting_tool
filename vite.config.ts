import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { getDeploymentConfig } from './config/build/deployment.config'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  // 注入到 process.env，供自定义部署配置读取
  Object.assign(process.env, env)

  // 调试日志：检查 vite 加载的 env
  console.log('[vite env] COPYRIGHT DEBUG', {
    VITE_COPYRIGHT_AUTHOR: env.VITE_COPYRIGHT_AUTHOR,
    VITE_COPYRIGHT_EMAIL: env.VITE_COPYRIGHT_EMAIL,
    VITE_COPYRIGHT_WEBSITE: env.VITE_COPYRIGHT_WEBSITE,
    VITE_COPYRIGHT_TOOL_NAME: env.VITE_COPYRIGHT_TOOL_NAME,
    VITE_COPYRIGHT_YEAR: env.VITE_COPYRIGHT_YEAR,
    mode,
    envFiles: ['.env.development.local', '.env.development', '.env.local', '.env']
  });

  const deploy = getDeploymentConfig()

  return {
    // 仅使用 base 控制公共路径：绝对URL 或 子路径
    base: deploy.useAbsoluteUrls ? deploy.assetsBaseUrl : deploy.basePath,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './shared-components'),
        'shared-components': path.resolve(__dirname, './shared-components'),
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          manualChunks: {
            vendor: ['react', 'react-dom']
          }
        }
      }
    },
    server: {
      host: true,
      port: 3000
    }
  }
})