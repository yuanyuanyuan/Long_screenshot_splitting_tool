// 共享类型定义

export interface ComponentMetadata {
  name: string;
  version: string;
  description: string;
  standalone: boolean;
}

export interface BuildConfig {
  mode: 'singlefile' | 'spa';
  target: string;
  outDir: string;
  base: string;
}

export interface DeploymentConfig {
  githubPages: {
    branch: string;
    directory: string;
    customDomain?: string;
  };
}