/**
 * 部署回滚脚本
 * 提供自动和手动回滚功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeployRollback {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'deploy');
    this.backupDir = path.join(process.cwd(), 'backups');
    this.deployConfig = this.loadDeployConfig();
    
    // 确保目录存在
    this.ensureDirectories();
  }

  /**
   * 加载部署配置
   */
  loadDeployConfig() {
    const configPath = path.join(process.cwd(), 'deploy.config.js');
    if (fs.existsSync(configPath)) {
      return require(configPath);
    }
    return {};
  }

  /**
   * 执行回滚操作
   */
  async rollback(options = {}) {
    const { 
      targetDeployId = null, 
      targetCommit = null, 
      dryRun = false,
      force = false 
    } = options;
    
    console.log('🔄 开始回滚操作...');
    
    try {
      // 获取回滚目标
      const rollbackTarget = await this.determineRollbackTarget(targetDeployId, targetCommit);
      
      if (!rollbackTarget) {
        throw new Error('无法确定回滚目标');
      }
      
      console.log(`回滚目标: ${rollbackTarget.deployId} (${rollbackTarget.commit})`);
      
      // 执行回滚前检查
      if (!force) {
        await this.preRollbackChecks(rollbackTarget);
      }
      
      // 创建当前状态备份
      await this.createBackup();
      
      // 执行回滚
      if (!dryRun) {
        await this.executeRollback(rollbackTarget);
        
        // 验证回滚结果
        await this.verifyRollback(rollbackTarget);
        
        // 记录回滚操作
        await this.recordRollback(rollbackTarget);
        
        console.log('✅ 回滚操作完成');
      } else {
        console.log('🔍 预演模式：回滚操作已模拟完成');
      }
      
      return rollbackTarget;
      
    } catch (error) {
      console.error('❌ 回滚操作失败:', error.message);
      throw error;
    }
  }

  /**
   * 确定回滚目标
   */
  async determineRollbackTarget(targetDeployId, targetCommit) {
    if (targetDeployId) {
      return await this.getDeployById(targetDeployId);
    }
    
    if (targetCommit) {
      return await this.getDeployByCommit(targetCommit);
    }
    
    // 获取最后一次成功的部署
    return await this.getLastSuccessfulDeploy();
  }

  /**
   * 根据部署ID获取部署信息
   */
  async getDeployById(deployId) {
    const deployFile = path.join(this.logDir, `deploy-${deployId}.json`);
    
    if (!fs.existsSync(deployFile)) {
      throw new Error(`部署记录不存在: ${deployId}`);
    }
    
    const deployData = JSON.parse(fs.readFileSync(deployFile, 'utf8'));
    
    if (deployData.status !== 'success') {
      throw new Error(`目标部署状态异常: ${deployData.status}`);
    }
    
    return deployData;
  }

  /**
   * 根据Git提交获取部署信息
   */
  async getDeployByCommit(commit) {
    const historyFile = path.join(this.logDir, 'deploy-history.json');
    
    if (!fs.existsSync(historyFile)) {
      throw new Error('部署历史记录不存在');
    }
    
    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    const deploy = history.find(d => d.gitInfo && d.gitInfo.commit === commit);
    
    if (!deploy) {
      throw new Error(`未找到对应提交的部署记录: ${commit}`);
    }
    
    return await this.getDeployById(deploy.deployId);
  }

  /**
   * 获取最后一次成功的部署
   */
  async getLastSuccessfulDeploy() {
    const historyFile = path.join(this.logDir, 'deploy-history.json');
    
    if (!fs.existsSync(historyFile)) {
      throw new Error('部署历史记录不存在');
    }
    
    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    const successfulDeploy = history.find(d => d.status === 'success');
    
    if (!successfulDeploy) {
      throw new Error('未找到成功的部署记录');
    }
    
    return await this.getDeployById(successfulDeploy.deployId);
  }

  /**
   * 回滚前检查
   */
  async preRollbackChecks(rollbackTarget) {
    console.log('🔍 执行回滚前检查...');
    
    // 检查Git状态
    await this.checkGitStatus();
    
    // 检查工作目录状态
    await this.checkWorkingDirectory();
    
    // 检查目标提交是否存在
    await this.checkTargetCommit(rollbackTarget.gitInfo.commit);
    
    // 检查依赖状态
    await this.checkDependencies();
    
    console.log('✅ 回滚前检查通过');
  }

  /**
   * 检查Git状态
   */
  async checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (status.trim()) {
        console.warn('⚠️ 工作目录有未提交的更改');
        console.log('未提交的文件:');
        console.log(status);
        
        // 可以选择自动暂存或要求用户处理
        const shouldStash = process.env.AUTO_STASH === 'true';
        if (shouldStash) {
          execSync('git stash push -m "Auto stash before rollback"', { stdio: 'inherit' });
          console.log('✅ 已自动暂存未提交的更改');
        }
      }
    } catch (error) {
      throw new Error(`Git状态检查失败: ${error.message}`);
    }
  }

  /**
   * 检查工作目录状态
   */
  async checkWorkingDirectory() {
    const requiredDirs = ['packages', 'tools'];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        throw new Error(`必需的目录不存在: ${dir}`);
      }
    }
  }

  /**
   * 检查目标提交是否存在
   */
  async checkTargetCommit(commit) {
    try {
      execSync(`git cat-file -e ${commit}`, { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`目标提交不存在: ${commit}`);
    }
  }

  /**
   * 检查依赖状态
   */
  async checkDependencies() {
    try {
      execSync('pnpm --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('pnpm 不可用');
    }
  }

  /**
   * 创建当前状态备份
   */
  async createBackup() {
    console.log('💾 创建当前状态备份...');
    
    const backupId = `backup_${Date.now()}`;
    const backupPath = path.join(this.backupDir, backupId);
    
    // 创建备份目录
    fs.mkdirSync(backupPath, { recursive: true });
    
    try {
      // 备份当前Git状态
      const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      
      const backupInfo = {
        backupId,
        timestamp: new Date().toISOString(),
        gitInfo: {
          commit: currentCommit,
          branch: currentBranch
        },
        buildInfo: this.getCurrentBuildInfo()
      };
      
      // 保存备份信息
      fs.writeFileSync(
        path.join(backupPath, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
      );
      
      // 备份构建产物
      const distDir = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distDir)) {
        this.copyDirectory(distDir, path.join(backupPath, 'dist'));
      }
      
      console.log(`✅ 备份创建完成: ${backupId}`);
      return backupInfo;
      
    } catch (error) {
      console.error('❌ 备份创建失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行回滚
   */
  async executeRollback(rollbackTarget) {
    console.log('🔄 执行回滚操作...');
    
    try {
      // 切换到目标提交
      console.log(`切换到提交: ${rollbackTarget.gitInfo.commit}`);
      execSync(`git checkout ${rollbackTarget.gitInfo.commit}`, { stdio: 'inherit' });
      
      // 重新安装依赖
      console.log('📦 重新安装依赖...');
      execSync('pnpm install --frozen-lockfile', { stdio: 'inherit' });
      
      // 重新构建
      console.log('🔨 重新构建项目...');
      execSync('pnpm run build:full', { stdio: 'inherit' });
      
      // 重新部署
      console.log('🚀 重新部署...');
      const MultiTargetDeployer = require('./multi-target-deploy');
      const deployer = new MultiTargetDeployer();
      await deployer.deploy({ target: 'all', mode: 'both' });
      
      console.log('✅ 回滚执行完成');
      
    } catch (error) {
      console.error('❌ 回滚执行失败:', error.message);
      
      // 尝试恢复到原始状态
      await this.restoreFromBackup();
      throw error;
    }
  }

  /**
   * 验证回滚结果
   */
  async verifyRollback(rollbackTarget) {
    console.log('🔍 验证回滚结果...');
    
    try {
      // 验证Git状态
      const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      if (currentCommit !== rollbackTarget.gitInfo.commit) {
        throw new Error('Git提交状态不匹配');
      }
      
      // 验证构建产物
      const distDir = path.join(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) {
        throw new Error('构建产物不存在');
      }
      
      // 验证部署状态
      const DeployStatusChecker = require('./deploy-status-check');
      const checker = new DeployStatusChecker();
      const statusResults = await checker.checkDeploymentStatus();
      
      const hasErrors = statusResults.some(r => r.status === 'error');
      if (hasErrors) {
        console.warn('⚠️ 部分服务状态异常，但回滚已完成');
      }
      
      console.log('✅ 回滚结果验证通过');
      
    } catch (error) {
      console.error('❌ 回滚结果验证失败:', error.message);
      throw error;
    }
  }

  /**
   * 记录回滚操作
   */
  async recordRollback(rollbackTarget) {
    const rollbackRecord = {
      rollbackId: `rollback_${Date.now()}`,
      timestamp: new Date().toISOString(),
      targetDeployId: rollbackTarget.deployId,
      targetCommit: rollbackTarget.gitInfo.commit,
      reason: 'Manual rollback',
      status: 'success'
    };
    
    // 保存回滚记录
    const rollbackFile = path.join(this.logDir, `rollback-${rollbackRecord.rollbackId}.json`);
    fs.writeFileSync(rollbackFile, JSON.stringify(rollbackRecord, null, 2));
    
    // 更新回滚历史
    await this.updateRollbackHistory(rollbackRecord);
    
    console.log(`📝 回滚记录已保存: ${rollbackRecord.rollbackId}`);
  }

  /**
   * 更新回滚历史
   */
  async updateRollbackHistory(rollbackRecord) {
    const historyFile = path.join(this.logDir, 'rollback-history.json');
    let history = [];
    
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
    
    history.unshift(rollbackRecord);
    
    // 只保留最近50次回滚记录
    history = history.slice(0, 50);
    
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  }

  /**
   * 从备份恢复
   */
  async restoreFromBackup() {
    console.log('🔄 尝试从备份恢复...');
    
    try {
      // 获取最新的备份
      const backups = fs.readdirSync(this.backupDir)
        .filter(name => name.startsWith('backup_'))
        .sort()
        .reverse();
      
      if (backups.length === 0) {
        throw new Error('没有可用的备份');
      }
      
      const latestBackup = backups[0];
      const backupPath = path.join(this.backupDir, latestBackup);
      const backupInfoFile = path.join(backupPath, 'backup-info.json');
      
      if (!fs.existsSync(backupInfoFile)) {
        throw new Error('备份信息文件不存在');
      }
      
      const backupInfo = JSON.parse(fs.readFileSync(backupInfoFile, 'utf8'));
      
      // 恢复Git状态
      execSync(`git checkout ${backupInfo.gitInfo.commit}`, { stdio: 'inherit' });
      
      // 恢复构建产物
      const backupDistDir = path.join(backupPath, 'dist');
      const currentDistDir = path.join(process.cwd(), 'dist');
      
      if (fs.existsSync(backupDistDir)) {
        if (fs.existsSync(currentDistDir)) {
          fs.rmSync(currentDistDir, { recursive: true });
        }
        this.copyDirectory(backupDistDir, currentDistDir);
      }
      
      console.log('✅ 从备份恢复成功');
      
    } catch (error) {
      console.error('❌ 从备份恢复失败:', error.message);
    }
  }

  /**
   * 获取当前构建信息
   */
  getCurrentBuildInfo() {
    const distDir = path.join(process.cwd(), 'dist');
    
    if (!fs.existsSync(distDir)) {
      return { exists: false };
    }
    
    const stats = fs.statSync(distDir);
    return {
      exists: true,
      modifiedTime: stats.mtime.toISOString(),
      size: this.getDirectorySize(distDir)
    };
  }

  /**
   * 复制目录
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  /**
   * 获取目录大小
   */
  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    if (!fs.existsSync(dirPath)) {
      return 0;
    }
    
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(itemPath);
      } else {
        totalSize += stats.size;
      }
    });
    
    return totalSize;
  }

  /**
   * 确保必要目录存在
   */
  ensureDirectories() {
    [this.logDir, this.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 列出可用的回滚目标
   */
  async listRollbackTargets() {
    const historyFile = path.join(this.logDir, 'deploy-history.json');
    
    if (!fs.existsSync(historyFile)) {
      return [];
    }
    
    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    return history.filter(deploy => deploy.status === 'success');
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // 解析命令行参数
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target-deploy':
        options.targetDeployId = args[++i];
        break;
      case '--target-commit':
        options.targetCommit = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--list':
        options.listTargets = true;
        break;
    }
  }
  
  const rollback = new DeployRollback();
  
  if (options.listTargets) {
    rollback.listRollbackTargets()
      .then(targets => {
        console.log('可用的回滚目标:');
        targets.forEach(target => {
          console.log(`  ${target.deployId} - ${target.timestamp} (${target.gitInfo?.commit?.substr(0, 8)})`);
        });
      })
      .catch(error => {
        console.error('获取回滚目标失败:', error);
        process.exit(1);
      });
  } else {
    rollback.rollback(options)
      .then(result => {
        console.log('回滚操作完成:', result.deployId);
        process.exit(0);
      })
      .catch(error => {
        console.error('回滚操作失败:', error);
        process.exit(1);
      });
  }
}

module.exports = DeployRollback;