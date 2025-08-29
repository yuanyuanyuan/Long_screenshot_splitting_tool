import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppConfig, createAppConfig } from '../../../config/app/app.config';

// Mock环境变量
const mockEnv = {
  NODE_ENV: 'test',
  VITE_APP_NAME: 'Test App',
  VITE_APP_VERSION: '1.0.0',
  VITE_API_BASE_URL: 'https://api.test.com'
};

describe('AppConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置环境变量
    Object.keys(mockEnv).forEach(key => {
      process.env[key] = mockEnv[key as keyof typeof mockEnv];
    });
  });

  describe('createAppConfig', () => {
    it('应该创建正确的应用配置', () => {
      const config = createAppConfig();

      expect(config.name).toBe('Test App');
      expect(config.version).toBe('1.0.0');
      expect(config.environment).toBe('test');
      expect(config.api.baseUrl).toBe('https://api.test.com');
    });

    it('应该使用默认值当环境变量不存在时', () => {
      delete process.env.VITE_APP_NAME;
      delete process.env.VITE_APP_VERSION;
      delete process.env.VITE_API_BASE_URL;

      const config = createAppConfig();

      expect(config.name).toBe('Screenshot Splitter');
      expect(config.version).toBe('1.0.0');
      expect(config.api.baseUrl).toBe('');
    });

    it('应该正确设置开发环境配置', () => {
      process.env.NODE_ENV = 'development';

      const config = createAppConfig();

      expect(config.environment).toBe('development');
      expect(config.debug).toBe(true);
    });

    it('应该正确设置生产环境配置', () => {
      process.env.NODE_ENV = 'production';

      const config = createAppConfig();

      expect(config.environment).toBe('production');
      expect(config.debug).toBe(false);
    });

    it('应该包含所有必需的配置字段', () => {
      const config = createAppConfig();

      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('debug');
      expect(config).toHaveProperty('api');
      expect(config.api).toHaveProperty('baseUrl');
      expect(config.api).toHaveProperty('timeout');
    });
  });
});