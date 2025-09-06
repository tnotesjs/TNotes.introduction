# [0010. EnWordList](https://github.com/Tdahuyou/TNotes.introduction/tree/main/notes/0010.%20EnWordList)

<!-- region:toc -->

- [1. 🆕 词汇卡片、发音、选中状态](#1--词汇卡片发音选中状态)

<!-- endregion:toc -->

## 1. 🆕 词汇卡片、发音、选中状态

- ![图 3](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-10-23-38-38.png)
- 实现单词发音功能
  - 支持英音、美音
  - 支持批量播放
    - 被朗读的单词会默认高亮
    - ![图 4](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-10-23-39-34.png)
    - 在批量播放过程中，播放任意单词，将会中止后续的播放流程。
- 词汇预加载 - 优化单词卡片的加载体验

---

🗓 25.05.09

- en-notes
  - 优化 TNotes.en-notes 中的单词本用到的词汇渲染组件
  - 实现加载单词卡片功能
    - 鼠标放在单词上，自动加载单词数据，并以 card 的形式来呈现。
    - ![图 1](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-10-23-32-43.png)
  - 实现单词卡片的 pin 功能
    - ![图 2](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-05-10-23-34-29.png)
    - 实现单词卡片的拖动功能
    - 实现单词卡片的尺寸调节功能
    - 实现层级自动调节功能（被点击的 card 默认置顶）
