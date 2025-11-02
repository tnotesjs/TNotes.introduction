# [0004. 嵌入 B 站视频](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0004.%20%E5%B5%8C%E5%85%A5%20B%20%E7%AB%99%E8%A7%86%E9%A2%91)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 如何嵌入 B 站视频呢？](#3--如何嵌入-b-站视频呢)
- [4. 🔗 引用](#4--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- BilibiliOutsidePlayer 简介

## 2. 🫧 评价

介绍 BilibiliOutsidePlayer 的基本用法。

## 3. 🤔 如何嵌入 B 站视频呢？

获取 BVID：

1. 找到需要插入的视频
   - 比如：https://www.bilibili.com/video/BV1QR4y1y7GG
2. 获取需要插入视频的 BVID -> `BV1QR4y1y7GG`
   - ![图 0](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-10-03-21-59-57.png)
   - 你可以在地址栏中看到 BVID

使用示例：

```md
<BilibiliOutsidePlayer id="BV1QR4y1y7GG" />
<!-- 或者简写 -->
<B id="BV1QR4y1y7GG" />
```

最终渲染效果如下：

<B id="BV1QR4y1y7GG" />

## 4. 🔗 引用

- [截图工具｜ snipaste 的使用分享][1]

[1]: https://www.bilibili.com/video/BV1QR4y1y7GG
