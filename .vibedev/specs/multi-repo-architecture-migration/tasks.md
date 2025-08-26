# Multi-repo ➜ 单仓库 扁平化架构迁移 - 任务清单

依据 docs/frontend-spec-new.md 的规范，对当前仓库进行差异整改与追踪。

## 状态总览
- [x] 采用 Vite + React 作为构建与框架
- [x] 资源绝对 URL 可配置（.env + config/build/deployment.config.ts）
- [x] Vitest 作为测试框架（Jest 已移除）
- [x] 共享组件库独立目录 shared-components/
- [x] 添加 @shared 别名（vite.config.ts、tsconfig.json）
- [x] Button 组件改用 CSS Modules（新增 Button.module.css 并更新实现）
- [x] CopyrightInfo 组件改用 CSS Modules
- [x] 新增 shared-components/components/index.ts 统一导出
- [x] 增加 *.module.css 类型声明（src/types/cssmodule.d.ts）
- [x] 删除遗留配置与废弃样式（jest.config.js、vite.config.base.js、config/build/vite.config.ts、Button.css、CopyrightInfo.css）
- [x] 清理构建检查引用（移除 BuildErrorHandler.ts 对已删除配置的检查）
- [x] 导入规范对齐（全仓检索未发现不合规导入，无需修改）

## 待办与遗留项
- [x] 下线/重写旧 monorepo 集成测试为单仓库规范版（tests/integration/build-flow.test.js）
- [x] shared-components 补充 README 与组件文档模板（shared-components/README.md、docs/component-docs/Component.README.template.md）
- [x] CI 调整：启用 Vitest + ESLint 门禁（新增 .github/workflows/ci.yml）
- [ ] 可选：shared-components/hooks、utils 增加索引导出与示例

## 验证清单
- [x] 构建输出的 HTML/JS 动态导入路径为绝对可配置 URL
- [ ] dev 运行正常、样式加载正常（Button、CopyrightInfo）
- [ ] `npm run lint` 无 Error（测试文件忽略策略保留）
- [ ] `npm run test` 基本用例通过（Vitest）
- [ ] GitHub Actions 构建通过（包含资产路径配置校验）

## 变更说明
- 别名：
  - vite.config.ts: @shared -> ./shared-components
  - tsconfig.json: @shared 与 @shared/* 映射到 shared-components
- 组件规范：
  - Button/CopyrightInfo 迁移到 CSS Modules（*.module.css），支持类名安全拼接
  - Button 兼容历史 size: small/medium/large
- 构建检查：
  - 移除对已删除 config/build/vite.config.ts 的存在性检查
- 文档/类型：
  - 新增 *.module.css 类型声明（src/types/cssmodule.d.ts）
  - 新增 shared-components/components/index.ts

更新时间: 自动生成