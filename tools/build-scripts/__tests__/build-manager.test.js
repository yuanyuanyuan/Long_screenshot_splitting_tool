/**
 * 构建管理器单元测试
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const BuildManager = require('../build-manager');

// 模拟依赖
jest.mock('fs');
jest.mock('child_process');

describe('BuildManager', () => {
  let buildManager;
  let mockFs;
  let mockExecSync;

  beforeEach(() => {
    mockFs = fs;
    mockExecSync = execSync;
    buildManager = new BuildManager();
    
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置默认模拟行为
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({
      name: 'test-package',
      version: '1.0.0'
    }));
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});
    mockExecSync.mockReturnValue('success');
  });

  describe('构建配置', () => {
    test('应该能够加载构建配置', () => {
      const config = buildManager.loadBuildConfig();
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    test('应该能够验证构建环境', () => {
      mockExecSync
        .mockReturnValueOnce('v18.0.0') // node --version
        .mockReturnValueOnce('8.0.0')   // pnpm --version
        .mockReturnValueOnce('5.0.0');  // vite --version
      
      const result = buildManager.validateEnvironment();
      
      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith('node --version', expect.any(Object));
      expect(mockExecSync).toHaveBeenCalledWith('pnpm --version', expect.any(Object));
    });

    test('环境验证失败时应该抛出错误', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });
      
      expect(() => {
        buildManager.validateEnvironment();
      }).toThrow();
    });
  });

  describe('单包构建', () => {
    test('应该能够构建单个包', async () => {
      const options = {
        package: 'screenshot-splitter',
        mode: 'spa',
        target: 'development'
      };
      
      const result = await buildManager.buildPackage(options);
      
      expect(result.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('pnpm run build'),
        expect.any(Object)
      );
    });

    test('应该能够构建单文件模式', async () => {
      const options = {
        package: 'screenshot-splitter',
        mode: 'singlefile',
        target: 'production'
      };
      
      const result = await buildManager.buildPackage(options);
      
      expect(result.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('BUILD_MODE=singlefile'),
        expect.any(Object)
      );
    });

    test('构建失败时应该返回错误信息', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Build failed');
      });
      
      const options = {
        package: 'screenshot-splitter',
        mode: 'spa'
      };
      
      const result = await buildManager.buildPackage(options);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Build failed');
    });
  });

  describe('批量构建', () => {
    test('应该能够构建所有包', async () => {
      mockFs.readdirSync.mockReturnValue(['screenshot-splitter', 'shared-components']);
      
      const result = await buildManager.buildAll({
        mode: 'both',
        target: 'production'
      });
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4); // 2 packages × 2 modes
    });

    test('应该能够并行构建', async () => {
      mockFs.readdirSync.mockReturnValue(['package1', 'package2']);
      
      const startTime = Date.now();
      await buildManager.buildAll({
        mode: 'spa',
        parallel: true
      });
      const endTime = Date.now();
      
      // 并行构建应该比串行构建快
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('部分构建失败时应该继续其他构建', async () => {
      mockFs.readdirSync.mockReturnValue(['good-package', 'bad-package']);
      
      let callCount = 0;
      mockExecSync.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Build failed');
        }
        return 'success';
      });
      
      const result = await buildManager.buildAll({ mode: 'spa' });
      
      expect(result.success).toBe(false);
      expect(result.results.some(r => r.success)).toBe(true);
      expect(result.results.some(r => !r.success)).toBe(true);
    });
  });

  describe('构建报告', () => {
    test('应该生成构建报告', async () => {
      const buildResults = [
        { package: 'pkg1', mode: 'spa', success: true, duration: 1000 },
        { package: 'pkg2', mode: 'singlefile', success: false, error: 'Error' }
      ];
      
      const report = buildManager.generateBuildReport(buildResults);
      
      expect(report).toContain('构建报告');
      expect(report).toContain('pkg1');
      expect(report).toContain('pkg2');
      expect(report).toContain('成功: 1');
      expect(report).toContain('失败: 1');
    });

    test('应该保存构建报告到文件', async () => {
      const buildResults = [
        { package: 'test', mode: 'spa', success: true, duration: 500 }
      ];
      
      await buildManager.saveBuildReport(buildResults);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('build-report'),
        expect.any(String)
      );
    });
  });

  describe('构建清理', () => {
    test('应该能够清理构建产物', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.rmSync = jest.fn();
      
      buildManager.cleanBuild('screenshot-splitter');
      
      expect(mockFs.rmSync).toHaveBeenCalledWith(
        expect.stringContaining('dist'),
        expect.objectContaining({ recursive: true })
      );
    });

    test('应该能够清理所有构建产物', () => {
      mockFs.readdirSync.mockReturnValue(['pkg1', 'pkg2']);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.rmSync = jest.fn();
      
      buildManager.cleanAll();
      
      expect(mockFs.rmSync).toHaveBeenCalledTimes(3); // 2 packages + root dist
    });
  });

  describe('构建优化', () => {
    test('应该能够分析构建产物大小', () => {
      mockFs.statSync.mockReturnValue({ size: 1024 * 1024 }); // 1MB
      mockFs.readdirSync.mockReturnValue(['app.js', 'app.css']);
      
      const analysis = buildManager.analyzeBuildSize('screenshot-splitter');
      
      expect(analysis.totalSize).toBeGreaterThan(0);
      expect(analysis.files).toHaveLength(2);
    });

    test('应该能够检查构建产物完整性', () => {
      mockFs.existsSync
        .mockReturnValueOnce(true)  // dist目录存在
        .mockReturnValueOnce(true)  // index.html存在
        .mockReturnValueOnce(true); // assets目录存在
      
      const result = buildManager.validateBuildOutput('screenshot-splitter', 'spa');
      
      expect(result.valid).toBe(true);
    });

    test('构建产物不完整时应该返回错误', () => {
      mockFs.existsSync
        .mockReturnValueOnce(true)   // dist目录存在
        .mockReturnValueOnce(false); // index.html不存在
      
      const result = buildManager.validateBuildOutput('screenshot-splitter', 'spa');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('index.html');
    });
  });

  describe('缓存管理', () => {
    test('应该能够检查构建缓存', () => {
      const cacheKey = buildManager.generateCacheKey('screenshot-splitter', 'spa');
      
      expect(typeof cacheKey).toBe('string');
      expect(cacheKey.length).toBeGreaterThan(0);
    });

    test('应该能够使用构建缓存', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        timestamp: Date.now(),
        hash: 'abc123'
      }));
      
      const canUseCache = buildManager.canUseBuildCache('screenshot-splitter', 'spa');
      
      expect(typeof canUseCache).toBe('boolean');
    });

    test('应该能够清理过期缓存', () => {
      mockFs.readdirSync.mockReturnValue(['cache1.json', 'cache2.json']);
      mockFs.statSync.mockReturnValue({
        mtime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
      });
      mockFs.unlinkSync = jest.fn();
      
      buildManager.cleanExpiredCache();
      
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
    });
  });
});