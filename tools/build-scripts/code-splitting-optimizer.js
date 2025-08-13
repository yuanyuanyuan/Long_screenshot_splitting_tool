/**
 * 代码分割和懒加载优化器
 * 自动分析和优化代码分割策略
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class CodeSplittingOptimizer {
  constructor() {
    this.projectRoot = process.cwd();
    this.analysisResults = {};
  }

  /**
   * 分析所有包的代码分割机会
   */
  async analyzeAll() {
    console.log('🔍 分析代码分割机会...');
    
    const packages = this.getPackages();
    const results = {};
    
    for (const pkg of packages) {
      console.log(`\n📦 分析包: ${pkg}`);
      results[pkg] = await this.analyzePackage(pkg);
    }
    
    this.analysisResults = results;
    await this.generateOptimizationPlan();
    
    return results;
  }

  /**
   * 分析单个包
   */
  async analyzePackage(packageName) {
    const packageDir = path.join(this.projectRoot, 'packages', packageName);
    const srcDir = path.join(packageDir, 'src');
    
    if (!fs.existsSync(srcDir)) {
      return { error: 'Source directory not found' };
    }
    
    const analysis = {
      package: packageName,
      components: [],
      routes: [],
      heavyDependencies: [],
      lazyLoadCandidates: [],
      chunkingOpportunities: [],
      recommendations: []
    };
    
    // 分析组件
    analysis.components = await this.analyzeComponents(srcDir);
    
    // 分析路由
    analysis.routes = await this.analyzeRoutes(srcDir);
    
    // 分析重型依赖
    analysis.heavyDependencies = await this.analyzeHeavyDependencies(packageDir);
    
    // 识别懒加载候选
    analysis.lazyLoadCandidates = this.identifyLazyLoadCandidates(analysis);
    
    // 识别代码块分割机会
    analysis.chunkingOpportunities = this.identifyChunkingOpportunities(analysis);
    
    // 生成优化建议
    analysis.recommendations = this.generateOptimizationRecommendations(analysis);
    
    return analysis;
  }

  /**
   * 分析组件
   */
  async analyzeComponents(srcDir) {
    const components = [];
    
    const analyzeFile = (filePath, relativePath) => {
      if (!filePath.match(/\.(tsx?|jsx?)$/)) return;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const ast = parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript', 'decorators-legacy']
        });
        
        const component = {
          name: path.basename(filePath, path.extname(filePath)),
          path: relativePath,
          size: content.length,
          imports: [],
          exports: [],
          dependencies: [],
          complexity: 0,
          isLazyLoadable: false
        };
        
        traverse(ast, {
          ImportDeclaration(path) {
            component.imports.push({
              source: path.node.source.value,
              specifiers: path.node.specifiers.map(s => s.local.name)
            });
          },
          
          ExportDefaultDeclaration(path) {
            component.exports.push('default');
          },
          
          ExportNamedDeclaration(path) {
            if (path.node.declaration) {
              if (path.node.declaration.id) {
                component.exports.push(path.node.declaration.id.name);
              }
            }
          },
          
          FunctionDeclaration(path) {
            component.complexity += this.calculateComplexity(path);
          },
          
          ArrowFunctionExpression(path) {
            component.complexity += this.calculateComplexity(path);
          }
        });
        
        // 判断是否适合懒加载
        component.isLazyLoadable = this.isLazyLoadable(component);
        
        components.push(component);
        
      } catch (error) {
        console.warn(`⚠️ 解析文件失败: ${filePath}`, error.message);
      }
    };
    
    this.walkDirectory(srcDir, analyzeFile);
    
    return components.sort((a, b) => b.size - a.size);
  }

  /**
   * 分析路由
   */
  async analyzeRoutes(srcDir) {
    const routes = [];
    const routerFiles = [];
    
    // 查找路由文件
    this.walkDirectory(srcDir, (filePath, relativePath) => {
      if (relativePath.includes('router') || relativePath.includes('route')) {
        routerFiles.push(filePath);
      }
    });
    
    for (const routerFile of routerFiles) {
      try {
        const content = fs.readFileSync(routerFile, 'utf8');
        const ast = parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript', 'decorators-legacy']
        });
        
        traverse(ast, {
          ObjectExpression(path) {
            const properties = path.node.properties;
            const route = {};
            
            properties.forEach(prop => {
              if (prop.key && prop.key.name === 'path' && prop.value.type === 'StringLiteral') {
                route.path = prop.value.value;
              }
              if (prop.key && prop.key.name === 'component') {
                route.component = this.extractComponentName(prop.value);
              }
            });
            
            if (route.path && route.component) {
              route.isLazyLoadable = !route.path.includes('*') && route.path !== '/';
              routes.push(route);
            }
          }
        });
        
      } catch (error) {
        console.warn(`⚠️ 解析路由文件失败: ${routerFile}`, error.message);
      }
    }
    
    return routes;
  }

  /**
   * 分析重型依赖
   */
  async analyzeHeavyDependencies(packageDir) {
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return [];
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const heavyDeps = [];
    
    // 已知的重型依赖
    const knownHeavyDeps = {
      'lodash': { size: 70000, alternative: 'lodash-es (tree-shakable)' },
      'moment': { size: 67000, alternative: 'dayjs (2KB)' },
      'antd': { size: 200000, alternative: '按需导入' },
      'material-ui': { size: 300000, alternative: '按需导入' },
      'chart.js': { size: 150000, alternative: '懒加载' },
      'monaco-editor': { size: 500000, alternative: '懒加载' },
      'three': { size: 400000, alternative: '懒加载' },
      'echarts': { size: 300000, alternative: '按需导入' }
    };
    
    if (packageJson.dependencies) {
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        if (knownHeavyDeps[name]) {
          heavyDeps.push({
            name,
            version,
            estimatedSize: knownHeavyDeps[name].size,
            alternative: knownHeavyDeps[name].alternative,
            recommendation: 'consider-optimization'
          });
        }
      });
    }
    
    return heavyDeps;
  }

  /**
   * 识别懒加载候选
   */
  identifyLazyLoadCandidates(analysis) {
    const candidates = [];
    
    // 大型组件
    const largeComponents = analysis.components.filter(c => 
      c.size > 5000 || c.complexity > 10
    );
    
    largeComponents.forEach(component => {
      candidates.push({
        type: 'component',
        name: component.name,
        path: component.path,
        reason: 'Large size or high complexity',
        priority: component.size > 10000 ? 'high' : 'medium',
        estimatedSavings: Math.round(component.size * 0.8)
      });
    });
    
    // 路由组件
    analysis.routes.forEach(route => {
      if (route.isLazyLoadable) {
        candidates.push({
          type: 'route',
          name: route.component,
          path: route.path,
          reason: 'Route-based code splitting opportunity',
          priority: 'high',
          estimatedSavings: 'TBD'
        });
      }
    });
    
    // 重型依赖
    analysis.heavyDependencies.forEach(dep => {
      candidates.push({
        type: 'dependency',
        name: dep.name,
        reason: 'Heavy dependency',
        priority: 'medium',
        estimatedSavings: dep.estimatedSize,
        alternative: dep.alternative
      });
    });
    
    return candidates.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 识别代码块分割机会
   */
  identifyChunkingOpportunities(analysis) {
    const opportunities = [];
    
    // 共享依赖
    const importCounts = {};
    analysis.components.forEach(component => {
      component.imports.forEach(imp => {
        if (imp.source.startsWith('.')) return; // 跳过相对导入
        importCounts[imp.source] = (importCounts[imp.source] || 0) + 1;
      });
    });
    
    Object.entries(importCounts).forEach(([dep, count]) => {
      if (count >= 3) {
        opportunities.push({
          type: 'vendor-chunk',
          dependency: dep,
          usageCount: count,
          reason: 'Shared dependency used in multiple components',
          recommendation: 'Extract to vendor chunk'
        });
      }
    });
    
    // 功能模块
    const moduleGroups = this.groupComponentsByModule(analysis.components);
    Object.entries(moduleGroups).forEach(([module, components]) => {
      if (components.length >= 2) {
        const totalSize = components.reduce((sum, c) => sum + c.size, 0);
        opportunities.push({
          type: 'feature-chunk',
          module,
          componentCount: components.length,
          totalSize,
          reason: 'Related components can be grouped',
          recommendation: 'Create feature-specific chunk'
        });
      }
    });
    
    return opportunities;
  }

  /**
   * 按模块分组组件
   */
  groupComponentsByModule(components) {
    const groups = {};
    
    components.forEach(component => {
      const pathParts = component.path.split('/');
      const module = pathParts.length > 1 ? pathParts[0] : 'root';
      
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(component);
    });
    
    return groups;
  }

  /**
   * 生成优化建议
   */
  generateOptimizationRecommendations(analysis) {
    const recommendations = [];
    
    // 懒加载建议
    if (analysis.lazyLoadCandidates.length > 0) {
      const highPriority = analysis.lazyLoadCandidates.filter(c => c.priority === 'high');
      if (highPriority.length > 0) {
        recommendations.push({
          type: 'lazy-loading',
          priority: 'high',
          title: '实施懒加载',
          description: `发现 ${highPriority.length} 个高优先级懒加载机会`,
          items: highPriority.slice(0, 5),
          estimatedImpact: 'high'
        });
      }
    }
    
    // 代码分割建议
    if (analysis.chunkingOpportunities.length > 0) {
      recommendations.push({
        type: 'code-splitting',
        priority: 'medium',
        title: '优化代码分割',
        description: `发现 ${analysis.chunkingOpportunities.length} 个代码分割机会`,
        items: analysis.chunkingOpportunities.slice(0, 3),
        estimatedImpact: 'medium'
      });
    }
    
    // 依赖优化建议
    if (analysis.heavyDependencies.length > 0) {
      recommendations.push({
        type: 'dependency-optimization',
        priority: 'medium',
        title: '优化重型依赖',
        description: `发现 ${analysis.heavyDependencies.length} 个重型依赖`,
        items: analysis.heavyDependencies,
        estimatedImpact: 'high'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 生成优化计划
   */
  async generateOptimizationPlan() {
    const planPath = path.join(this.projectRoot, 'code-splitting-plan.json');
    const htmlPlanPath = path.join(this.projectRoot, 'code-splitting-plan.html');
    
    const plan = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      packages: this.analysisResults,
      globalRecommendations: this.generateGlobalRecommendations(),
      implementationSteps: this.generateImplementationSteps()
    };
    
    // 生成JSON计划
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    
    // 生成HTML计划
    const htmlPlan = this.generateHtmlPlan(plan);
    fs.writeFileSync(htmlPlanPath, htmlPlan);
    
    console.log(`\n📋 优化计划已生成:`);
    console.log(`  JSON: ${planPath}`);
    console.log(`  HTML: ${htmlPlanPath}`);
    
    this.printOptimizationSummary(plan);
  }

  /**
   * 生成摘要
   */
  generateSummary() {
    const summary = {
      totalPackages: Object.keys(this.analysisResults).length,
      totalLazyLoadCandidates: 0,
      totalChunkingOpportunities: 0,
      totalHeavyDependencies: 0,
      estimatedSavings: 0
    };
    
    Object.values(this.analysisResults).forEach(analysis => {
      if (analysis.error) return;
      
      summary.totalLazyLoadCandidates += analysis.lazyLoadCandidates?.length || 0;
      summary.totalChunkingOpportunities += analysis.chunkingOpportunities?.length || 0;
      summary.totalHeavyDependencies += analysis.heavyDependencies?.length || 0;
      
      // 估算节省的大小
      analysis.lazyLoadCandidates?.forEach(candidate => {
        if (typeof candidate.estimatedSavings === 'number') {
          summary.estimatedSavings += candidate.estimatedSavings;
        }
      });
    });
    
    return summary;
  }

  /**
   * 生成全局建议
   */
  generateGlobalRecommendations() {
    const recommendations = [];
    
    // Vite配置优化
    recommendations.push({
      type: 'vite-config',
      title: '优化Vite配置',
      description: '配置代码分割和懒加载',
      code: `
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash-es', 'dayjs']
        }
      }
    }
  }
}`,
      priority: 'high'
    });
    
    // React懒加载
    recommendations.push({
      type: 'react-lazy',
      title: '实施React懒加载',
      description: '使用React.lazy和Suspense',
      code: `
// 懒加载组件
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// 使用Suspense包装
<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>`,
      priority: 'high'
    });
    
    // 路由懒加载
    recommendations.push({
      type: 'route-lazy',
      title: '路由级别懒加载',
      description: '按路由分割代码',
      code: `
// 路由懒加载
const routes = [
  {
    path: '/dashboard',
    component: React.lazy(() => import('./pages/Dashboard'))
  },
  {
    path: '/settings',
    component: React.lazy(() => import('./pages/Settings'))
  }
];`,
      priority: 'medium'
    });
    
    return recommendations;
  }

  /**
   * 生成实施步骤
   */
  generateImplementationSteps() {
    return [
      {
        step: 1,
        title: '分析当前状态',
        description: '运行构建产物分析，了解当前包大小',
        command: 'node tools/build-scripts/bundle-analyzer.js',
        estimatedTime: '10分钟'
      },
      {
        step: 2,
        title: '配置代码分割',
        description: '更新Vite配置，启用手动代码分割',
        files: ['vite.config.js', 'vite.config.base.js'],
        estimatedTime: '30分钟'
      },
      {
        step: 3,
        title: '实施路由懒加载',
        description: '将路由组件改为懒加载',
        files: ['src/router/index.ts'],
        estimatedTime: '1小时'
      },
      {
        step: 4,
        title: '优化重型依赖',
        description: '替换或懒加载重型依赖',
        estimatedTime: '2小时'
      },
      {
        step: 5,
        title: '测试和验证',
        description: '构建并测试优化效果',
        command: 'pnpm run build && node tools/build-scripts/bundle-analyzer.js',
        estimatedTime: '30分钟'
      }
    ];
  }

  /**
   * 生成HTML计划
   */
  generateHtmlPlan(plan) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码分割优化计划</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
        .recommendation { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0; }
        .rec-high { border-left: 4px solid #dc3545; }
        .rec-medium { border-left: 4px solid #ffc107; }
        .rec-low { border-left: 4px solid #28a745; }
        .code-block { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; margin: 10px 0; font-family: 'Courier New', monospace; font-size: 14px; overflow-x: auto; }
        .step { background: white; border: 1px solid #ddd; border-radius: 6px; padding: 20px; margin: 15px 0; }
        .step-number { background: #667eea; color: white; border-radius: 50%; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin-right: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 代码分割优化计划</h1>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 优化摘要</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${plan.summary.totalLazyLoadCandidates}</div>
                        <div class="stat-label">懒加载机会</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${plan.summary.totalChunkingOpportunities}</div>
                        <div class="stat-label">代码分割机会</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${plan.summary.totalHeavyDependencies}</div>
                        <div class="stat-label">重型依赖</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.formatSize(plan.summary.estimatedSavings)}</div>
                        <div class="stat-label">预估节省</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>💡 全局建议</h2>
                ${plan.globalRecommendations.map(rec => `
                    <div class="recommendation rec-${rec.priority}">
                        <h3>${rec.title}</h3>
                        <p>${rec.description}</p>
                        <div class="code-block">${rec.code}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <h2>📋 实施步骤</h2>
                ${plan.implementationSteps.map(step => `
                    <div class="step">
                        <div style="display: flex; align-items: center;">
                            <div class="step-number">${step.step}</div>
                            <div>
                                <h3>${step.title}</h3>
                                <p>${step.description}</p>
                                ${step.command ? `<div class="code-block">${step.command}</div>` : ''}
                                <small>预估时间: ${step.estimatedTime}</small>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * 打印优化摘要
   */
  printOptimizationSummary(plan) {
    console.log('\n🚀 优化机会摘要:');
    console.log(`  懒加载候选: ${plan.summary.totalLazyLoadCandidates}`);
    console.log(`  代码分割机会: ${plan.summary.totalChunkingOpportunities}`);
    console.log(`  重型依赖: ${plan.summary.totalHeavyDependencies}`);
    console.log(`  预估节省: ${this.formatSize(plan.summary.estimatedSavings)}`);
    
    console.log('\n📋 下一步行动:');
    plan.implementationSteps.slice(0, 3).forEach(step => {
      console.log(`  ${step.step}. ${step.title} (${step.estimatedTime})`);
    });
  }

  /**
   * 工具方法
   */
  getPackages() {
    const packagesDir = path.join(this.projectRoot, 'packages');
    if (!fs.existsSync(packagesDir)) return [];
    
    return fs.readdirSync(packagesDir).filter(item => {
      const itemPath = path.join(packagesDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
  }

  walkDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        this.walkDirectory(itemPath, callback);
      } else {
        const relativePath = path.relative(this.projectRoot, itemPath);
        callback(itemPath, relativePath);
      }
    });
  }

  calculateComplexity(path) {
    // 简单的复杂度计算
    let complexity = 1;
    
    path.traverse({
      IfStatement: () => complexity++,
      ForStatement: () => complexity++,
      WhileStatement: () => complexity++,
      SwitchStatement: () => complexity++,
      ConditionalExpression: () => complexity++
    });
    
    return complexity;
  }

  isLazyLoadable(component) {
    // 判断组件是否适合懒加载
    return component.size > 3000 || 
           component.complexity > 5 ||
           component.imports.some(imp => 
             ['chart', 'editor', 'calendar', 'table'].some(keyword => 
               imp.source.toLowerCase().includes(keyword)
             )
           );
  }

  extractComponentName(node) {
    if (node.type === 'Identifier') {
      return node.name;
    }
    if (node.type === 'CallExpression' && node.callee.name === 'lazy') {
      return 'LazyComponent';
    }
    return 'Unknown';
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 命令行接口
if (require.main === module) {
  const optimizer = new CodeSplittingOptimizer();
  
  optimizer.analyzeAll()
    .then(() => {
      console.log('\n✅ 代码分割分析完成!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 分析失败:', error);
      process.exit(1);
    });
}

module.exports = CodeSplittingOptimizer;
