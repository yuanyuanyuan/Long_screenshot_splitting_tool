import { createAutoConfig } from '../../vite.config.base.js';
import { getBuildConfig, printBuildInfo, getAssetsBaseUrl } from '../../tools/build-scripts/env-config.js';

// 打印构建信息
printBuildInfo();

// 获取构建配置
const buildConfig = getBuildConfig({
  component: 'screenshot-splitter',
});

// 获取资源基础URL
const assetsBaseUrl = getAssetsBaseUrl();

// 导出配置
export default createAutoConfig({
  root: import.meta.dirname,
  component: 'screenshot-splitter',
  base: buildConfig.base,
  assetsBaseUrl: assetsBaseUrl,
  env: {
    COMPONENT_NAME: 'screenshot-splitter',
    BUILD_MODE: buildConfig.mode,
    ASSETS_BASE_URL: assetsBaseUrl || '',
  },
});
