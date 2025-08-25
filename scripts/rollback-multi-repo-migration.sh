#!/bin/bash

# 多仓库架构改造回滚脚本
# 用于快速恢复monorepo结构

set -e

echo "🚨 开始执行多仓库架构改造回滚..."
echo "📦 恢复monorepo结构"

# 检查备份目录是否存在
if [ ! -d ".backup/multi-repo-migration" ]; then
    echo "❌ 错误：备份目录不存在，无法回滚"
    exit 1
fi

# 恢复根目录配置文件
echo "📄 恢复根目录配置文件..."
cp -f ".backup/multi-repo-migration/package.json" .
cp -f ".backup/multi-repo-migration/pnpm-workspace.yaml" .

# 恢复packages目录
echo "📦 恢复packages目录..."
rm -rf packages
cp -r ".backup/multi-repo-migration/packages" .

# 清理临时文件（如果有）
echo "🧹 清理临时文件..."
rm -rf screenshot-splitter 2>/dev/null || true
rm -rf shared-components 2>/dev/null || true

# 重新安装依赖
echo "📦 重新安装依赖..."
pnpm install

echo "✅ 回滚完成！monorepo结构已恢复"
echo "📝 回滚时间: $(date)"
echo "🔧 恢复的文件:"
echo "   - package.json"
echo "   - pnpm-workspace.yaml" 
echo "   - packages/ 目录"

# 验证恢复结果
echo "🔍 验证恢复结果..."
if [ -f "pnpm-workspace.yaml" ] && [ -d "packages" ]; then
    echo "✅ 验证成功：monorepo结构已正确恢复"
else
    echo "❌ 验证失败：恢复过程中可能出现问题"
    exit 1
fi

echo "🎉 回滚操作完成！项目已恢复到改造前的状态"