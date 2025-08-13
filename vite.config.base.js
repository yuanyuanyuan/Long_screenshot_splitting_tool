import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { viteExternalsPlugin } from 'vite-plugin-externals';
import { resolve } from 'path';
import { getOptimizedExternalsConfig } from './tools/build-scripts/cdn-config.js';

/**
 * 创建基础Vite配置
 * @param {Object} options - 配置选项
 * @param {string} options.mode - 构建模式 ('spa' | 'singlefile')
 * @param {string} options.component - 组件名称
 * @param {string} options.root - 项目根目录
 * @param {Object} options.env - 环境变量
 * @returns {Object} Vite配置对象
 */
export function createBaseConfig(options = {}) {
  const {
    mode = 'spa',
    component = '',
    root = process.cwd(),
    env = {},
    base = './',
    outDir = 'dist'
  } = options;

  const isSingleFile = mode === 'singlefile';
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`🔧 创建Vite配置 - 模式: ${mode}, 组件: ${component || '主应用'}`);

  return defineConfig({
    // 基础配置
    root,
    base,
    mode: mode === 'singlefile' ? 'production' : mode,
    
    // 环境变量
    define: {
      __BUILD_MODE__: JSON.stringify(mode),
      __COMPONENT_NAME__: JSON.stringify(component),
      ...Object.entries(env).reduce((acc, [key, value]) => {
        acc[`process.env.${key}`] = JSON.stringify(value);
        return acc;
      }, {})
    },

    // 插件配置
    plugins: [
      react({
        // React插件配置
        fastRefresh: !isProduction,
        babel: {
          plugins: isProduction ? [] : []
        }
      }),
      
      // 单文件模式插件
      ...(isSingleFile ? [
        // CDN外部库支持
        viteExternalsPlugin(getOptimizedExternalsConfig({
          includeReact: true,
          includeLodash: false,
          includeDateFns: false
        })),
        viteSingleFile({
          removeViteModuleLoader: true,
          useRecommendedBuildConfig: true,
          inlinePattern: ['**/*.css', '**/*.js']
        })
      ] : [])
    ],

    // 构建配置
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      
      // 单文件模式特殊配置
      ...(isSingleFile && {
        cssCodeSplit: false,
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        rollupOptions: {
          inlineDynamicImports: true,
          output: {
            assetFileNames: 'assets/[name].[ext]',
            chunkFileNames: 'assets/[name].js',
            entryFileNames: 'assets/[name].js'
          }
        }
      }),

      // SPA模式配置
      ...(!isSingleFile && {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom']
            }
          }
        }
      })
    },

    // 开发服务器配置
    server: {
      port: 3000,
      host: true,
      open: false,
      cors: true,
      hmr: {
        overlay: true
      }
    },

    // 预览服务器配置
    preview: {
      port: 4173,
      host: true,
      open: false
    },

    // 路径解析
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
        '@shared': resolve(root, '../shared-components/src'),
        '@ui': resolve(root, '../ui-library/src'),
        '@screenshot-splitter': resolve(root, '../screenshot-splitter/src')
      }
    },

    // CSS配置
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    },

    // 优化配置
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@vite/client', '@vite/env']
    },

    // 实验性功能
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      }
    }
  });
}

/**
 * 创建单文件模式配置
 * @param {Object} options - 配置选项
 * @returns {Object} 单文件模式Vite配置
 */
export function createSingleFileConfig(options = {}) {
  return createBaseConfig({
    ...options,
    mode: 'singlefile'
  });
}

/**
 * 创建SPA模式配置
 * @param {Object} options - 配置选项
 * @returns {Object} SPA模式Vite配置
 */
export function createSpaConfig(options = {}) {
  return createBaseConfig({
    ...options,
    mode: 'spa'
  });
}

/**
 * 根据环境变量自动选择配置
 * @param {Object} options - 配置选项
 * @returns {Object} 自动选择的Vite配置
 */
export function createAutoConfig(options = {}) {
  const mode = process.env.VITE_BUILD_MODE || process.env.BUILD_MODE || 'spa';
  const component = process.env.VITE_COMPONENT || process.env.COMPONENT || '';
  
  console.log(`🚀 自动配置模式: ${mode}${component ? `, 组件: ${component}` : ''}`);
  
  return createBaseConfig({
    mode,
    component,
    ...options
  });
}

// 默认导出自动配置
export default createAutoConfig;