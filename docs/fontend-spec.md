

### **Prompt: 多仓库（Multi-repo）项目架构技术规范**

#### **1. 核心理念**

本项目采用\*\*多仓库（Multi-repo）\*\*模式进行代码组织与管理。每个独立的应用或共享库都将在其专属的 Git 仓库中进行开发、版本控制和部署。此架构旨在实现以下核心目标：

  * **完全解耦**: 各项目拥有独立的开发、构建、测试和部署生命周期，互不干扰。
  * **清晰的所有权与职责**: 每个仓库的职责边界清晰，便于团队分工、代码所有权划分及权限管理。
  * **独立的版本控制**: 所有共享包必须遵循**语义化版本控制（Semantic Versioning）**，允许应用方精确控制依赖版本，实现渐进式、低风险的更新策略。

#### **2. 整体架构与工作流**

本架构由**应用仓库**和**共享包仓库**两大类组成，它们之间通过一个**私有NPM仓库**（例如 GitHub Packages, Verdaccio, Sonatype Nexus 等）进行通信和依赖管理。

**架构工作流示意图:**

```plaintext
+---------------------------+        publishes       +-----------------------+
|  共享包仓库               | --------------------> |   私有 NPM 仓库       |
|  (e.g., shared-components) |                      | (Private NPM Registry)|
+---------------------------+       <-------------------- | -----------------------+
                                        installs
                                          |
+---------------------------+             |
|  应用仓库                 |-------------+
|  (e.g., screenshot-splitter)|
+---------------------------+
```

#### **3. 仓库结构规范**

##### **3.1. 应用仓库 (Application Repository)**

  * **定义**: 包含完整业务逻辑、可独立构建和部署的前端或后端应用。
  * **示例**: `screenshot-splitter-repo`

**目录结构:**

```plaintext
/
|-- src/
|   |-- components/ (仅供此应用内部使用的业务组件)
|   |-- layouts/
|   |-- hooks/
|   |-- locales/
|   |-- styles/
|   |-- utils/ (仅供此应用内部使用的工具函数)
|   `-- index.tsx (应用入口)
|-- docs/ (应用相关的文档)
|-- config/ (应用的环境变量与配置)
|-- .gitignore
|-- package.json
`-- tsconfig.json
```

**`package.json` 依赖示例:**

```json
{
  "name": "screenshot-splitter",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@your-org/shared-components": "^1.2.0",
    "@your-org/utils": "^2.0.1",
    "react": "...",
    "react-dom": "..."
  }
}
```

##### **3.2. 共享包仓库 (Shared Package Repository)**

  * **定义**: 可被多个应用仓库复用的代码库，必须能作为独立的NPM包进行发布。
  * **示例**: `shared-components-repo`, `utils-repo`

**目录结构 (`shared-components-repo`):**

```plaintext
/
|-- src/
|   |-- ComponentA/
|   |   |-- hooks/
|   |   |-- styles/
|   |   `-- index.tsx
|   |-- ComponentB/
|   `-- index.ts (统一导出所有组件)
|-- docs/ (可选，详细文档)
|-- .gitignore
|-- README.md (核心文档，必须遵循文档规范)
|-- package.json (定义包名、版本和发布脚本)
`-- tsconfig.json
```

**`package.json` 定义示例:**

```json
{
  "name": "@your-org/shared-components",
  "version": "1.2.0",
  "description": "A shared component library for YourOrg projects.",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "prepublishOnly": "npm run build",
    "release": "npm publish --registry=https://your-private-registry.com"
  },
  "peerDependencies": {
    "react": ">=17.0.0"
  }
}
```

#### **4. 核心开发与发布流程**

1.  **修改共享包**: 开发者在对应的共享包仓库（如 `shared-components-repo`）中进行代码修改或功能开发。
2.  **提升版本**: 修改完成后，必须根据修改内容（修复、新增功能、破坏性变更）更新 `package.json` 中的 `version` 字段。
3.  **发布共享包**: 运行发布脚本（如 `npm run release`），将新版本的包构建并发布到私有NPM仓库。
4.  **更新应用**: 在应用仓库（如 `screenshot-splitter-repo`）中，运行 `npm update @your-org/shared-components` 或 `pnpm/yarn` 的等效命令，以在其 `package.json` 中引入新版本的共享包。
5.  **集成与测试**: 在应用中进行集成测试，确保新版本的共享包能够正常工作。
6.  **部署应用**: 测试通过后，提交应用的 lock 文件变更，并正常执行应用的部署流程。

#### **5. 文档规范**

所有共享包仓库的 `README.md` 或 `docs` 目录必须为其中导出的每个主要模块或组件提供详尽的文档。文档必须严格遵循以下模板：

> #### **`组件名称`**
>
> **1. 用途说明 (Purpose)**
>
> > *清晰、简洁地描述这个组件是做什么的，以及它的适用场景。*
>
> **2. Props API**
>
> > *使用表格详细介绍每个 `prop` 的类型、作用、默认值和是否必需。*
>
> | 属性 (Prop) | 类型 (Type)     | 描述 (Description)             | 默认值 (Default) | 是否必需 (Required) |
> | :---------- | :-------------- | :----------------------------- | :--------------- | :---------------- |
> | `variant`   | `'primary'\|'secondary'` | 定义了组件的样式变体。         | `'primary'`      | No                |
> | `onClick`   | `() => void`    | 点击事件的回调函数。           | `-`              | Yes               |
>
> **3. 使用示例 (Usage Examples)**
>
> > *提供一或多个清晰、可直接复制的代码片段来展示组件的基本用法和高级用法。*
>
> ```tsx
> import { ComponentA } from '@your-org/shared-components';
> ```

> const App = () =\> {
> const handleClick = () =\> {
> console.log('Component clicked\!');
> };

> return <ComponentA onClick={handleClick} />;
> };
>
> ```
> 
> **4. 注意事项 (Caveats)**

> > *列出所有需要特别注意的使用场景、限制或潜在问题。*

> >   * 例如：此组件的性能在渲染超过1000个子项时会下降。
> >   * 例如：`children` 属性目前只接受文本节点。
> ```

#### **6. 技术与工具约束**

  * **必须**: 建立并使用一个统一的**私有NPM仓库**来托管所有内部共享包。
  * **必须**: 所有共享包的发布都必须遵循**语义化版本控制**。
  * **禁止**: 项目中**不使用** Storybook 或其他类似的UI组件开发环境及文档生成工具。所有组件文档必须手动维护在 `README.md` 文件中。


#### **7. 编码与设计原则 (Coding & Design Principles)**

此章节旨在将《代码简洁之道》与面向接口编程的思想融入日常开发，是提升代码质量与可维护性的基石。

**7.1. SOLID原则的贯彻**
* **单一职责原则 (SRP)**: 每个组件或函数只做一件事。一个组件应只有一个引起其变化的原因。例如，UI展示和数据获取逻辑应分离到不同的组件或Hooks中。
* **开放/封闭原则 (OCP)**: 组件应“对扩展开放，对修改封闭”。优先使用Props和组合（Composition）的方式来扩展组件功能，而不是直接修改其内部源码。
* **里氏替换原则 (LSP)**: 在使用组件继承或组合时，子组件必须能够完全替代父组件，而不影响程序的正确性。
* **接口隔离原则 (ISP)**: 组件的Props接口应尽量小而专。避免创建一个包含过多可选属性的“上帝”组件，应将其拆分为更小的、职责更专一的组件。
* **依赖倒置原则 (DIP)**: 高层模块（如业务页面）不应依赖于底层模块（如具体UI组件），两者都应依赖于抽象（如Props接口定义）。

**7.2. 接口定义与组件API设计**
* **接口先行**: 在编写组件实现之前，首先使用TypeScript的`interface`或`type`精确定义其Props。这个接口就是组件的“契约”，是其与外部世界交互的唯一方式。
* **意图明确的命名**: 无论是组件名、Props名还是事件回调名，都必须清晰地反映其意图。例如，使用`onItemSelect`而不是`onClick`，使用`isLoading`而不是`flag`。
* **最小暴露原则**: 只通过Props暴露组件的必要状态和行为。组件内部的状态和实现细节应被完全封装，对外部透明。
* **数据驱动**: 组件的状态应由外部通过Props传入，自身的内部状态（State）应尽可能少。优先设计为受控组件（Controlled Components）。

**7.3. 代码整洁度**
* **小函数/小组件**: 一个函数或一个组件的渲染部分不应超过一个屏幕的高度（约50-100行）。过大的单元必须被重构和拆分。
* **代码即文档**: 追求自解释的代码。只有在解释“为什么”这么做，而不是“做什么”时才添加注释。
* **避免副作用**: 工具函数（`packages/utils`）必须是纯函数，无任何副作用，给定相同的输入，永远返回相同的输出。


##### **示例 for 7.1: 单一职责原则 (SRP)**

**[反例]** 一个组件既负责获取数据，又负责渲染UI：

```tsx
// Bad: UserList.tsx - 职责混杂
import React, { useState, useEffect } from 'react';

// 这个组件做了三件事：
// 1. 管理加载和错误状态
// 2. 发起API请求获取用户
// 3. 渲染用户列表
export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => setError(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching users!</div>;

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
};
```

**[正例]** 将数据获取逻辑抽离到自定义Hook中，组件仅负责UI呈现：

```tsx
// Good: useUsers.ts - 封装数据获取逻辑 (职责1 & 2)
import { useState, useEffect } from 'react';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => setError(err))
      .finally(() => setIsLoading(false));
  }, []);

  return { users, isLoading, error };
};

// Good: UserList.tsx - 纯粹的UI展示组件 (职责3)
import React from 'react';
import { useUsers } from './useUsers';

export const UserList = () => {
  const { users, isLoading, error } = useUsers();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching users!</div>;

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
};
```

**说明**: 通过职责分离，`useUsers` Hook变得可复用且易于独立测试，`UserList`组件则成为了一个纯粹的、易于理解和预览的“哑”组件。

-----

##### **示例 for 7.2: 接口先行与意图明确的命名**

**[反例]** Props接口定义模糊，命名通用：

```ts
// Bad: 接口定义含糊不清
interface CardProps {
  data: object;        // 'data'是什么？结构完全未知。
  options: any;        // 'any'是魔鬼，应绝对避免。
  onAction: Function;  // 'Action'是什么动作？不明确。
}
```

**[正例]** Props接口定义精确，命名体现业务意图：

```ts
// Good: 精确、自解释的接口定义
interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  isActive: boolean;
}

interface UserProfileCardProps {
  /** 当前需要展示的用户信息 */
  user: UserProfile;

  /** 是否显示用户的在线状态 */
  showStatus?: boolean; // 可选属性清晰标注

  /** 当用户点击“删除”按钮时的回调函数，传递用户ID */
  onDelete: (userId: string) => void;
}
```

**说明**: 好的接口定义本身就是最好的文档。开发者看到`UserProfileCardProps`时，无需阅读内部实现，就能立刻理解如何正确使用该组件。

#### **8. 测试驱动开发规范 (TDD/BDD Specification)**

此章节将TDD/BDD方法论制度化，确保代码质量、功能正确性，并为未来的重构提供安全保障。

**8.1. 测试层次结构**
* **单元测试 (Unit Tests)**:
    * **范围**: 共享包 (`shared-components`, `utils`) 中的每一个独立函数和组件都必须有单元测试覆盖。
    * **工具**: 使用 `Vitest` 或 `Jest` 配合 `React Testing Library`。
    * **要求**: 测试必须覆盖组件的各种Props组合、事件触发、状态变更和边界条件。**先写测试用例，再进行代码实现**。
* **集成测试 (Integration Tests)**:
    * **范围**: 在应用仓库中，测试由多个共享组件和业务组件组合成的复杂交互场景。
    * **目的**: 验证当新版本的共享包（如`@your-org/shared-components@1.3.0`）被引入后，应用的整体功能是否依然符合预期。
* **端到端测试 (E2E Tests) - BDD驱动**:
    * **范围**: 在应用仓库中，针对核心用户流程进行测试。
    * **工具**: 使用 `Cypress` 或 `Playwright`。
    * **要求**: 测试用例应使用 **Gherkin** 语法（`Given-When-Then`）或类似方式编写，以业务需求和用户行为为驱动。例如：“**假如**用户在首页，**当**他点击登录按钮并输入正确的凭据后，**那么**他应该被重定向到个人面板页面。”

**8.2. 测试实施细则**
* **测试文件位置**: 测试文件（如 `ComponentA.test.tsx`）应与被测试的源文件置于同一目录下，便于查找和维护。
* **测试覆盖率**: 共享包仓库的核心逻辑**必须达到90%以上**的单元测试覆盖率。应用仓库的核心业务流程必须有E2E测试覆盖。
* **CI/CD集成**: 所有测试必须在代码提交（pre-commit hook）和合并请求（pull request）时在CI/CD流水线中自动运行。测试失败将直接阻塞代码合并。

##### **示例 for 8.1: 单元测试 (TDD) - 使用Vitest & React Testing Library**

**1. 先写测试 (`Button.test.tsx`)**

假设我们要创建一个`Button`组件，我们先定义它的行为：

```tsx
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button'; // 组件此时还不存在

describe('Button Component', () => {

  it('should render with the correct text', () => {
    render(<Button>Click Me</Button>);
    // 断言：检查文本内容为 "Click Me" 的按钮是否存在于文档中
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeInTheDocument();
  });

  it('should call the onClick handler when clicked', () => {
    const handleClick = vi.fn(); // 创建一个模拟函数 (spy)
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /Click Me/i });
    fireEvent.click(button);

    // 断言：模拟函数被调用了1次
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled and not call onClick when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click Me</Button>);

    const button = screen.getByRole('button', { name: /Click Me/i });
    fireEvent.click(button);

    // 断言：按钮处于禁用状态
    expect(button).toBeDisabled();
    // 断言：模拟函数未被调用
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

*此时运行测试，所有测试都会失败，因为`Button`组件还未实现。*

**2. 编写最小化实现使其通过 (`Button.tsx`)**

```tsx
// Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button = ({ children, onClick, disabled = false }: ButtonProps) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
```

*现在再次运行测试，所有测试都将通过。这就是TDD的核心循环。*



##### **示例 for 8.1: 端到端测试 (BDD) - 使用Cypress & Gherkin**

**1. 先写业务行为描述 (`login.feature`)**

```feature
# login.feature
Feature: User Login

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I fill in "username" with "testuser"
    And I fill in "password" with "password123"
    And I click the "Log In" button
    Then I should be redirected to the "/dashboard" page
```

**2. 编写对应的测试步骤实现 (Cypress)**

```javascript
// login.steps.js
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I am on the login page', () => {
  cy.visit('/login');
});

When('I fill in "username" with "{string}"', (username) => {
  cy.get('input[name="username"]').type(username);
});

When('I fill in "password" with "{string}"', (password) => {
  cy.get('input[name="password"]').type(password);
});

When('I click the "Log In" button', () => {
  cy.get('button[type="submit"]').click();
});

Then('I should be redirected to the "{string}" page', (path) => {
  cy.url().should('include', path);
});
```

**说明**: BDD的方式让产品经理、QA和开发人员可以使用统一的自然语言来描述和验证系统功能，确保软件开发始终紧密围绕业务需求。

