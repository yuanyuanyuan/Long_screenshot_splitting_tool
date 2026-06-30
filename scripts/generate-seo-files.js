#!/usr/bin/env node

/**
 * SEO文件生成脚本
 * 在构建后生成robots.txt、sitemap.xml等SEO相关文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');

// 加载SEO配置
let seoConfig;
try {
  const seoConfigPath = path.resolve(PROJECT_ROOT, 'src/config/seo.config.json');
  const seoConfigContent = fs.readFileSync(seoConfigPath, 'utf8');
  seoConfig = JSON.parse(seoConfigContent);
  console.log('✅ SEO配置加载成功');
} catch (error) {
  console.error('❌ 无法加载SEO配置:', error.message);
  process.exit(1);
}

/**
 * 生成robots.txt文件
 */
function generateRobotsTxt() {
  const robotsConfig = seoConfig.robotsTxt;
  let robotsContent = '';

  if (robotsConfig.customRules && robotsConfig.customRules.length > 0) {
    // 使用自定义规则
    robotsContent = robotsConfig.customRules.join('\n');
  } else {
    // 生成默认规则
    robotsContent += `User-agent: ${robotsConfig.userAgent}\n`;

    robotsConfig.allow.forEach(rule => {
      robotsContent += `Allow: ${rule}\n`;
    });

    robotsConfig.disallow.forEach(rule => {
      robotsContent += `Disallow: ${rule}\n`;
    });

    if (robotsConfig.crawlDelay) {
      robotsContent += `Crawl-delay: ${robotsConfig.crawlDelay}\n`;
    }

    if (robotsConfig.sitemapUrl) {
      robotsContent += `\nSitemap: ${robotsConfig.sitemapUrl}\n`;
    }
  }

  const robotsPath = path.join(DIST_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsContent.trim());
  console.log('✅ robots.txt 已生成');
}

/**
 * 生成sitemap.xml文件
 */
function generateSitemap() {
  const sitemapConfig = seoConfig.sitemap;

  let sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapContent +=
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  sitemapConfig.staticPages.forEach(page => {
    // 为每种语言生成URL
    page.languages.forEach((lang, index) => {
      const url = index === 0 ? page.url : `/${lang}${page.url === '/' ? '' : page.url}`;
      // 修复URL拼接逻辑 - 避免双斜杠和协议问题
      const cleanBaseUrl = sitemapConfig.baseUrl.endsWith('/')
        ? sitemapConfig.baseUrl.slice(0, -1)
        : sitemapConfig.baseUrl;
      const fullUrl = url === '/' ? cleanBaseUrl : `${cleanBaseUrl}${url}`;

      sitemapContent += '  <url>\n';
      sitemapContent += `    <loc>${fullUrl}</loc>\n`;
      sitemapContent += `    <lastmod>${page.lastmod}</lastmod>\n`;
      sitemapContent += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemapContent += `    <priority>${page.priority}</priority>\n`;

      // 添加多语言链接
      if (page.languages.length > 1) {
        page.languages.forEach(altLang => {
          const altUrl =
            altLang === seoConfig.site.defaultLanguage
              ? page.url
              : `/${altLang}${page.url === '/' ? '' : page.url}`;
          // 修复多语言URL拼接逻辑
          const cleanAltBaseUrl = sitemapConfig.baseUrl.endsWith('/')
            ? sitemapConfig.baseUrl.slice(0, -1)
            : sitemapConfig.baseUrl;
          const altFullUrl = altUrl === '/' ? cleanAltBaseUrl : `${cleanAltBaseUrl}${altUrl}`;
          sitemapContent += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altFullUrl}"/>\n`;
        });
      }

      sitemapContent += '  </url>\n';
    });
  });

  sitemapContent += '</urlset>';

  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log('✅ sitemap.xml 已生成');
}

/**
 * 生成SEO元数据JSON文件（供客户端使用）
 */
function generateSEOMetadata() {
  // 创建运行时SEO元数据
  const runtimeSEO = {
    version: seoConfig.version,
    pages: seoConfig.pages,
    defaultImages: seoConfig.defaultImages,
    site: seoConfig.site,
    keywords: seoConfig.keywords,
    structuredData: seoConfig.structuredData,
    analytics: seoConfig.analytics,
    socialMedia: seoConfig.socialMedia,
    generatedAt: new Date().toISOString(),
  };

  const metadataPath = path.join(DIST_DIR, 'seo-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(runtimeSEO, null, 2));
  console.log('✅ seo-metadata.json 已生成');
}

/**
 * 主执行函数
 */
async function main() {
  console.log('🚀 开始生成SEO文件...');

  // 确保dist目录存在
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist目录不存在，请先运行构建');
    process.exit(1);
  }

  try {
    generateRobotsTxt();
    generateSitemap();
    generateSEOMetadata();

    console.log('🎉 SEO文件生成完成！');
    console.log(`📁 文件位置: ${DIST_DIR}`);
    console.log('📄 生成的文件:');
    console.log('  - robots.txt');
    console.log('  - sitemap.xml');
    console.log('  - seo-metadata.json');
  } catch (error) {
    console.error('❌ SEO文件生成失败:', error.message);
    process.exit(1);
  }
}

// 直接执行时运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as generateSEOFiles };
