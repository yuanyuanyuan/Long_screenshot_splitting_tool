/**
 * 资源路径工具函数
 * 根据配置生成正确的资源路径
 */

import { componentConfig } from '../../component.config.js';

/**
 * 获取资源路径
 * @param {string} filename 文件名
 * @param {string} type 资源类型 ('js' | 'css')
 * @returns {string} 完整的资源路径
 */
export function getAssetPath(filename, type = 'js') {
  const { assets } = componentConfig.deploy;
  
  // 根据资源类型选择对应的路径配置
  let path;
  switch (type) {
    case 'css':
      path = assets.cssPath || assets.basePath || '/assets/';
      break;
    case 'js':
    default:
      path = assets.jsPath || assets.basePath || '/assets/';
      break;
  }
  
  // 移除可能的前缀 ./
  const cleanFilename = filename.replace(/^\.\//, '');
  
  return `${path}${cleanFilename}`;
}

/**
 * 生成脚本标签HTML
 * @param {string} filename 文件名
 * @param {Object} options 选项
 * @returns {string} 脚本标签HTML
 */
export function generateScriptTag(filename, options = {}) {
  const { crossorigin = 'anonymous', type = 'module' } = options;
  const src = getAssetPath(filename, 'js');
  
  return `<script type="${type}" crossorigin="${crossorigin}" src="${src}"></script>`;
}

/**
 * 生成样式链接标签HTML
 * @param {string} filename 文件名
 * @returns {string} 样式链接标签HTML
 */
export function generateStyleTag(filename) {
  const href = getAssetPath(filename, 'css');
  return `<link rel="stylesheet" href="${href}">`;
}

/**
 * 生成模块预加载标签HTML
 * @param {string} filename 文件名
 * @param {Object} options 选项
 * @returns {string} 预加载标签HTML
 */
export function generateModulePreloadTag(filename, options = {}) {
  const { crossorigin = 'anonymous' } = options;
  const href = getAssetPath(filename, 'js');
  
  return `<link rel="modulepreload" crossorigin="${crossorigin}" href="${href}">`;
}