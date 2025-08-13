/**
 * 多目标部署器单元测试
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const MultiTargetDeployer = require('../multi-target-deploy');

// 模拟依赖
jest.mock('fs');
jest.mock('child_process');

describe('MultiTargetDeployer', () => {
  let deployer;
  let mockFs;
  let mockExecSync;

  beforeEach(() => {
    mockFs = fs;
    mockExecSync = execSync;
    deployer = new MultiTargetDeployer();
    
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置默认模拟行为
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({
      targets: {
        'github-pages': {
          type: 'github-pages',
          branch: 'gh-pages',
          directory: 'dist'
        }
      }
    }));
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});
    mockExecSync.mockReturnValue('success');
  });

  describe('部署配置', () => {
    test('应该能够加载部署配置', () => {
      const config = deployer.loadDeployConfig();
      
      expect(config).toBeDefined();
      expect(config.targets).toBeDefined();
    });

    test('应该能够验证部署环境', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.30.0')
        .mockReturnValueOnce('main');
      
      const result = deployer.validateDeployEnvironment();
      
      expect(result).toBe(true);
    });

    test('Git不可用时应该抛出错误', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('git: command not found');
      });
      
      expect(() => {
        deployer.validateDeployEnvironment();
      }).toThrow();
    });
  });

  describe('GitHub Pages部署', () => {
    test('应该能够部署到GitHub Pages', async () => {
      const options = {
        target: 'github-pages',
        mode: 'spa',
        component: 'screenshot-splitter'
      };
      
      const result = await deployer.deployToGitHubPages(options);
      
      expect(result.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git push'),
        expect.any(Object)
      );
    });

    test('应该能够部署单文件模式', async () => {
      const options = {
        target: 'github-pages',
        mode: 'singlefile',
        component: 'screenshot-splitter'
      };
      
      const result = await deployer.deployToGitHubPages(options);
      
      expect(result.success).toBe(true);
      expect(result.deployedFiles).toContain('index.html');
    });

    test('部署失败时应该返回错误信息', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Push failed');
      });
      
      const options = {
        target: 'github-pages',
        mode: 'spa'
      };
      
      const result = await deployer.deployToGitHubPages(options);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Push failed');
    });
  });

  describe('多目标部署', () => {
    test('应该能够部署到多个目标', async () => {
      const options = {
        target: 'all',
        mode: 'both'
      };
      
      const result = await deployer.deploy(options);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.results)).toBe(true);
    });

    test('应该能够部署特定组件', async () => {
      const options = {
        target: 'github-pages',
        mode: 'spa',
        component: 'screenshot-splitter'
      };
      
      const result = await deployer.deploy(options);
      
      expect(result.success).toBe(true);
      expect(result.component).toBe('screenshot-splitter');
    });

    test('部分部署失败时应该继续其他部署', async () => {
      let callCount = 0;
      mockExecSync.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Deploy failed');
        }
        return 'success';
      });
      
      const options = {
        target: 'all',
        mode: 'spa'
      };
      
      const result = await deployer.deploy(options);
      
      expect(result.success).toBe(false);
      expect(result.results.some(r => r.success)).toBe(true);
      expect(result.results.some(r => !r.success)).toBe(true);
    });
  });

  describe('部署准备', () => {
    test('应该能够准备部署文件', () => {
      mockFs.readdirSync.mockReturnValue(['index.html', 'assets']);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false });
      mockFs.copyFileSync = jest.fn();
      
      const result = deployer.prepareDeployment('screenshot-splitter', 'spa');
      
      expect(result.success).toBe(true);
      expect(mockFs.copyFileSync).toHaveBeenCalled();
    });

    test('应该能够生成部署清单', () => {
      mockFs.readdirSync.mockReturnValue(['index.html', 'app.js', 'app.css']);
      mockFs.statSync.mockReturnValue({ 
        size: 1024,
        mtime: new Date()
      });
      
      const manifest = deployer.generateDeploymentManifest('screenshot-splitter');
      
      expect(manifest.files).toHaveLength(3);
      expect(manifest.totalSize).toBeGreaterThan(0);
    });
  });

  describe('部署验证', () => {
    test('应该能够验证部署结果', async () => {
      // 模拟HTTP请求成功
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });
      global.fetch = mockFetch;
      
      const result = await deployer.verifyDeployment('https://example.github.io');
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('https://example.github.io');
    });

    test('部署验证失败时应该返回错误', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      global.fetch = mockFetch;
      
      const result = await deployer.verifyDeployment('https://example.github.io');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    test('网络错误时应该处理异常', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;
      
      const result = await deployer.verifyDeployment('https://example.github.io');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('部署回滚', () => {
    test('应该能够回滚到上一个版本', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        deployments: [
          { id: 'deploy-2', commit: 'abc123', timestamp: Date.now() },
          { id: 'deploy-1', commit: 'def456', timestamp: Date.now() - 1000 }
        ]
      }));
      
      const result = await deployer.rollback();
      
      expect(result.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git checkout def456'),
        expect.any(Object)
      );
    });

    test('没有历史部署时应该返回错误', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        deployments: []
      }));
      
      const result = await deployer.rollback();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No previous deployment');
    });
  });

  describe('部署日志', () => {
    test('应该能够记录部署日志', () => {
      const deployInfo = {
        id: 'deploy-123',
        target: 'github-pages',
        mode: 'spa',
        timestamp: Date.now(),
        success: true
      };
      
      deployer.logDeployment(deployInfo);
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('deploy-123.json'),
        expect.stringContaining(deployInfo.id)
      );
    });

    test('应该能够获取部署历史', () => {
      mockFs.readdirSync.mockReturnValue(['deploy-1.json', 'deploy-2.json']);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        id: 'deploy-1',
        success: true
      }));
      
      const history = deployer.getDeploymentHistory();
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);
    });
  });

  describe('部署清理', () => {
    test('应该能够清理临时文件', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.rmSync = jest.fn();
      
      deployer.cleanup();
      
      expect(mockFs.rmSync).toHaveBeenCalledWith(
        expect.stringContaining('temp'),
        expect.objectContaining({ recursive: true })
      );
    });

    test('应该能够清理过期的部署记录', () => {
      mockFs.readdirSync.mockReturnValue(['deploy-old.json', 'deploy-new.json']);
      mockFs.statSync
        .mockReturnValueOnce({
          mtime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前
        })
        .mockReturnValueOnce({
          mtime: new Date() // 现在
        });
      mockFs.unlinkSync = jest.fn();
      
      deployer.cleanupOldDeployments();
      
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(1);
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('deploy-old.json')
      );
    });
  });

  describe('错误处理', () => {
    test('应该处理Git操作失败', async () => {
      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('git')) {
          throw new Error('Git operation failed');
        }
        return 'success';
      });
      
      const options = {
        target: 'github-pages',
        mode: 'spa'
      };
      
      const result = await deployer.deploy(options);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Git operation failed');
    });

    test('应该处理文件系统错误', async () => {
      mockFs.copyFileSync.mockImplementation(() => {
        throw new Error('File copy failed');
      });
      
      const result = deployer.prepareDeployment('screenshot-splitter', 'spa');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File copy failed');
    });
  });

  describe('配置验证', () => {
    test('应该验证部署目标配置', () => {
      const validConfig = {
        type: 'github-pages',
        branch: 'gh-pages',
        directory: 'dist'
      };
      
      const result = deployer.validateTargetConfig(validConfig);
      
      expect(result.valid).toBe(true);
    });

    test('无效配置应该返回错误', () => {
      const invalidConfig = {
        type: 'unknown-type'
      };
      
      const result = deployer.validateTargetConfig(invalidConfig);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid deployment type');
    });
  });
});
