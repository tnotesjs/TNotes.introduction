# [0012. Mermaid 图表](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0012.%20Mermaid%20%E5%9B%BE%E8%A1%A8)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 mermaid 组件如何使用？](#3--mermaid-组件如何使用)
- [4. 🔗 引用](#4--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- Mermaid 组件的基本使用

## 2. 🫧 评价

vitepress 默认是不带有 mermaid 支持的，但是又经常有绘制图表的需求，因此集成了 mermaid 功能。

## 3. 🤔 mermaid 组件如何使用？

和 [mermaid][1] 要求的语法一致。

输入：

````md
```mermaid
flowchart LR
  Start --> Stop
```
````

输出：

```mermaid
flowchart LR
  Start --> Stop
```

会在鼠标悬停在图表上时，显示相关控制按钮：

![img](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-11-03-00-27-44.png)

## 4. 🔗 引用

- [mermaid.org 官方文档][1]

[1]: https://mermaid.js.org/
