/**
 * 部署通知系统
 * 支持多种通知渠道和自定义通知模板
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class DeployNotification {
  constructor() {
    this.config = this.loadNotificationConfig();
    this.logDir = path.join(process.cwd(), 'logs', 'deploy');
    this.ensureDirectories();
  }

  /**
   * 加载通知配置
   */
  loadNotificationConfig() {
    const configPath = path.join(process.cwd(), 'notification.config.js');

    if (fs.existsSync(configPath)) {
      return require(configPath);
    }

    // 默认配置
    return {
      channels: {
        console: { enabled: true },
        webhook: {
          enabled: false,
          url: process.env.WEBHOOK_URL || '',
          secret: process.env.WEBHOOK_SECRET || '',
        },
        email: {
          enabled: false,
          smtp: {
            host: process.env.SMTP_HOST || '',
            port: process.env.SMTP_PORT || 587,
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
          recipients: (process.env.NOTIFICATION_EMAILS || '').split(',').filter(Boolean),
        },
      },
      templates: {
        success: {
          title: '✅ 部署成功',
          color: '#28a745',
        },
        failure: {
          title: '❌ 部署失败',
          color: '#dc3545',
        },
        warning: {
          title: '⚠️ 部署警告',
          color: '#ffc107',
        },
        rollback: {
          title: '🔄 部署回滚',
          color: '#17a2b8',
        },
      },
    };
  }

  /**
   * 发送部署通知
   */
  async sendNotification(type, data) {
    console.log(`📢 发送${type}通知...`);

    try {
      const notification = this.buildNotification(type, data);
      const results = [];

      // 发送到各个通道
      if (this.config.channels.console.enabled) {
        results.push(await this.sendConsoleNotification(notification));
      }

      if (this.config.channels.webhook.enabled) {
        results.push(await this.sendWebhookNotification(notification));
      }

      if (this.config.channels.email.enabled) {
        results.push(await this.sendEmailNotification(notification));
      }

      // 记录通知日志
      await this.logNotification(type, notification, results);

      console.log('✅ 通知发送完成');
      return results;
    } catch (error) {
      console.error('❌ 通知发送失败:', error.message);
      throw error;
    }
  }

  /**
   * 构建通知内容
   */
  buildNotification(type, data) {
    const template = this.config.templates[type] || this.config.templates.success;
    const timestamp = new Date().toISOString();

    const notification = {
      type,
      title: template.title,
      color: template.color,
      timestamp,
      data: {
        ...data,
        environment: process.env.NODE_ENV || 'development',
        branch: this.getCurrentBranch(),
        commit: this.getCurrentCommit(),
      },
    };

    // 根据类型添加特定内容
    switch (type) {
      case 'success':
        notification.message = this.buildSuccessMessage(data);
        break;
      case 'failure':
        notification.message = this.buildFailureMessage(data);
        break;
      case 'warning':
        notification.message = this.buildWarningMessage(data);
        break;
      case 'rollback':
        notification.message = this.buildRollbackMessage(data);
        break;
      default:
        notification.message = this.buildGenericMessage(data);
    }

    return notification;
  }

  /**
   * 构建成功消息
   */
  buildSuccessMessage(data) {
    const { deployId, duration, targets, mode } = data;

    return {
      summary: `部署 ${deployId} 成功完成`,
      details: [
        `🎯 部署目标: ${Array.isArray(targets) ? targets.join(', ') : targets}`,
        `🔧 构建模式: ${mode}`,
        `⏱️ 部署耗时: ${duration}ms`,
        `📅 完成时间: ${new Date().toLocaleString('zh-CN')}`,
      ],
      actions: [
        {
          text: '查看部署状态',
          url: this.getStatusUrl(),
        },
        {
          text: '访问应用',
          url: this.getAppUrl(),
        },
      ],
    };
  }

  /**
   * 构建失败消息
   */
  buildFailureMessage(data) {
    const { deployId, error, stage, duration } = data;

    return {
      summary: `部署 ${deployId} 在 ${stage} 阶段失败`,
      details: [
        `❌ 错误信息: ${error}`,
        `📍 失败阶段: ${stage}`,
        `⏱️ 失败前耗时: ${duration}ms`,
        `📅 失败时间: ${new Date().toLocaleString('zh-CN')}`,
      ],
      actions: [
        {
          text: '查看错误日志',
          url: this.getLogUrl(deployId),
        },
        {
          text: '执行回滚',
          url: this.getRollbackUrl(),
        },
      ],
    };
  }

  /**
   * 构建警告消息
   */
  buildWarningMessage(data) {
    const { deployId, warnings, stage } = data;

    return {
      summary: `部署 ${deployId} 完成但有警告`,
      details: [`⚠️ 警告阶段: ${stage}`, `📋 警告信息:`, ...warnings.map(w => `  • ${w}`)],
      actions: [
        {
          text: '查看详细日志',
          url: this.getLogUrl(deployId),
        },
      ],
    };
  }

  /**
   * 构建回滚消息
   */
  buildRollbackMessage(data) {
    const { rollbackId, targetDeployId, reason } = data;

    return {
      summary: `执行回滚操作 ${rollbackId}`,
      details: [
        `🎯 回滚目标: ${targetDeployId}`,
        `📝 回滚原因: ${reason}`,
        `📅 回滚时间: ${new Date().toLocaleString('zh-CN')}`,
      ],
      actions: [
        {
          text: '查看回滚状态',
          url: this.getStatusUrl(),
        },
      ],
    };
  }

  /**
   * 构建通用消息
   */
  buildGenericMessage(data) {
    return {
      summary: JSON.stringify(data, null, 2),
      details: [],
      actions: [],
    };
  }

  /**
   * 发送控制台通知
   */
  async sendConsoleNotification(notification) {
    console.log('\n' + '='.repeat(60));
    console.log(`${notification.title} - ${notification.timestamp}`);
    console.log('='.repeat(60));
    console.log(notification.message.summary);

    if (notification.message.details.length > 0) {
      console.log('\n详细信息:');
      notification.message.details.forEach(detail => {
        console.log(`  ${detail}`);
      });
    }

    if (notification.message.actions.length > 0) {
      console.log('\n相关链接:');
      notification.message.actions.forEach(action => {
        console.log(`  ${action.text}: ${action.url}`);
      });
    }

    console.log('='.repeat(60) + '\n');

    return { channel: 'console', status: 'success' };
  }

  /**
   * 发送Webhook通知
   */
  async sendWebhookNotification(notification) {
    if (!this.config.channels.webhook.url) {
      return { channel: 'webhook', status: 'skipped', reason: 'No webhook URL configured' };
    }

    try {
      const payload = {
        text: notification.title,
        attachments: [
          {
            color: notification.color,
            title: notification.message.summary,
            fields: notification.message.details.map(detail => ({
              value: detail,
              short: false,
            })),
            actions: notification.message.actions,
            timestamp: notification.timestamp,
          },
        ],
      };

      await this.sendHttpRequest(this.config.channels.webhook.url, payload);

      return { channel: 'webhook', status: 'success' };
    } catch (error) {
      return {
        channel: 'webhook',
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * 发送邮件通知
   */
  async sendEmailNotification(notification) {
    if (!this.config.channels.email.recipients.length) {
      return { channel: 'email', status: 'skipped', reason: 'No recipients configured' };
    }

    try {
      // 这里可以集成实际的邮件发送服务
      // 例如使用 nodemailer 或其他邮件服务
      console.log('📧 邮件通知功能需要配置SMTP服务');

      return { channel: 'email', status: 'pending', reason: 'Email service not configured' };
    } catch (error) {
      return {
        channel: 'email',
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * 发送HTTP请求
   */
  sendHttpRequest(url, data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      const urlObj = new URL(url);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, res => {
        let responseData = '';

        res.on('data', chunk => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 记录通知日志
   */
  async logNotification(type, notification, results) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      notification,
      results,
      success: results.every(r => r.status === 'success' || r.status === 'skipped'),
    };

    const logFile = path.join(this.logDir, 'notifications.json');
    let logs = [];

    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }

    logs.unshift(logEntry);

    // 只保留最近100条通知记录
    logs = logs.slice(0, 100);

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  }

  /**
   * 获取当前Git分支
   */
  getCurrentBranch() {
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 获取当前Git提交
   */
  getCurrentCommit() {
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substr(0, 8);
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 获取状态页面URL
   */
  getStatusUrl() {
    const baseUrl = process.env.DEPLOY_BASE_URL || 'https://your-domain.github.io';
    return `${baseUrl}/health.html`;
  }

  /**
   * 获取应用URL
   */
  getAppUrl() {
    const baseUrl = process.env.DEPLOY_BASE_URL || 'https://your-domain.github.io';
    return baseUrl;
  }

  /**
   * 获取日志URL
   */
  getLogUrl(deployId) {
    const baseUrl = process.env.DEPLOY_BASE_URL || 'https://your-domain.github.io';
    return `${baseUrl}/logs/deploy-${deployId}.json`;
  }

  /**
   * 获取回滚URL
   */
  getRollbackUrl() {
    return 'https://github.com/your-repo/actions'; // GitHub Actions页面
  }

  /**
   * 确保必要目录存在
   */
  ensureDirectories() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 测试通知系统
   */
  async testNotifications() {
    console.log('🧪 测试通知系统...');

    const testData = {
      deployId: 'test_' + Date.now(),
      duration: 5000,
      targets: ['github-pages'],
      mode: 'both',
    };

    try {
      await this.sendNotification('success', testData);
      console.log('✅ 通知系统测试成功');
    } catch (error) {
      console.error('❌ 通知系统测试失败:', error.message);
      throw error;
    }
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const notification = new DeployNotification();

  switch (command) {
    case 'test':
      notification
        .testNotifications()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('测试失败:', error);
          process.exit(1);
        });
      break;

    case 'send':
      const type = args[1] || 'success';
      const data = JSON.parse(args[2] || '{}');

      notification
        .sendNotification(type, data)
        .then(() => process.exit(0))
        .catch(error => {
          console.error('发送失败:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('用法:');
      console.log('  node deploy-notification.js test           # 测试通知系统');
      console.log('  node deploy-notification.js send <type> <data>  # 发送通知');
      console.log('');
      console.log('支持的通知类型: success, failure, warning, rollback');
  }
}

module.exports = DeployNotification;
