# 配置管理文档

## 概述

项目采用环境变量驱动的配置管理方式，所有配置值都存储在 `.env` 文件中，`config/` 目录只包含配置处理逻辑。

## 配置文件结构

```
├── .env                    # 默认环境配置
├── .env.development        # 开发环境配置
├── .env.test              # 测试环境配置
├── .env.production        # 生产环境配置
├── .env.example           # 配置示例文件
└── config/build/
    └── deployment.config.ts # 配置处理逻辑（不包含配置值）
```

## 核心配置项

### 资源URL配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `VITE_USE_ABSOLUTE_URLS` | 是否使用绝对URL | `true` / `false` |
| `VITE_ASSETS_BASE_URL` | 资源基础URL | `https://cdn.example.com/project` |
| `VITE_DEPLOY_ENV` | 部署环境 | `development` / `test` / `production` |

### 资源服务器配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `VITE_ASSETS_DOMAIN` | 资源服务器域名 | `cdn.example.com` |
| `VITE_ASSETS_PATH_PREFIX` | 资源路径前缀 | `/project-name` |
| `VITE_ASSETS_HTTPS` | 是否使用HTTPS | `true` / `false` |

### CDN配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `VITE_CDN_BASE_URL` | CDN基础URL | `https://cdn.example.com` |

### GitHub Pages配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `VITE_GITHUB_PAGES` | 是否启用GitHub Pages | `true` / `false` |
| `VITE_GITHUB_REPOSITORY` | GitHub仓库 | `username/repository` |
| `VITE_GITHUB_USER` | GitHub用户名 | `username` |
| `VITE_BASE_PATH` | 应用基础路径 | `/` 或 `/repository/` |

## 使用场景

### 1. 开发环境（相对路径）

```bash
# .env.development
VITE_USE_ABSOLUTE_URLS=false
VITE_ASSETS_BASE_URL=
VITE_DEPLOY_ENV=development
```

### 2. 生产环境（自定义CDN）

```bash
# .env.production
VITE_USE_ABSOLUTE_URLS=true
VITE_ASSETS_BASE_URL=https://your-cdn.com/project
VITE_CDN_BASE_URL=https://your-cdn.com
VITE_DEPLOY_ENV=production
```

### 3. GitHub Pages部署

```bash
# .env.production
VITE_USE_ABSOLUTE_URLS=true
VITE_ASSETS_BASE_URL=https://username.github.io/repository
VITE_GITHUB_PAGES=true
VITE_GITHUB_REPOSITORY=username/repository
VITE_BASE_PATH=/repository/
```

### 4. 测试环境

```bash
# .env.test
VITE_USE_ABSOLUTE_URLS=true
VITE_ASSETS_BASE_URL=https://test-cdn.example.com/project
VITE_DEPLOY_ENV=test
```

## 构建命令

### 使用环境文件

```bash
# 开发环境
npm run dev

# 生产环境
npm run build

# 测试环境
NODE_ENV=test npm run build
```

### 使用临时环境变量

```bash
# 临时覆盖配置
VITE_USE_ABSOLUTE_URLS=true VITE_ASSETS_BASE_URL=https://custom-cdn.com npm run build
```

## 配置优先级

1. 命令行环境变量（最高优先级）
2. `.env.local` 文件
3. `.env.[NODE_ENV]` 文件（如 `.env.production`）
4. `.env` 文件（最低优先级）

## 最佳实践

1. **配置分离**：配置值放在 `.env` 文件中，处理逻辑放在 `config/` 目录
2. **环境区分**：不同环境使用不同的 `.env` 文件
3. **安全性**：敏感配置使用 `.env.local`，不提交到版本控制
4. **文档化**：在 `.env.example` 中提供完整的配置示例

## 故障排除

### 资源路径仍然是相对路径

检查以下配置：
- `VITE_USE_ABSOLUTE_URLS` 是否设置为 `true`
- `VITE_ASSETS_BASE_URL` 是否正确设置
- 环境变量是否正确加载

### GitHub Pages部署失败

检查以下配置：
- `VITE_GITHUB_PAGES` 设置为 `true`
- `VITE_GITHUB_REPOSITORY` 格式正确（`username/repository`）
- `VITE_BASE_PATH` 包含仓库名称（`/repository/`）