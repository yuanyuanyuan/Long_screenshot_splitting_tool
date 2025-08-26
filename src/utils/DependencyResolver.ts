/**
 * 依赖解析器 - 处理多仓库架构下的依赖解析
 * 提供fallback机制和详细的错误处理
 */

export interface DependencyResolutionOptions {
  fallbackPaths?: string[];
  enableLogging?: boolean;
  throwOnError?: boolean;
}

export interface DependencyResolutionResult {
  success: boolean;
  resolvedPath?: string;
  error?: string;
  fallbackUsed?: boolean;
}

export class DependencyResolver {
  private options: Required<DependencyResolutionOptions>;

  constructor(options: DependencyResolutionOptions = {}) {
    this.options = {
      fallbackPaths: options.fallbackPaths || [],
      enableLogging: options.enableLogging ?? true,
      throwOnError: options.throwOnError ?? false,
    };
  }

  /**
   * 解析依赖路径，支持fallback机制
   */
  async resolveDependency(
    dependencyName: string,
    primaryPath?: string
  ): Promise<DependencyResolutionResult> {
    const paths = [
      primaryPath,
      ...this.options.fallbackPaths,
      `../shared-components`, // 默认共享组件路径
      `../../shared-components`, // 备用共享组件路径
    ].filter(Boolean) as string[];

    for (const path of paths) {
      try {
        const resolvedPath = await this.tryResolvePath(path, dependencyName);
        if (resolvedPath) {
          this.log(`✓ 成功解析依赖 ${dependencyName} 到路径: ${resolvedPath}`);
          return {
            success: true,
            resolvedPath,
            fallbackUsed: path !== primaryPath,
          };
        }
      } catch (error) {
        this.log(`✗ 路径 ${path} 解析失败: ${error}`);
        continue;
      }
    }

    const errorMessage = this.generateErrorMessage(dependencyName, paths);
    this.log(`✗ 依赖解析失败: ${errorMessage}`);

    if (this.options.throwOnError) {
      throw new Error(errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * 尝试解析单个路径
   */
  private async tryResolvePath(
    basePath: string,
    dependencyName: string
  ): Promise<string | null> {
    try {
      // 检查是否为相对路径依赖
      if (basePath.startsWith('../') || basePath.startsWith('./')) {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const fullPath = path.resolve(process.cwd(), basePath);
        const packageJsonPath = path.join(fullPath, 'package.json');
        
        // 检查package.json是否存在
        await fs.access(packageJsonPath);
        
        const packageJson = JSON.parse(
          await fs.readFile(packageJsonPath, 'utf-8')
        );
        
        // 验证包名是否匹配
        if (packageJson.name === dependencyName || basePath.includes(dependencyName)) {
          return fullPath;
        }
      }
      
      // 对于npm包，尝试require.resolve
      return require.resolve(dependencyName);
    } catch (error) {
      return null;
    }
  }

  /**
   * 生成详细的错误信息和解决方案建议
   */
  private generateErrorMessage(dependencyName: string, attemptedPaths: string[]): string {
    const suggestions = this.generateSuggestions(dependencyName);
    
    return `
无法解析依赖: ${dependencyName}

尝试的路径:
${attemptedPaths.map(path => `  - ${path}`).join('\n')}

可能的解决方案:
${suggestions.map(suggestion => `  • ${suggestion}`).join('\n')}

如果问题持续存在，请检查:
1. 依赖是否已正确安装
2. 路径配置是否正确
3. 是否需要运行 npm install 或 pnpm install
    `.trim();
  }

  /**
   * 根据依赖名称生成解决方案建议
   */
  private generateSuggestions(dependencyName: string): string[] {
    const suggestions: string[] = [];

    if (dependencyName.includes('shared-components')) {
      suggestions.push('确保 shared-components 包在正确的相对路径位置');
      suggestions.push('检查 shared-components/package.json 是否存在');
      suggestions.push('验证 shared-components 包的 name 字段是否正确');
    }

    if (dependencyName.startsWith('@')) {
      suggestions.push(`运行 npm install ${dependencyName} 安装scoped包`);
    } else {
      suggestions.push(`运行 npm install ${dependencyName} 安装依赖`);
    }

    suggestions.push('检查 package.json 中的依赖声明是否正确');
    suggestions.push('清除 node_modules 并重新安装依赖');

    return suggestions;
  }

  /**
   * 记录日志信息
   */
  private log(message: string): void {
    if (this.options.enableLogging) {
      console.log(`[DependencyResolver] ${message}`);
    }
  }

  /**
   * 验证当前项目的依赖配置
   */
  async validateDependencies(): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // 检查package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, 'utf-8')
      );

      // 检查workspace配置（应该已移除）
      if (packageJson.workspaces) {
        issues.push('检测到 workspaces 配置，这在多仓库架构中应该被移除');
        suggestions.push('移除 package.json 中的 workspaces 字段');
      }

      // 检查workspace:*依赖（应该已替换）
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      for (const [name, version] of Object.entries(allDeps)) {
        if (typeof version === 'string' && version.startsWith('workspace:')) {
          issues.push(`发现 workspace 依赖: ${name}@${version}`);
          suggestions.push(`将 ${name} 的依赖改为 file: 或具体版本号`);
        }
      }

      // 检查共享组件路径
      const sharedComponentsPath = path.resolve(process.cwd(), '../shared-components');
      try {
        await fs.access(sharedComponentsPath);
      } catch {
        issues.push('无法访问 shared-components 目录');
        suggestions.push('确保 shared-components 在正确的相对路径位置');
      }

    } catch (error) {
      issues.push(`验证过程中发生错误: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}

// 导出单例实例
export const dependencyResolver = new DependencyResolver({
  enableLogging: process.env.NODE_ENV === 'development',
  throwOnError: false,
});