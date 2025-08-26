import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = path.join(__dirname, '../../');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

describe('单仓库构建流程（符合前端规范）', () => {
  it('package.json 应包含核心脚本', () => {
    const pkg = readJson(path.join(projectRoot, 'package.json'));
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.lint).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });

  it('tsconfig 路径映射与包含目录应正确', () => {
    const tsconfig = readJson(path.join(projectRoot, 'tsconfig.json'));
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();
    // 新规范别名
    expect(tsconfig.compilerOptions.paths['@shared']).toBeDefined();
    expect(tsconfig.include).toEqual(expect.arrayContaining(['config', 'shared-components', 'src']));
    // 测试排除
    expect(tsconfig.exclude.join(' ')).toMatch(/__tests__|\.test\.|tests/);
  });

  it('vite.config.ts 存在并包含 @shared 别名', () => {
    const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
    expect(fs.existsSync(viteConfigPath)).toBe(true);
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    expect(content).toContain("'@shared'");
    expect(content).toContain("shared-components");
  });

  it('不应存在 Jest 配置', () => {
    const jestConfig = path.join(projectRoot, 'jest.config.js');
    expect(fs.existsSync(jestConfig)).toBe(false);
  });

  it('能成功构建（npm run build）', () => {
    try {
      execSync('npm run build', { cwd: projectRoot, stdio: 'pipe', env: { ...process.env } });
    } catch (e) {
      throw new Error(`构建失败: ${e.message}`);
    }
    const distDir = path.join(projectRoot, 'dist');
    expect(fs.existsSync(distDir)).toBe(true);
    const indexFile = path.join(distDir, 'index.html');
    expect(fs.existsSync(indexFile)).toBe(true);
  }, 180000);

  it('当配置绝对资源URL时，产物使用绝对URL', () => {
    // 使用临时环境变量触发绝对URL
    try {
      execSync(
        "VITE_USE_ABSOLUTE_URLS=true VITE_ASSETS_BASE_URL=https://example.com/app npm run build",
        { cwd: projectRoot, stdio: 'pipe', env: { ...process.env } }
      );
    } catch (e) {
      throw new Error(`绝对URL构建失败: ${e.message}`);
    }
    const distDir = path.join(projectRoot, 'dist');
    const indexFile = path.join(distDir, 'index.html');
    const html = fs.readFileSync(indexFile, 'utf8');
    // 入口与动态资源均应指向绝对地址前缀
    expect(html).toMatch(/https:\/\/example\.com\/app\/assets\/[^\s"']+/);
  }, 180000);

  it('部署工作流存在', () => {
    const workflow = path.join(projectRoot, '.github/workflows/deploy.yml');
    expect(fs.existsSync(workflow)).toBe(true);
    const content = fs.readFileSync(workflow, 'utf8');
    // 不强制 pnpm，仅确认存在构建步骤关键词
    expect(content).toMatch(/build/i);
  });
});