# 支持单文件 HTML 和 多文件 SPA 构建的完整配置指南

为了让同一项目既能够生成单文件 HTML 应用（所有资源内联到一个 HTML 文件），也能够生成传统的多文件单页面应用（SPA），可以通过在 Vite 配置中使用环境变量或 CLI 参数来动态切换构建模式。以下示例展示了如何在 `vite.config.js`、`package.json` 脚本及项目结构中进行配置。

---

## 一、安装必要依赖

```bash
npm install vite --save-dev
npm install vite-plugin-singlefile --save-dev
npm install vite-plugin-externals --save-dev
# 如需自动注入 CDN 库，可选：
npm install vite-plugin-cdn-import --save-dev
```

---

## 二、在 `package.json` 中添加构建脚本

```jsonc
{
  "scripts": {
    // 开发模式：始终启动多文件 SPA
    "dev": "vite",

    // 构建多文件 SPA
    "build:spa": "vite build",

    // 构建单文件 HTML
    "build:single": "vite build --mode singlefile",

    // 预览单文件 HTML
    "preview:single": "vite preview --port 4173",
  },
}
```

- `build:spa`：默认多文件输出（JavaScript、CSS 等分离）。
- `build:single`：使用自定义 `singlefile` 模式，生成单个内联 HTML。

---

## 三、动态 Vite 配置 (vite.config.js)

```javascript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { viteExternalsPlugin } from 'vite-plugin-externals';
import importToCDN from 'vite-plugin-cdn-import';

export default defineConfig(({ mode }) => {
  // 加载 .env 变量
  const env = loadEnv(mode, process.cwd());
  const isSingle = mode === 'singlefile';

  // 公共外部 CDN 配置（可按需修改）
  const cdnModules = [
    { name: 'react', var: 'React', path: 'umd/react.production.min.js' },
    { name: 'react-dom', var: 'ReactDOM', path: 'umd/react-dom.production.min.js' },
    { name: 'lodash', var: '_', path: 'lodash.min.js' },
  ];

  return {
    base: './',
    plugins: [
      react(),
      // 仅在 singlefile 模式时启用单文件插件
      ...(isSingle
        ? [
            viteSingleFile({
              removeViteModuleLoader: true,
              useRecommendedBuildConfig: true,
            }),
            // 外部 CDN 引入（避免打包到单文件中）
            viteExternalsPlugin({
              react: 'React',
              'react-dom': 'ReactDOM',
              lodash: '_',
            }),
            // 或者使用自动注入 CDN 插件
            // importToCDN({ prodUrl: 'https://unpkg.com/{name}@{version}/{path}', modules: cdnModules })
          ]
        : []),
    ],
    build: {
      // 单文件构建时的专属覆盖设置
      ...(isSingle && {
        cssCodeSplit: false,
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        rollupOptions: {
          inlineDynamicImports: true,
          output: {
            manualChunks: () => 'everything.js',
          },
        },
      }),
      // 多文件 SPA 则使用 Vite 默认配置
    },
  };
});
```

**说明：**

- 通过 `mode === 'singlefile'` 判断构建模式。
- 在单文件模式下：
  - 启用 `vite-plugin-singlefile` 并关闭代码拆分、资源分离。
  - 将第三方库标记为外部并通过 CDN 引入，避免内联冗余大体积库。
- 在 SPA 模式下：
  - 不加载单文件插件，使用 Vite 默认多文件输出（JS/CSS 分割）。

---

## 四、项目使用示例

假设项目结构为：

```
my-app/
├─ index.html
├─ src/
│  ├─ main.jsx
│  ├─ components/
│  │  ├─ App.jsx
│  │  └─ Button.jsx
│  └─ style.css
├─ vite.config.js
└─ package.json
```

### 1. 多文件 SPA 构建

```bash
npm run build:spa
```

结果目录 `dist/` 中包含：

- `index.html`
- 分离的 JS、CSS、资源文件  
  可通过 `npm run preview` 预览。

### 2. 单文件 HTML 构建

```bash
npm run build:single
```

结果目录 `dist/` 中包含：

- 单个 `index.html`（所有 JS、CSS 均内联）  
  可通过 `npm run preview:single` 在 4173 端口预览。

---

## 五、部署建议

- **多文件 SPA**：适用于大中型应用，支持缓存、按需加载、性能更优，可部署到任意静态站点托管（Netlify、Vercel、GitHub Pages 等）。
- **单文件 HTML**：适合小型演示页、微应用或需嵌入到第三方平台的场景；无需额外资源，易于分发。

---

### 结论

通过上述方式，项目可灵活切换构建模式：开发时保持 SPA 体验，发布时根据需求选择多文件构建或单文件内联，满足多样化部署场景。

[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/59556146/3d8edfed-13ba-4ee2-8c95-d592b213cc49/Shi-Yong-Vite-He-vite-plugin-singlefile-Chuang-Jian-Dan-Wen-Jian-HTML-Ying-Yong-De-Wan.md
