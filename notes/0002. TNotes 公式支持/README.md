# [0002. TNotes 公式支持](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0002.%20TNotes%20%E5%85%AC%E5%BC%8F%E6%94%AF%E6%8C%81)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 TNotes 中支持数学公式吗？](#3--tnotes-中支持数学公式吗)
  - [3.1. `test 1`](#31-test-1)
    - [输入](#输入)
    - [输出](#输出)
  - [3.2. `test 2`](#32-test-2)
    - [输入](#输入)
    - [输出](#输出)
- [4. 🔗 引用](#4--引用)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- TNotes 公式支持

## 2. 🫧 评价

印象中，在早期的 vitepress 中是没有 [数学公式支持][3] 的，需要手动去引第三方的库来实现，现在已经提供了支持，需要下载一个第三方库 `markdown-it-mathjax3` 然后开启 `math` 配置即可。

## 3. 🤔 TNotes 中支持数学公式吗？

在 TNotes 中已经开启了 vitepress 提供的数学公式支持功能。

以下是两个简单的测试用例：

| 测试用例 | 描述                                                              |
| -------- | ----------------------------------------------------------------- |
| `test 1` | 这是引用自 vitepress 官方的测试用例                               |
| `test 2` | 这是写 TNotes.leetcode 题解的时候经常要用到的复杂度的一些写法测试 |

### 3.1. `test 1`

#### 输入

```md
When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are

$$ x = {-b \pm \sqrt{b^2-4ac} \over 2a} $$

Maxwell's equations:

| equation | description |
| --- | --- |
| $\nabla \cdot \vec{\mathbf{B}}  = 0$ | divergence of $\vec{\mathbf{B}}$ is zero |
| $\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t}  = \vec{\mathbf{0}}$ | curl of $\vec{\mathbf{E}}$ is proportional to the rate of change of $\vec{\mathbf{B}}$ |
| $\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} = \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho$ | _wha?_ |
```

#### 输出

When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are

$$ x = {-b \pm \sqrt{b^2-4ac} \over 2a} $$

Maxwell's equations:

| equation | description |
| --- | --- |
| $\nabla \cdot \vec{\mathbf{B}}  = 0$ | divergence of $\vec{\mathbf{B}}$ is zero |
| $\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t}  = \vec{\mathbf{0}}$ | curl of $\vec{\mathbf{E}}$ is proportional to the rate of change of $\vec{\mathbf{B}}$ |
| $\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} = \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho$ | _wha?_ |

### 3.2. `test 2`

#### 输入

```md
- $O(n)$
- $O(n^2)$
- $O(\log n)$
```

#### 输出

- $O(n)$
- $O(n^2)$
- $O(\log n)$

## 4. 🔗 引用

- [Vitepress - markdown 扩展 - 数学方程][3]
- [markdown-it-mathjax3 - github][2]
- [markdown-it-mathjax3 - github page][1]

[1]: https://tani.github.io/markdown-it-mathjax3/
[2]: https://github.com/tani/markdown-it-mathjax3
[3]: https://vitepress.dev/zh/guide/markdown#math-equations
