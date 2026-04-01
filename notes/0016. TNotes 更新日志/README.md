# [0016. TNotes 更新日志](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0016.%20TNotes%20%E6%9B%B4%E6%96%B0%E6%97%A5%E5%BF%97)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 在哪查看 TNotes 日志？](#3--在哪查看-tnotes-日志)
- [4. 🤔 日志都记录了哪些内容？](#4--日志都记录了哪些内容)
- [5. 🤔 日志是如何自动生成的？](#5--日志是如何自动生成的)
- [6. 🔗 引用](#6--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- TNotes 更新日志简介

## 2. 🫧 评价

为了方便查阅每个月完成的笔记内容，TNotes 更新日志以月为单位，同步在了 tnotesjs 组织中的 projects 模块下。

## 3. 🤔 在哪查看 TNotes 日志？

在 [tnotesjs 组织][2] 组织下，找到 Project 模块，这里边儿有一个公开的 [TNotes 日志模块][1]。

::: swiper

![Project](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-12-13-15-21-08.png)

![TNotes 日志模块](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-12-13-15-14-34.png)

:::

## 4. 🤔 日志都记录了哪些内容？

在日志模块中以月为单位来记录每个月完成的笔记内容，并提供了 github 和 github pages 的访问链接。

以 [25.11 日志][3] 为例：

![img](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-12-13-15-26-00.png)

## 5. 🤔 日志是如何自动生成的？

在根知识库 TNotes 中执行 `pnpm tn:changelog` 命令即可自动在 `changelogs` 目录下生成指定范围的日志文件：

```powershell
pnpm tn:changelog

# > tnotes@0.0.1 tn:changelog C:\tnotesjs\TNotes
# > tsx scripts/generate-changelog.ts


# 📝 月度更新日志生成工具

# 请选择日志生成范围：
#   1. 本月更新日志
#   2. 上个月更新日志
#   3. 所有月份更新日志
#   4. 指定年份和月份

# 请输入选项（1-4）：
```

目前（25.12）的策略如下：

1. 在 TNotes 根知识库中遍历所有子知识库中根目录下的 README.md 文件
2. 根据 git 记录的版本信息，对比每个子知识库的当前月最后一次和上一个月最后一次的提交记录来判断新增的笔记都有哪些
3. 新增笔记的判断机制：以 `0001. xxx` 笔记为例，在 `README.md` 中，上个月最后一次提交时它的状态非 `- [x] 0001. xxx` 而这个月的最后一次提交时它的状态是 `- [x] 0001. xxx`，则说明这个笔记是本月新增的

```txt
tnotesjs
├── TNotes # 根知识库
├── TNotes.algorithms
├── TNotes.c
├── TNotes.canvas
├── TNotes.chrome
├── TNotes.cooking
├── TNotes.egg
├── TNotes.electron
├── TNotes.en-notes
├── TNotes.en-words
├── TNotes.footprints
├── TNotes.git-notes
├── TNotes.introduction
├── TNotes.javascript
├── TNotes.leetcode
├── TNotes.miniprogram
├── TNotes.network
├── TNotes.nodejs
├── TNotes.notes
├── TNotes.python
├── TNotes.react
├── TNotes.redis
├── TNotes.sql
├── TNotes.svg
├── TNotes.typescript
├── TNotes.vite
├── TNotes.vitepress
├── TNotes.vscode
├── TNotes.vue
└── TNotes.webpack
```

## 6. 🔗 引用

- [tnotesjs 组织 - github][2]
- [TNotes 日志模块 - github - tnotesjs][1]
- [25.11 日志 - github - tnotesjs][3]

[1]: https://github.com/orgs/tnotesjs/projects/4
[2]: https://github.com/tnotesjs
[3]: https://github.com/tnotesjs/TNotes.discussions/issues/46
