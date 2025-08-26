import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DependencyResolver } from '../DependencyResolver';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs和path模块
vi.mock('fs/promises');
vi.mock('path');

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;

  beforeEach(() => {
    resolver = new DependencyResolver({
      enableLogging: false,
      throwOnError: false,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveDependency', () => {
    it('应该成功解析存在的依赖', async () => {
      // 模拟文件系统
      mockPath.resolve.mockReturnValue('/mock/path/shared-components');
      mockPath.join.mockReturnValue('/mock/path/shared-components/package.json');
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'shared-components'
      }));

      const result = await resolver.resolveDependency('shared-components', '../shared-components');

      expect(result.success).toBe(true);
      expect(result.resolvedPath).toBe('/mock/path/shared-components');
      expect(result.fallbackUsed).toBe(false);
    });

    it('应该在主路径失败时使用fallback路径', async () => {
      // 第一次调用失败
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));
      
      // 第二次调用成功
      mockPath.resolve.mockReturnValue('/mock/fallback/shared-components');
      mockPath.join.mockReturnValue('/mock/fallback/shared-components/package.json');
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'shared-components'
      }));

      resolver = new DependencyResolver({
        fallbackPaths: ['../../shared-components'],
        enableLogging: false,
      });

      const result = await resolver.resolveDependency('shared-components', '../shared-components');

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
    });

    it('应该在所有路径都失败时返回错误', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await resolver.resolveDependency('non-existent-package');

      expect(result.success).toBe(false);
      expect(result.error).toContain('无法解析依赖');
      expect(result.error).toContain('non-existent-package');
    });

    it('应该在throwOnError为true时抛出异常', async () => {
      resolver = new DependencyResolver({
        throwOnError: true,
        enableLogging: false,
      });

      mockFs.access.mockRejectedValue(new Error('File not found'));

      await expect(
        resolver.resolveDependency('non-existent-package')
      ).rejects.toThrow('无法解析依赖');
    });
  });

  describe('validateDependencies', () => {
    it('应该检测workspace配置残留', async () => {
      mockPath.join.mockReturnValue('/mock/package.json');
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'test-package',
        workspaces: ['packages/*']
      }));

      const result = await resolver.validateDependencies();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('检测到 workspaces 配置，这在多仓库架构中应该被移除');
      expect(result.suggestions).toContain('移除 package.json 中的 workspaces 字段');
    });

    it('应该检测workspace依赖', async () => {
      mockPath.join.mockReturnValue('/mock/package.json');
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'test-package',
        dependencies: {
          'shared-components': 'workspace:*'
        }
      }));

      const result = await resolver.validateDependencies();

      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('workspace 依赖'))).toBe(true);
    });

    it('应该检查shared-components目录', async () => {
      mockPath.join.mockReturnValue('/mock/package.json');
      mockPath.resolve.mockReturnValue('/mock/shared-components');
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'test-package'
      }));
      mockFs.access.mockRejectedValue(new Error('Directory not found'));

      const result = await resolver.validateDependencies();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('无法访问 shared-components 目录');
    });

    it('应该在配置正确时返回valid为true', async () => {
      mockPath.join.mockReturnValue('/mock/package.json');
      mockPath.resolve.mockReturnValue('/mock/shared-components');
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'test-package',
        dependencies: {
          'react': '^18.0.0'
        }
      }));
      mockFs.access.mockResolvedValue(undefined);

      const result = await resolver.validateDependencies();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('generateSuggestions', () => {
    it('应该为shared-components依赖生成特定建议', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await resolver.resolveDependency('shared-components');

      expect(result.error).toContain('确保 shared-components 包在正确的相对路径位置');
      expect(result.error).toContain('检查 shared-components/package.json 是否存在');
    });

    it('应该为scoped包生成安装建议', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await resolver.resolveDependency('@types/node');

      expect(result.error).toContain('运行 npm install @types/node 安装scoped包');
    });
  });
});