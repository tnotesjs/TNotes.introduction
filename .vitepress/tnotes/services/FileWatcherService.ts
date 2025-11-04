/**
 * .vitepress/tnotes/services/FileWatcherService.ts
 *
 * 文件监听服务 - 监听笔记文件变化并自动更新
 */
import * as fs from 'fs'
import * as path from 'path'
import { logger } from '../utils/logger'
import { ReadmeService } from './ReadmeService'
import { NOTES_DIR_PATH } from '../config/constants'

/**
 * 文件监听服务类
 */
export class FileWatcherService {
  private readmeService: ReadmeService
  private watcher: fs.FSWatcher | null = null
  private updateTimer: NodeJS.Timeout | null = null
  private readonly debounceDelay = 1000 // 防抖延迟（毫秒）
  private changedFiles: Set<string> = new Set()

  constructor() {
    this.readmeService = new ReadmeService()
  }

  /**
   * 启动文件监听
   */
  start(): void {
    if (this.watcher) {
      logger.warn('文件监听已启动')
      return
    }

    logger.info('启动文件监听...')
    logger.info(`监听目录: ${NOTES_DIR_PATH}`)

    this.watcher = fs.watch(
      NOTES_DIR_PATH,
      { recursive: true },
      (eventType, filename) => {
        if (!filename) return

        // 只监听 README.md 和 .tnotes.json 文件
        if (
          !filename.endsWith('README.md') &&
          !filename.endsWith('.tnotes.json')
        ) {
          return
        }

        // 忽略临时文件和备份文件
        if (filename.includes('~') || filename.includes('.swp')) {
          return
        }

        const fullPath = path.join(NOTES_DIR_PATH, filename)
        this.changedFiles.add(fullPath)

        logger.info(`检测到文件变更: ${filename}`)

        // 防抖处理：延迟更新，避免频繁触发
        if (this.updateTimer) {
          clearTimeout(this.updateTimer)
        }

        this.updateTimer = setTimeout(() => {
          this.handleFileChange()
        }, this.debounceDelay)
      }
    )

    logger.success('文件监听已启动')
  }

  /**
   * 停止文件监听
   */
  stop(): void {
    if (!this.watcher) {
      logger.warn('文件监听未启动')
      return
    }

    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      this.updateTimer = null
    }

    this.watcher.close()
    this.watcher = null
    this.changedFiles.clear()

    logger.info('文件监听已停止')
  }

  /**
   * 处理文件变更
   */
  private async handleFileChange(): Promise<void> {
    if (this.changedFiles.size === 0) return

    const fileCount = this.changedFiles.size
    this.changedFiles.clear()

    logger.info(`开始更新 (检测到 ${fileCount} 个文件变更)...`)

    try {
      const startTime = Date.now()

      // 执行增量更新
      await this.readmeService.updateAllReadmes({
        updateSidebar: true,
        updateToc: true,
        updateHome: true,
      })

      const duration = Date.now() - startTime
      logger.success(`更新完成 (耗时 ${duration}ms)`)
    } catch (error) {
      logger.error('自动更新失败', error)
    }
  }

  /**
   * 检查监听状态
   */
  isWatching(): boolean {
    return this.watcher !== null
  }
}
