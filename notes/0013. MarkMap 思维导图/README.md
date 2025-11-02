# [0013. MarkMap 思维导图](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0013.%20MarkMap%20%E6%80%9D%E7%BB%B4%E5%AF%BC%E5%9B%BE)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 思维导图组件如何使用？](#3--思维导图组件如何使用)
  - [3.1. 基本用法](#31-基本用法)
  - [3.2. 导入文件](#32-导入文件)
  - [3.3. 配置层级](#33-配置层级)
  - [3.4. 其他功能](#34-其他功能)
- [4. 🔗 引用](#4--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- 思维导图组件的基本使用

## 2. 🫧 评价

想要在纯 markdown 中集成思维导图功能，目前测试下来最佳方案是使用 [markmap][1]。

TNotes 中的 MarkMap 思维导图组件就是基于 markmap 实现的。

## 3. 🤔 思维导图组件如何使用？

支持的写法蛮多的，且支持传入参数配置默认展开的层级。

### 3.1. 基本用法

输入：

<<< ./assets/1.md

输出：

```markmap

- root
  - item1
  - item2

```

### 3.2. 导入文件

::: code-group

````md [导入文件的写法]
```markmap
<<< ./assets/2.md
```
````

<<< ./assets/2.md [被导入的文件内容]

:::

输出：

```markmap
<<< ./assets/2.md
```

### 3.3. 配置层级

::: code-group

````md [导入文件的写法]
```markmap 2
<<< ./assets/2.md
```
````

<<< ./assets/2.md [被导入的文件内容]

:::

输出：

```markmap 2
<<< ./assets/2.md
```

### 3.4. 其他功能

- 主题切换同步：同一个笔记下的所有 markmap 都保持同一个主题
- 修改层级：可以通过上下箭头调整默认展示的层级，按下回车或者层级旁边的 L 按钮改变层级
- zoom：缩小、放大、居中
- 全屏切换
- ……

## 4. 🔗 引用

[1]: https://github.com/gera2ld/markmap
