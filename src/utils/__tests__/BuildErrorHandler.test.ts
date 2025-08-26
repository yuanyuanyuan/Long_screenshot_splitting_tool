import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildErrorHandler } from '../BuildErrorHandler';

describe('BuildErrorHandler', () => {
  let handler: BuildErrorHandler;

  beforeEach(() => {
    handler = new BuildErrorHandler();
  });

  describe('handleBuildError', () => {
    it('应该识别workspace相关错误', () => {
      const error = 'workspace not found in current directory';
      const result = handler.handleBuildError(error);

      expect(result.type).toBe('workspace');
      expect(result.severity).toBe('error');
      expect(result.suggestions).toContain('确认已完全移除pnpm-workspace.yaml文件');
    });

    it('应该识别模块解析错误', () => {
      const error = 'Cannot resolve module "shared-components"';
      const result = handler.handleBuildError(error);

      expect(result.type).toBe('dependency');
      expect(result.severity).toBe('error');
      expect(result.suggestions).toContain('检查依赖是否已正确安装');
    });

    it('应该识别配置文件错误', () => {
      const error = 'Config file not found: vite.config.ts';
      const result = handler.handleBuildError(error);

      expect(result.type).toBe('config');
      expect(result.severity).toBe('error');
      expect(result.suggestions).toContain('检查config目录结构是否完整');
    });

    it('应该识别Vite构建错误', () => {
      const error = 'Vite build failed with exit code 1';
      const result = handler.handleBuildError(error);

      expect(result.type).toBe('config');
      expect(result.severity).toBe('error');
      expect(result.suggestions).toContain('检查vite.config.ts配置是否正确');
    });

    it('应该识别TypeScript错误', () => {
      const error = 'TypeScript error: Type "string" is not assignable to type "number"';
      const result = handler.handleBuildError(error);

      expect(result.type).toBe('config');
      expect(result.severity).toBe('warning');
      expect(result.suggestions).toContain('检查tsconfig.json配置');
    });

    it('应该处理未知错误', () => {
      const error = 'Some unknown error occurred';
      const result = handler.handleBuildError(error);

      expect(result.type).toBe('unknown');
      expect(result.severity).toBe('error');
      expect(result.suggestions).toContain('检查错误日志获取更多信息');
    });

    it('应该处理Error对象', () => {
      const error = new Error('Test error message');
      const result = handler.handleBuildError(error);

      expect(result.originalError).toBe(error);
      expect(result.message).toBe('Test error message');
    });
  });

  describe('formatError', () => {
    it('应该正确格式化错误信息', () => {
      const buildError = {
        type: 'workspace' as const,
        message: 'Test error message',
        suggestions: ['Suggestion 1', 'Suggestion 2'],
        severity: 'error' as const
      };

      const formatted = handler.formatError(buildError);

      expect(formatted).toContain('❌ 构建错误 [WORKSPACE]');
      expect(formatted).toContain('Test error message');
      expect(formatted).toContain('1. Suggestion 1');
      expect(formatted).toContain('2. Suggestion 2');
    });

    it('应该包含原始错误信息', () => {
      const originalError = new Error('Original error');
      const buildError = {
        type: 'unknown' as const,
        message: 'Test message',
        originalError,
        suggestions: ['Fix it'],
        severity: 'error' as const
      };

      const formatted = handler.formatError(buildError);

      expect(formatted).toContain('原始错误:');
      expect(formatted).toContain('Original error');
    });
  });
});