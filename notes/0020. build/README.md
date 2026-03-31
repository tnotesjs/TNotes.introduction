# [0020. build](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0020.%20build)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 TNotes 知识库的构建命令是？](#3--tnotes-知识库的构建命令是)
- [4. 💻 测试 - build error](#4--测试---build-error)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- `tn:build` 命令简介

## 2. 🫧 评价

这篇笔记用于记录 `tn:build` 命令构建知识库的核心流程，核心逻辑就是自行封装 vite 插件，监听 build 信息，改善可视化的构建进度。

## 3. 🤔 TNotes 知识库的构建命令是？

```bash
$ pnpm tn:build

# > @ tn:build /Users/huyouda/tnotesjs/TNotes.introduction
# >                        tsx ./.vitepress/tnotes/index.ts --build

# 🚀 [08:21:40.485] [build] 构建知识库
# ℹ️  [08:21:40.486] [build] 开始构建知识库...
# Building [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   0% | Transforms: 1/3332 | Chunks: 0/94 | Time: 0.1s
# Building [████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  10% | Transforms: 343/3332 | Chunks: 0/94 | Time: 1.0s
# Building [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% | Transforms: 686/3332 | Chunks: 0/94 | Time: 1.3s
# Building [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  30% | Transforms: 1028/3332 | Chunks: 0/94 | Time: 1.6s
# Building [████████████████░░░░░░░░░░░░░░░░░░░░░░░░]  40% | Transforms: 1371/3332 | Chunks: 0/94 | Time: 1.9s
# Building [████████████████████░░░░░░░░░░░░░░░░░░░░]  50% | Transforms: 1713/3332 | Chunks: 0/94 | Time: 2.6s
# Building [████████████████████████░░░░░░░░░░░░░░░░]  60% | Transforms: 2056/3332 | Chunks: 0/94 | Time: 3.0s
# Building [████████████████████████████░░░░░░░░░░░░]  70% | Transforms: 2399/3332 | Chunks: 0/94 | Time: 3.1s
# Building [████████████████████████████████░░░░░░░░]  80% | Transforms: 2741/3332 | Chunks: 0/94 | Time: 3.4s
# Building [████████████████████████████████████░░░░]  90% | Transforms: 3084/3332 | Chunks: 95/94 | Time: 7.4s
# Building [████████████████████████████████████████] 100% | Transforms: 3332/3332 | Chunks: 94/94 | Time: 7.7s
# ✅ 构建成功！
#    📁 输出目录: /Users/huyouda/tnotesjs/TNotes.introduction/.vitepress/dist
#    ⏱️  耗时: 7.7s
# ✅ [08:21:50.077] [build] 知识库构建完成
# ✨ [08:21:50.077] [build] 命令执行耗时：9592 ms
```

## 4. 💻 测试 - build error

<!-- 在测试的时候将下面这条注释去掉直接写入然后 pnpm tn:build 测试构建 -->

<!-- ![](./assets/undefined.png) -->

可以通过引入一张不存在的图片来测试 build error 报错行为是否正常。

```txt
![](./assets/undefined.png)
```

测试构建：

```bash
$ pnpm tn:build

# > @ tn:build /Users/huyouda/tnotesjs/TNotes.introduction
# >                        tsx ./.vitepress/tnotes/index.ts --build

# 🚀 [08:22:41.740] [build] 构建知识库
# ℹ️  [08:22:41.741] [build] 开始构建知识库...
# Building [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   0% | Transforms: 1/3288 | Chunks: 0/94 | Time: 0.1s
# build error:
# Could not resolve "./assets/undefined.png" from "notes/0020. build/README.md"
# file: /Users/huyouda/tnotesjs/TNotes.introduction/notes/0020. build/README.md
# Could not resolve "./assets/undefined.png" from "notes/0020. build/README.md"
# file: /Users/huyouda/tnotesjs/TNotes.introduction/notes/0020. build/README.md
#     at getRollupError (file:///Users/huyouda/tnotesjs/TNotes.introduction/node_modules/.pnpm/rollup@4.50.1/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
#     at error (file:///Users/huyouda/tnotesjs/TNotes.introduction/node_modules/.pnpm/rollup@4.50.1/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
#     at ModuleLoader.handleInvalidResolvedId (file:///Users/huyouda/tnotesjs/TNotes.introduction/node_modules/.pnpm/rollup@4.50.1/node_modules/rollup/dist/es/shared/node-entry.js:21539:24)
#     at file:///Users/huyouda/tnotesjs/TNotes.introduction/node_modules/.pnpm/rollup@4.50.1/node_modules/rollup/dist/es/shared/node-entry.js:21499:26
# ❌ Error
# 错误信息：Command failed with code 1
# ❌ Error
# 错误信息：Command failed with code 1
#  ELIFECYCLE  Command failed with exit code 1.
```
