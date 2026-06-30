/**
 * 部署状态检查脚本
 * 验证部署是否成功，检查各组件的可用性
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class DeployStatusChecker {
  constructor() {
    this.deployConfig = this.loadDeployConfig();
    this.checkResults = [];
  }

  /**
   * 加载部署配置
   */
  loadDeployConfig() {
    const configPath = path.join(process.cwd(), 'deploy.config.js');
    if (fs.existsSync(configPath)) {
      return require(configPath);
    }
    throw new Error('部署配置文件不存在');
  }

  /**
   * 执行完整的部署状态检查
   */
  async checkDeploymentStatus() {
    console.log('🔍 开始部署状态检查...');

    try {
      // 获取基础URL
      const baseUrl = this.getBaseUrl();
      console.log(`基础URL: ${baseUrl}`);

      // 检查主应用
      await this.checkMainApp(baseUrl);

      // 检查各组件
      for (const component of this.deployConfig.components) {
        await this.checkComponent(baseUrl, component);
      }

      // 生成检查报告
      await this.generateStatusReport();

      // 输出结果摘要
      this.printSummary();

      return this.checkResults;
    } catch (error) {
      console.error('❌ 部署状态检查失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取基础URL
   */
  getBaseUrl() {
    // 优先使用环境变量
    if (process.env.DEPLOY_BASE_URL) {
      return process.env.DEPLOY_BASE_URL;
    }

    // 从GitHub仓库信息构建URL
    if (process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
      return `https://${owner}.github.io/${repo}`;
    }

    // 使用配置文件中的URL
    const env = process.env.NODE_ENV || 'production';
    if (this.deployConfig.environments && this.deployConfig.environments[env]) {
      return this.deployConfig.environments[env].baseUrl;
    }

    // 默认URL
    return 'https://your-username.github.io/your-repo';
  }

  /**
   * 检查主应用
   */
  async checkMainApp(baseUrl) {
    console.log('🏠 检查主应用...');

    const mainUrl = baseUrl;
    const result = await this.checkUrl(mainUrl, '主应用');

    this.checkResults.push({
      type: 'main-app',
      name: '主应用',
      url: mainUrl,
      ...result,
    });
  }

  /**
   * 检查组件
   */
  async checkComponent(baseUrl, component) {
    console.log(`🧩 检查组件: ${component.name}...`);

    const results = [];

    // 检查SPA版本
    if (component.buildMode === 'spa' || component.buildMode === 'both') {
      const spaUrl = `${baseUrl}${component.deployPath}/`;
      const spaResult = await this.checkUrl(spaUrl, `${component.name} (SPA)`);

      results.push({
        type: 'component-spa',
        name: component.name,
        mode: 'spa',
        url: spaUrl,
        ...spaResult,
      });
    }

    // 检查单文件版本
    if (component.buildMode === 'singlefile' || component.buildMode === 'both') {
      const singleFileUrl = `${baseUrl}${component.deployPath}/${component.name}.html`;
      const singleResult = await this.checkUrl(singleFileUrl, `${component.name} (单文件)`);

      results.push({
        type: 'component-single',
        name: component.name,
        mode: 'singlefile',
        url: singleFileUrl,
        ...singleResult,
      });
    }

    this.checkResults.push(...results);
  }

  /**
   * 检查URL可用性
   */
  async checkUrl(url, name) {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest(url);
      const responseTime = Date.now() - startTime;

      const result = {
        status: 'success',
        statusCode: response.statusCode,
        responseTime,
        contentLength: response.headers['content-length'] || 0,
        contentType: response.headers['content-type'] || 'unknown',
        lastModified: response.headers['last-modified'] || null,
        error: null,
      };

      // 检查响应内容
      if (response.statusCode === 200) {
        const contentCheck = await this.checkContent(response.body, name);
        result.contentCheck = contentCheck;

        if (!contentCheck.isValid) {
          result.status = 'warning';
        }
      } else {
        result.status = 'error';
        result.error = `HTTP ${response.statusCode}`;
      }

      console.log(`  ✅ ${name}: ${result.status} (${responseTime}ms)`);
      return result;
    } catch (error) {
      console.log(`  ❌ ${name}: 失败 - ${error.message}`);
      return {
        status: 'error',
        statusCode: null,
        responseTime: null,
        contentLength: 0,
        contentType: null,
        lastModified: null,
        error: error.message,
        contentCheck: { isValid: false, issues: [error.message] },
      };
    }
  }

  /**
   * 发起HTTP请求
   */
  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Deploy-Status-Checker/1.0',
        },
      };

      const req = client.request(options, res => {
        let body = '';

        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });

      req.end();
    });
  }

  /**
   * 检查响应内容
   */
  async checkContent(body, name) {
    const issues = [];
    let isValid = true;

    // 基础HTML检查
    if (!body.includes('<!DOCTYPE html>') && !body.includes('<html')) {
      issues.push('不是有效的HTML文档');
      isValid = false;
    }

    // 检查是否包含错误信息
    const errorPatterns = [
      /404.*not found/i,
      /500.*internal server error/i,
      /error.*occurred/i,
      /something went wrong/i,
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(body)) {
        issues.push(`检测到错误信息: ${pattern.source}`);
        isValid = false;
      }
    }

    // 检查内容长度
    if (body.length < 100) {
      issues.push('内容过短，可能不完整');
      isValid = false;
    }

    // 组件特定检查
    if (name.includes('长截图分割工具')) {
      if (!body.includes('截图') && !body.includes('分割')) {
        issues.push('未找到预期的组件内容');
        isValid = false;
      }
    }

    return { isValid, issues };
  }

  /**
   * 生成状态报告
   */
  async generateStatusReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.getBaseUrl(),
      totalChecks: this.checkResults.length,
      successCount: this.checkResults.filter(r => r.status === 'success').length,
      warningCount: this.checkResults.filter(r => r.status === 'warning').length,
      errorCount: this.checkResults.filter(r => r.status === 'error').length,
      averageResponseTime: this.calculateAverageResponseTime(),
      results: this.checkResults,
      summary: this.generateSummary(),
    };

    // 保存报告
    const reportPath = path.join(process.cwd(), 'dist', 'deploy-status-report.json');
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 状态报告已保存到: ${reportPath}`);

    return report;
  }

  /**
   * 计算平均响应时间
   */
  calculateAverageResponseTime() {
    const validTimes = this.checkResults
      .filter(r => r.responseTime !== null)
      .map(r => r.responseTime);

    if (validTimes.length === 0) return 0;

    return Math.round(validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length);
  }

  /**
   * 生成摘要
   */
  generateSummary() {
    const summary = {
      overallStatus: 'success',
      mainAppStatus: null,
      componentStatuses: {},
      recommendations: [],
    };

    // 检查主应用状态
    const mainAppResult = this.checkResults.find(r => r.type === 'main-app');
    if (mainAppResult) {
      summary.mainAppStatus = mainAppResult.status;
      if (mainAppResult.status !== 'success') {
        summary.overallStatus = 'warning';
      }
    }

    // 检查组件状态
    const componentResults = this.checkResults.filter(r => r.type.startsWith('component-'));
    const componentNames = [...new Set(componentResults.map(r => r.name))];

    for (const componentName of componentNames) {
      const componentResults = this.checkResults.filter(r => r.name === componentName);
      const hasError = componentResults.some(r => r.status === 'error');
      const hasWarning = componentResults.some(r => r.status === 'warning');

      if (hasError) {
        summary.componentStatuses[componentName] = 'error';
        summary.overallStatus = 'error';
      } else if (hasWarning) {
        summary.componentStatuses[componentName] = 'warning';
        if (summary.overallStatus === 'success') {
          summary.overallStatus = 'warning';
        }
      } else {
        summary.componentStatuses[componentName] = 'success';
      }
    }

    // 生成建议
    if (summary.overallStatus === 'error') {
      summary.recommendations.push('存在严重错误，需要立即修复');
    } else if (summary.overallStatus === 'warning') {
      summary.recommendations.push('存在警告，建议检查和优化');
    } else {
      summary.recommendations.push('所有检查通过，部署状态良好');
    }

    // 性能建议
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > 3000) {
      summary.recommendations.push('响应时间较慢，建议优化性能');
    } else if (avgResponseTime > 1000) {
      summary.recommendations.push('响应时间可以进一步优化');
    }

    return summary;
  }

  /**
   * 打印结果摘要
   */
  printSummary() {
    console.log('\n📊 部署状态检查摘要:');
    console.log('='.repeat(50));

    const summary = this.generateSummary();

    // 总体状态
    const statusIcon = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    console.log(
      `总体状态: ${statusIcon[summary.overallStatus]} ${summary.overallStatus.toUpperCase()}`
    );

    // 统计信息
    const total = this.checkResults.length;
    const success = this.checkResults.filter(r => r.status === 'success').length;
    const warning = this.checkResults.filter(r => r.status === 'warning').length;
    const error = this.checkResults.filter(r => r.status === 'error').length;

    console.log(`检查项目: ${total} 个`);
    console.log(`成功: ${success} 个 | 警告: ${warning} 个 | 错误: ${error} 个`);
    console.log(`平均响应时间: ${this.calculateAverageResponseTime()}ms`);

    // 详细结果
    console.log('\n详细结果:');
    this.checkResults.forEach(result => {
      const icon = statusIcon[result.status];
      const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
      console.log(`  ${icon} ${result.name} (${time})`);

      if (result.error) {
        console.log(`    错误: ${result.error}`);
      }

      if (result.contentCheck && result.contentCheck.issues.length > 0) {
        result.contentCheck.issues.forEach(issue => {
          console.log(`    问题: ${issue}`);
        });
      }
    });

    // 建议
    if (summary.recommendations.length > 0) {
      console.log('\n💡 建议:');
      summary.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    console.log('='.repeat(50));
  }
}

// 命令行接口
if (require.main === module) {
  const checker = new DeployStatusChecker();

  checker
    .checkDeploymentStatus()
    .then(results => {
      const hasErrors = results.some(r => r.status === 'error');
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      console.error('检查失败:', error);
      process.exit(1);
    });
}

module.exports = DeployStatusChecker;
