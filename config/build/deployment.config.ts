/**
 * 部署配置处理逻辑
 * 从环境变量读取配置，不包含硬编码的配置值
 */

export interface DeploymentConfig {
  /** 应用的基础路径，用于子路径部署 */
  basePath: string;
  /** 静态资源的基础URL - 支持完整URL配置 */
  assetsBaseUrl: string;
  /** 是否使用完整URL而不是相对路径 */
  useAbsoluteUrls: boolean;
  /** 资源服务器配置 */
  assetsServer: {
    /** 资源服务器域名 */
    domain: string;
    /** 资源路径前缀 */
    pathPrefix: string;
    /** 是否启用HTTPS */
    https: boolean;
  };
  /** GitHub Pages 配置 */
  githubPages: {
    /** 仓库名称，用于 GitHub Pages 子路径 */
    repository: string;
    /** 是否启用 GitHub Pages 部署 */
    enabled: boolean;
    /** GitHub Pages 域名 */
    domain: string;
  };
  /** CDN 配置 */
  cdn: {
    /** CDN 基础URL */
    baseUrl: string;
    /** 是否启用 CDN */
    enabled: boolean;
  };
}

/**
 * 从环境变量读取配置值
 */
function getEnvConfig() {
  return {
    // 核心配置
    useAbsoluteUrls: process.env.VITE_USE_ABSOLUTE_URLS === 'true',
    customAssetsBaseUrl: process.env.VITE_ASSETS_BASE_URL || '',
    deployEnv: process.env.VITE_DEPLOY_ENV || 'development',
    basePath: process.env.VITE_BASE_PATH || '/',
    
    // 资源服务器配置
    assetsServerDomain: process.env.VITE_ASSETS_DOMAIN || '',
    assetsPathPrefix: process.env.VITE_ASSETS_PATH_PREFIX || '/assets',
    useHttps: process.env.VITE_ASSETS_HTTPS !== 'false',
    
    // CDN配置
    cdnBaseUrl: process.env.VITE_CDN_BASE_URL || '',
    
    // GitHub Pages配置
    isGitHubPages: process.env.VITE_GITHUB_PAGES === 'true' || process.env.GITHUB_PAGES === 'true' || process.env.CI === 'true',
    githubRepository: process.env.VITE_GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY || '',
    githubUser: process.env.VITE_GITHUB_USER || '',
  };
}

/**
 * 构建资源基础URL的逻辑
 */
function buildAssetsBaseUrl(envConfig: ReturnType<typeof getEnvConfig>): { assetsBaseUrl: string; useAbsoluteUrls: boolean } {
  const {
    useAbsoluteUrls: forceAbsoluteUrls,
    customAssetsBaseUrl,
    cdnBaseUrl,
    assetsServerDomain,
    assetsPathPrefix,
    useHttps,
    isGitHubPages,
    githubRepository,
    githubUser
  } = envConfig;

  // 如果强制使用绝对URL且提供了自定义URL
  if (forceAbsoluteUrls && customAssetsBaseUrl) {
    return {
      assetsBaseUrl: customAssetsBaseUrl.endsWith('/') ? customAssetsBaseUrl.slice(0, -1) : customAssetsBaseUrl,
      useAbsoluteUrls: true
    };
  }

  // 如果配置了CDN
  if (cdnBaseUrl) {
    return {
      assetsBaseUrl: cdnBaseUrl.endsWith('/') ? cdnBaseUrl.slice(0, -1) : cdnBaseUrl,
      useAbsoluteUrls: true
    };
  }

  // 如果配置了自定义资源服务器
  if (assetsServerDomain) {
    const protocol = useHttps ? 'https' : 'http';
    return {
      assetsBaseUrl: `${protocol}://${assetsServerDomain}${assetsPathPrefix}`,
      useAbsoluteUrls: true
    };
  }

  // 如果是GitHub Pages
  if (isGitHubPages && githubRepository) {
    const [user, repo] = githubRepository.split('/');
    const finalUser = user || githubUser;
    const finalRepo = repo || 'long-screenshot-splitter';
    return {
      assetsBaseUrl: `https://${finalUser}.github.io/${finalRepo}`,
      useAbsoluteUrls: true
    };
  }

  // 默认使用相对路径
  return {
    assetsBaseUrl: '.',
    useAbsoluteUrls: false
  };
}

/**
 * 获取当前环境的部署配置
 */
export function getDeploymentConfig(): DeploymentConfig {
  const envConfig = getEnvConfig();
  const { assetsBaseUrl, useAbsoluteUrls } = buildAssetsBaseUrl(envConfig);

  // 处理GitHub Pages的basePath
  let basePath = envConfig.basePath;
  if (envConfig.isGitHubPages && envConfig.githubRepository) {
    const repoName = envConfig.githubRepository.split('/')[1] || 'long-screenshot-splitter';
    basePath = `/${repoName}/`;
  }

  return {
    basePath,
    assetsBaseUrl,
    useAbsoluteUrls,
    
    assetsServer: {
      domain: envConfig.assetsServerDomain,
      pathPrefix: envConfig.assetsPathPrefix,
      https: envConfig.useHttps,
    },
    
    githubPages: {
      repository: envConfig.githubRepository,
      enabled: envConfig.isGitHubPages,
      domain: envConfig.githubUser ? `${envConfig.githubUser}.github.io` : '',
    },
    
    cdn: {
      baseUrl: envConfig.cdnBaseUrl,
      enabled: !!envConfig.cdnBaseUrl,
    },
  };
}

/**
 * 获取静态资源的完整URL
 */
export function getAssetUrl(assetPath: string): string {
  const config = getDeploymentConfig();
  
  // 移除开头的斜杠，确保路径格式正确
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  
  if (config.useAbsoluteUrls) {
    // 使用完整URL（CDN、自定义域名或GitHub Pages）
    return `${config.assetsBaseUrl}/${cleanPath}`;
  }
  
  // 使用相对路径（开发环境或本地部署）
  return `./assets/${cleanPath}`;
}

/**
 * 获取路由的完整URL
 */
export function getRouteUrl(routePath: string): string {
  const config = getDeploymentConfig();
  return `${config.basePath}${routePath}`.replace(/\/+/g, '/');
}

/**
 * 获取完整的资源基础URL（用于动态导入）
 */
export function getAssetsBaseUrl(): string {
  const config = getDeploymentConfig();
  return config.assetsBaseUrl;
}

/**
 * 创建动态导入的完整URL
 */
export function createDynamicImportUrl(modulePath: string): string {
  const config = getDeploymentConfig();
  
  // 移除开头的斜杠和assets前缀
  let cleanPath = modulePath.startsWith('/') ? modulePath.slice(1) : modulePath;
  if (cleanPath.startsWith('assets/')) {
    cleanPath = cleanPath.slice(7); // 移除 'assets/' 前缀
  }
  
  if (config.useAbsoluteUrls) {
    return `${config.assetsBaseUrl}/${cleanPath}`;
  }
  
  return `./assets/${cleanPath}`;
}

// 导出默认配置
export const deploymentConfig = getDeploymentConfig();