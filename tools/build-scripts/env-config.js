/**
 * 环境变量配置管理
 */

/**
 * 获取构建模式
 * @returns {string} 构建模式 ('spa' | 'singlefile')
 */
export function getBuildMode() {
  return process.env.VITE_BUILD_MODE || 
         process.env.BUILD_MODE || 
         process.env.MODE || 
         'spa';
}

/**
 * 获取组件名称
 * @returns {string} 组件名称
 */
export function getComponentName() {
  return process.env.VITE_COMPONENT || 
         process.env.COMPONENT || 
         '';
}

/**
 * 获取构建环境
 * @returns {string} 构建环境 ('development' | 'production')
 */
export function getBuildEnv() {
  return process.env.NODE_ENV || 'development';
}

/**
 * 检查是否为生产环境
 * @returns {boolean}
 */
export function isProduction() {
  return getBuildEnv() === 'production';
}

/**
 * 检查是否为单文件模式
 * @returns {boolean}
 */
export function isSingleFileMode() {
  return getBuildMode() === 'singlefile';
}

/**
 * 获取输出目录
 * @param {string} component - 组件名称
 * @returns {string} 输出目录路径
 */
export function getOutputDir(component = '') {
  const baseDir = 'dist';
  if (component) {
    return `${baseDir}/${component}`;
  }
  return baseDir;
}

/**
 * 获取基础路径
 * @param {string} component - 组件名称
 * @returns {string} 基础路径
 */
export function getBasePath(component = '') {
  if (process.env.GITHUB_PAGES) {
    const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
    if (component) {
      return `/${repo}/${component}/`;
    }
    return `/${repo}/`;
  }
  return './';
}

/**
 * 获取完整的构建配置
 * @param {Object} options - 额外选项
 * @returns {Object} 完整的构建配置
 */
export function getBuildConfig(options = {}) {
  const mode = getBuildMode();
  const component = getComponentName();
  const env = getBuildEnv();
  
  return {
    mode,
    component,
    env,
    isProduction: isProduction(),
    isSingleFile: isSingleFileMode(),
    outDir: getOutputDir(component),
    base: getBasePath(component),
    ...options
  };
}

/**
 * 打印构建配置信息
 */
export function printBuildInfo() {
  const config = getBuildConfig();
  
  console.log('🔧 构建配置信息:');
  console.log(`   模式: ${config.mode}`);
  console.log(`   环境: ${config.env}`);
  console.log(`   组件: ${config.component || '主应用'}`);
  console.log(`   输出目录: ${config.outDir}`);
  console.log(`   基础路径: ${config.base}`);
  console.log(`   单文件模式: ${config.isSingleFile ? '是' : '否'}`);
}