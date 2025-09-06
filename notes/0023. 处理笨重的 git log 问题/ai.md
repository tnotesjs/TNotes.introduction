- 更安全的替代方案（推荐）
  - 如果你只是想“看起来”从头开始，但保留历史备份，可以：

```bash
# 保留原仓库历史
git clone https://github.com/username/repo.git
cd repo

# 创建一个新分支，不基于任何历史
git switch --orphan fresh-start
git add .
git commit -m "Initial commit"

# 强制推送到 main
git push -f origin fresh-start:main
```

这样你还能保留旧分支（如 `backup-old-history`）做参考。

| 方法 | 是否可行 | 推荐度 |
| --- | --- | --- |
| 拉取 → 删 `.git` → `git init` → `git add` → `git commit` → `git push -f` | ✅ 可行 | ⭐⭐⭐⭐ |
| 使用 `--orphan` 分支重置历史 | ✅ 更优雅 | ⭐⭐⭐⭐⭐ |
| 克隆裸仓库再重建 | ❌ 复杂且易错 | ⭐ |

```bash
git clone --depth 1 https://github.com/username/repo.git repo-clean
cd repo-clean
rm -rf .git
git init
git branch -M main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/repo.git
git push -f origin main
```

运行后，你的远程仓库就只有一个提交，历史被彻底“重置”。

📌 **记得通知协作者！**
