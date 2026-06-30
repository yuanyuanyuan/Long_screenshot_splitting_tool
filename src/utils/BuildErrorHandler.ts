/**
 * 构建错误处理器 - 检测和处理多仓库架构下的构建错误
 * 提供友好的错误提示和解决方案建议
 */

export interface BuildError {
  type: 'workspace' | 'dependency' | 'config' | 'unknown';
  message: string;
  originalError?: Error;
  suggestions: string[];
  severity: 'error' | 'warning' | 'info';
}

export interface BuildErrorContext {
  command?: string;
  environment?: string;
  configPath?: string;
  dependencies?: Record<string, string>;
}

export class BuildErrorHandler {
  private errorPatterns: Map<
    RegExp,
    (match: RegExpMatchArray, context?: BuildErrorContext) => BuildError
  >;

  constructor() {
    this.errorPatterns = new Map();
    this.initializeErrorPatterns();
  }

  /**
   * 初始化错误模式匹配规则
   */
  private initializeErrorPatterns(): void {
    // Workspace相关错误
    this.errorPatterns.set(/workspace.*not.*found|workspace.*missing/i, () => ({
      type: 'workspace',
      message: '检测到workspace相关错误',
      suggestions: [
        '确认已完全移除pnpm-workspace.yaml文件',
        '检查package.json中是否还有workspaces配置',
        '将workspace:*依赖替换为file:或具体版本',
        '重新安装依赖: rm -rf node_modules && npm install',
      ],
      severity: 'error',
    }));

    // 依赖解析错误
    this.errorPatterns.set(/cannot.*resolve.*module|module.*not.*found/i, (match, _context) => ({
      type: 'dependency',
      message: `模块解析失败: ${match[0]}`,
      suggestions: [
        '检查依赖是否已正确安装',
        '验证import路径是否正确',
        '确认shared-components在正确的相对路径位置',
        '运行npm install重新安装依赖',
        '检查TypeScript配置中的路径映射',
      ],
      severity: 'error',
    }));

    // 配置文件错误
    this.errorPatterns.set(/config.*not.*found|invalid.*config/i, (match, _context) => ({
      type: 'config',
      message: `配置文件错误: ${match[0]}`,
      suggestions: [
        '检查config目录结构是否完整',
        '验证配置文件语法是否正确',
        '确认环境变量配置是否正确',
        '检查TypeScript配置文件',
        '重新生成配置文件',
      ],
      severity: 'error',
    }));

    // Vite构建错误
    this.errorPatterns.set(/vite.*error|build.*failed/i, () => ({
      type: 'config',
      message: 'Vite构建失败',
      suggestions: [
        '检查vite.config.ts配置是否正确',
        '验证构建目标和输出配置',
        '清除构建缓存: rm -rf dist .vite',
        '检查依赖兼容性',
        '尝试更新Vite版本',
      ],
      severity: 'error',
    }));

    // TypeScript错误
    this.errorPatterns.set(/typescript.*error|type.*error/i, () => ({
      type: 'config',
      message: 'TypeScript类型错误',
      suggestions: [
        '检查tsconfig.json配置',
        '验证类型定义文件',
        '更新@types包版本',
        '检查路径映射配置',
        '运行tsc --noEmit检查类型',
      ],
      severity: 'warning',
    }));
  }

  /**
   * 分析并处理构建错误
   */
  handleBuildError(error: Error | string, context?: BuildErrorContext): BuildError {
    const errorMessage = typeof error === 'string' ? error : error.message;

    // 尝试匹配已知错误模式
    for (const [pattern, handler] of this.errorPatterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        const buildError = handler(match, context);
        buildError.originalError = typeof error === 'object' ? error : undefined;
        return buildError;
      }
    }

    // 未知错误的通用处理
    return {
      type: 'unknown',
      message: errorMessage,
      originalError: typeof error === 'object' ? error : undefined,
      suggestions: [
        '检查错误日志获取更多信息',
        '确认所有依赖已正确安装',
        '尝试清除缓存并重新构建',
        '检查Node.js和npm版本兼容性',
        '查看项目文档或联系开发团队',
      ],
      severity: 'error',
    };
  }

  /**
   * 格式化错误信息用于显示
   */
  formatError(buildError: BuildError): string {
    const severityIcon = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const icon = severityIcon[buildError.severity];

    return `
${icon} 构建错误 [${buildError.type.toUpperCase()}]

错误信息:
${buildError.message}

建议解决方案:
${buildError.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}

${buildError.originalError ? `\n原始错误:\n${buildError.originalError.stack || buildError.originalError.message}` : ''}
    `.trim();
  }

  /**
   * 检查构建环境配置
   */
  async validateBuildEnvironment(): Promise<{
    valid: boolean;
    issues: BuildError[];
  }> {
    const issues: BuildError[] = [];

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      // 检查关键配置文件
      const configFiles = ['package.json', 'vite.config.ts', 'tsconfig.json'];

      for (const configFile of configFiles) {
        try {
          const fullPath = path.join(process.cwd(), configFile);
          await fs.access(fullPath);
        } catch {
          issues.push({
            type: 'config',
            message: `缺少配置文件: ${configFile}`,
            suggestions: [`创建 ${configFile} 文件`, '参考项目模板或文档', '检查文件路径是否正确'],
            severity: configFile === 'package.json' ? 'error' : 'warning',
          });
        }
      }

      // 检查workspace残留
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

        if (packageJson.workspaces) {
          issues.push({
            type: 'workspace',
            message: '检测到workspace配置残留',
            suggestions: ['移除package.json中的workspaces字段', '确认已完全迁移到多仓库架构'],
            severity: 'error',
          });
        }

        // 检查workspace依赖
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        for (const [name, version] of Object.entries(allDeps)) {
          if (typeof version === 'string' && version.startsWith('workspace:')) {
            issues.push({
              type: 'workspace',
              message: `发现workspace依赖: ${name}@${version}`,
              suggestions: [`将${name}依赖改为file:路径或具体版本号`, '重新安装依赖'],
              severity: 'error',
            });
          }
        }
      } catch (error) {
        issues.push({
          type: 'config',
          message: '无法读取package.json',
          originalError: error as Error,
          suggestions: ['检查package.json文件是否存在', '验证JSON语法是否正确'],
          severity: 'error',
        });
      }

      // 检查pnpm-workspace.yaml是否已删除
      try {
        const workspaceConfigPath = path.join(process.cwd(), '../../pnpm-workspace.yaml');
        await fs.access(workspaceConfigPath);
        issues.push({
          type: 'workspace',
          message: '检测到pnpm-workspace.yaml文件仍然存在',
          suggestions: ['删除根目录的pnpm-workspace.yaml文件', '确认已完全迁移到多仓库架构'],
          severity: 'error',
        });
      } catch {
        // 文件不存在是正确的
      }
    } catch (error) {
      issues.push({
        type: 'unknown',
        message: '环境验证过程中发生错误',
        originalError: error as Error,
        suggestions: ['检查文件系统权限', '确认当前工作目录正确'],
        severity: 'error',
      });
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * 监听构建过程并自动处理错误
   */
  async watchBuildProcess(buildCommand: string): Promise<void> {
    const { spawn } = await import('child_process');

    console.log(`🔧 开始监听构建过程: ${buildCommand}`);

    const child = spawn(buildCommand, { shell: true, stdio: 'pipe' });

    child.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(output);
    });

    child.stderr?.on('data', (data: Buffer) => {
      const errorOutput = data.toString();
      const buildError = this.handleBuildError(errorOutput);

      if (buildError.severity === 'error') {
        console.error(this.formatError(buildError));
      } else {
        console.warn(this.formatError(buildError));
      }
    });

    child.on('close', (code: number) => {
      if (code === 0) {
        console.log('✅ 构建成功完成');
      } else {
        console.error(`❌ 构建失败，退出码: ${code}`);
      }
    });
  }
}

// 导出单例实例
export const buildErrorHandler = new BuildErrorHandler();
