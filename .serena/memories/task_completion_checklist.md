# 任务完成检查清单

## ✅ 代码质量检查 (必须完成)
```bash
pnpm lint             # ESLint代码检查 (必须通过)
pnpm type-check       # TypeScript类型检查 (必须通过)
pnpm format:check     # Prettier格式检查 (建议通过)
```

## 🧪 测试验证 (根据修改范围)
```bash
# 单元测试 (核心功能修改时需要)
pnpm test:unit

# 集成测试 (涉及多个组件时)
pnpm test:integration

# 端到端测试 (用户流程修改时)
pnpm test:e2e

# 覆盖率检查 (新功能添加时)
pnpm test:coverage
```

## 🏗️ 构建验证
```bash
# 构建检查
pnpm build:check      # 类型和lint检查
pnpm build            # 完整构建验证

# 特定组件构建检查
pnpm build:screenshot-splitter
```

## 📦 部署前检查 (如需部署)
```bash
# 预览构建结果
pnpm preview

# 部署准备检查
pnpm deploy:prepare
```

## 🔍 代码审查要点
- [ ] 类型安全: 无any类型，类型定义完整
- [ ] 代码规范: 符合ESLint和Prettier规则
- [ ] 测试覆盖: 新功能有相应测试
- [ ] 性能考虑: 无内存泄漏，代码分割合理
- [ ] 可访问性: 组件支持无障碍访问
- [ ] 浏览器兼容: 支持目标浏览器版本

## ⚡ 性能检查
- [ ] 构建产物大小合理
- [ ] 无重复依赖
- [ ] 代码分割配置正确
- [ ] 图片资源优化
- [ ] 缓存策略合理

## 🛡️ 安全检查
- [ ] 无安全漏洞 (npm audit)
- [ ] 输入验证完整
- [ ] 错误处理恰当
- [ ] 敏感信息保护

## 📝 文档更新
- [ ] README文档更新 (如有接口变更)
- [ ] 类型注释完整
- [ ] 使用示例更新
- [ ] CHANGELOG记录变更