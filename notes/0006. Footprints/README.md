# [0006. Footprints](https://github.com/Tdahuyou/TNotes.template/tree/main/notes/0006.%20Footprints)

<!-- region:toc -->
- [1. 📒 notes_title](#1--notes_title)
<!-- endregion:toc -->

## 1. 📒 notes_title

<Footprints :times="[2025, 3, 15, 0, 43]">
  <template #text-area>
    <p>正在整理 TNotes.template 的功能文档</p>
    <p>现在外边正下着小于雨 🌧️</p>
  </template>
  <template #image-list="{ openModal }">
    <img src="assets/2025-03-15-00-44-24.png" @click="openModal(0)"/>
    <img src="assets/2025-03-15-00-44-24.png" @click="openModal(1)"/>
    <img src="assets/2025-03-15-00-44-24.png" @click="openModal(2)"/>
    <img src="assets/2025-03-15-00-44-24.png" @click="openModal(3)"/>
    <img src="assets/we.jpg" @click="openModal(4)"/>
    <img src="assets/2025-03-15-00-44-24.png" @click="openModal(5)"/>
    <img src="assets/2025-03-15-00-44-24.png" @click="openModal(6)"/>
    <img src="assets/2025-03-15-00-44-24.png" @click="openModal(7)"/>
    <img src="assets/2025-03-15-00-44-24.png" @click="openModal(8)"/>
  </template>
</Footprints>