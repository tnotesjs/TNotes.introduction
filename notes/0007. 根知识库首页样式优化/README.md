# [0007. 根知识库首页样式优化](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0007.%20%E6%A0%B9%E7%9F%A5%E8%AF%86%E5%BA%93%E9%A6%96%E9%A1%B5%E6%A0%B7%E5%BC%8F%E4%BC%98%E5%8C%96)

<!-- region:toc -->

- [1. 🆕 根知识库首页样式优化](#1--根知识库首页样式优化)

<!-- endregion:toc -->

## 1. 🆕 根知识库首页样式优化

- 对 TNotes 根目录下的首页样式做了优化。
  - ![图 0](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-06-02-10-51-55.png)
  - 第一个 card 是根，后续带的数字是所有知识库中汇总后的已完成的笔记的数量。
  - 第二个 card 是 TNotes 模板
  - 最后一个 card 是私有知识库
  - 其余 card 按照知识库名称排列
- 目的：
  - 在根中汇总其余知识库，以便查阅。
  - 统计每个知识库中的已完成笔记数量。
- 实现：
  - 首页文档 index.md 中的内容通过脚本来动态生成，数据源位于每个知识库配置文件中。

::: code-group

```txt [index.md] {15-170}
---
layout: home
hero:
  name: TNotes
  tagline: 学点东西，做点贡献。
  image:
    src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/footprints.png
    alt: notes logo
  actions:
    - theme: brand
      text: 开始阅读
      link: README

features:
  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/footprints.png
    title: TNotes（328）
    details: TNotes.xxx 所有知识库的根节点，汇总所有 TNotes 相关的笔记。
    link: https://tdahuyou.github.io/notes

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--template.svg
    title: TNotes 笔记模板（5）
    details: 25.03 正在测试、优化中。
    link: https://tdahuyou.github.io/TNotes.template/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--c-cpp.svg
    title: C、C++ 笔记（1）
    details: 公司产品涉及到这块知识，有时间再慢慢倒腾。
    link: https://tdahuyou.github.io/TNotes.c-cpp/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--canvas.svg
    title: Canvas 笔记（0）
    details: 基本完成，还需要整理，目前记录的都是一些非常基础的内容。
    link: https://tdahuyou.github.io/TNotes.canvas/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--change-log.svg
    title: TNotes 更新日志（1）
    details: 按照月份，记录 TNotes 更新的内容。
    link: https://tdahuyou.github.io/TNotes.change-log/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--cooking.svg
    title: 做饭笔记（5）
    details: 记录一些自己做过的吃的。
    link: https://tdahuyou.github.io/TNotes.cooking/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--eggjs.png
    title: Egg.js 笔记（19）
    details: 25.03 近期在写后端（边学边写），需要用到这玩意儿，正好写点儿笔记。
    link: https://tdahuyou.github.io/TNotes.egg/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--electron.svg
    title: Electron 笔记（19）
    details: 优化早期写的一些内容的格式。
    link: https://tdahuyou.github.io/TNotes.electron/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--en-notes.svg
    title: 英语学习笔记（5）
    details: 记单词工具、后续也可以将学口语、练听力的功能也加上。
    link: https://tdahuyou.github.io/TNotes.en-notes/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--footprints.svg
    title: 活着的一些动态（6）
    details: 类似于一个在线版的微信朋友圈
    link: https://tdahuyou.github.io/TNotes.footprints/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--git.svg
    title: git 笔记（0）
    details: 目前主要记录了一些在使用 git 命令过程中的一些报错。
    link: https://tdahuyou.github.io/TNotes.git-notes/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--html-css-js.png
    title: 前端三件套（30）
    details: 记录跟前端相关的一系列内容。
    link: https://tdahuyou.github.io/TNotes.html-css-js/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--leetcode.svg
    title: Leetcode 刷题笔记（3）
    details: 数据结构与算法
    link: https://tdahuyou.github.io/TNotes.leetcode/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--miniprogram-wechat.svg
    title: 小程序（0）
    details: 前司需要做一个年会抽奖的微信小程序，当时看官方文档学了点儿皮毛，现公司目前无这方面的需求，因此目前基本没再更新。【占位仓库】
    link: https://tdahuyou.github.io/TNotes.miniprogram/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--network.svg
    title: 网络笔记（0）
    details: 待搬运语雀上的笔记。（早期记录了一些 http、tcp 相关的内容）
    link: https://tdahuyou.github.io/TNotes.network/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--nodejs.svg
    title: NodeJS 笔记（57）
    details: TNotes 实现的核心逻辑基本上都是基于 NodeJS 来实现的。
    link: https://tdahuyou.github.io/TNotes.nodejs/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--pc.svg
    title: notes（46）
    details: 早期在 B 站坐的工具分享系列内容，或者存储的一些没有明确分组的笔记的集合。
    link: https://tdahuyou.github.io/TNotes.notes/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--react.svg
    title: React 笔记（37）
    details: 待搬运语雀上的笔记。
    link: https://tdahuyou.github.io/TNotes.react/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--mysql.svg
    title: SQL 笔记（30）
    details: SQL 学习笔记，正在刷《MySQL 8 从入门到精通》。
    link: https://tdahuyou.github.io/TNotes.sql/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--svg.png
    title: SVG 笔记（34）
    details: 基本完成，还需要整理，目前记录的都是一些非常基础的内容。
    link: https://tdahuyou.github.io/TNotes.svg/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--typescript.svg
    title: TS 笔记（0）
    details: 待搬运语雀上的笔记。
    link: https://tdahuyou.github.io/TNotes.typescript/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--vite.svg
    title: Vite 笔记（0）
    details: 待搬运语雀上的笔记。
    link: https://tdahuyou.github.io/TNotes.vite/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--vitepress.svg
    title: VitePress 笔记（1）
    details: SSG 静态站点生成器，TNotes 核心依赖之一。
    link: https://tdahuyou.github.io/TNotes.vitepress/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--vue.svg
    title: Vue.js 笔记（0）
    details: 待搬运语雀上的笔记。
    link: https://tdahuyou.github.io/TNotes.vue/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--webpack.svg
    title: Webpack 笔记（0）
    details: 待搬运语雀上的笔记。
    link: https://tdahuyou.github.io/TNotes.webpack/

  - icon:
      src: https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--0.svg
    title: 0
    completed_notes_count: 0
    details: 个人学习资料汇总，存储了一些不便公开的学习资料，从 0 到 1 嘛，0 是学习资料、1 就是这些公开的笔记了。
    link: https://github.com/Tdahuyou/TNotes.0
---
```

```json [.tnotes.json] {15-23}
{
  "author": "Tdahuyou",
  "repoName": "TNotes.change-log",
  "keywords": ["TNotes.change-log"],
  "ignore_dirs": [
    ".vscode",
    "0000",
    "assets",
    "node_modules",
    "hidden",
    "demos",
    "assets"
  ],
  "rootSidebarDir": "../TNotes/sidebars",
  "root_item": {
    "icon": {
      "src": "https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/assets/icon--change-log.svg"
    },
    "title": "TNotes 更新日志",
    "completed_notes_count": 2,
    "details": "按照月份，记录 TNotes 更新的内容。",
    "link": "https://tdahuyou.github.io/TNotes.change-log/"
  },
  "port": 9448,
  "menuItems": [
    {
      "text": "🏠 Home",
      "link": "/"
    },
    {
      "text": "⚙️ Settings",
      "link": "/Settings"
    },
    {
      "text": "📒 TNotes",
      "link": "https://tdahuyou.github.io/notes"
    },
    {
      "text": "📂 TNotes.yuque",
      "link": "https://www.yuque.com/tdahuyou/tnotes.yuque"
    }
  ],
  "socialLinks": [
    {
      "ariaLabel": "Tdahuyou 语雀主页链接",
      "link": "https://www.yuque.com/tdahuyou",
      "icon": {
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M17.28 2.955c2.97.203 3.756 2.342 3.84 2.597l1.297.096c.13 0 .169.18.054.236c-1.323.716-1.727 2.17-1.49 3.118c.09.358.254.69.412 1.02c.307.642.651 1.418.707 2.981c.117 3.24-2.51 6.175-5.789 6.593c1.17-1.187 1.815-2.444 2.12-3.375c.606-1.846.508-3.316.055-4.44a4.46 4.46 0 0 0-1.782-2.141c-1.683-1.02-3.22-1.09-4.444-.762c.465-.594.876-1.201 1.2-1.864c.584-1.65-.102-2.848-.704-3.519c-.192-.246-.061-.655.305-.655c1.41 0 2.813.02 4.22.115M3.32 19.107c1.924-2.202 4.712-5.394 7.162-8.15c.559-.63 2.769-2.338 5.748-.533c.878.532 2.43 2.165 1.332 5.51c-.803 2.446-4.408 7.796-15.76 5.844c-.227-.039-.511-.354-.218-.687z\"/></svg>"
      }
    },
    {
      "ariaLabel": "Tdahuyou B 站主页链接",
      "link": "https://space.bilibili.com/407241004",
      "icon": {
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1024\" height=\"1024\" viewBox=\"0 0 1024 1024\"><g fill=\"currentColor\"><path d=\"M310.134 596.45c-7.999-4.463-16.498-8.43-24.997-11.9a274 274 0 0 0-26.996-7.438c-2.5-.992-2.5.991-2.5 1.487c0 7.934.5 18.843 1.5 27.768c1 7.438 2 15.372 4 22.81c0 .496 0 .991.5 1.487c.999.992 1.999 1.488 2.999.496c7.999-4.463 15.998-8.43 22.997-13.388c7.499-5.454 15.498-11.9 21.997-18.347c1.5-1.487 0-2.479.5-2.975m323.96-11.9a274 274 0 0 0-26.997-7.438c-2.5-.992-2.5.991-2.5 1.487c0 7.934.5 18.843 1.5 27.768c1 7.438 2 15.372 4 22.81c0 .496 0 .991.5 1.487c1 .992 2 1.488 3 .496c7.999-4.463 15.998-8.43 22.997-13.388c7.499-5.454 15.498-11.9 21.997-18.347c2-1.487.5-2.479.5-2.975c-7.5-4.463-16.498-8.43-24.997-11.9\"/><path d=\"M741.496 112H283c-94.501 0-171 76.5-171 171.5v458c.5 94 77 170.5 170.999 170.5h457.997c94.5 0 171.002-76.5 171.002-170.5v-458c.497-95-76.002-171.5-170.502-171.5m95 343.5h15.5v48h-15.5zm-95.5-1.5l2 43l-13.5 1.5l-5-44.5zm-23.5 0l4 45.5l-14.5 1.5l-6.5-47.5h17zm-230.498 1.5h15v48h-15zm-96-1.5l2 43l-13.5 1.5l-5-44.5zm-23.5 0l4 45.5l-14.5 2l-6-47.5zm-3.5 149C343.498 668.5 216 662.5 204.5 660.5C195.5 499 181.5 464 170 385l54.5-22.5c1 71.5 9 185 9 185s108.5-15.5 132 47c.5 3 0 6-1.5 8.5m20.5 35.5l-23.5-124h35.5l13 123zm44.5-8l-27-235l33.5-1.5l21 236H429zm34-175h17.5v48H467zm41 190h-26.5l-9.5-126h36zm209.998-43C693.496 668 565.997 662 554.497 660c-9-161-23-196-34.5-275l54.5-22.5c1 71.5 9 185 9 185s108.5-15.5 132 46.5c.5 3 0 6-1.5 8.5m19.5 36l-23-124h35.5l13 123zm45.5-8l-27.5-235l33.5-1.5l21 236h-27zm33.5-175h17.5v48h-13zm41 190h-26.5l-9.5-126h36z\"/></g></svg>"
      }
    },
    {
      "ariaLabel": "TNotes.change-log github 仓库链接",
      "link": "https://github.com/Tdahuyou/TNotes.change-log",
      "icon": "github"
    }
  ],
  "id": "f7674e4d-9c1b-424e-b1dc-bcef54a50a8b"
}
```

```js [_/scripts/gen-index-md.js]
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 🧩 常量定义 ------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 根知识库标识符
const ROOT_KNOWLEDGE_KEY = '_'

// JSON 输入路径：根知识库配置文件
const JSON_INPUT_PATH = path.resolve(__dirname, '..', '.tnotes.json')

// Markdown 输出路径
const MD_OUTPUT_PATH = path.resolve(__dirname, '..', 'docs', 'src', 'index.md')

// 排序顺序
const FEATURES_DISPLAY_ORDER = [
  ROOT_KNOWLEDGE_KEY,
  'TNotes.template',
  'TNotes.c-cpp',
  'TNotes.canvas',
  'TNotes.change-log',
  'TNotes.cooking',
  'TNotes.egg',
  'TNotes.electron',
  'TNotes.en-notes',
  // 'TNotes.en-words',
  'TNotes.footprints',
  'TNotes.git-notes',
  'TNotes.html-css-js',
  'TNotes.leetcode',
  'TNotes.miniprogram',
  'TNotes.network',
  'TNotes.nodejs',
  'TNotes.notes',
  'TNotes.react',
  'TNotes.sql',
  'TNotes.svg',
  'TNotes.typescript',
  'TNotes.vite',
  'TNotes.vitepress',
  'TNotes.vue',
  'TNotes.webpack',
  'TNotes.0',
]

// 不需要统计 completed_notes_count 的 key 列表
const IGNORE_NOTE_COUNT_KEYS = ['TNotes.en-words', 'TNotes.0']

// 所有子知识库的配置文件路径
const SUB_KNOWLEDGE_TNOTES_CONFIG_PATHS = FEATURES_DISPLAY_ORDER.map((key) =>
  path.resolve(__dirname, '..', '..', key, '.tnotes.json')
)

const SUB_CONFIG_KEY = 'root_itemm'

// 📁 工具函数 ------------------------------------------------------------------

function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.warn(`⚠️ 无法读取或解析文件: ${filePath}`)
    return null
  }
}

function writeMarkdownFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`✅ Markdown 文件已生成: ${filePath}`)
}

function serialize(obj, indent = 0) {
  let result = ''
  const spaces = '  '.repeat(indent)

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}- ${serialize(item, indent + 1).trimStart()}\n`
      } else {
        result += `${spaces}- ${item}\n`
      }
    })
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      const value = obj[key]
      if (typeof value === 'object' && value !== null) {
        result += `${spaces}${key}:\n`
        result += serialize(value, indent + 1)
      } else {
        result += `${spaces}${key}: ${value}\n`
      }
    }
  }

  return result
}

function calculateTotalNoteCount(features) {
  const entries = Object.entries(features).filter(
    ([key]) =>
      key !== ROOT_KNOWLEDGE_KEY && !IGNORE_NOTE_COUNT_KEYS.includes(key)
  )
  return entries.reduce((sum, [_, feature]) => {
    const count = parseInt(feature.completed_notes_count || '0', 10)
    return sum + count
  }, 0)
}

function sortFeaturesByOrder(features) {
  return FEATURES_DISPLAY_ORDER.map((key) => features[key]).filter(Boolean)
}

function processFeatures(featuresArray) {
  return featuresArray.map((feature) => {
    const newFeature = { ...feature }

    const shouldIgnore = IGNORE_NOTE_COUNT_KEYS.some((key) =>
      feature.title.toLowerCase().includes(key.split('.').pop())
    )

    if (!shouldIgnore && newFeature.completed_notes_count !== undefined) {
      newFeature.title = `${newFeature.title}（${newFeature.completed_notes_count}）`
      delete newFeature.completed_notes_count
    }

    return newFeature
  })
}

// 🔄 主逻辑：加载子知识库配置并合并到根配置中 ------------------------------------------------------------------

function main() {
  // 1️⃣ 读取根知识库配置
  const rootConfig = readJsonFile(JSON_INPUT_PATH)
  const rootFeatures = rootConfig.home.features

  // 2️⃣ 遍历所有子知识库配置文件
  const mergedFeatures = { ...rootFeatures }

  SUB_KNOWLEDGE_TNOTES_CONFIG_PATHS.forEach((configPath) => {
    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️ 配置文件不存在，跳过: ${configPath}`)
      return
    }

    const folderName = path.basename(path.dirname(configPath))
    if (!FEATURES_DISPLAY_ORDER.includes(folderName)) return

    const subConfig = readJsonFile(configPath)
    if (!subConfig[SUB_CONFIG_KEY]) return

    const overrideItem = subConfig[SUB_CONFIG_KEY]
    mergedFeatures[folderName] = {
      ...mergedFeatures[folderName],
      ...overrideItem,
    }
  })

  // 3️⃣ 构建最终数据
  const totalNotes = calculateTotalNoteCount(mergedFeatures)
  mergedFeatures[ROOT_KNOWLEDGE_KEY].completed_notes_count =
    totalNotes.toString()

  const orderedFeatures = sortFeaturesByOrder(mergedFeatures)
  const processedFeatures = processFeatures(orderedFeatures)

  const finalData = {
    layout: rootConfig.home.layout,
    hero: rootConfig.home.hero,
    features: processedFeatures,
  }

  // 4️⃣ 生成 Markdown 文件
  let markdown = '---\n'
  markdown += serialize(finalData)
  markdown = markdown.trimEnd()
  markdown += '\n---'

  writeMarkdownFile(MD_OUTPUT_PATH, markdown)

  // 🔁 将合并后的 features 写回根配置文件
  rootConfig.home.features = mergedFeatures
  fs.writeFileSync(JSON_INPUT_PATH, JSON.stringify(rootConfig, null, 2), 'utf8')
  console.log(`✅ 根知识库配置已更新: ${JSON_INPUT_PATH}`)
}

// ----------------------
// ▶️ 启动脚本
// ----------------------

main()
```

:::
