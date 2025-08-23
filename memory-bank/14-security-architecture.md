
# 文档 14: 安全架构 (Security Architecture)

## 1. 概述

本文档对 `dual-build-monorepo-system` 项目的安全架构进行分析。对于任何应用，安全都是一个至关重要的方面。由于本项目是一个纯客户端应用，其安全模型与传统的客户端-服务器应用有着显著的不同。

本项目的核心安全策略是**最小化攻击面**，这主要通过以下两点实现：
1.  **数据不出浏览器**: 核心功能在客户端完成，用户数据（上传的图片）不经过任何网络传输，从根本上消除了数据在传输过程中被窃取或泄露的风险。
2.  **无后端服务**: 由于没有后端服务器、数据库或需要认证的 API，因此不存在服务器被入侵、数据库泄露、身份认证被绕过等常见的 Web 安全漏洞。

然而，作为现代 Web 应用，它仍然面临着两大主要安全考量：**软件供应链安全** 和 **浏览器环境安全**。

## 2. 架构图

应用的安全边界可以清晰地定义在用户的浏览器内部。

```mermaid
graph TD
    subgraph User's Computer
        subgraph Browser Sandbox
            A[screenshot-splitter App]
            B[User Data (Images)]
            C[Browser APIs (Canvas, Worker)]
        end
        D[Local Filesystem]
    end

    subgraph Internet
        E[NPM Registry (Dependencies)]
    end

    D -- "Data Flow (Local)" --- B;
    B -- "Data Flow (Local)" --- C;
    C -- "Data Flow (Local)" --- A;
    A -- "Data Flow (Local)" --> D;
    
    E -- "Dependency Flow (During Development)" --> A;

    style A fill:#cde,stroke:#333,stroke-width:2px
    style B fill:#fcd,stroke:#333,stroke-width:2px
```
该图显示：
*   **用户数据流 (红色)**: 完全封闭在用户的计算机内部，这是系统最强的安全保障。
*   **依赖流 (蓝色)**: 项目的唯一外部连接是在开发和构建阶段从 NPM 拉取第三方依赖。这构成了主要的潜在安全风险（即供应链攻击）。

## 3. 代码示例 (安全实践)

React 框架自身通过 **JSX 自动转义** 提供了针对跨站脚本攻击 (XSS) 的基础防护。

**场景**: 假设应用需要显示用户输入的文件名。
```typescript
// In a React component
constfileName = "user_provided_filename.png";
// const maliciousFileName = "<img src='x' onerror='alert(\"XSS Attack!\")'>";

return (
  <div>
    {/* React会自动转义fileName变量，使其作为纯文本显示 */}
    {/* 如果fileName是恶意字符串，其中的HTML标签会失效 */}
    <h1>Processing: {fileName}</h1>
  </div>
);
```
当渲染 `{fileName}` 时，React 会将 `<` 和 `>` 等特殊字符转换为 `&lt;` 和 `&gt;`，使其无法被浏览器作为 HTML 执行。这有效地防止了最常见的 XSS 攻击向量。

## 4. 配置示例 (潜在改进)

当前项目的 `package.json` 中**没有**专门用于依赖安全审计的脚本。这是一个可以增强的领域。

**建议在根 `package.json` 中添加以下脚本**:
```json
{
  "scripts": {
    // ... other scripts
    "audit:check": "pnpm audit",
    "audit:fix": "pnpm audit --fix"
  }
}
```
*   `pnpm audit`: 会根据 `pnpm-lock.yaml` 文件检查所有依赖项（包括子依赖）是否存在已知的安全漏洞。
*   `pnpm audit --fix`: 会尝试自动更新到不存在已知漏洞的安全版本。

将 `audit:check` 命令集成到 CI/CD 流程中，可以在每次代码提交或合并时自动扫描依赖，从而主动地管理供应链安全风险。

## 5. 最佳实践

*   **保持依赖更新**: 定期（例如，每周或每月）运行 `pnpm up --latest` 来更新所有依赖项到最新版本，并运行 `pnpm audit` 来检查新出现的漏洞。可以使用 GitHub 的 Dependabot 等工具来自动化这个过程。
*   **最小权限原则**: 对于项目使用的任何第三方库，都应了解其功能范围。例如，一个颜色处理库不应该需要访问网络或文件系统。
*   **使用 HTTPS**: 应用部署时必须使用 HTTPS。这可以防止中间人攻击，确保用户与应用之间的通信（即使只是加载静态资源）是加密的。静态托管平台（如 Vercel, Netlify）通常会默认并强制启用 HTTPS。
*   **内容安全策略 (CSP)**: 在部署时，可以通过 HTTP 头配置一个严格的 CSP。这可以进一步限制浏览器只能从可信的来源加载资源（脚本、样式、图片等），为防范 XSS 攻击提供了第二层深度防御。

## 6. 案例分析

**场景**: `screenshot-splitter` 所依赖的一个 npm 包 `some-utility-library` 被发现存在一个严重的安全漏洞，允许通过特制的图片文件执行任意代码。

由于当前的安全架构，风险评估和应对措施如下：
1.  **风险暴露面**:
    *   **高风险**: 依赖该库的开发人员在本地构建项目时，或者 CI/CD 系统在构建时，可能会受到攻击。
    *   **中风险**: 如果该漏洞能影响到运行在浏览器中的客户端代码，那么使用该应用的用户可能会受到攻击。
    *   **无风险**: 用户的数据（图片）是安全的，因为它们从未上传到服务器。
2.  **应对措施**:
    *   **立即执行依赖审计**: 运行 `pnpm audit` 会立即报告 `some-utility-library` 存在漏洞。
    *   **修复**: 运行 `pnpm audit --fix` 或手动更新该库到已修复漏洞的版本。
    *   **验证**: 重新运行测试以确保更新没有破坏任何功能。
    *   **重新部署**: 立即部署修复后的新版本。

这个案例说明，对于纯客户端应用，**软件供应链是其最脆弱的环节**。因此，建立一套自动化的依赖审计和更新流程是其安全架构中至关重要的一环。
