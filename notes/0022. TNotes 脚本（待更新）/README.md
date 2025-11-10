# [0022. TNotes 脚本（待更新）](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0022.%20TNotes%20%E8%84%9A%E6%9C%AC%EF%BC%88%E5%BE%85%E6%9B%B4%E6%96%B0%EF%BC%89)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. ⚙️ 脚本简介](#3-️-脚本简介)
- [4. 💻 使用 VSCode 任务快速调用命令](#4--使用-vscode-任务快速调用命令)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- TNotes 核心脚本简介

## 2. 🫧 评价

- 记录 TNotes 中的核心脚本，也就是 `package.json` 中 `scripts` 字段中的内容。
- TODO
  - 这些脚本后续可以抽离出来，不必附着于 notes 仓库，比如可以考虑封装为 VSCode 插件、或者 npm 包的形式来安装，具体如何实现，可以找空闲时间测试一下，看看怎么整更方便。

## 3. ⚙️ 脚本简介

```json
"scripts": {
  "tn:new": "         node ./.vitepress/tnotes --new",
  "tn:dev": "         node ./.vitepress/tnotes --dev",
  "tn:dev:safe": "    node ./.vitepress/tnotes --safeDev",
  "tn:update": "      node ./.vitepress/tnotes --update",
  "tn:update:safe": " node ./.vitepress/tnotes --safeUpdate",
  "tn:push": "        node ./.vitepress/tnotes --push",
  "tn:pull": "        node ./.vitepress/tnotes --pull",
  "tn:merge": "       node ./.vitepress/tnotes --merge",
  "tn:distribute": "  node ./.vitepress/tnotes --distribute",
  "tn:tempSync": "    node ./.vitepress/tnotes --tempSync",
  "tn:pushAll": "     node ./.vitepress/tnotes --pushAll",
  "tn:build": "       node ./.vitepress/tnotes --build",
  "tn:preview": "     node ./.vitepress/tnotes --preview",
  "tn:pullAll": "     node ./.vitepress/tnotes --pullAll",
  "tn:sync": "        node ./.vitepress/tnotes --sync",
  "tn:syncAll": "     node ./.vitepress/tnotes --syncAll"
}
```

| 命令 | 描述 | 使用频率 |
| --- | --- | --- |
| `tn:new` | 新建笔记 | ⭐️⭐️ |
| `tn:dev` | 启动开发环境 | ⭐️⭐️⭐️ |
| `tn:dev:safe` | 以安全的方式启动开发环境，配合 `tn:update:safe` 使用 | ⭐️⭐️ |
| `tn:update` | 更新笔记 | ⭐️⭐️⭐️ |
| `tn:update:safe` | 以安全的方式更新笔记，配合 `tn:dev:safe` 使用，以免大量笔记（比如 `TNotes.leetcode` 中 `3k+` 数量的笔记）的更新导致服务卡死 | ⭐️⭐️ |
| `tn:push` | 将笔记推送到 GitHub | ⭐️⭐️⭐️ |
| `tn:pull` | 从 GitHub 拉取最新的笔记（更多情况下会直接使用 `git pull` 命令） | ⭐️ |
| `tn:merge` | 合并所有笔记到 `MERGED_README.md` 文件中，配合 `tn:distribute` 使用 | ⭐️ |
| `tn:distribute` | 分发 `MERGED_README.md` 文件中的内容到每个笔记中 | ⭐️ |
| `tn:tempSync` | 向指定本地的 `TNotes.xxx` 知识库同步 TNotes 核心逻辑 | ⭐️⭐️⭐️ |
| `tn:pushAll` | 遍历所有 `TNotes.xxx`，将所有知识库的笔记推送到 GitHub | ⭐️⭐️⭐️ |
| `tn:build` | 笔记打包（通常会在 GitHub pages 构建失败的时候排查问题使用） | ⭐️⭐️ |
| `tn:preview` | 预览笔记打包结果 | ⭐️ |
| `tn:pullAll` | 遍历所有 `TNotes.xxx`，从 GitHub 拉取最新的笔记 | ⭐️ |
| `tn:sync` | 相当于现 `tn:pull` 再 `tn:push` | ⭐️ |
| `tn:syncAll` | 相当于现 `tn:pullAll` 再 `tn:pushAll` | ⭐️ |

## 4. 💻 使用 VSCode 任务快速调用命令

- 使用流程：
  - 1️⃣ `control shift p` 显示并运行命令
  - 2️⃣ `Tasks: Run Task` 找到这个命令。提示：只需要键入关键字，比如 `run` 或者 `run task` 即可快速定位到这个命令
  - 3️⃣ 通过上、下方向键切换到需要运行的命令，或者直接键入关键字，比如 `tn:update`、`tn:new` 来定位到指定命令。提示：你也可以将常用的命令 pin 在头部。
  - 4️⃣ 按下回车键运行命令即可

::: swiper

![1](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-10-03-21-47-32.png)

![2](https://cdn.jsdelivr.net/gh/tnotesjs/imgs@main/2025-10-03-21-51-56.png)

:::

- 上述流程使用习惯之后想要运行某个指令是非常快的，比如如果想要更新笔记状态，只需要敲几下键盘就完事儿了 👉 `control shift p` -> `task` -> `update`。
- `.vscode/tasks.json` 配置文件的内容如下：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "tn:new",
      "detail": "新建一篇笔记",
      "type": "shell",
      "command": "pnpm tn:new",
      "group": {
        "kind": "build"
      },
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:dev",
      "detail": "启动知识库开发环境",
      "type": "shell",
      "command": "pnpm tn:dev",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:dev:safe",
      "detail": "安全启动知识库开发环境（自动管理进程）",
      "type": "shell",
      "command": "pnpm tn:dev:safe",
      "group": "build",
      "problemMatcher": ["$tsc"],
      "isBackground": true,
      "presentation": {
        "panel": "dedicated",
        "reveal": "always",
        "focus": true
      },
      "runOptions": {
        "runOn": "folderOpen",
        "instanceLimit": 1 // 防止重复启动
      }
    },
    {
      "label": "tn:update",
      "detail": "根据笔记内容更新知识库",
      "type": "shell",
      "command": "pnpm tn:update",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:update:safe",
      "detail": "安全更新知识库（自动重启服务）",
      "type": "shell",
      "command": "pnpm tn:update:safe",
      "group": "build",
      "problemMatcher": ["$tsc"],
      "presentation": {
        "panel": "dedicated",
        "reveal": "always",
        "focus": true
      }
    },
    {
      "label": "tn:push",
      "detail": "将知识库推送到 github",
      "type": "shell",
      "command": "pnpm tn:push",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:pull",
      "detail": "将 github 的知识库拉下来",
      "type": "shell",
      "command": "pnpm tn:pull",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:merge",
      "detail": "合并知识库中的所有笔记到一个文件 MERGED_README.md 中（所有笔记数据汇总到一个文件中进行批量编辑，常用于快速统一所有笔记格式等需要批量操作多篇笔记的场景）",
      "type": "shell",
      "command": "pnpm tn:merge",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:distribute",
      "detail": "分发 MERGED_README.md 文件中的内容到各笔记中（配合 tn:merge 使用）",
      "type": "shell",
      "command": "pnpm tn:distribute",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:tempSync",
      "detail": "同步知识库脚本到其它 TNotes.xxx 知识库中",
      "type": "shell",
      "command": "pnpm tn:tempSync",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:pushAll",
      "detail": "推送所有 TNotes.xxx 知识库到 GitHub",
      "type": "shell",
      "command": "pnpm tn:pushAll",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:build",
      "detail": "构建知识库",
      "type": "shell",
      "command": "pnpm tn:build",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:preview",
      "detail": "预览构建后的知识库",
      "type": "shell",
      "command": "pnpm tn:preview",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:pullAll",
      "detail": "拉取所有 TNotes.xxx 知识库，确保本地的仓库是最新的",
      "type": "shell",
      "command": "pnpm tn:pullAll",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:sync",
      "detail": "同步本地和远程的知识库状态",
      "type": "shell",
      "command": "pnpm tn:sync",
      "group": "build",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "tn:syncAll",
      "detail": "同步所有知识库",
      "type": "shell",
      "command": "pnpm tn:syncAll",
      "group": "build",
      "problemMatcher": ["$tsc"]
    }
  ]
}
```
