/**
 * .vitepress/tnotes/services/file-watcher/globalUpdateCoordinator.ts
 *
 * 全局更新协调：应用配置更新、更新 README 列表
 */
import type { WatchEvent } from './internal'
import type { NoteIndexCache } from '../../core/NoteIndexCache'
import type { ReadmeService } from '../ReadmeService'

interface GlobalUpdateCoordinatorConfig {
  /** README 服务实例，用于更新 README 文件和侧边栏 */
  readmeService: ReadmeService
  /** 笔记索引缓存实例 */
  noteIndexCache: NoteIndexCache
  /** 日志记录器 */
  logger: any
}

export class GlobalUpdateCoordinator {
  constructor(private config: GlobalUpdateCoordinatorConfig) {}

  async applyConfigUpdates(changedNoteIndexes: string[]): Promise<void> {
    if (changedNoteIndexes.length === 0) return

    const { readmeService, noteIndexCache, logger } = this.config

    logger.info('检测到笔记状态变化，增量更新全局文件...')

    for (const noteIndex of changedNoteIndexes) {
      try {
        const item = noteIndexCache.getByNoteIndex(noteIndex)
        await readmeService.updateNoteInReadme(
          noteIndex,
          item?.noteConfig || {}
        )
        logger.info(`增量更新 README 中的笔记: ${noteIndex}`)
      } catch (error) {
        logger.error(`增量更新失败: ${noteIndex}`, error)
      }
    }

    await readmeService.regenerateSidebar()
  }

  async updateNoteReadmesOnly(events: WatchEvent[]): Promise<void> {
    const noteIndexesToUpdate = [...new Set(events.map((c) => c.noteIndex))]
    if (noteIndexesToUpdate.length === 0) return
    await this.config.readmeService.updateNoteReadmesOnly(noteIndexesToUpdate)
  }
}
