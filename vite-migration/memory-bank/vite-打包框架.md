# 使用 Vite 和 vite-plugin-singlefile 创建单文件 HTML 应用的完整配置指南

## 项目初始化和插件安装

首先创建项目并安装必要的依赖：

```bash
# 创建 Vite 项目（原生 JS 或 React）
npm create vite@latest my-app -- --template vanilla  # 原生 JS
# 或
npm create vite@latest my-app -- --template react    # React

cd my-app
npm install

# 安装 vite-plugin-singlefile
npm install vite-plugin-singlefile --save-dev

# 如果需要支持外部CDN库，安装以下插件之一：
npm install vite-plugin-externals --save-dev
# 或
npm install vite-plugin-cdn-import --save-dev
```

## 基础配置（vite.config.js）

### 1. 原生 JavaScript 配置

```javascript
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { viteExternalsPlugin } from 'vite-plugin-externals'

export default defineConfig({
  plugins: [
    viteSingleFile(),
    // 配置外部CDN依赖
    viteExternalsPlugin({
      'lodash': '_',
      'axios': 'axios',
      'dayjs': 'dayjs'
    })
  ],
  build: {
    // viteSingleFile插件会自动配置以下选项，但也可以手动配置
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      inlineDynamicImports: true,
      output: {
        manualChunks: () => 'everything.js',
      }
    }
  }
})
```

### 2. React 配置

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { viteExternalsPlugin } from 'vite-plugin-externals'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true,  // 移除 Vite 模块加载器
      useRecommendedBuildConfig: true // 使用推荐的构建配置
    }),
    // 配置外部CDN依赖
    viteExternalsPlugin({
      'react': 'React',
      'react-dom': 'ReactDOM'
    })
  ]
})
```

## 高级配置选项

### viteSingleFile 插件选项详解[1]

```javascript
viteSingleFile({
  // 使用推荐的构建配置（默认：true）
  useRecommendedBuildConfig: true,
  
  // 移除 Vite 模块加载器（默认：false）
  removeViteModuleLoader: true,
  
  // 内联文件匹配模式（默认：[]，表示内联所有识别的文件）
  inlinePattern: ['**/*.js', '**/*.css'],
  
  // 删除已内联的文件（默认：true）
  deleteInlinedFiles: true,
  
  // 覆盖配置选项
  overrideConfig: {
    base: './'  // 设置基础路径
  }
})
```

## 支持外部 CDN 库的三种方式

### 方式一：使用 vite-plugin-externals（推荐）

```javascript
import { viteExternalsPlugin } from 'vite-plugin-externals'

export default defineConfig({
  plugins: [
    viteSingleFile(),
    viteExternalsPlugin({
      'react': 'React',
      'react-dom': 'ReactDOM',
      'lodash': '_',
      'axios': 'axios',
      'moment': 'moment'
    })
  ]
})
```

在 `index.html` 中添加 CDN 链接：

```html



  
  My App


  
  
  
  
  
  
  
  
  


```

### 方式二：使用 vite-plugin-cdn-import（自动注入）

```javascript
import importToCDN from 'vite-plugin-cdn-import'

export default defineConfig({
  plugins: [
    viteSingleFile(),
    importToCDN({
      prodUrl: 'https://unpkg.com/{name}@{version}/{path}',
      modules: [
        {
          name: 'react',
          var: 'React',
          path: 'umd/react.production.min.js'
        },
        {
          name: 'react-dom',
          var: 'ReactDOM',
          path: 'umd/react-dom.production.min.js'
        },
        {
          name: 'lodash',
          var: '_',
          path: 'lodash.min.js'
        }
      ]
    })
  ]
})
```

### 方式三：使用 rollup-plugin-external-globals

```javascript
import externalGlobals from 'rollup-plugin-external-globals'

export default defineConfig({
  plugins: [
    viteSingleFile()
  ],
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'lodash'],
      plugins: [
        externalGlobals({
          'react': 'React',
          'react-dom': 'ReactDOM',
          'lodash': '_'
        })
      ]
    }
  }
})
```

## 组件化开发示例

### 原生 JavaScript 组件化

```javascript
// src/components/Button.js
export class Button {
  constructor(text, onClick) {
    this.text = text
    this.onClick = onClick
  }
  
  render() {
    const button = document.createElement('button')
    button.textContent = this.text
    button.addEventListener('click', this.onClick)
    return button
  }
}

// src/components/App.js
import { Button } from './Button.js'

export class App {
  constructor(container) {
    this.container = container
  }
  
  render() {
    const button = new Button('Click me!', () => {
      console.log('Button clicked!')
    })
    
    this.container.appendChild(button.render())
  }
}

// src/main.js
import { App } from './components/App.js'
import './style.css'

// 使用外部CDN库（例如lodash）
console.log(_.version) // lodash通过CDN引入

const app = new App(document.querySelector('#app'))
app.render()
```

### React 组件化

```jsx
// src/components/Button.jsx
import React from 'react'

export const Button = ({ children, onClick }) => {
  return (
    
      {children}
    
  )
}

// src/components/App.jsx  
import React, { useState } from 'react'
import { Button } from './Button'

export const App = () => {
  const [count, setCount] = useState(0)
  
  return (
    
      Count: {count}
       setCount(count + 1)}>
        Increment
      
       setCount(count - 1)}>
        Decrement
      
    
  )
}

// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './components/App'
import './index.css'

// 使用外部CDN库
console.log(_.version) // lodash通过CDN引入

ReactDOM.createRoot(document.getElementById('root')).render(
  
    
  
)
```

## 构建和部署

### package.json 脚本配置

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 构建命令

```bash
# 开发环境
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建完成后，`dist` 目录将包含一个完整的单文件 HTML 应用，所有 JavaScript 和 CSS 都内联其中，同时支持外部 CDN 资源。[2][1]

