# 实施计划 (Implementation Plan): 全面迁移至 Tailwind CSS

**版本:** 1.0.0
**关联 PRD:** `产品需求文档.md` (v2.0.0)
**关联架构:** `architecture.md`, `tech-stack.md`
**目标:** 将项目中所有现存的 CSS (`.css` 文件及 Astro 组件中的 `<style>` 标签) 全部重构为使用 Tailwind CSS 工具类，并移除所有旧的样式文件。

---

## 第一部分：准备与设置 (Setup & Configuration)

此阶段的目标是为项目正确集成 Tailwind CSS，并建立基础样式层。

- **`task-1.1: 安装依赖`**
  - **指令:** 在项目根目录下，执行命令安装 Tailwind CSS 及其对等依赖项：`tailwindcss`, `postcss`, `autoprefixer`。
  - **验证标准:** `package.json` 文件中出现对应的依赖项及其版本号。

- **`task-1.2: 初始化配置文件`**
  - **指令:** 创建 `tailwind.config.js` 和 `postcss.config.js` 配置文件。
  - **验证标准:** 项目根目录下存在这两个文件。

- **`task-1.3: 配置 Astro 集成`**
  - **指令:** 修改 `astro.config.mjs` 文件，导入并集成 Astro 的 Tailwind CSS 插件。
  - **验证标准:** `astro.config.mjs` 的 `integrations` 数组中包含了 `tailwind()`。

- **`task-1.4: 配置 Tailwind 内容源`**
  - **指令:** 编辑 `tailwind.config.js` 文件，在其 `content` 字段中，精确指向所有包含类名的文件路径，通常是 `src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}`。
  - **验证标准:** `tailwind.config.js` 的 `content` 数组配置正确。

- **`task-1.5: 建立样式入口`**
  - **指令:** 
    1. 在 `src/styles/` 目录下创建一个新的 `tailwind.css` 文件。
    2. 在此文件中，使用 `@tailwind` 指令引入 Tailwind 的 `base`, `components`, 和 `utilities` 层。
    3. 在主布局文件 `src/layouts/MainLayout.astro` 中，导入这个新的 `tailwind.css` 文件。
  - **验证标准:** 页面加载后，浏览器开发者工具中可以看到由 Tailwind 生成的基础样式 (Preflight) 已被应用。

## 第二部分：组件与页面样式迁移 (Component & Page Migration)

此阶段的核心是逐一将现有组件和页面的样式替换为 Tailwind 工具类。这是一个原子化的、可独立验证的过程。

- **`task-2.1: 迁移 `src/pages/index.astro` 样式`**
  - **指令:** 
    1. 审查 `index.astro` 文件中的 `<style>` 块和所有元素的 `class` 属性。
    2. 逐一将现有 CSS 规则替换为对应的 Tailwind 工具类。
    3. 迁移完成后，完全删除 `<style>` 块。
  - **验证标准 (敏捷验证模式):** 在浏览器中打开首页，其外观（布局、颜色、间距、字体等）与迁移前**完全一致**。通过截图对比进行像素级验证。

- **`task-2.2: 迁移 `src/components/Previewer.astro` 样式`**
  - **指令:** (同 `task-2.1`)
  - **验证标准 (敏捷验证模式):** (同 `task-2.1`)

- **`task-2.3: 迁移 `src/components/Feedback.astro` 样式`**
  - **指令:** (同 `task-2.1`)
  - **验证标准 (敏捷验证模式):** (同 `task-2.1`)

## 第三部分：全局样式迁移与清理 (Global Style Migration & Cleanup)

此阶段处理全局样式文件，并完成最终的清理工作。

- **`task-3.1: 分析并迁移全局样式`**
  - **指令:** 
    1. 审查 `src/styles/global.css` 和 `src/styles/style.css`。
    2. 将其中定义的自定义样式（如特定 class）迁移到使用它们的 Astro 组件中，用 `@apply` 或直接用工具类替换。
    3. 对于真正的全局基础样式（如 `body` 字体），确认 Tailwind 的 Preflight 是否已覆盖。如有必要，在 `src/styles/tailwind.css` 中进行少量自定义覆盖。
  - **验证标准:** 所有在旧的全局样式文件中定义的规则，都已在新的 Tailwind 系统中找到了等效实现或被安全移除。

- **`task-3.2: 移除旧样式文件`**
  - **指令:** 
    1. 从 `src/layouts/MainLayout.astro` 中移除对 `global.css` 和 `style.css` 的导入语句。
    2. 从文件系统中删除 `src/styles/global.css` 和 `src/styles/style.css` 这两个文件。
  - **验证标准:** 
    1. 项目能够成功编译和运行。
    2. 再次对整个应用进行视觉回归检查，确保所有页面和组件的样式仍然与迁移前完全一致。

## 第四部分：最终审查 (Final Review)

- **`task-4.1: 起飞前检查`**
  - **指令:** 将此 `implementation-plan.md` 交给执行编码的 AI，并提问：“请阅读 memory-bank 里的所有文档，这份实施计划对你来说 100% 清晰吗？你有哪些问题可以帮助你更精确地理解任务？”
  - **目的:** 根据 AI 的反馈，对计划进行最后优化，消除任何潜在的歧义。