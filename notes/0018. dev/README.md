# [0018. dev](https://github.com/tnotesjs/TNotes.introduction/tree/main/notes/0018.%20dev)

<!-- region:toc -->

- [1. 🎯 本节内容](#1--本节内容)
- [2. 🫧 评价](#2--评价)
- [3. 🤔 TNotes 知识库的开发环境启动命令是？](#3--tnotes-知识库的开发环境启动命令是)
- [4. 🤔 服务的启动流程是？](#4--服务的启动流程是)
- [5. 🤔 为什么需要对 `vitepress dev` 做二次封装？](#5--为什么需要对-vitepress-dev-做二次封装)
- [6. 🤔 vitepress 服务启动阶段都做了哪些检查？](#6--vitepress-服务启动阶段都做了哪些检查)
  - [6.1. 确保是单例服务](#61-确保是单例服务)
  - [6.2. 确保无冲突的笔记索引和配置 id](#62-确保无冲突的笔记索引和配置-id)
- [7. 🤔 如何获取 vitepress 服务启动的真实进度？](#7--如何获取-vitepress-服务启动的真实进度)
- [8. 🤔 vitepress 服务启动的超时时间是？](#8--vitepress-服务启动的超时时间是)
- [9. 🤔 TNotes 笔记监听服务的启动流程是？](#9--tnotes-笔记监听服务的启动流程是)
  - [9.1. 步骤 1：获取笔记数据](#91-步骤-1获取笔记数据)
  - [9.2. 步骤 2：初始化笔记索引缓存](#92-步骤-2初始化笔记索引缓存)
  - [9.3. 步骤 3：启动文件监听服务](#93-步骤-3启动文件监听服务)

<!-- endregion:toc -->

## 1. 🎯 本节内容

- `tn:dev` 命令简介

## 2. 🫧 评价

这篇笔记用于记录 `tn:dev` 命令启动知识库开发服务的核心流程，主要可分为两个阶段：

1. 启动 vitepress 服务
2. 启动 TNotes 笔记监听服务

## 3. 🤔 TNotes 知识库的开发环境启动命令是？

```bash
# 执行以下命令，启动笔记服务
pnpm tn:dev

# 相当于执行：
# tsx ./.vitepress/tnotes/index.ts --dev
# 本质是运行 ./.vitepress/tnotes/index.ts 文件，并传入启动参数 --dev
```

## 4. 🤔 服务的启动流程是？

![1.svg](./assets/1.svg)

## 5. 🤔 为什么需要对 `vitepress dev` 做二次封装？

核心目的：实现 vitepress 单例服务，以免误操作同时启动多个服务，导致监听行为冲突。

相关逻辑所在位置：在 `.vitepress/tnotes/commands/dev/DevCommand.ts` 中引入了二次封装的 `VitepressService` 类，通过 `vitepressService.startServer()` 来启动 vitepress 服务。

## 6. 🤔 vitepress 服务启动阶段都做了哪些检查？

### 6.1. 确保是单例服务

需要确保服务是单例的，在服务启动之前会做以下处理：

- 根据服务 ID `${repoName}-vitepress-dev` 检查当前知识库的 vitepress 服务是否已启动过，若检测到服务已经启动则 kill 旧的服务进程。
- 检查服务端口是否被占用，若被占用则终止占用端口的进程。

经过上述处理之后，再执行 `vitepress dev` 命令：

```ts {7-10}
// .vitepress/tnotes/services/VitepressService.ts

// 启动 VitePress 开发服务器
const pm = this.configManager.get('packageManager') || DEFAULT_PACKAGE_MANAGER
const args = ['vitepress', 'dev', '--port', port.toString()]

const processInfo = this.processManager.spawn(processId, pm, args, {
  cwd: ROOT_DIR_PATH,
  stdio: ['inherit', 'pipe', 'pipe'],
})
```

### 6.2. 确保无冲突的笔记索引和配置 id

在 `DevCommand.run()` 中，扫描笔记目录并读取配置信息后，会对笔记数据进行完整性校验。校验内容包括：

1. 笔记索引冲突 — 检查是否有多个笔记文件夹使用了相同的 4 位数字编号
2. 配置 ID 缺失 — 检查是否有笔记的 `.tnotes.json` 配置文件缺失或 `id` 字段为空
3. 配置 ID 重复 — 检查是否有多个笔记使用了相同的 UUID 配置 ID

任一检查失败都会终止启动流程，并输出错误信息指引用户修复。

```ts
// .vitepress/tnotes/commands/dev/DevCommand.ts

private validateNotes(notes: NoteInfo[]): void {
  const errors: string[] = []

  // 检查 noteIndex 冲突
  const indexMap = new Map<string, string[]>()
  for (const note of notes) {
    if (!indexMap.has(note.index)) indexMap.set(note.index, [])
    indexMap.get(note.index)!.push(note.dirName)
  }
  for (const [index, dirNames] of indexMap.entries()) {
    if (dirNames.length > 1) {
      errors.push(`⚠️  检测到重复的笔记编号：`)
      errors.push(`   编号 ${index} 被以下笔记重复使用：`)
      dirNames.forEach((dirName) => errors.push(`      - ${dirName}`))
    }
  }

  // 检查 config id 缺失
  const missingConfigId: string[] = []
  for (const note of notes) {
    if (!note.config || !note.config.id) {
      missingConfigId.push(note.dirName)
    }
  }
  if (missingConfigId.length > 0) {
    errors.push(`⚠️  检测到笔记配置 ID 缺失：`)
    missingConfigId.forEach((dirName) => errors.push(`      - ${dirName}`))
  }

  // 检查 config id 重复
  const configIdMap = new Map<string, string[]>()
  for (const note of notes) {
    if (note.config?.id) {
      if (!configIdMap.has(note.config.id))
        configIdMap.set(note.config.id, [])
      configIdMap.get(note.config.id)!.push(note.dirName)
    }
  }
  for (const [configId, dirNames] of configIdMap.entries()) {
    if (dirNames.length > 1) {
      errors.push(`⚠️  检测到重复的笔记配置 ID：`)
      errors.push(`   配置 ID ${configId} 被以下笔记重复使用：`)
      dirNames.forEach((dirName) => errors.push(`      - ${dirName}`))
    }
  }

  if (errors.length > 0) {
    for (const line of errors) {
      this.logger.error(line)
    }
    this.logger.error('\n请修复上述问题后重新启动服务。\n')
    process.exit(1)
  }
}
```

笔记索引冲突示例：

```bash
pnpm tn:dev

# 🚀 [13:08:28.377] [dev] 启动知识库开发服务
# ℹ️  [13:08:28.378] 扫描笔记目录...
# ℹ️  [13:08:28.390] 扫描到 31 篇笔记
# ❌ [13:08:28.590] ⚠️  检测到重复的笔记编号：
# ❌ [13:08:28.590]    编号 0001 被以下笔记重复使用：
# ❌ [13:08:28.590]       - 0001. new
# ❌ [13:08:28.590]       - 0001. TNotes 简介
# ❌ [13:08:28.591]
# 请修复上述问题后重新启动服务。

#  ELIFECYCLE  Command failed with exit code 1.
```

配置 ID 缺失示例：

```bash
pnpm tn:dev

# ❌ ⚠️  检测到笔记配置 ID 缺失：
# ❌       - 0003. 评论功能的技术实现
# ❌
# 请修复上述问题后重新启动服务。
```

配置 ID 重复示例：

```bash
pnpm tn:dev

# ❌ ⚠️  检测到重复的笔记配置 ID：
# ❌    配置 ID f3625513-ef8b-4ef5-b01b-69875d0fdcd9 被以下笔记重复使用：
# ❌       - 0001. TNotes 简介
# ❌       - 0005. 开启评论功能
# ❌
# 请修复上述问题后重新启动服务。
```

## 7. 🤔 如何获取 vitepress 服务启动的真实进度？

启动进度的真实百分比不好获取，通过 vitepress 的钩子做了尝试没能成功，可能需要改 vitepress 源码，目前（26.03）所有 TNotes 知识库的启动耗时大致在十几秒以内，是否能够看到真实进度对体验的影响也不是很大，因此暂时先将这个真实百分比的优化点挂起！

::: tip 无法获取 dev 阶段的百分比进度的根本原因

VitePress 及其底层的 Vite 在启动过程中没有提供进度事件机制。

Vite dev 模式采用 unbundled 设计，启动时只做配置解析和启动 HTTP 服务器，模块在浏览器请求时才按需处理（触发 `resolveId`/`load`/`transform` 钩子），启动阶段根本不存在“逐文件处理”的过程，也就没有进度可报告。

VitePress 的 Build Hooks（如 `buildEnd`、`transformHead`）仅在 SSG 构建时触发（因此 build 阶段可以获取到真实打包进度），dev 模式下不会被调用；`transformPageData` 虽然在 dev 模式可用，但它是按页面请求触发的，不是启动时批量触发的。

开发时曾尝试通过 VitePress 的生命周期钩子和 Vite 插件钩子（`buildStart`、`configureServer` 等）来获取启动进度，但这些钩子在启动时都只触发一次，无法提供逐步的进度信息。

无论是通过 CLI（`spawn`）还是 Node API（`createServer`）启动，都只能知道“未就绪”和“已就绪”两个状态，中间不会暴露逐步的进度信息。这不是调用方式的问题，而是 VitePress/Vite 本身的设计如此。

:::

## 8. 🤔 vitepress 服务启动的超时时间是？

测试了 `3k~4k` 笔记数量的知识库 `TNotes.leetcode`，总的启动耗时（vitepress 服务 + TNotes 笔记监听服务）大致在 `10s~20s` 左右，因此暂时将 vitepress 启动的超时时间设置为了 `60s`。

基于 vite 的 unbundled 机制，vitepress 服务基本都是秒开的，如果 60s 还是没启动成功，那大概率是系统 BUG。

```ts {4,21-30}
// .vitepress/tnotes/services/VitepressService.ts

/ 服务启动超时时间（毫秒） */
const SERVER_STARTUP_TIMEOUT = 60000

// ...

/
 * 等待服务就绪，显示启动状态
 * @param childProcess - 子进程
 * @param noteCount - 笔记数量
 */
private waitForServerReady(
  childProcess: import('child_process').ChildProcess,
  noteCount: number,
): Promise<void> {
  return new Promise((resolve) => {
    // ...

    // 超时处理
    setTimeout(() => {
      if (!serverReady) {
        serverReady = true
        clearInterval(statusTimer)
        process.stderr.clearLine?.(0)
        process.stderr.cursorTo?.(0)
        console.log('⚠️  启动超时，请检查 VitePress 输出')
        resolve()
      }
    }, SERVER_STARTUP_TIMEOUT)
  })
}
```

在服务启动过程中，会打印服务的启动状态（比如扫描到多少篇笔记，一共耗时多长时间），在监听到 vitepress 服务启动完成（监听到进程输出 `Local:` 或者 `http://localhost`）之后，打印启动成功后的一些提示信息。

启动成功示例：

```bash
pnpm tn:dev

# > @ tn:dev C:\tnotesjs\TNotes.introduction
# >                          tsx ./.vitepress/tnotes/index.ts --dev

# 🚀 [13:20:32.156] [dev] 启动知识库开发服务
# ✅ VitePress 服务已就绪 - 共 30 篇笔记，启动耗时 3.7s

#   ➜  Local:   http://localhost:9379/TNotes.introduction/
#   ➜  Network: use --host to expose
#   ➜  press h to show help
```

看到终端打印 `http://localhost:9379/TNotes.introduction/` 之后，意味着 vitepress 服务已经启动成功，此时就可以通过浏览器打开此链接访问开发环境下的知识库了。

::: tip ⏰ TODO

将这个启动超时的时间做成可配置的或许会更好！

:::

## 9. 🤔 TNotes 笔记监听服务的启动流程是？

在 VitePress 服务启动成功之后，`DevCommand` 会调用 `serviceManager.initialize(notes)` 来初始化缓存和文件监听服务，传入的 `notes` 是 `DevCommand.run()` 中已经扫描并校验通过的笔记数据，避免重复扫描。`ServiceManager` 是一个单例，内部依次完成以下三个步骤：

```ts
// .vitepress/tnotes/services/manager.ts

async initialize(preScannedNotes?: NoteInfo[]): Promise<void> {
  try {
    let notes: NoteInfo[]

    if (preScannedNotes) {
      // 使用外部传入的扫描结果（避免重复扫描）
      notes = preScannedNotes
      logger.info(`使用预扫描结果，共 ${notes.length} 篇笔记`)
    } else {
      // 内部自行扫描（兼容 updateConfigPlugin 等场景）
      logger.info('扫描笔记目录...')
      notes = this.noteManager.scanNotes()
      logger.info(`扫描到 ${notes.length} 篇笔记`)
    }

    // 2. 初始化笔记索引缓存
    logger.info('初始化笔记索引缓存...')
    this.noteIndexCache.initialize(notes)

    // 3. 启动文件监听服务
    this.fileWatcherService.start()

    this.initialized = true
  } catch (error) {
    logger.error('ServiceManager 初始化失败:', error)
    throw error
  }
}
```

`initialize()` 支持两种调用方式：

- 有参调用 `initialize(notes)` — `DevCommand` 启动流程使用，传入预扫描结果，跳过重复扫描
- 无参调用 `initialize()` — `updateConfigPlugin` 等其他场景使用，内部自行扫描

### 9.1. 步骤 1：获取笔记数据

当 `DevCommand` 传入预扫描结果时，`initialize()` 直接使用这些已经过校验的笔记数据，无需再次扫描文件系统。

扫描目录得到 `notes` 数据结构：

```js
// notes = [
//   {
//     index: '0001',
//     path: 'C:\\tnotesjs\\TNotes.introduction\\notes\\0001. TNotes 简介',
//     dirName: '0001. TNotes 简介',
//     readmePath: 'C:\\tnotesjs\\TNotes.introduction\\notes\\0001. TNotes 简介\\README.md',
//     configPath: 'C:\\tnotesjs\\TNotes.introduction\\notes\\0001. TNotes 简介\\.tnotes.json',
//     config: {
//       bilibili: [],
//       tnotes: [],
//       yuque: [],
//       done: true,
//       enableDiscussions: true,
//       description: 'TNotes 是一个基于开源技术构建的免费个人在线知识库系统，采用分仓库模式管理笔记，支持公式渲染和自定义组件扩展，旨在提供高效便捷的知识管理和分享体验。',
//       id: 'f3625513-ef8b-4ef5-b01b-69875d0fdcd9',
//       created_at: 1748866888000,
//       updated_at: 1762784040000
//     }
//   },
//   {
//     index: '0002',
//     path: 'C:\\tnotesjs\\TNotes.introduction\\notes\\0002. TNotes 公式支持',
//     dirName: '0002. TNotes 公式支持',
//     readmePath: 'C:\\tnotesjs\\TNotes.introduction\\notes\\0002. TNotes 公式支持\\README.md',
//     configPath: 'C:\\tnotesjs\\TNotes.introduction\\notes\\0002. TNotes 公式支持\\.tnotes.json',
//     config: {
//       bilibili: [],
//       tnotes: [],
//       yuque: [],
//       done: true,
//       enableDiscussions: true,
//       description: '本文介绍了 TNotes 对数学公式的支持，通过集成 markdown-it-mathjax3 实现了 LaTeX 公式渲染功能，并提供了测试用例验证其正确性。',
//       id: '4bd88b23-afee-4c89-a7b6-f4bd17f2e556',
//       created_at: 1759507206000,
//       updated_at: 1762330131000
//     }
//   },
//   ...
// ]
```

### 9.2. 步骤 2：初始化笔记索引缓存

将扫描结果注入 `NoteIndexCache` 单例，构建两个内存索引：

- `byNoteIndex`：笔记编号（如 `"0001"`）→ 笔记索引项
- `byConfigId`：配置文件中的 UUID → 笔记编号

有了这两个索引，后续通过笔记编号或配置 ID 查询笔记信息时，直接从内存读取，无需再扫描文件系统。

### 9.3. 步骤 3：启动文件监听服务

启动 `FileWatcherService`，监听 `notes/` 目录下的文件变化。监听到变化后，会根据事件类型（笔记目录重命名/删除、配置文件变更、README 变更等）自动触发对应的更新逻辑，并同步更新 `NoteIndexCache` 中的缓存数据。

对应终端输出：

```bash
# ✅ [13:20:36.227] [dev] PID: 664708
# ℹ️  [13:20:36.227] 扫描笔记目录...
# ℹ️  [13:20:36.234] 扫描到 30 篇笔记
# ℹ️  [13:20:36.235] 初始化笔记索引缓存...
# ℹ️  [13:20:36.235] 笔记索引初始化完成，共 30 篇笔记
# ✅ [13:20:36.250] 文件监听服务已启动
# ✅ [13:20:36.251] TNotes 文件监听服务已就绪 - C:\tnotesjs\TNotes.introduction\notes
# ✨ [13:20:36.255] [dev] 命令执行耗时：4099 ms
```

至此，`tn:dev` 的整个启动流程完成。服务进入就绪状态，用户可以正常访问知识库并进行编辑，文件变更会被自动监听和处理。
