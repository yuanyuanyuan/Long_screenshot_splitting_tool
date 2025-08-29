import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildConfig, createBuildConfig } from '../../../vite.config';

describe('BuildConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBuildConfig', () => {
    it('应该创建开发环境构建配置', () => {
      const config = createBuildConfig('development');

      expect(config.mode).toBe('development');
      expect(config.build.minify).toBe(false);
      expect(config.build.sourcemap).toBe(true);
      expect(config.server.port).toBe(3000);
    });

    it('应该创建生产环境构建配置', () => {
      const config = createBuildConfig('production');

      expect(config.mode).toBe('production');
      expect(config.build.minify).toBe('esbuild');
      expect(config.build.sourcemap).toBe(false);
      expect(config.build.outDir).toBe('dist');
    });

    it('应该创建测试环境构建配置', () => {
      const config = createBuildConfig('test');

      expect(config.mode).toBe('test');
      expect(config.build.minify).toBe(false);
      expect(config.build.sourcemap).toBe(true);
    });

    it('应该包含正确的插件配置', () => {
      const config = createBuildConfig('development');

      expect(config.plugins).toBeDefined();
      expect(Array.isArray(config.plugins)).toBe(true);
    });

    it('应该包含正确的解析配置', () => {
      const config = createBuildConfig('development');

      expect(config.resolve).toBeDefined();
      expect(config.resolve.alias).toBeDefined();
      expect(config.resolve.alias['@']).toContain('src');
    });

    it('应该根据环境设置不同的优化选项', () => {
      const devConfig = createBuildConfig('development');
      const prodConfig = createBuildConfig('production');

      expect(devConfig.build.minify).toBe(false);
      expect(prodConfig.build.minify).toBe('esbuild');
      
      expect(devConfig.build.sourcemap).toBe(true);
      expect(prodConfig.build.sourcemap).toBe(false);
    });
  });
});