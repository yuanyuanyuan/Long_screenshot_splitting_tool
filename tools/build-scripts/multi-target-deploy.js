/**
 * 多目标部署脚本
 * 支持GitHub Pages、Vercel、Netlify等多个平台
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 动态加载部署配置
const deployConfigModule = await import('../../deploy.config.js');
const deployConfig = deployConfigModule.default;

// 支持的部署平台
const SUPPORTED_PLATFORMS = ['github-pages', 'vercel', 'netlify', 'surge', 'firebase'];

// 支持的组件
const SUPPORTED_COMPONENTS = ['screenshot-splitter'];

/**
 * 部署到GitHub Pages
 */
async function deployToGitHubPages(component, buildMode = 'spa') {
  console.log(`🚀 开始部署 ${component} 到 GitHub Pages (${buildMode} 模式)`);
  
  try {
    // 确保构建目录存在
    const distPath = path.join(process.cwd(), 'packages', component, 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error(`构建目录不存在: ${distPath}`);
    }
    
    // 检查是否有GitHub Pages配置
    const config = deployConfig.githubPages;
    if (!config) {
      throw new Error('GitHub Pages 配置未找到');
    }
    
    // 创建部署分支
    const deployBranch = config.branch || 'gh-pages';
    
    console.log(`📦 准备部署文件...`);
    
    // 复制构建文件到临时目录
    const tempDir = path.join(process.cwd(), '.deploy-temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    // 复制文件
    execSync(`cp -r ${distPath}/* ${tempDir}/`, { stdio: 'inherit' });
    
    // 创建CNAME文件（如果配置了自定义域名）
    if (config.domain) {
      fs.writeFileSync(path.join(tempDir, 'CNAME'), config.domain);
    }
    
    // 创建.nojekyll文件
    fs.writeFileSync(path.join(tempDir, '.nojekyll'), '');
    
    console.log(`🌐 部署到 GitHub Pages...`);
    
    // 初始化git仓库
    process.chdir(tempDir);
    execSync('git init', { stdio: 'inherit' });
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Deploy ${component} - ${new Date().toISOString()}"`, { stdio: 'inherit' });
    
    // 推送到GitHub Pages分支
    const repoUrl = config.repository || 'origin';
    execSync(`git branch -M ${deployBranch}`, { stdio: 'inherit' });
    execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
    execSync(`git push -f origin ${deployBranch}`, { stdio: 'inherit' });
    
    // 清理临时目录
    process.chdir(process.cwd());
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log(`✅ ${component} 已成功部署到 GitHub Pages`);
    
    // 返回部署信息
    return {
      platform: 'github-pages',
      component,
      buildMode,
      url: config.domain ? `https://${config.domain}` : `https://${config.username}.github.io/${config.repository}`,
      branch: deployBranch,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ GitHub Pages 部署失败:`, error.message);
    throw error;
  }
}

/**
 * 部署到Vercel
 */
async function deployToVercel(component, buildMode = 'spa') {
  console.log(`🚀 开始部署 ${component} 到 Vercel (${buildMode} 模式)`);
  
  try {
    const config = deployConfig.platforms.vercel;
    if (!config || !config.enabled) {
      throw new Error('Vercel 配置未启用');
    }
    
    const distPath = path.join(process.cwd(), 'packages', component, 'dist');
    
    // 使用Vercel CLI部署
    const deployCommand = `vercel --prod --cwd ${distPath}`;
    const result = execSync(deployCommand, { encoding: 'utf8' });
    
    console.log(`✅ ${component} 已成功部署到 Vercel`);
    
    return {
      platform: 'vercel',
      component,
      buildMode,
      url: result.trim(),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Vercel 部署失败:`, error.message);
    throw error;
  }
}

/**
 * 部署到Netlify
 */
async function deployToNetlify(component, buildMode = 'spa') {
  console.log(`🚀 开始部署 ${component} 到 Netlify (${buildMode} 模式)`);
  
  try {
    const config = deployConfig.platforms.netlify;
    if (!config || !config.enabled) {
      throw new Error('Netlify 配置未启用');
    }
    
    const distPath = path.join(process.cwd(), 'packages', component, 'dist');
    
    // 使用Netlify CLI部署
    const deployCommand = `netlify deploy --prod --dir ${distPath}`;
    const result = execSync(deployCommand, { encoding: 'utf8' });
    
    console.log(`✅ ${component} 已成功部署到 Netlify`);
    
    return {
      platform: 'netlify',
      component,
      buildMode,
      url: config.domain || 'https://app.netlify.com',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Netlify 部署失败:`, error.message);
    throw error;
  }
}

/**
 * 主部署函数
 */
async function deploy(platform, component, buildMode = 'spa') {
  // 验证参数
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    throw new Error(`不支持的部署平台: ${platform}. 支持的平台: ${SUPPORTED_PLATFORMS.join(', ')}`);
  }
  
  if (!SUPPORTED_COMPONENTS.includes(component)) {
    throw new Error(`不支持的组件: ${component}. 支持的组件: ${SUPPORTED_COMPONENTS.join(', ')}`);
  }
  
  console.log(`🎯 开始部署流程:`);
  console.log(`   平台: ${platform}`);
  console.log(`   组件: ${component}`);
  console.log(`   模式: ${buildMode}`);
  console.log('');
  
  let deployResult;
  
  switch (platform) {
    case 'github-pages':
      deployResult = await deployToGitHubPages(component, buildMode);
      break;
    case 'vercel':
      deployResult = await deployToVercel(component, buildMode);
      break;
    case 'netlify':
      deployResult = await deployToNetlify(component, buildMode);
      break;
    default:
      throw new Error(`部署平台 ${platform} 尚未实现`);
  }
  
  // 保存部署记录
  const deployRecord = {
    ...deployResult,
    deployedAt: new Date().toISOString(),
    deployedBy: process.env.USER || 'unknown'
  };
  
  const recordsPath = path.join(process.cwd(), '.deploy-records.json');
  let records = [];
  
  if (fs.existsSync(recordsPath)) {
    try {
      records = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
    } catch (error) {
      console.warn('无法读取部署记录文件，将创建新文件');
    }
  }
  
  records.push(deployRecord);
  
  // 只保留最近50条记录
  if (records.length > 50) {
    records = records.slice(-50);
  }
  
  fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
  
  console.log('');
  console.log(`🎉 部署完成!`);
  console.log(`   URL: ${deployResult.url}`);
  console.log(`   时间: ${deployResult.timestamp}`);
  
  return deployResult;
}

// 命令行接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, platform, component, buildMode] = process.argv;
  
  if (!platform || !component) {
    console.log('用法: node multi-target-deploy.js <platform> <component> [buildMode]');
    console.log('');
    console.log('支持的平台:', SUPPORTED_PLATFORMS.join(', '));
    console.log('支持的组件:', SUPPORTED_COMPONENTS.join(', '));
    console.log('构建模式: spa, singlefile (默认: spa)');
    process.exit(1);
  }
  
  try {
    await deploy(platform, component, buildMode || 'spa');
  } catch (error) {
    console.error('部署失败:', error.message);
    process.exit(1);
  }
}

export { deploy, deployToGitHubPages, deployToVercel, deployToNetlify };