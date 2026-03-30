# [0035. TNotes 规范](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0035.%20TNotes%20%E8%A7%84%E8%8C%83)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 编写 TNotes 知识库推荐使用的编辑器是？](#3--编写-tnotes-知识库推荐使用的编辑器是)
- [4. 🤔 如何隐藏笔记目录下的 `.tnotes.json` 配置文件？](#4--如何隐藏笔记目录下的-tnotesjson-配置文件)
- [5. 🔗 引用](#5--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- TNotes 规范

## 2. 🫧 评价

本节主要介绍 TNotes 笔记的一些书写规范和环境配置。

## 3. 🤔 编写 TNotes 知识库推荐使用的编辑器是？

[VSCode][1]

## 4. 🤔 如何隐藏笔记目录下的 `.tnotes.json` 配置文件？

```json
// .vscode/settings.json
{
  "files.exclude": {
    "**/notes/**/.tnotes.json": true
  }
}
```

## 5. 🔗 引用

- [VSCode 官网][1]

[1]: https://code.visualstudio.com/
