# [0005. Discussions](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0005.%20Discussions)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 如何开启评论功能？](#3--如何开启评论功能)
- [4. 🔗 引用](#4--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- 评论功能简介

## 2. 🫧 评价

评论组件是基于 `giscus` 实现的。

## 3. 🤔 如何开启评论功能？

只需要在配置文件 `tnotes.json` 中将 `"enableDiscussions": true,` 开启即可。

```json [5]
{
  "bilibili": [],
  "tnotes": [],
  "yuque": [],
  "done": false,
  "enableDiscussions": false,
  "created_at": 1762087893770,
  "updated_at": 1762087893770,
  "id": "2dfe45e5-5f93-4ebe-a7fb-82570dbc9853"
}
```

开启配置之后，TNotes 自动在笔记结尾插入评论组件 `<Discussions />`，会自动渲染为类似 GitHub 风格的评论组件。

## 4. 🔗 引用

- [giscus][1]

[1]: https://giscus.app/zh-CN
