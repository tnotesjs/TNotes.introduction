# [0007. 英文单词列表](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0007.%20%E8%8B%B1%E6%96%87%E5%8D%95%E8%AF%8D%E5%88%97%E8%A1%A8)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 英文单词列表组件是什么？如何使用？有哪些功能？](#3--英文单词列表组件是什么如何使用有哪些功能)
  - [3.1. 核心功能简介](#31-核心功能简介)
  - [3.2. 功能演示](#32-功能演示)
  - [3.3. 使用示例](#33-使用示例)
- [4. 🔗 引用](#4--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- 单词组件的基本用法

## 2. 🫧 评价

单词组件的数据源来自于开源项目 [dict][1]。

::: tip ⏰ TODO

使用体验不是特别满意，还会继续优化！

:::

## 3. 🤔 英文单词列表组件是什么？如何使用？有哪些功能？

### 3.1. 核心功能简介

| 功能类别 | 功能简介 |
| --- | --- |
| 词汇预加载 | ✅ 优化单词卡片的加载体验 |
| 词汇卡片 | ✅ 支持 pin 到页面上<br> ✅ 单词卡片支持拖动<br> ✅ 单词卡片尺寸支持调节<br> ✅ 层级自动会调节（被点击的 `card` 默认置顶）<br>✅ 打开自动显示单词卡片的开关后，鼠标悬停时自动展示单词详情 |
| 发音 | ✅ 支持英音、美音<br>✅ 支持批量播放<br> ✅ 被朗读的单词默认高亮<br> ✅ 批量播放中再次播放任意单词会中止后续流程 |
| 完成状态切换 | ✅ 对记住的词汇可在前边打勾<br>✅ 学习记录缓存在浏览器中 |
| 排序 | ✅ 可配置是否根据字母升序排序 |

### 3.2. 功能演示

- `1` - 右键菜单项
- `2` - 播放到的词汇自动高亮
- `3` - 自动展示单词卡片
- `4` - 单词卡片的 pin 功能

::: swiper

![1](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-10-23-38-38.png)

![2](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-10-23-39-34.png)

![3](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-10-23-32-43.png)

![4](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-10-23-34-29.png)

:::

### 3.3. 使用示例

```md
<!-- 布尔属性：needSort，可以开启按照字母升序排序的功能 -->

<EnWordList :words="[
'cancel',
'explosive',
'numerous',
'govern',
'analyse',
'discourage',
'resemble',
'remote',
'salary',
'pollution',
'pretend',
'kettle',
'wreck',
'drunk',
'calculate',
'persistent',
'sake',
'conceal',
'audience',
'meanwhile',]" />
```

最终效果如下：

<EnWordList :words="[
'cancel',
'explosive',
'numerous',
'govern',
'analyse',
'discourage',
'resemble',
'remote',
'salary',
'pollution',
'pretend',
'kettle',
'wreck',
'drunk',
'calculate',
'persistent',
'sake',
'conceal',
'audience',
'meanwhile',]" />

## 4. 🔗 引用

- [dict][1]

[1]: https://github.com/kajweb/dict
