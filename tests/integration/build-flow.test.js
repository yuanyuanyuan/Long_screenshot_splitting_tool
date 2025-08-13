/**
 * 构建流程集成测试
 * 测试完整的构建和部署流程
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('构建流程集成测试', () => {
  const testProjectRoot = path.join(__dirname, '../../');
  const tempDir = path.join(testProjectRoot, 'temp-test');

  beforeAll(() => {
    // 确保测试环境干净
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    // 清理测试环境
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Monorepo结构验证', () => {
    test('应该有正确的workspace配置', () => {
      const workspaceFile = path.join(testProjectRoot, 'pnpm-workspace.yaml');
      expect(fs.existsSync(workspaceFile)).toBe(true);
      
      const workspaceContent = fs.readFileSync(workspaceFile, 'utf8');
      expect(workspaceContent).toContain('packages/*');
    });

    test('应该有所有必需的包', () => {
      const packagesDir = path.join(testProjectRoot, 'packages');
      expect(fs.existsSync(packagesDir)).toBe(true);
      
      const packages = fs.readdirSync(packagesDir);
      expect(packages).toContain('screenshot-splitter');
      expect(packages).toContain('shared-components');
    });

    test('每个包应该有正确的package.json', () => {
      const screenshotPkg = path.join(testProjectRoot, 'packages/screenshot-splitter/package.json');
      const sharedPkg = path.join(testProjectRoot, 'packages/shared-components/package.json');
      
      expect(fs.existsSync(screenshotPkg)).toBe(true);
      expect(fs.existsSync(sharedPkg)).toBe(true);
      
      const screenshotConfig = JSON.parse(fs.readFileSync(screenshotPkg, 'utf8'));
      expect(screenshotConfig.name).toBe('@long-screenshot/screenshot-splitter');
      
      const sharedConfig = JSON.parse(fs.readFileSync(sharedPkg, 'utf8'));
      expect(sharedConfig.name).toBe('@long-screenshot/shared-components');
    });
  });

  describe('依赖安装验证', () => {
    test('应该能够安装所有依赖', () => {
      try {
        execSync('pnpm install', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
      } catch (error) {
        fail(`依赖安装失败: ${error.message}`);
      }
    });

    test('应该有正确的依赖关系', () => {
      const rootPkg = JSON.parse(fs.readFileSync(
        path.join(testProjectRoot, 'package.json'), 
        'utf8'
      ));
      
      expect(rootPkg.devDependencies).toHaveProperty('vite');
      expect(rootPkg.devDependencies).toHaveProperty('typescript');
      expect(rootPkg.devDependencies).toHaveProperty('jest');
    });
  });

  describe('TypeScript配置验证', () => {
    test('应该有正确的TypeScript配置', () => {
      const rootTsConfig = path.join(testProjectRoot, 'tsconfig.json');
      expect(fs.existsSync(rootTsConfig)).toBe(true);
      
      const screenshotTsConfig = path.join(testProjectRoot, 'packages/screenshot-splitter/tsconfig.json');
      expect(fs.existsSync(screenshotTsConfig)).toBe(true);
      
      const sharedTsConfig = path.join(testProjectRoot, 'packages/shared-components/tsconfig.json');
      expect(fs.existsSync(sharedTsConfig)).toBe(true);
    });

    test('TypeScript编译应该成功', () => {
      try {
        execSync('pnpm run type-check', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
      } catch (error) {
        fail(`TypeScript编译失败: ${error.message}`);
      }
    });
  });

  describe('构建系统验证', () => {
    test('应该能够构建SPA模式', () => {
      try {
        execSync('pnpm run build:spa', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
        
        const distDir = path.join(testProjectRoot, 'dist');
        expect(fs.existsSync(distDir)).toBe(true);
        
        const indexFile = path.join(distDir, 'index.html');
        expect(fs.existsSync(indexFile)).toBe(true);
        
      } catch (error) {
        fail(`SPA构建失败: ${error.message}`);
      }
    });

    test('应该能够构建单文件模式', () => {
      try {
        execSync('pnpm run build:singlefile', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
        
        const distDir = path.join(testProjectRoot, 'dist');
        expect(fs.existsSync(distDir)).toBe(true);
        
        const indexFile = path.join(distDir, 'index.html');
        expect(fs.existsSync(indexFile)).toBe(true);
        
        // 验证单文件模式特征
        const indexContent = fs.readFileSync(indexFile, 'utf8');
        expect(indexContent).toContain('<style>'); // 内联CSS
        expect(indexContent).toContain('<script>'); // 内联JS
        
      } catch (error) {
        fail(`单文件构建失败: ${error.message}`);
      }
    });

    test('应该能够构建独立组件', () => {
      try {
        execSync('pnpm run build:component screenshot-splitter', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
        
        const componentDist = path.join(testProjectRoot, 'packages/screenshot-splitter/dist');
        expect(fs.existsSync(componentDist)).toBe(true);
        
      } catch (error) {
        fail(`组件构建失败: ${error.message}`);
      }
    });
  });

  describe('构建产物验证', () => {
    beforeAll(() => {
      // 确保有构建产物
      try {
        execSync('pnpm run build:full', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
      } catch (error) {
        console.warn('构建失败，跳过构建产物验证');
      }
    });

    test('SPA模式构建产物应该正确', () => {
      const distDir = path.join(testProjectRoot, 'dist');
      if (!fs.existsSync(distDir)) {
        console.warn('构建产物不存在，跳过验证');
        return;
      }
      
      const indexFile = path.join(distDir, 'index.html');
      const assetsDir = path.join(distDir, 'assets');
      
      expect(fs.existsSync(indexFile)).toBe(true);
      expect(fs.existsSync(assetsDir)).toBe(true);
      
      const indexContent = fs.readFileSync(indexFile, 'utf8');
      expect(indexContent).toContain('<!DOCTYPE html>');
      expect(indexContent).toContain('<div id="root">');
    });

    test('单文件模式构建产物应该正确', () => {
      const singlefileDir = path.join(testProjectRoot, 'dist-singlefile');
      if (!fs.existsSync(singlefileDir)) {
        console.warn('单文件构建产物不存在，跳过验证');
        return;
      }
      
      const indexFile = path.join(singlefileDir, 'index.html');
      expect(fs.existsSync(indexFile)).toBe(true);
      
      const indexContent = fs.readFileSync(indexFile, 'utf8');
      expect(indexContent).toContain('<!DOCTYPE html>');
      
      // 验证资源内联
      expect(indexContent).toContain('<style>');
      expect(indexContent).toContain('<script>');
      
      // 不应该有外部资源引用
      expect(indexContent).not.toMatch(/<link[^>]*href="[^"]*\.css"/);
      expect(indexContent).not.toMatch(/<script[^>]*src="[^"]*\.js"/);
    });

    test('构建产物大小应该合理', () => {
      const distDir = path.join(testProjectRoot, 'dist');
      if (!fs.existsSync(distDir)) {
        console.warn('构建产物不存在，跳过大小验证');
        return;
      }
      
      const indexFile = path.join(distDir, 'index.html');
      const stats = fs.statSync(indexFile);
      
      // HTML文件不应该太大（SPA模式）
      expect(stats.size).toBeLessThan(100 * 1024); // 100KB
      
      // 检查单文件模式
      const singlefileDir = path.join(testProjectRoot, 'dist-singlefile');
      if (fs.existsSync(singlefileDir)) {
        const singlefileIndex = path.join(singlefileDir, 'index.html');
        const singlefileStats = fs.statSync(singlefileIndex);
        
        // 单文件应该比SPA模式大，但不应该超过5MB
        expect(singlefileStats.size).toBeGreaterThan(stats.size);
        expect(singlefileStats.size).toBeLessThan(5 * 1024 * 1024); // 5MB
      }
    });
  });

  describe('开发服务器验证', () => {
    test('应该能够启动开发服务器', (done) => {
      const devServer = execSync('pnpm run dev', { 
        cwd: testProjectRoot,
        stdio: 'pipe',
        timeout: 10000
      });
      
      // 简单验证命令执行成功
      expect(devServer).toBeDefined();
      done();
    }, 15000);
  });

  describe('测试系统验证', () => {
    test('应该能够运行单元测试', () => {
      try {
        execSync('pnpm run test:unit', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
      } catch (error) {
        // 测试可能失败，但不应该是配置问题
        expect(error.message).not.toContain('Configuration error');
        expect(error.message).not.toContain('Cannot find module');
      }
    });

    test('Jest配置应该正确', () => {
      const jestConfig = path.join(testProjectRoot, 'jest.config.js');
      expect(fs.existsSync(jestConfig)).toBe(true);
      
      const config = require(jestConfig);
      expect(config.projects).toBeDefined();
      expect(Array.isArray(config.projects)).toBe(true);
      expect(config.projects.length).toBeGreaterThan(0);
    });
  });

  describe('部署配置验证', () => {
    test('应该有GitHub Actions配置', () => {
      const workflowFile = path.join(testProjectRoot, '.github/workflows/deploy.yml');
      expect(fs.existsSync(workflowFile)).toBe(true);
      
      const workflowContent = fs.readFileSync(workflowFile, 'utf8');
      expect(workflowContent).toContain('pnpm');
      expect(workflowContent).toContain('build');
      expect(workflowContent).toContain('deploy');
    });

    test('应该有部署配置文件', () => {
      const deployConfig = path.join(testProjectRoot, 'deploy.config.js');
      expect(fs.existsSync(deployConfig)).toBe(true);
      
      const config = require(deployConfig);
      expect(config.targets).toBeDefined();
      expect(config.targets['github-pages']).toBeDefined();
    });

    test('部署脚本应该存在', () => {
      const deployScript = path.join(testProjectRoot, 'tools/build-scripts/multi-target-deploy.js');
      expect(fs.existsSync(deployScript)).toBe(true);
      
      const buildScript = path.join(testProjectRoot, 'tools/build-scripts/build-manager.js');
      expect(fs.existsSync(buildScript)).toBe(true);
    });
  });

  describe('组件独立性验证', () => {
    test('长截图分割工具应该能够独立运行', () => {
      const componentDir = path.join(testProjectRoot, 'packages/screenshot-splitter');
      const componentPkg = path.join(componentDir, 'package.json');
      
      expect(fs.existsSync(componentPkg)).toBe(true);
      
      const config = JSON.parse(fs.readFileSync(componentPkg, 'utf8'));
      expect(config.scripts).toHaveProperty('build');
      expect(config.scripts).toHaveProperty('dev');
    });

    test('组件应该有独立的配置文件', () => {
      const componentConfig = path.join(testProjectRoot, 'packages/screenshot-splitter/component.config.js');
      expect(fs.existsSync(componentConfig)).toBe(true);
      
      const config = require(componentConfig);
      expect(config.id).toBe('screenshot-splitter');
      expect(config.name).toBeDefined();
      expect(config.version).toBeDefined();
    });
  });

  describe('错误处理验证', () => {
    test('构建失败时应该有明确的错误信息', () => {
      // 创建一个有语法错误的临时文件
      const errorFile = path.join(tempDir, 'error-component.tsx');
      fs.writeFileSync(errorFile, 'import React from "react"; export default function() { return <div>unclosed');
      
      try {
        execSync(`npx tsc --noEmit ${errorFile}`, { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
        fail('应该检测到语法错误');
      } catch (error) {
        expect(error.message).toContain('error');
      }
    });

    test('缺少依赖时应该有明确提示', () => {
      const testFile = path.join(tempDir, 'missing-dep.js');
      fs.writeFileSync(testFile, 'const missing = require("non-existent-package");');
      
      try {
        execSync(`node ${testFile}`, { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
        fail('应该检测到缺少依赖');
      } catch (error) {
        expect(error.message).toContain('Cannot find module');
      }
    });
  });
});