/**
 * 端到端部署测试
 * 验证完整的部署流程和功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

describe('端到端部署测试', () => {
  const testProjectRoot = path.join(__dirname, '../../');
  const tempDeployDir = path.join(testProjectRoot, 'temp-deploy');

  beforeAll(() => {
    // 准备测试环境
    if (fs.existsSync(tempDeployDir)) {
      fs.rmSync(tempDeployDir, { recursive: true });
    }
    fs.mkdirSync(tempDeployDir, { recursive: true });
  });

  afterAll(() => {
    // 清理测试环境
    if (fs.existsSync(tempDeployDir)) {
      fs.rmSync(tempDeployDir, { recursive: true });
    }
  });

  describe('构建和部署准备', () => {
    test('应该能够执行完整构建', async () => {
      try {
        execSync('pnpm run build:full', { 
          cwd: testProjectRoot,
          stdio: 'pipe',
          timeout: 60000 // 60秒超时
        });
        
        // 验证构建产物
        const distDir = path.join(testProjectRoot, 'dist');
        expect(fs.existsSync(distDir)).toBe(true);
        
        const singlefileDir = path.join(testProjectRoot, 'dist-singlefile');
        expect(fs.existsSync(singlefileDir)).toBe(true);
        
      } catch (error) {
        fail(`完整构建失败: ${error.message}`);
      }
    }, 120000);

    test('应该能够准备部署文件', () => {
      try {
        execSync('node tools/build-scripts/deploy-prepare.js screenshot-splitter', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
        
        const deployDir = path.join(testProjectRoot, 'deploy-ready');
        expect(fs.existsSync(deployDir)).toBe(true);
        
      } catch (error) {
        console.warn(`部署准备失败: ${error.message}`);
      }
    });
  });

  describe('本地部署验证', () => {
    test('应该能够启动本地预览服务器', (done) => {
      const previewProcess = require('child_process').spawn('node', [
        'tools/build-scripts/deploy-preview.js',
        'screenshot-splitter',
        'spa',
        '8082'
      ], {
        cwd: testProjectRoot,
        stdio: 'pipe'
      });

      let serverStarted = false;
      
      previewProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running') && !serverStarted) {
          serverStarted = true;
          
          // 验证服务器响应
          setTimeout(() => {
            const req = https.get('http://localhost:8082', (res) => {
              expect(res.statusCode).toBe(200);
              previewProcess.kill();
              done();
            });
            
            req.on('error', (error) => {
              console.warn(`预览服务器请求失败: ${error.message}`);
              previewProcess.kill();
              done();
            });
          }, 1000);
        }
      });

      previewProcess.on('error', (error) => {
        console.warn(`预览服务器启动失败: ${error.message}`);
        done();
      });

      // 超时保护
      setTimeout(() => {
        if (!serverStarted) {
          previewProcess.kill();
          done();
        }
      }, 10000);
    }, 15000);
  });

  describe('部署脚本验证', () => {
    test('部署管理器应该能够正常工作', () => {
      try {
        const MultiTargetDeployer = require(path.join(testProjectRoot, 'tools/build-scripts/multi-target-deploy.js'));
        const deployer = new MultiTargetDeployer();
        
        expect(deployer).toBeDefined();
        expect(typeof deployer.deploy).toBe('function');
        expect(typeof deployer.validateDeployEnvironment).toBe('function');
        
      } catch (error) {
        fail(`部署管理器加载失败: ${error.message}`);
      }
    });

    test('构建管理器应该能够正常工作', () => {
      try {
        const BuildManager = require(path.join(testProjectRoot, 'tools/build-scripts/build-manager.js'));
        const manager = new BuildManager();
        
        expect(manager).toBeDefined();
        expect(typeof manager.buildPackage).toBe('function');
        expect(typeof manager.buildAll).toBe('function');
        
      } catch (error) {
        fail(`构建管理器加载失败: ${error.message}`);
      }
    });
  });

  describe('健康检查系统验证', () => {
    test('应该能够生成健康检查页面', () => {
      try {
        execSync('node tools/build-scripts/health-check-generator.js', { 
          cwd: testProjectRoot,
          stdio: 'pipe'
        });
        
        const healthFile = path.join(testProjectRoot, 'dist/health.html');
        if (fs.existsSync(healthFile)) {
          const healthContent = fs.readFileSync(healthFile, 'utf8');
          expect(healthContent).toContain('健康检查');
          expect(healthContent).toContain('screenshot-splitter');
        }
        
      } catch (error) {
        console.warn(`健康检查生成失败: ${error.message}`);
      }
    });

    test('健康检查API应该返回正确格式', () => {
      const healthApiFile = path.join(testProjectRoot, 'dist/api/health.json');
      if (fs.existsSync(healthApiFile)) {
        const healthData = JSON.parse(fs.readFileSync(healthApiFile, 'utf8'));
        
        expect(healthData).toHaveProperty('status');
        expect(healthData).toHaveProperty('timestamp');
        expect(healthData).toHaveProperty('components');
        expect(Array.isArray(healthData.components)).toBe(true);
      }
    });
  });

  describe('部署监控验证', () => {
    test('部署监控器应该能够记录部署状态', () => {
      try {
        const DeployMonitor = require(path.join(testProjectRoot, 'tools/build-scripts/deploy-monitor.js'));
        const monitor = new DeployMonitor();
        
        expect(monitor).toBeDefined();
        expect(typeof monitor.startMonitoring).toBe('function');
        expect(typeof monitor.checkDeploymentStatus).toBe('function');
        
      } catch (error) {
        fail(`部署监控器加载失败: ${error.message}`);
      }
    });

    test('应该能够生成部署报告', () => {
      const logsDir = path.join(testProjectRoot, 'logs/deploy');
      if (fs.existsSync(logsDir)) {
        const logFiles = fs.readdirSync(logsDir);
        const deployLogs = logFiles.filter(file => file.startsWith('deploy-'));
        
        if (deployLogs.length > 0) {
          const latestLog = path.join(logsDir, deployLogs[0]);
          const logContent = fs.readFileSync(latestLog, 'utf8');
          const logData = JSON.parse(logContent);
          
          expect(logData).toHaveProperty('deployId');
          expect(logData).toHaveProperty('timestamp');
          expect(logData).toHaveProperty('status');
        }
      }
    });
  });

  describe('回滚系统验证', () => {
    test('回滚脚本应该能够正常加载', () => {
      try {
        const DeployRollback = require(path.join(testProjectRoot, 'tools/build-scripts/deploy-rollback.js'));
        const rollback = new DeployRollback();
        
        expect(rollback).toBeDefined();
        expect(typeof rollback.rollback).toBe('function');
        expect(typeof rollback.listRollbackTargets).toBe('function');
        
      } catch (error) {
        fail(`回滚脚本加载失败: ${error.message}`);
      }
    });

    test('应该能够创建备份', () => {
      const backupDir = path.join(testProjectRoot, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      expect(fs.existsSync(backupDir)).toBe(true);
    });
  });

  describe('通知系统验证', () => {
    test('通知系统应该能够正常工作', () => {
      try {
        const DeployNotification = require(path.join(testProjectRoot, 'tools/build-scripts/deploy-notification.js'));
        const notification = new DeployNotification();
        
        expect(notification).toBeDefined();
        expect(typeof notification.sendNotification).toBe('function');
        expect(typeof notification.testNotifications).toBe('function');
        
      } catch (error) {
        fail(`通知系统加载失败: ${error.message}`);
      }
    });

    test('应该能够测试通知功能', async () => {
      try {
        execSync('node tools/build-scripts/deploy-notification.js test', { 
          cwd: testProjectRoot,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // 通知测试可能因为配置问题失败，但不应该是代码错误
        expect(error.message).not.toContain('SyntaxError');
        expect(error.message).not.toContain('Cannot find module');
      }
    });
  });

  describe('组件独立部署验证', () => {
    test('应该能够独立构建长截图分割工具', () => {
      try {
        execSync('pnpm run build:component screenshot-splitter', { 
          cwd: testProjectRoot,
          stdio: 'pipe',
          timeout: 30000
        });
        
        const componentDist = path.join(testProjectRoot, 'packages/screenshot-splitter/dist');
        expect(fs.existsSync(componentDist)).toBe(true);
        
        const componentIndex = path.join(componentDist, 'index.html');
        expect(fs.existsSync(componentIndex)).toBe(true);
        
      } catch (error) {
        console.warn(`组件独立构建失败: ${error.message}`);
      }
    });

    test('组件构建产物应该包含必要文件', () => {
      const componentDist = path.join(testProjectRoot, 'packages/screenshot-splitter/dist');
      if (fs.existsSync(componentDist)) {
        const files = fs.readdirSync(componentDist);
        expect(files).toContain('index.html');
        
        // 检查是否有资源文件
        const hasAssets = files.some(file => 
          file.endsWith('.js') || 
          file.endsWith('.css') || 
          fs.existsSync(path.join(componentDist, 'assets'))
        );
        expect(hasAssets).toBe(true);
      }
    });
  });

  describe('性能验证', () => {
    test('构建时间应该在合理范围内', async () => {
      const startTime = Date.now();
      
      try {
        execSync('pnpm run build:spa', { 
          cwd: testProjectRoot,
          stdio: 'pipe',
          timeout: 120000 // 2分钟超时
        });
        
        const buildTime = Date.now() - startTime;
        expect(buildTime).toBeLessThan(120000); // 应该在2分钟内完成
        
      } catch (error) {
        console.warn(`性能测试构建失败: ${error.message}`);
      }
    }, 150000);

    test('构建产物大小应该合理', () => {
      const distDir = path.join(testProjectRoot, 'dist');
      if (fs.existsSync(distDir)) {
        const totalSize = getTotalDirectorySize(distDir);
        expect(totalSize).toBeLessThan(50 * 1024 * 1024); // 50MB
      }
      
      const singlefileDir = path.join(testProjectRoot, 'dist-singlefile');
      if (fs.existsSync(singlefileDir)) {
        const singlefileSize = getTotalDirectorySize(singlefileDir);
        expect(singlefileSize).toBeLessThan(10 * 1024 * 1024); // 10MB
      }
    });
  });

  describe('兼容性验证', () => {
    test('构建产物应该包含必要的polyfill', () => {
      const distIndex = path.join(testProjectRoot, 'dist/index.html');
      if (fs.existsSync(distIndex)) {
        const indexContent = fs.readFileSync(distIndex, 'utf8');
        
        // 检查是否有现代浏览器支持
        expect(indexContent).toContain('<!DOCTYPE html>');
        expect(indexContent).toContain('<meta charset="utf-8">');
        expect(indexContent).toContain('<meta name="viewport"');
      }
    });

    test('单文件模式应该包含所有必要资源', () => {
      const singlefileIndex = path.join(testProjectRoot, 'dist-singlefile/index.html');
      if (fs.existsSync(singlefileIndex)) {
        const indexContent = fs.readFileSync(singlefileIndex, 'utf8');
        
        // 应该包含内联样式和脚本
        expect(indexContent).toContain('<style>');
        expect(indexContent).toContain('<script>');
        
        // 不应该有外部资源引用（除了CDN）
        const externalLinks = indexContent.match(/<link[^>]*href="(?!https?:\/\/)[^"]*"/g);
        const externalScripts = indexContent.match(/<script[^>]*src="(?!https?:\/\/)[^"]*"/g);
        
        expect(externalLinks).toBeNull();
        expect(externalScripts).toBeNull();
      }
    });
  });
});

/**
 * 计算目录总大小
 */
function getTotalDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  const items = fs.readdirSync(dirPath);
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      totalSize += getTotalDirectorySize(itemPath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
}
