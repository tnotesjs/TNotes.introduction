# [0036. core 开发工作流](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0036.%20core%20%E5%BC%80%E5%8F%91%E5%B7%A5%E4%BD%9C%E6%B5%81)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 core 是指？](#3--core-是指)
- [4. 🤔 core 开发的基本流程是？](#4--core-开发的基本流程是)
- [5. 🤔 开发环境和生产环境如何切换？](#5--开发环境和生产环境如何切换)
- [6. 🤔 core 的版本号 `major.minor.patch` 更新机制是？](#6--core-的版本号-majorminorpatch-更新机制是)
- [7. 🤔 core 的发版流程是？](#7--core-的发版流程是)
- [8. 🔗 引用](#8--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- core 开发工作流

## 2. 🫧 评价

该笔记主要用于记录和 core 开发工作流相关的一些内容。

## 3. 🤔 core 是指？

这里所说的 core 是指 @tnotesjs/core 这个 NPM 包，它是 TNotes.xxx 知识库的核心依赖。

## 4. 🤔 core 开发的基本流程是？

```bash
# 克隆 core 仓库
git clone https://github.com/tnotesjs/core.git
cd core
pnpm install

# 构建
pnpm build

# 类型检查
pnpm build:check

# 监听模式构建（修改源码后自动重新构建 dist/）
pnpm dev

# 本地调试 - 在宿主仓库中 link 到本地 core
cd ../TNotes.introduction
pnpm link ../core
```

## 5. 🤔 开发环境和生产环境如何切换？

- 开发环境（走本地 link）：在宿主仓库中执行 `pnpm link ../core`，`node_modules/@tnotesjs/core` 指向本地 core 目录，改动实时生效（配合 `pnpm dev` 监听构建）。
- 生产环境（走线上 npm 包）：`pnpm unlink @tnotesjs/core && pnpm install`，恢复为从 npm registry 安装的版本。
- CI/CD 环境：直接 `pnpm install`，不存在 link，天然走线上包。

## 6. 🤔 core 的版本号 `major.minor.patch` 更新机制是？

核心判断标准：

| 场景 | 升哪个 | 示例 |
| --- | --- | --- |
| 日常提交（bug 修复、优化、小功能混在一起） | 修订版本 `patch` | `0.0.1` -> `0.0.2` |
| 消费端需要改代码才能适配（改了导出接口、改了配置格式等） | 次版本 `minor` | `0.0.x` -> `0.1.0` |
| API 稳定了、正式对外发布，或者重大的架构变更 | 主版本 `major` | -> `1.0.0` |

次版本号和修订版本号的界定会比较模糊，为了简化判断机制，就定了一个标准：看这次的 core 改动是否需要 TNotes.xxx 知识库改动代码来适配才能使用。

- TNotes.xxx 需要改动代码适配：升级次版本号
- TNotes.xxx 不需要改动代码适配：升级修订版本号

## 7. 🤔 core 的发版流程是？

1. 编辑 `CHANGELOG.md`，在 `[Unreleased]` 下写入本次变更内容
2. 提交变更：`git add -A && git commit -m "docs: 更新 CHANGELOG"`
3. 执行发版脚本：`pnpm release patch`（或 `pnpm release 0.0.2`）

脚本会自动完成以下步骤：

- 检查工作区是否干净
- 检查 `CHANGELOG.md` 的 `[Unreleased]` 是否有内容
- 类型检查（`tsc --noEmit`）
- 构建（`tsup`）
- 更新 `package.json` 版本号
- 将 `[Unreleased]` 内容转为 `[x.y.z] - 日期` 格式
- `git commit` + `git tag`
- 交互确认后 `git push` + `npm publish`

## 8. 🔗 引用

- [tnotesjs/core - github][1]
- [tnotesjs/core - npm][2]

[1]: https://github.com/tnotesjs/core
[2]: https://www.npmjs.com/package/@tnotesjs/core
