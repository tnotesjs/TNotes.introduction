# [0014. 本地目录结构](https://github.com/Tdahuyou/TNotes.introduction/tree/main/notes/0014.%20%E6%9C%AC%E5%9C%B0%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)

<!-- region:toc -->

- [1. 📝 概述](#1--概述)
- [2. 分仓库模式](#2-分仓库模式)
- [3. 📒 本地目录结构](#3--本地目录结构)

<!-- endregion:toc -->

## 1. 📝 概述

## 2. 分仓库模式

- **🤔 为什么要分仓库来管理笔记？直接将所有的学习笔记合并到一个仓库中不行吗？**
  - **体积问题**：若所有笔记都统一丢到一个仓库中，后续仓库体积可能会变得异常庞大。
  - **划分原则**：仓库的划分可能有些是不太合理的，会根据实际情况不断调整优化。
    - 比如 markdown、mermaid 的笔记，从某种程度上讲，mermaid 的笔记其实可以一并丢到 markdown 中，因为 mermaid 的主要应用场景基本上都是在 markdown 中使用。
    - 这也是一个不断学习的过程，在学习某个内容 xxx 的时候，最初做的划分很可能也都是不太合理的，后续再优化结构即可，初学阶段没必要过分纠结自己写的笔记应该属于哪个组，重要的是先把笔记给写好。
- ![图 0](https://cdn.jsdelivr.net/gh/Tdahuyou/imgs@main/2025-06-02-12-11-09.png)

## 3. 📒 本地目录结构

```bash
├── _ # 根知识库 https://github.com/Tdahuyou/notes.git
├── TNotes.0 # 私有知识库 https://github.com/Tdahuyou/TNotes.0.git
├── TNotes.c-cpp # https://github.com/Tdahuyou/TNotes.c-cpp.git
├── TNotes.canvas # https://github.com/Tdahuyou/TNotes.canvas.git
├── TNotes.cooking # https://github.com/Tdahuyou/TNotes.cooking.git
├── TNotes.egg # https://github.com/Tdahuyou/TNotes.egg.git
├── TNotes.electron # https://github.com/Tdahuyou/TNotes.electron.git
├── TNotes.en-notes # https://github.com/Tdahuyou/TNotes.en-notes.git
├── TNotes.footprints # https://github.com/Tdahuyou/TNotes.footprints.git
├── TNotes.git-notes # https://github.com/Tdahuyou/TNotes.git-notes.git
├── TNotes.html-css-js # https://github.com/Tdahuyou/TNotes.html-css-js.git
├── TNotes.leetcode # https://github.com/Tdahuyou/TNotes.leetcode.git
├── TNotes.miniprogram # https://github.com/Tdahuyou/TNotes.miniprogram.git
├── TNotes.network # https://github.com/Tdahuyou/TNotes.network.git
├── TNotes.nodejs # https://github.com/Tdahuyou/TNotes.nodejs.git
├── TNotes.notes # https://github.com/Tdahuyou/TNotes.notes.git
├── TNotes.react # https://github.com/Tdahuyou/TNotes.react.git
├── TNotes.sql # https://github.com/Tdahuyou/TNotes.sql.git
├── TNotes.svg # https://github.com/Tdahuyou/TNotes.svg.git
├── TNotes.template # https://github.com/Tdahuyou/TNotes.template.git
├── TNotes.typescript # https://github.com/Tdahuyou/TNotes.typescript.git
├── TNotes.vite # https://github.com/Tdahuyou/TNotes.vite.git
├── TNotes.vitepress # https://github.com/Tdahuyou/TNotes.vitepress.git
├── TNotes.vue # https://github.com/Tdahuyou/TNotes.vue.git
└── TNotes.webpack # https://github.com/Tdahuyou/TNotes.webpack.git
```
