#!/usr/bin/env node

/**
 * 构建所有包的脚本
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const packages = ['shared-components', 'ui-library', 'screenshot-splitter'];

console.log('🚀 开始构建所有包...\n');

for (const pkg of packages) {
  const pkgPath = path.join('packages', pkg);
  
  if (!existsSync(pkgPath)) {
    console.log(`⚠️  跳过不存在的包: ${pkg}`);
    continue;
  }
  
  console.log(`📦 构建包: ${pkg}`);
  
  try {
    execSync(`pnpm --filter ${pkg} build`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${pkg} 构建成功\n`);
  } catch (error) {
    console.error(`❌ ${pkg} 构建失败:`, error.message);
    process.exit(1);
  }
}

console.log('🎉 所有包构建完成！');