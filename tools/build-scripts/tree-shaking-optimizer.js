/**
 * Tree-shaking优化器
 * 分析和优化无用代码消除
 */

const fs = require('fs');
const path = require('path');

class TreeShakingOptimizer {
  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * 执行Tree-shaking优化
   */
  async optimizeTreeShaking() {
    console.log('🌳 开始Tree-shaking优化分析...');
    
    const analysis = await this.analyzeProject();
    const optimizations = this.generateOptimizations(analysis);
    
    await this.generateOptimizedConfig(optimizations);
    await this.generateReport(analysis, optimizations);
    
    return optimizations;
  }

  /**
   * 分析项目
   */
  async analyzeProject() {
    const packages = this.getPackages();
    const analysis = {
      packages: {},
      totalFiles: 0,
      unusedExports: [],
      sideEffects: []
    };
    
    for (const pkg of packages) {
      const packageDir = path.join(this.projectRoot, 'packages', pkg);
      if (fs.existsSync(packageDir)) {
        analysis.packages[pkg] = await this.analyzePackage(packageDir);
        analysis.totalFiles += analysis.packages[pkg].fileCount;
      }
    }
    
    return analysis;
  }

  /**
   * 分析包
   */
  async analyzePackage(packageDir) {
    const srcDir = path.join(packageDir, 'src');
    const analysis = {
      name: path.basename(packageDir),
      fileCount: 0,
      exports: [],
      imports: [],
      sideEffects: false
    };
    
    if (fs.existsSync(srcDir)) {
      const files = this.getAllSourceFiles(srcDir);
      analysis.fileCount = files.length;
      
      // 简化的分析逻辑
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检测导出
        const exports = content.match(/export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g) || [];
        analysis.exports.push(...exports);
        
        // 检测副作用
        if (this.hasSideEffects(content)) {
          analysis.sideEffects = true;
        }
      });
    }
    
    return analysis;
  }

  /**
   * 检测副作用
   */
  hasSideEffects(content) {
    const sideEffectPatterns = [
      /console\./,
      /window\./,
      /document\./,
      /localStorage/,
      /fetch\(/
    ];
    
    return sideEffectPatterns.some(pattern => pattern.test(content));
  }

  /**
   * 生成优化建议
   */
  generateOptimizations(analysis) {
    const optimizations = {
      timestamp: new Date().toISOString(),
      viteConfig: {
        build: {
          rollupOptions: {
            treeshake: {
              moduleSideEffects: false,
              propertyReadSideEffects: false,
              tryCatchDeoptimization: false
            }
          }
        }
      },
      packageJsonUpdates: {},
      recommendations: []
    };
    
    // 为每个包生成sideEffects配置
    Object.entries(analysis.packages).forEach(([name, pkg]) => {
      optimizations.packageJsonUpdates[name] = {
        sideEffects: pkg.sideEffects ? true : false
      };
    });
    
    // 生成建议
    optimizations.recommendations = [
      '启用严格的tree-shaking配置',
      '标记包的副作用状态',
      '使用ES模块导入/导出',
      '避免导入整个库，使用具名导入'
    ];
    
    return optimizations;
  }

  /**
   * 生成优化配置
   */
  async generateOptimizedConfig(optimizations) {
    const configPath = path.join(this.projectRoot, 'tree-shaking.config.js');
    
    const config = `/**
 * Tree-shaking优化配置
 * 自动生成于 ${new Date().toISOString()}
 */

module.exports = ${JSON.stringify(optimizations.viteConfig, null, 2)};

// 包副作用配置建议:
${Object.entries(optimizations.packageJsonUpdates).map(([name, config]) => 
  `// packages/${name}/package.json: "sideEffects": ${config.sideEffects}`
).join('\n')}
`;
    
    fs.writeFileSync(configPath, config);
    console.log('✅ Tree-shaking配置已生成: tree-shaking.config.js');
  }

  /**
   * 生成报告
   */
  async generateReport(analysis, optimizations) {
    const reportPath = path.join(this.projectRoot, 'tree-shaking-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      analysis,
      optimizations,
      summary: {
        totalPackages: Object.keys(analysis.packages).length,
        totalFiles: analysis.totalFiles,
        recommendationCount: optimizations.recommendations.length
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n🌳 Tree-shaking优化摘要:');
    console.log(`  分析包数: ${report.summary.totalPackages}`);
    console.log(`  分析文件: ${report.summary.totalFiles}`);
    console.log(`  优化建议: ${report.summary.recommendationCount} 条`);
    
    console.log('\n📊 报告已生成: tree-shaking-report.json');
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

  getAllSourceFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        files.push(...this.getAllSourceFiles(itemPath));
      } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
        files.push(itemPath);
      }
    });
    
    return files;
  }
}

// 命令行接口
if (require.main === module) {
  const optimizer = new TreeShakingOptimizer();
  
  optimizer.optimizeTreeShaking()
    .then(() => {
      console.log('\n✅ Tree-shaking优化完成!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Tree-shaking优化失败:', error);
      process.exit(1);
    });
}

module.exports = TreeShakingOptimizer;
