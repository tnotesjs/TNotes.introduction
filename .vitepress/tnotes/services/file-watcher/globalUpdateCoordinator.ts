/**
 * 全局更新协调：应用配置更新、更新 README 列表
 */
import type { WatchEvent } from './models'

export class GlobalUpdateCoordinator {
  constructor(
    private readmeService: any,
    private noteIndexCache: any,
    private logger: any
  ) {}

  async applyConfigUpdates(changedNoteIndexes: string[]): Promise<void> {
    if (changedNoteIndexes.length === 0) return

    this.logger.info('检测到笔记状态变化，增量更新全局文件...')

    for (const noteIndex of changedNoteIndexes) {
      try {
        const item = this.noteIndexCache.getByNoteIndex(noteIndex)
        await this.readmeService.updateNoteInReadme(
          noteIndex,
          item?.noteConfig || {}
        )
        this.logger.info(`增量更新 README 中的笔记: ${noteIndex}`)
      } catch (error) {
        this.logger.error(`增量更新失败: ${noteIndex}`, error)
      }
    }

    await this.readmeService.regenerateSidebar()
  }

  async updateNoteReadmesOnly(events: WatchEvent[]): Promise<void> {
    const noteIndexesToUpdate = [...new Set(events.map((c) => c.noteIndex))]
    if (noteIndexesToUpdate.length === 0) return
    await this.readmeService.updateNoteReadmesOnly(noteIndexesToUpdate)
  }
}
