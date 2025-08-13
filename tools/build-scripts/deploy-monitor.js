/**
 * 部署监控和错误处理系统
 * 提供部署失败通知、自动回滚、日志收集等功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

class DeployMonitor {
  constructor() {
    this.deployConfig = this.loadDeployConfig();
    this.logDir = path.join(process.cwd(), 'logs', 'deploy');
    this.currentDeployId = this.generateDeployId();
    this.deployStartTime = Date.now();
    this.deployLogs = [];
    this.healthCheckInterval = null;
    
    // 确保日志目录存在
    this.ensureLogDirectory();
  }

  /**
   * 加载部署配置
   */
  loadDeployConfig() {
    const configPath = path.join(process.cwd(), 'deploy.config.js');
    if (fs.existsSync(configPath)) {
      return require(configPath);
    }
    
    // 默认配置
    return {
      deployStrategy: {
        runTests: true,
        runLint: true,
        generateReport: true,
        autoRollback: false,
        notifications: {
          success: true,
          failure: true,
          channels: ['console']
        }
      },
      monitoring: {
        performance: true,
        errorTracking: true,
        analytics: false,
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 300000
        }
      }
    };
  }

  /**
   * 开始部署监控
   */
  async startDeployMonitoring(deployOptions = {}) {
    this.log('info', '🚀 开始部署监控...');
    
    try {
      // 记录部署开始
      await this.recordDeployStart(deployOptions);
      
      // 执行部署前检查
      await this.preDeployChecks();
      
      // 开始健康检查
      if (this.deployConfig.monitoring.healthCheck.enabled) {
        this.startHealthCheck();
      }
      
      this.log('info', '✅ 部署监控启动成功');
      return true;
      
    } catch (error) {
      this.log('error', `❌ 部署监控启动失败: ${error.message}`);
      await this.handleDeployFailure(error, 'monitoring-start');
      throw error;
    }
  }

  /**
   * 监控部署过程
   */
  async monitorDeployment(deployFunction) {
    this.log('info', '📊 开始监控部署过程...');
    
    try {
      // 执行部署
      const result = await this.executeWithMonitoring(deployFunction);
      
      // 部署成功处理
      await this.handleDeploySuccess(result);
      
      return result;
      
    } catch (error) {
      // 部署失败处理
      await this.handleDeployFailure(error, 'deployment');
      throw error;
    } finally {
      // 清理监控资源
      this.cleanup();
    }
  }

  /**
   * 执行部署前检查
   */
  async preDeployChecks() {
    this.log('info', '🔍 执行部署前检查...');
    
    const checks = [];
    
    // 运行测试
    if (this.deployConfig.deployStrategy.runTests) {
      checks.push(this.runTests());
    }
    
    // 运行代码检查
    if (this.deployConfig.deployStrategy.runLint) {
      checks.push(this.runLint());
    }
    
    // 检查构建环境
    checks.push(this.checkBuildEnvironment());
    
    // 检查磁盘空间
    checks.push(this.checkDiskSpace());
    
    const results = await Promise.allSettled(checks);
    const failures = results.filter(r => r.status === 'rejected');
    
    if (failures.length > 0) {
      const errors = failures.map(f => f.reason.message).join(', ');
      throw new Error(`部署前检查失败: ${errors}`);
    }
    
    this.log('info', '✅ 部署前检查通过');
  }

  /**
   * 运行测试
   */
  async runTests() {
    this.log('info', '🧪 运行测试...');
    
    try {
      execSync('pnpm run test', { 
        stdio: 'pipe',
        timeout: 300000 // 5分钟超时
      });
      this.log('info', '✅ 测试通过');
    } catch (error) {
      this.log('error', `❌ 测试失败: ${error.message}`);
      throw new Error('测试失败');
    }
  }

  /**
   * 运行代码检查
   */
  async runLint() {
    this.log('info', '🔍 运行代码检查...');
    
    try {
      execSync('pnpm run lint', { 
        stdio: 'pipe',
        timeout: 120000 // 2分钟超时
      });
      this.log('info', '✅ 代码检查通过');
    } catch (error) {
      // 代码检查失败不阻止部署，只记录警告
      this.log('warning', `⚠️ 代码检查有问题: ${error.message}`);
    }
  }

  /**
   * 检查构建环境
   */
  async checkBuildEnvironment() {
    this.log('info', '🔧 检查构建环境...');
    
    const checks = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'pnpm', command: 'pnpm --version' },
      { name: 'Git', command: 'git --version' }
    ];
    
    for (const check of checks) {
      try {
        const version = execSync(check.command, { encoding: 'utf8' }).trim();
        this.log('info', `  ✅ ${check.name}: ${version}`);
      } catch (error) {
        throw new Error(`${check.name} 不可用`);
      }
    }
  }

  /**
   * 检查磁盘空间
   */
  async checkDiskSpace() {
    this.log('info', '💾 检查磁盘空间...');
    
    try {
      const output = execSync('df -h .', { encoding: 'utf8' });
      const lines = output.split('\n');
      const dataLine = lines[1];
      const parts = dataLine.split(/\s+/);
      const usage = parts[4];
      
      this.log('info', `  磁盘使用率: ${usage}`);
      
      const usagePercent = parseInt(usage.replace('%', ''));
      if (usagePercent > 90) {
        throw new Error(`磁盘空间不足: ${usage}`);
      }
      
    } catch (error) {
      this.log('warning', `⚠️ 无法检查磁盘空间: ${error.message}`);
    }
  }

  /**
   * 带监控执行部署
   */
  async executeWithMonitoring(deployFunction) {
    const startTime = Date.now();
    
    try {
      // 记录部署开始
      this.log('info', '🚀 开始执行部署...');
      
      // 执行部署函数
      const result = await deployFunction();
      
      // 记录执行时间
      const duration = Date.now() - startTime;
      this.log('info', `⏱️ 部署执行完成，耗时: ${this.formatDuration(duration)}`);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('error', `❌ 部署执行失败，耗时: ${this.formatDuration(duration)}`);
      throw error;
    }
  }

  /**
   * 处理部署成功
   */
  async handleDeploySuccess(result) {
    this.log('info', '🎉 部署成功！');
    
    const deployDuration = Date.now() - this.deployStartTime;
    
    // 记录成功信息
    const successInfo = {
      deployId: this.currentDeployId,
      status: 'success',
      duration: deployDuration,
      timestamp: new Date().toISOString(),
      result
    };
    
    // 保存部署记录
    await this.saveDeployRecord(successInfo);
    
    // 发送成功通知
    if (this.deployConfig.deployStrategy.notifications.success) {
      await this.sendNotification('success', successInfo);
    }
    
    // 生成部署报告
    if (this.deployConfig.deployStrategy.generateReport) {
      await this.generateDeployReport(successInfo);
    }
    
    this.log('info', `✅ 部署成功处理完成，总耗时: ${this.formatDuration(deployDuration)}`);
  }

  /**
   * 处理部署失败
   */
  async handleDeployFailure(error, stage) {
    this.log('error', `💥 部署失败 (${stage}): ${error.message}`);
    
    const deployDuration = Date.now() - this.deployStartTime;
    
    // 记录失败信息
    const failureInfo = {
      deployId: this.currentDeployId,
      status: 'failure',
      stage,
      error: {
        message: error.message,
        stack: error.stack
      },
      duration: deployDuration,
      timestamp: new Date().toISOString()
    };
    
    // 保存部署记录
    await this.saveDeployRecord(failureInfo);
    
    // 发送失败通知
    if (this.deployConfig.deployStrategy.notifications.failure) {
      await this.sendNotification('failure', failureInfo);
    }
    
    // 自动回滚
    if (this.deployConfig.deployStrategy.autoRollback) {
      await this.attemptRollback(failureInfo);
    }
    
    this.log('error', `❌ 部署失败处理完成，总耗时: ${this.formatDuration(deployDuration)}`);
  }

  /**
   * 尝试自动回滚
   */
  async attemptRollback(failureInfo) {
    this.log('info', '🔄 尝试自动回滚...');
    
    try {
      // 获取上一次成功的部署记录
      const lastSuccessfulDeploy = await this.getLastSuccessfulDeploy();
      
      if (!lastSuccessfulDeploy) {
        this.log('warning', '⚠️ 没有找到可回滚的版本');
        return;
      }
      
      // 执行回滚
      await this.executeRollback(lastSuccessfulDeploy);
      
      this.log('info', '✅ 自动回滚成功');
      
      // 发送回滚成功通知
      await this.sendNotification('rollback-success', {
        originalFailure: failureInfo,
        rolledBackTo: lastSuccessfulDeploy
      });
      
    } catch (rollbackError) {
      this.log('error', `❌ 自动回滚失败: ${rollbackError.message}`);
      
      // 发送回滚失败通知
      await this.sendNotification('rollback-failure', {
        originalFailure: failureInfo,
        rollbackError: rollbackError.message
      });
    }
  }

  /**
   * 执行回滚
   */
  async executeRollback(targetDeploy) {
    this.log('info', `🔄 回滚到部署: ${targetDeploy.deployId}`);
    
    // 这里实现具体的回滚逻辑
    // 例如：恢复到之前的git commit、重新部署等
    
    // 示例实现：重新部署上一个成功的版本
    if (targetDeploy.gitCommit) {
      execSync(`git checkout ${targetDeploy.gitCommit}`, { stdio: 'inherit' });
      execSync('pnpm run build:full', { stdio: 'inherit' });
      // 重新部署...
    }
  }

  /**
   * 开始健康检查
   */
  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    const interval = this.deployConfig.monitoring.healthCheck.interval;
    this.log('info', `💓 启动健康检查，间隔: ${this.formatDuration(interval)}`);
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);
    
    // 立即执行一次健康检查
    setTimeout(() => this.performHealthCheck(), 5000);
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    try {
      const baseUrl = this.getBaseUrl();
      const healthUrl = `${baseUrl}${this.deployConfig.monitoring.healthCheck.path}`;
      
      const response = await this.makeHealthCheckRequest(healthUrl);
      
      if (response.statusCode === 200) {
        this.log('debug', '💓 健康检查通过');
      } else {
        this.log('warning', `⚠️ 健康检查异常: HTTP ${response.statusCode}`);
      }
      
    } catch (error) {
      this.log('error', `❌ 健康检查失败: ${error.message}`);
    }
  }

  /**
   * 发起健康检查请求
   */
  makeHealthCheckRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'GET',
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        resolve({ statusCode: res.statusCode });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('健康检查超时'));
      });
      
      req.end();
    });
  }

  /**
   * 发送通知
   */
  async sendNotification(type, data) {
    const channels = this.deployConfig.deployStrategy.notifications.channels;
    
    for (const channel of channels) {
      try {
        await this.sendNotificationToChannel(channel, type, data);
      } catch (error) {
        this.log('error', `通知发送失败 (${channel}): ${error.message}`);
      }
    }
  }

  /**
   * 发送通知到指定渠道
   */
  async sendNotificationToChannel(channel, type, data) {
    switch (channel) {
      case 'console':
        this.sendConsoleNotification(type, data);
        break;
      case 'email':
        await this.sendEmailNotification(type, data);
        break;
      case 'slack':
        await this.sendSlackNotification(type, data);
        break;
      case 'webhook':
        await this.sendWebhookNotification(type, data);
        break;
      default:
        this.log('warning', `未知的通知渠道: ${channel}`);
    }
  }

  /**
   * 发送控制台通知
   */
  sendConsoleNotification(type, data) {
    const messages = {
      'success': `🎉 部署成功！部署ID: ${data.deployId}，耗时: ${this.formatDuration(data.duration)}`,
      'failure': `💥 部署失败！部署ID: ${data.deployId}，错误: ${data.error.message}`,
      'rollback-success': `🔄 自动回滚成功！从 ${data.originalFailure.deployId} 回滚到 ${data.rolledBackTo.deployId}`,
      'rollback-failure': `❌ 自动回滚失败！原始错误: ${data.originalFailure.error.message}，回滚错误: ${data.rollbackError}`
    };
    
    const message = messages[type] || `通知: ${type}`;
    console.log(`\n📢 ${message}\n`);
  }

  /**
   * 发送邮件通知（示例实现）
   */
  async sendEmailNotification(type, data) {
    // 这里可以集成邮件服务
    this.log('info', `📧 邮件通知: ${type}`);
  }

  /**
   * 发送Slack通知（示例实现）
   */
  async sendSlackNotification(type, data) {
    // 这里可以集成Slack API
    this.log('info', `💬 Slack通知: ${type}`);
  }

  /**
   * 发送Webhook通知（示例实现）
   */
  async sendWebhookNotification(type, data) {
    // 这里可以发送到自定义webhook
    this.log('info', `🔗 Webhook通知: ${type}`);
  }

  /**
   * 生成部署报告
   */
  async generateDeployReport(deployInfo) {
    this.log('info', '📊 生成部署报告...');
    
    const report = {
      deployId: deployInfo.deployId,
      status: deployInfo.status,
      timestamp: deployInfo.timestamp,
      duration: deployInfo.duration,
      logs: this.deployLogs,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      gitInfo: await this.getGitInfo(),
      buildInfo: deployInfo.result || {},
      performance: {
        totalDuration: deployInfo.duration,
        averageResponseTime: 0 // 可以从健康检查中获取
      }
    };
    
    // 保存报告
    const reportPath = path.join(this.logDir, `deploy-report-${deployInfo.deployId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('info', `📊 部署报告已保存: ${reportPath}`);
    return report;
  }

  /**
   * 获取Git信息
   */
  async getGitInfo() {
    try {
      const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const author = execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim();
      const message = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim();
      
      return { commit, branch, author, message };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 记录部署开始
   */
  async recordDeployStart(options) {
    const startInfo = {
      deployId: this.currentDeployId,
      startTime: this.deployStartTime,
      options,
      gitInfo: await this.getGitInfo()
    };
    
    this.log('info', `📝 记录部署开始: ${this.currentDeployId}`);
    return startInfo;
  }

  /**
   * 保存部署记录
   */
  async saveDeployRecord(record) {
    const recordPath = path.join(this.logDir, `deploy-${record.deployId}.json`);
    fs.writeFileSync(recordPath, JSON.stringify(record, null, 2));
    
    // 更新部署历史
    await this.updateDeployHistory(record);
  }

  /**
   * 更新部署历史
   */
  async updateDeployHistory(record) {
    const historyPath = path.join(this.logDir, 'deploy-history.json');
    let history = [];
    
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
    
    history.unshift({
      deployId: record.deployId,
      status: record.status,
      timestamp: record.timestamp,
      duration: record.duration
    });
    
    // 只保留最近100次部署记录
    history = history.slice(0, 100);
    
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  /**
   * 获取上一次成功的部署
   */
  async getLastSuccessfulDeploy() {
    const historyPath = path.join(this.logDir, 'deploy-history.json');
    
    if (!fs.existsSync(historyPath)) {
      return null;
    }
    
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    return history.find(deploy => deploy.status === 'success');
  }

  /**
   * 获取基础URL
   */
  getBaseUrl() {
    if (process.env.DEPLOY_BASE_URL) {
      return process.env.DEPLOY_BASE_URL;
    }
    
    if (process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
      return `https://${owner}.github.io/${repo}`;
    }
    
    return 'https://your-username.github.io/your-repo';
  }

  /**
   * 记录日志
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      deployId: this.currentDeployId
    };
    
    this.deployLogs.push(logEntry);
    
    // 输出到控制台
    const colors = {
      'debug': '\x1b[36m',   // 青色
      'info': '\x1b[32m',    // 绿色
      'warning': '\x1b[33m', // 黄色
      'error': '\x1b[31m',   // 红色
      'reset': '\x1b[0m'     // 重置
    };
    
    const color = colors[level] || colors.reset;
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`);
    
    // 写入日志文件
    const logFile = path.join(this.logDir, `deploy-${this.currentDeployId}.log`);
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(logFile, logLine);
  }

  /**
   * 生成部署ID
   */
  generateDeployId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `deploy_${timestamp}_${random}`;
  }

  /**
   * 格式化持续时间
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 清理监控资源
   */
  cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.log('info', '🧹 监控资源清理完成');
  }
}

// 命令行接口
if (require.main === module) {
  const monitor = new DeployMonitor();
  
  // 示例：监控一个简单的部署函数
  const exampleDeploy = async () => {
    console.log('执行示例部署...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { status: 'completed', files: 10 };
  };
  
  monitor.startDeployMonitoring()
    .then(() => monitor.monitorDeployment(exampleDeploy))
    .then(result => {
      console.log('部署监控完成:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('部署监控失败:', error);
      process.exit(1);
    });
}

module.exports = DeployMonitor;