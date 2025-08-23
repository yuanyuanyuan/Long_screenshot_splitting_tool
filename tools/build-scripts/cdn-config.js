/**
 * CDN外部库配置管理
 */

/**
 * CDN库配置（包含主备CDN）
 */
export const CDN_LIBS = {
  // React生态
  react: {
    global: 'React',
    url: 'https://unpkg.com/react@19/umd/react.production.min.js',
    fallback: 'https://cdn.jsdelivr.net/npm/react@19/umd/react.production.min.js',
    dev: 'https://unpkg.com/react@19/umd/react.development.js',
    devFallback: 'https://cdn.jsdelivr.net/npm/react@19/umd/react.development.js'
  },
  'react-dom': {
    global: 'ReactDOM',
    url: 'https://unpkg.com/react-dom@19/umd/react-dom.production.min.js',
    fallback: 'https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.production.min.js',
    dev: 'https://unpkg.com/react-dom@19/umd/react-dom.development.js',
    devFallback: 'https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.development.js'
  },
  
  // 工具库
  lodash: {
    global: '_',
    url: 'https://unpkg.com/lodash@4/lodash.min.js',
    fallback: 'https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js'
  },
  
  // 日期处理
  'date-fns': {
    global: 'dateFns',
    url: 'https://unpkg.com/date-fns@2/index.js',
    fallback: 'https://cdn.jsdelivr.net/npm/date-fns@2/index.js'
  }
};

/**
 * 获取CDN脚本URL（包含fallback机制）
 * @param {boolean} isDev - 是否为开发环境
 * @returns {Array<{primary: string, fallback: string}>} CDN URL配置数组
 */
export function getCdnScriptsWithFallback(isDev = false) {
  return Object.values(CDN_LIBS).map(config => {
    const primary = isDev && config.dev ? config.dev : config.url;
    const fallback = isDev && config.devFallback ? config.devFallback : config.fallback;
    
    return {
      primary,
      fallback: fallback || primary // 如果没有fallback，使用主URL
    };
  });
}

/**
 * 生成带fallback的HTML脚本标签
 * @param {boolean} isDev - 是否为开发环境
 * @returns {string} HTML脚本标签字符串
 */
export function generateCdnScriptTagsWithFallback(isDev = false) {
  const scripts = getCdnScriptsWithFallback(isDev);
  
  return scripts.map(({ primary, fallback }) => 
    `<script crossorigin src="${primary}" onerror="this.src='${fallback}'"></script>`
  ).join('\n    ');
}

/**
 * 获取外部库映射配置
 * @param {boolean} isDev - 是否为开发环境
 * @returns {Object} 外部库映射
 */
export function getExternalsConfig(isDev = false) {
  const externals = {};
  
  Object.entries(CDN_LIBS).forEach(([name, config]) => {
    externals[name] = config.global;
  });
  
  return externals;
}

/**
 * 获取CDN脚本标签
 * @param {boolean} isDev - 是否为开发环境
 * @returns {string[]} CDN脚本URL数组
 */
export function getCdnScripts(isDev = false) {
  return Object.values(CDN_LIBS).map(config => {
    return isDev && config.dev ? config.dev : config.url;
  });
}

/**
 * 生成HTML中的CDN脚本标签
 * @param {boolean} isDev - 是否为开发环境
 * @returns {string} HTML脚本标签字符串
 */
export function generateCdnScriptTags(isDev = false) {
  const scripts = getCdnScripts(isDev);
  
  return scripts.map(url => 
    `<script crossorigin src="${url}"></script>`
  ).join('\n    ');
}

/**
 * 检查库是否应该外部化
 * @param {string} id - 模块ID
 * @returns {boolean} 是否应该外部化
 */
export function shouldExternalize(id) {
  return Object.keys(CDN_LIBS).includes(id);
}

/**
 * 获取优化后的外部库配置
 * @param {Object} options - 配置选项
 * @returns {Object} 优化后的配置
 */
export function getOptimizedExternalsConfig(options = {}) {
  const { 
    includeReact = true, 
    includeLodash = false,
    includeDateFns = false 
  } = options;
  
  const config = {};
  
  if (includeReact) {
    config.react = CDN_LIBS.react.global;
    config['react-dom'] = CDN_LIBS['react-dom'].global;
  }
  
  if (includeLodash) {
    config.lodash = CDN_LIBS.lodash.global;
  }
  
  if (includeDateFns) {
    config['date-fns'] = CDN_LIBS['date-fns'].global;
  }
  
  return config;
}