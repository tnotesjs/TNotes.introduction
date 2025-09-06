# [0001. TNotes 简介](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0001.%20TNotes%20%E7%AE%80%E4%BB%8B)

<!-- region:toc -->

- [1. 🤔 TNotes 是什么？](#1--tnotes-是什么)
- [2. 🤔 TNotes 中的知识库是什么？](#2--tnotes-中的知识库是什么)
- [3. 🤔 TNotes 中知识库之间的关系是？](#3--tnotes-中知识库之间的关系是)
- [4. 📒 TNotes.introduction](#4--tnotesintroduction)

<!-- endregion:toc -->

## 1. 🤔 TNotes 是什么？

<a href="https://tdahuyou.github.io/notes" target="_blank">
  <img src="https://tdahuyou.github.io/TNotes.introduction/logo.png" alt="foot print" title="TNotes logo" style="display: block; margin: auto; width: 50%;" />
</a>

- [TNotes](https://tdahuyou.github.io/notes)（Tdahuyou の Notes） 是一个基于开源项目和免费工具（比如：[vitepress](https://github.com/vuejs/vitepress)、[github pages](https://pages.github.com/)、[vitepress](https://vitepress.dev/)、[giscus](https://giscus.app/zh-CN)、[markdown-it](https://github.com/markdown-it/markdown-it) ……）实现的一个快速搭建个人在线开源知识库的免费工具。
- 但凡是在 TNotes 中能看到的内容，均已开源在 [github](https://github.com/Tdahuyou) 上，有需要的可自行 clone。
- TNotes 诞生时间：`24.08.28`，现阶段还在不断完善中。

## 2. 🤔 TNotes 中的知识库是什么？

- 本质上就是一个简单的 git 仓库，在仓库的 notes 目录下，存放着一系列的笔记，这些笔记就是知识库中的核心内容。
- TNotes 的作用就是通过脚本来自动管理这些笔记，比如：
  - 根据笔记标题自动生成带有编号的笔记目录；
  - 根据 Home README 中的配置解析所有笔记生成整个知识库的目录；

## 3. 🤔 TNotes 中知识库之间的关系是？

- 目前在 TNotes 中只有两种类型的知识库：根知识库和子知识库。
  - 根知识库：只有一个
  - 子知识库：可以有多个
  - 比如：下图中 notes 就是根知识库，其余的都是子知识库。
  - ![](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-06-02-12-11-09.png)
- TNotes 的根知识库，汇总了其余所有知识库的 README.md 笔记文档，以便满足查阅和分享的需求。
  - ![图 0](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-29-00-20-43.png)

## 4. 📒 TNotes.introduction

- **`TNotes.introduction`**
  - `TNotes.introduction` 是一个基于 `TNotes` 实现的一个开源的知识库，主要用于介绍 `TNotes` 的相关内容，可以理解为 `TNotes` 的使用说明文档。
- 在这个知识库下，主要会介绍 `TNotes` 的一些功能以及其使用说明，比如：
  - 自定义知识库封面
  - 自定义组件
  - markdown 增强
  - 本地搜索配置
  - 配置文件说明
  - ……
