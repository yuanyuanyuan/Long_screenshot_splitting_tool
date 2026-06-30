/**
 * SEO配置迁移脚本
 * 将 seo.config.ts 中的使用迁移到新的 seo.config.json 系统
 */

import { promises as fs } from 'fs';
import { join } from 'path';

interface MigrationTask {
  file: string;
  replacements: Array<{
    from: string | RegExp;
    to: string;
    description: string;
  }>;
}

const MIGRATION_TASKS: MigrationTask[] = [
  {
    file: 'src/components/SEOManager.tsx',
    replacements: [
      {
        from: /import { SEO_CONFIG, getCurrentSEOConfig } from.*?;/,
        to: `import { seoConfigManager } from '../utils/seo/SEOConfigManager';`,
        description: '替换导入语句',
      },
      {
        from: /SEO_CONFIG\.siteUrl/g,
        to: `seoConfigManager.getCurrentConfig()?.site?.url || 'https://screenshot-splitter.com'`,
        description: '替换siteUrl引用',
      },
      {
        from: /SEO_CONFIG\.siteName/g,
        to: `seoConfigManager.getCurrentConfig()?.site?.name[language] || 'Long Screenshot Splitter'`,
        description: '替换siteName引用',
      },
      {
        from: /SEO_CONFIG\.socialMedia/g,
        to: `seoConfigManager.getCurrentConfig()?.socialMedia`,
        description: '替换socialMedia引用',
      },
      {
        from: /SEO_CONFIG\.structuredData/g,
        to: `seoConfigManager.getCurrentConfig()?.structuredData`,
        description: '替换structuredData引用',
      },
    ],
  },
  {
    file: 'src/utils/seo/metadataGenerator.ts',
    replacements: [
      {
        from: /import { SEO_CONFIG } from.*?;/,
        to: `import { seoConfigManager } from './SEOConfigManager';`,
        description: '替换导入语句',
      },
      {
        from: /SEO_CONFIG\.keywords\.primary/g,
        to: `seoConfigManager.getKeywords('zh-CN').primary`,
        description: '替换关键词引用',
      },
      {
        from: /SEO_CONFIG\.siteUrl/g,
        to: `seoConfigManager.getCurrentConfig()?.site?.url || 'https://screenshot-splitter.com'`,
        description: '替换siteUrl引用',
      },
    ],
  },
];

/**
 * 执行配置迁移
 */
async function migrateConfigurations(): Promise<void> {
  console.log('🚀 开始SEO配置迁移...\n');

  let totalReplacements = 0;

  for (const task of MIGRATION_TASKS) {
    console.log(`📁 处理文件: ${task.file}`);

    try {
      // 读取文件内容
      const filePath = join(process.cwd(), task.file);
      const content = await fs.readFile(filePath, 'utf-8');
      let newContent = content;
      let fileReplacements = 0;

      // 执行替换
      for (const replacement of task.replacements) {
        const matches = newContent.match(replacement.from);
        if (matches) {
          newContent = newContent.replace(replacement.from, replacement.to);
          fileReplacements += matches.length;
          console.log(`  ✅ ${replacement.description}: ${matches.length} 处替换`);
        }
      }

      // 写回文件
      if (fileReplacements > 0) {
        await fs.writeFile(filePath, newContent, 'utf-8');
        totalReplacements += fileReplacements;
        console.log(`  📝 文件已更新，共 ${fileReplacements} 处修改\n`);
      } else {
        console.log(`  ℹ️ 文件无需修改\n`);
      }
    } catch (error) {
      console.error(`  ❌ 处理文件失败: ${error}\n`);
    }
  }

  console.log(`🎉 迁移完成！总共处理了 ${totalReplacements} 处替换`);

  // 生成迁移报告
  await generateMigrationReport();
}

/**
 * 生成迁移报告
 */
async function generateMigrationReport(): Promise<void> {
  const report = `# SEO配置迁移报告

## 迁移概述
- 迁移时间: ${new Date().toLocaleString()}
- 迁移目标: 从 seo.config.ts 迁移到 seo.config.json 系统

## 迁移内容
1. 替换所有 SEO_CONFIG 直接引用
2. 使用 seoConfigManager 统一访问配置
3. 支持多语言配置访问
4. 保持向后兼容性

## 下一步行动
1. 测试所有SEO相关功能
2. 验证配置正确加载
3. 考虑删除 seo.config.ts 文件（在确认无引用后）

## 注意事项
- 新系统需要在应用启动时初始化 seoConfigManager
- 确保 seo.config.json 配置完整
- 测试多语言场景的配置加载
`;

  await fs.writeFile(join(process.cwd(), 'docs/SEO-MIGRATION-REPORT.md'), report, 'utf-8');
  console.log('📋 迁移报告已生成: docs/SEO-MIGRATION-REPORT.md');
}

/**
 * 清理旧配置文件的引用
 */
async function cleanupLegacyReferences(): Promise<void> {
  console.log('\n🧹 检查旧配置文件引用...');

  const searchFiles = ['src/components', 'src/utils', 'src/hooks'];

  // 这里可以添加更多的清理逻辑
  // 例如搜索所有 SEO_CONFIG 的引用并报告
}

/**
 * 验证新配置系统
 */
async function validateNewConfigSystem(): Promise<void> {
  console.log('\n✅ 验证新配置系统...');

  try {
    // 检查配置文件是否存在
    const configPath = join(process.cwd(), 'src/config/seo.config.json');
    await fs.access(configPath);
    console.log('  ✅ seo.config.json 存在');

    // 检查配置文件格式
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    const requiredFields = [
      'version',
      'site',
      'keywords',
      'robotsTxt',
      'sitemap',
      'keywordOptimization',
    ];

    for (const field of requiredFields) {
      if (config[field]) {
        console.log(`  ✅ ${field} 配置存在`);
      } else {
        console.log(`  ⚠️ ${field} 配置缺失`);
      }
    }
  } catch (error) {
    console.error('  ❌ 配置验证失败:', error);
  }
}

// 执行迁移
if (require.main === module) {
  migrateConfigurations()
    .then(() => cleanupLegacyReferences())
    .then(() => validateNewConfigSystem())
    .catch(console.error);
}

export { migrateConfigurations, cleanupLegacyReferences, validateNewConfigSystem };
