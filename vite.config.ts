import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { getDeploymentConfig } from './config/build/deployment.config'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 设置环境变量到process.env，以便部署配置能够读取
  Object.assign(process.env, env)
  
  // 获取部署配置
  const config = getDeploymentConfig()
  
  return {
    plugins: [react()],
    base: config.useAbsoluteUrls ? config.assetsBaseUrl : config.basePath,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'shared-components': path.resolve(__dirname, './shared-components')
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          // 资源文件命名
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['html2canvas', 'dompurify']
          }
        }
      }
    },
    server: {
      port: 3000,
      host: true
    },
    // 实验性功能：支持运行时基础路径
    // 实验性功能：支持运行时基础路径
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        // 移除filename中的assets/前缀，避免重复
        const cleanFilename = filename.startsWith('assets/') ? filename.slice(7) : filename
        
        if (hostType === 'js') {
          // 对于JS中的动态导入，使用配置的URL
          return config.useAbsoluteUrls 
            ? `${config.assetsBaseUrl}/assets/${cleanFilename}`
            : `./assets/${cleanFilename}`
        }
        // 对于HTML中的资源引用
        return config.useAbsoluteUrls
          ? `${config.assetsBaseUrl}/assets/${cleanFilename}`
          : `./assets/${cleanFilename}`
      }
    }
  }
})