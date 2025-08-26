/**
 * Vite构建配置
 * 定义不同环境下的构建参数和优化选项
 */

import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export interface BuildConfig {
  input: string;
  output: string;
  external: string[];
  plugins: any[];
  optimization: {
    minify: boolean;
    sourcemap: boolean;
    treeshaking: boolean;
    splitting: boolean;
  };
  performance: {
    chunkSizeWarningLimit: number;
    maxAssetSize: number;
  };
}

/**
 * 基础构建配置
 */
export const baseBuildConfig: BuildConfig = {
  input: 'src/main.tsx',
  output: 'dist',
  external: [],
  plugins: [react()],
  optimization: {
    minify: true,
    sourcemap: false,
    treeshaking: true,
    splitting: true,
  },
  performance: {
    chunkSizeWarningLimit: 1000, // 1MB
    maxAssetSize: 5000, // 5MB
  },
};

/**
 * 开发环境配置
 */
export const developmentConfig: Partial<BuildConfig> = {
  optimization: {
    minify: false,
    sourcemap: true,
    treeshaking: false,
    splitting: false,
  },
};

/**
 * 生产环境配置
 */
export const productionConfig: Partial<BuildConfig> = {
  optimization: {
    minify: true,
    sourcemap: false,
    treeshaking: true,
    splitting: true,
  },
};

/**
 * 测试环境配置
 */
export const testConfig: Partial<BuildConfig> = {
  optimization: {
    minify: false,
    sourcemap: true,
    treeshaking: false,
    splitting: false,
  },
};

/**
 * 获取环境特定的构建配置
 */
export function getBuildConfig(env: string = 'development'): BuildConfig {
  const envConfigs = {
    development: developmentConfig,
    production: productionConfig,
    test: testConfig,
  };

  const envConfig = envConfigs[env as keyof typeof envConfigs] || developmentConfig;
  
  return {
    ...baseBuildConfig,
    ...envConfig,
    optimization: {
      ...baseBuildConfig.optimization,
      ...envConfig.optimization,
    },
  };
}

/**
 * 创建Vite配置
 */
export function createViteConfig(env: string = 'development'): UserConfig {
  const buildConfig = getBuildConfig(env);
  
  return defineConfig({
    plugins: buildConfig.plugins,
    build: {
      outDir: buildConfig.output,
      sourcemap: buildConfig.optimization.sourcemap,
      minify: buildConfig.optimization.minify ? 'terser' : false,
      rollupOptions: {
        input: resolve(__dirname, '../../', buildConfig.input),
        external: buildConfig.external,
        output: {
          manualChunks: buildConfig.optimization.splitting ? {
            vendor: ['react', 'react-dom'],
            utils: ['jspdf', 'jszip'],
          } : undefined,
        },
      },
      chunkSizeWarningLimit: buildConfig.performance.chunkSizeWarningLimit,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '../../src'),
        '@shared': resolve(__dirname, '../../../shared-components/src'),
      },
    },
    server: {
      port: 3000,
      open: true,
      cors: true,
    },
    preview: {
      port: 4173,
      open: true,
    },
  });
}

/**
 * 导出默认配置
 */
export default createViteConfig(process.env.NODE_ENV || 'development');