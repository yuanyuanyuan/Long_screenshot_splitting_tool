import { CopyrightConfig } from '../types';

// 说明：使用编译期注入的 import.meta.env，Vite 会在构建时静态替换这些值。
// 注意：.env(.local) 变更后需重启 dev 服务。

// 调试日志：检查 env 读取
console.log('[ENV] COPYRIGHT DEBUG', {
  VITE_COPYRIGHT_AUTHOR: (import.meta as any).env.VITE_COPYRIGHT_AUTHOR,
  VITE_COPYRIGHT_EMAIL: (import.meta as any).env.VITE_COPYRIGHT_EMAIL,
  VITE_COPYRIGHT_WEBSITE: (import.meta as any).env.VITE_COPYRIGHT_WEBSITE,
  VITE_COPYRIGHT_TOOL_NAME: (import.meta as any).env.VITE_COPYRIGHT_TOOL_NAME,
  VITE_COPYRIGHT_YEAR: (import.meta as any).env.VITE_COPYRIGHT_YEAR,
  allEnv: (import.meta as any).env
});

const toNumber = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const defaultCopyrightConfig: CopyrightConfig = {
  author: (import.meta as any).env.VITE_COPYRIGHT_AUTHOR || 'Your Company',
  email: (import.meta as any).env.VITE_COPYRIGHT_EMAIL || '',
  website: (import.meta as any).env.VITE_COPYRIGHT_WEBSITE || '',
  toolName: (import.meta as any).env.VITE_COPYRIGHT_TOOL_NAME || 'Screenshot Splitter Tool',
  license: (import.meta as any).env.VITE_COPYRIGHT_LICENSE || '',
  attributionText: (import.meta as any).env.VITE_COPYRIGHT_ATTRIBUTION || '',
  year: toNumber((import.meta as any).env.VITE_COPYRIGHT_YEAR, new Date().getFullYear()),
  // 开关：true/false/1/0 的简单兼容
  showCopyrightSymbol: ((import.meta as any).env.VITE_COPYRIGHT_SHOW_SYMBOL ?? 'true') !== 'false',
  showContactInfo: ((import.meta as any).env.VITE_COPYRIGHT_SHOW_CONTACT ?? 'true') !== 'false',
  showWebsiteLink: ((import.meta as any).env.VITE_COPYRIGHT_SHOW_WEBSITE ?? 'true') !== 'false',
  showPoweredBy: ((import.meta as any).env.VITE_COPYRIGHT_SHOW_POWERED_BY ?? 'true') !== 'false',
  showLicense: ((import.meta as any).env.VITE_COPYRIGHT_SHOW_LICENSE ?? 'false') === 'true',
  showAttribution: ((import.meta as any).env.VITE_COPYRIGHT_SHOW_ATTRIBUTION ?? 'false') === 'true',
  className: (import.meta as any).env.VITE_COPYRIGHT_CLASSNAME || 'copyright-info',
};

// 若有需要保留的预设（兼容旧用法），基于默认配置派生
export const minimalCopyrightConfig: CopyrightConfig = {
  ...defaultCopyrightConfig,
  email: '',
  website: '',
  toolName: '',
  license: '',
  attributionText: '',
  showContactInfo: false,
  showWebsiteLink: false,
  showPoweredBy: false,
  showLicense: false,
  showAttribution: false,
  className: 'copyright-info-minimal',
};

export const fullCopyrightConfig: CopyrightConfig = {
  ...defaultCopyrightConfig,
  showLicense: true,
  showAttribution: true,
  className: 'copyright-info-full',
};