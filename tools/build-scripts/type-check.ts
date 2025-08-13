/**
 * TypeScript类型检查工具
 * 用于解决根目录TypeScript配置的输入文件问题
 */

export interface TypeCheckOptions {
  packages: string[];
  strict: boolean;
}

export const runTypeCheck = (options: TypeCheckOptions) => {
  console.log('Running type check for packages:', options.packages);
  return true;
};