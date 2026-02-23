#!/bin/bash
#
# 临时脚本：批量重写所有兄弟知识库的 config.mts、theme/index.ts 和 public/ 目录
#
# 使用方式：
#   1. 先在 TNotes.introduction 上完成 core 改造并验证
#   2. 执行 pnpm tn:sync-core 将 core 同步到所有仓库
#   3. 运行此脚本：bash /Users/huyouda/tnotesjs/TNotes.introduction/sync-outer-files.sh
#   4. 执行 pnpm tn:push --all 推送所有仓库
#   5. 删除此脚本
#
set -e

BASE_DIR="/Users/huyouda/tnotesjs"
SKIP_DIRS=("TNotes.core" "TNotes.en-words" "TNotes.introduction" "TNotes")

echo "🚀 开始批量重写兄弟知识库外围文件..."
echo ""

# 新的 config.mts 内容
CONFIG_CONTENT='/**
 * .vitepress/config.mts
 *
 * VitePress 站点配置文件 - 连接层
 *
 * 所有配置逻辑封装在 TNotes.core 中，此文件仅作为 VitePress 入口。
 *
 * !注意：主题入口文件模块的位置是 VitePress 规定的，不能更改位置！
 */
import { defineNotesConfig } from '"'"'./tnotes/vitepress/config'"'"'

export default defineNotesConfig()
'

# 新的 theme/index.ts 内容
THEME_CONTENT='/**
 * .vitepress/theme/index.ts
 *
 * 主题入口文件模块 - 连接层
 *
 * 所有主题逻辑封装在 TNotes.core 中，此文件仅作为 VitePress 入口。
 *
 * !注意：主题入口文件模块的位置是 VitePress 规定的，不能更改位置！
 */
import { defineNotesTheme } from '"'"'../tnotes/vitepress/theme'"'"'

export default defineNotesTheme()
'

count=0
skip_count=0

for dir in "$BASE_DIR"/TNotes.*; do
  # 跳过非目录
  [ ! -d "$dir" ] && continue

  repo_name=$(basename "$dir")

  # 跳过排除列表
  skip=false
  for skip_dir in "${SKIP_DIRS[@]}"; do
    if [ "$repo_name" = "$skip_dir" ]; then
      skip=true
      break
    fi
  done

  if [ "$skip" = true ]; then
    echo "⏭️  跳过 $repo_name"
    skip_count=$((skip_count + 1))
    continue
  fi

  # 检查是否有 .vitepress 目录（确认是知识库）
  if [ ! -d "$dir/.vitepress" ]; then
    echo "⚠️  跳过 $repo_name（无 .vitepress 目录）"
    skip_count=$((skip_count + 1))
    continue
  fi

  echo "📝 处理 $repo_name..."

  # 1. 重写 config.mts
  echo "$CONFIG_CONTENT" > "$dir/.vitepress/config.mts"

  # 2. 重写 theme/index.ts
  mkdir -p "$dir/.vitepress/theme"
  echo "$THEME_CONTENT" > "$dir/.vitepress/theme/index.ts"

  # 3. 清理 public/ 目录：删除 SVG 图标和 m2mm.png，保留 favicon.ico 和 logo.png
  if [ -d "$dir/public" ]; then
    rm -f "$dir/public"/icon__*.svg "$dir/public/m2mm.png"
  fi

  count=$((count + 1))
  echo "   ✅ 完成"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 批量重写完成：$count 个仓库已更新，$skip_count 个已跳过"
echo ""
echo "📋 后续步骤："
echo "   1. 在 TNotes.introduction 中执行 pnpm tn:dev 验证功能"
echo "   2. 执行 pnpm tn:push --all 推送所有仓库"
echo "   3. 删除此脚本：rm $0"
