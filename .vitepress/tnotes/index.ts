import minimist from 'minimist'

import ReadmeUpdater from './ReadmeUpdater'
import { mergeNotes, distributeNotes } from './mergeDistribute'
import {
  syncRepo,
  pushRepo,
  pullRepo,
  syncAllRepos,
  pushAllRepos,
  pullAllRepos,
  runCommandSpawn,
} from './utils/index'
import { newNotes } from './newNotes'
import { ROOT_DIR_PATH, port } from './constants'
import { tempSync } from './tempSync'
import { safeUpdate, startServer } from './VpManager'
;(async (): Promise<void> => {
  try {
    const args = minimist(process.argv)

    const startTime = Date.now()
    let commandExecuted = false

    switch (true) {
      case args.dev:
        const port_ = port || 5173
        await runCommandSpawn(
          `vitepress dev --host --port ${port_} --open`,
          ROOT_DIR_PATH
        )
        commandExecuted = true
        break
      // 含大量笔记知识库（比如 TNotes.leetcode）的启动方式
      case args.safeDev:
        startServer()
        commandExecuted = true
        break
      case args.build:
        await runCommandSpawn(`vitepress build`, ROOT_DIR_PATH)
        commandExecuted = true
        break
      case args.preview:
        await runCommandSpawn(`vitepress preview`, ROOT_DIR_PATH)
        commandExecuted = true
        break
      case args.update:
        const updater = new ReadmeUpdater()
        await updater.updateReadme()
        commandExecuted = true
        break
      // 含大量笔记知识库（比如 TNotes.leetcode）的更新方式
      case args.safeUpdate:
        await safeUpdate()
        commandExecuted = true
        break
      case args.push:
        await pushRepo()
        commandExecuted = true
        break
      case args.pushAll:
        await pushAllRepos()
        commandExecuted = true
        break
      case args.pull:
        await pullRepo()
        commandExecuted = true
        break
      case args.pullAll:
        await pullAllRepos()
        commandExecuted = true
        break
      case args.sync:
        await syncRepo()
        commandExecuted = true
        break
      case args.syncAll:
        await syncAllRepos()
        commandExecuted = true
        break
      case args.new:
        newNotes()
        commandExecuted = true
        break
      case args.merge:
        mergeNotes()
        commandExecuted = true
        break
      case args.distribute:
        distributeNotes()
        commandExecuted = true
        break
      case args.tempSync:
        await tempSync()
        commandExecuted = true
        break
      default:
        console.log('No valid command provided.')
        break
    }

    if (commandExecuted) {
      const endTime = Date.now() // 记录结束时间
      const duration = endTime - startTime // 计算耗时
      console.log(`✅ Command executed in ${duration}ms`) // 输出耗时日志
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ TNotes Error:', errorMessage)
  }
})()
