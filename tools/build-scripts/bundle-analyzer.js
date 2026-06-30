/**
 * 构建产物分析器
 * 分析构建产物大小、依赖关系和优化建议
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.analysisResults = {};
  }

  /**
   * 分析所有构建产物
   */
  async analyzeAll() {
    console.log('🔍 开始分析构建产物...');

    const packages = this.getPackages();
    const results = {};

    for (const pkg of packages) {
      console.log(`\n📦 分析包: ${pkg}`);
      results[pkg] = await this.analyzePackage(pkg);
    }

    // 分析根目录构建产物
    console.log('\n🏠 分析根目录构建产物...');
    results.root = await this.analyzeRootBuild();

    this.analysisResults = results;
    await this.generateReport();

    return results;
  }

  /**
   * 分析单个包
   */
  async analyzePackage(packageName) {
    const packageDir = path.join(this.projectRoot, 'packages', packageName);
    const distDir = path.join(packageDir, 'dist');

    if (!fs.existsSync(distDir)) {
      console.warn(`⚠️ 构建产物不存在: ${packageName}`);
      return { error: 'Build output not found' };
    }

    const analysis = {
      package: packageName,
      timestamp: new Date().toISOString(),
      files: [],
      totalSize: 0,
      gzipSize: 0,
      dependencies: [],
      recommendations: [],
    };

    // 分析文件大小
    analysis.files = this.analyzeFiles(distDir);
    analysis.totalSize = analysis.files.reduce((sum, file) => sum + file.size, 0);

    // 分析依赖
    analysis.dependencies = this.analyzeDependencies(packageDir);

    // 生成优化建议
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * 分析根目录构建产物
   */
  async analyzeRootBuild() {
    const analysis = {
      spa: null,
      singlefile: null,
      comparison: null,
    };

    // 分析SPA模式
    const spaDir = path.join(this.projectRoot, 'dist');
    if (fs.existsSync(spaDir)) {
      analysis.spa = this.analyzeBuildOutput(spaDir, 'spa');
    }

    // 分析单文件模式
    const singlefileDir = path.join(this.projectRoot, 'dist-singlefile');
    if (fs.existsSync(singlefileDir)) {
      analysis.singlefile = this.analyzeBuildOutput(singlefileDir, 'singlefile');
    }

    // 对比分析
    if (analysis.spa && analysis.singlefile) {
      analysis.comparison = this.compareBuildModes(analysis.spa, analysis.singlefile);
    }

    return analysis;
  }

  /**
   * 分析构建输出
   */
  analyzeBuildOutput(distDir, mode) {
    const analysis = {
      mode,
      files: [],
      totalSize: 0,
      htmlSize: 0,
      jsSize: 0,
      cssSize: 0,
      assetSize: 0,
      recommendations: [],
    };

    analysis.files = this.analyzeFiles(distDir);
    analysis.totalSize = analysis.files.reduce((sum, file) => sum + file.size, 0);

    // 按类型分类
    analysis.files.forEach(file => {
      if (file.name.endsWith('.html')) {
        analysis.htmlSize += file.size;
      } else if (file.name.endsWith('.js')) {
        analysis.jsSize += file.size;
      } else if (file.name.endsWith('.css')) {
        analysis.cssSize += file.size;
      } else {
        analysis.assetSize += file.size;
      }
    });

    // 生成建议
    analysis.recommendations = this.generateBuildRecommendations(analysis);

    return analysis;
  }

  /**
   * 分析文件
   */
  analyzeFiles(dirPath, relativePath = '') {
    const files = [];

    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      const relativeItemPath = path.join(relativePath, item);

      if (stats.isDirectory()) {
        files.push(...this.analyzeFiles(itemPath, relativeItemPath));
      } else {
        files.push({
          name: item,
          path: relativeItemPath,
          size: stats.size,
          sizeFormatted: this.formatSize(stats.size),
          type: this.getFileType(item),
          gzipSize: this.estimateGzipSize(stats.size),
        });
      }
    });

    return files.sort((a, b) => b.size - a.size);
  }

  /**
   * 分析依赖
   */
  analyzeDependencies(packageDir) {
    const packageJsonPath = path.join(packageDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return [];
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = [];

    // 分析生产依赖
    if (packageJson.dependencies) {
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        dependencies.push({
          name,
          version,
          type: 'production',
          size: this.estimateDependencySize(name),
        });
      });
    }

    // 分析开发依赖
    if (packageJson.devDependencies) {
      Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
        dependencies.push({
          name,
          version,
          type: 'development',
          size: this.estimateDependencySize(name),
        });
      });
    }

    return dependencies.sort((a, b) => b.size - a.size);
  }

  /**
   * 生成优化建议
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // 大小建议
    if (analysis.totalSize > 5 * 1024 * 1024) {
      // 5MB
      recommendations.push({
        type: 'size',
        level: 'warning',
        message: '构建产物过大，建议进行代码分割和懒加载优化',
        impact: 'high',
      });
    }

    // 文件数量建议
    if (analysis.files.length > 50) {
      recommendations.push({
        type: 'files',
        level: 'info',
        message: '文件数量较多，建议合并小文件减少HTTP请求',
        impact: 'medium',
      });
    }

    // 大文件建议
    const largeFiles = analysis.files.filter(f => f.size > 1024 * 1024); // 1MB
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'large-files',
        level: 'warning',
        message: `发现${largeFiles.length}个大文件，建议进行压缩或分割`,
        files: largeFiles.map(f => f.name),
        impact: 'high',
      });
    }

    // 依赖建议
    const heavyDeps = analysis.dependencies?.filter(d => d.size > 500 * 1024) || []; // 500KB
    if (heavyDeps.length > 0) {
      recommendations.push({
        type: 'dependencies',
        level: 'info',
        message: `发现${heavyDeps.length}个重型依赖，考虑使用轻量级替代方案`,
        dependencies: heavyDeps.map(d => d.name),
        impact: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * 生成构建模式建议
   */
  generateBuildRecommendations(analysis) {
    const recommendations = [];

    if (analysis.mode === 'singlefile') {
      if (analysis.htmlSize > 5 * 1024 * 1024) {
        // 5MB
        recommendations.push({
          type: 'singlefile-size',
          level: 'error',
          message: '单文件HTML过大，可能影响加载性能',
          impact: 'high',
        });
      }

      if (analysis.jsSize > 2 * 1024 * 1024) {
        // 2MB
        recommendations.push({
          type: 'js-size',
          level: 'warning',
          message: 'JavaScript代码过大，建议进行代码分割',
          impact: 'high',
        });
      }
    }

    if (analysis.mode === 'spa') {
      if (analysis.files.length < 5) {
        recommendations.push({
          type: 'spa-files',
          level: 'info',
          message: 'SPA模式文件较少，可能未充分利用代码分割',
          impact: 'low',
        });
      }
    }

    return recommendations;
  }

  /**
   * 对比构建模式
   */
  compareBuildModes(spa, singlefile) {
    return {
      sizeDifference: singlefile.totalSize - spa.totalSize,
      sizeRatio: singlefile.totalSize / spa.totalSize,
      fileCountDifference: singlefile.files.length - spa.files.length,
      recommendations: [
        {
          type: 'mode-comparison',
          level: 'info',
          message:
            singlefile.totalSize > spa.totalSize
              ? '单文件模式体积较大，但减少了HTTP请求'
              : 'SPA模式体积较大，可能存在优化空间',
          impact: 'medium',
        },
      ],
    };
  }

  /**
   * 获取包列表
   */
  getPackages() {
    const packagesDir = path.join(this.projectRoot, 'packages');

    if (!fs.existsSync(packagesDir)) {
      return [];
    }

    return fs.readdirSync(packagesDir).filter(item => {
      const itemPath = path.join(packagesDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
  }

  /**
   * 获取文件类型
   */
  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.mjs': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.css': 'stylesheet',
      '.scss': 'stylesheet',
      '.sass': 'stylesheet',
      '.html': 'html',
      '.json': 'json',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font',
      '.eot': 'font',
    };

    return typeMap[ext] || 'other';
  }

  /**
   * 估算Gzip大小
   */
  estimateGzipSize(originalSize) {
    // 简单估算，实际压缩率取决于文件内容
    return Math.round(originalSize * 0.3);
  }

  /**
   * 估算依赖大小
   */
  estimateDependencySize(depName) {
    // 简单的依赖大小估算
    const sizeMap = {
      react: 42 * 1024,
      'react-dom': 130 * 1024,
      lodash: 70 * 1024,
      moment: 67 * 1024,
      axios: 15 * 1024,
      typescript: 0, // 开发依赖
      vite: 0, // 开发依赖
    };

    return sizeMap[depName] || 10 * 1024; // 默认10KB
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成分析报告
   */
  async generateReport() {
    const reportPath = path.join(this.projectRoot, 'bundle-analysis-report.json');
    const htmlReportPath = path.join(this.projectRoot, 'bundle-analysis-report.html');

    // 生成JSON报告
    fs.writeFileSync(reportPath, JSON.stringify(this.analysisResults, null, 2));

    // 生成HTML报告
    const htmlReport = this.generateHtmlReport();
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`\n📊 分析报告已生成:`);
    console.log(`  JSON: ${reportPath}`);
    console.log(`  HTML: ${htmlReportPath}`);

    // 输出摘要
    this.printSummary();
  }

  /**
   * 生成HTML报告
   */
  generateHtmlReport() {
    const results = this.analysisResults;

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>构建产物分析报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .package-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
        .file-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .file-item { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 15px; }
        .size-bar { background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .size-fill { background: linear-gradient(90deg, #28a745, #ffc107, #dc3545); height: 100%; transition: width 0.3s; }
        .recommendation { padding: 15px; border-radius: 6px; margin: 10px 0; }
        .rec-info { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .rec-warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .rec-error { background: #f8d7da; border-left: 4px solid #dc3545; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: white; border: 1px solid #ddd; border-radius: 6px; padding: 20px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 构建产物分析报告</h1>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="content">
            ${this.generateRootAnalysisHtml(results.root)}
            ${this.generatePackageAnalysisHtml(results)}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * 生成根目录分析HTML
   */
  generateRootAnalysisHtml(rootAnalysis) {
    if (!rootAnalysis) return '';

    let html = '<div class="section"><h2>🏠 根目录构建分析</h2>';

    if (rootAnalysis.spa || rootAnalysis.singlefile) {
      html += '<div class="stats-grid">';

      if (rootAnalysis.spa) {
        html += `
          <div class="stat-card">
            <div class="stat-value">${this.formatSize(rootAnalysis.spa.totalSize)}</div>
            <div class="stat-label">SPA模式总大小</div>
          </div>`;
      }

      if (rootAnalysis.singlefile) {
        html += `
          <div class="stat-card">
            <div class="stat-value">${this.formatSize(rootAnalysis.singlefile.totalSize)}</div>
            <div class="stat-label">单文件模式总大小</div>
          </div>`;
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * 生成包分析HTML
   */
  generatePackageAnalysisHtml(results) {
    let html = '<div class="section"><h2>📦 包分析</h2>';

    Object.entries(results).forEach(([key, analysis]) => {
      if (key === 'root' || analysis.error) return;

      html += `
        <div class="package-card">
          <h3>${analysis.package}</h3>
          <p>总大小: ${this.formatSize(analysis.totalSize)} | 文件数: ${analysis.files.length}</p>
          
          <h4>主要文件:</h4>
          <div class="file-list">
            ${analysis.files
              .slice(0, 10)
              .map(
                file => `
              <div class="file-item">
                <strong>${file.name}</strong>
                <div class="size-bar">
                  <div class="size-fill" style="width: ${(file.size / analysis.totalSize) * 100}%"></div>
                </div>
                <small>${file.sizeFormatted} (${file.type})</small>
              </div>
            `
              )
              .join('')}
          </div>
          
          ${
            analysis.recommendations.length > 0
              ? `
            <h4>优化建议:</h4>
            ${analysis.recommendations
              .map(
                rec => `
              <div class="recommendation rec-${rec.level}">
                <strong>${rec.type}:</strong> ${rec.message}
              </div>
            `
              )
              .join('')}
          `
              : ''
          }
        </div>`;
    });

    html += '</div>';
    return html;
  }

  /**
   * 打印摘要
   */
  printSummary() {
    console.log('\n📋 分析摘要:');

    Object.entries(this.analysisResults).forEach(([key, analysis]) => {
      if (key === 'root') {
        if (analysis.spa) {
          console.log(`  SPA模式: ${this.formatSize(analysis.spa.totalSize)}`);
        }
        if (analysis.singlefile) {
          console.log(`  单文件模式: ${this.formatSize(analysis.singlefile.totalSize)}`);
        }
      } else if (!analysis.error) {
        console.log(
          `  ${analysis.package}: ${this.formatSize(analysis.totalSize)} (${analysis.files.length} 文件)`
        );

        if (analysis.recommendations.length > 0) {
          const warnings = analysis.recommendations.filter(r => r.level === 'warning').length;
          const errors = analysis.recommendations.filter(r => r.level === 'error').length;
          if (warnings > 0 || errors > 0) {
            console.log(`    ⚠️ ${warnings} 警告, ${errors} 错误`);
          }
        }
      }
    });
  }
}

// 命令行接口
if (require.main === module) {
  const analyzer = new BundleAnalyzer();

  analyzer
    .analyzeAll()
    .then(() => {
      console.log('\n✅ 分析完成!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 分析失败:', error);
      process.exit(1);
    });
}

module.exports = BundleAnalyzer;
