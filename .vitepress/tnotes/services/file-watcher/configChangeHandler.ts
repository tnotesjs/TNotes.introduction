/**
 * 配置变更处理
 */
import type { ConfigSnapshot, WatchEvent } from './internal'
import type { WatchState } from './watchState'

export class ConfigChangeHandler {
  constructor(
    private state: WatchState,
    private readSnapshot: (configPath: string) => ConfigSnapshot | null,
    private noteService: any,
    private noteIndexCache: any,
    private logger: any
  ) {}

  async handle(events: WatchEvent[]): Promise<string[]> {
    if (events.length === 0) return []
    const changedIndexes: string[] = []

    for (const change of events) {
      // 忽略由 API 主动写入的更新，避免重复触发
      if (this.noteService.shouldIgnoreConfigChange(change.path)) {
        this.logger.debug(`忽略 API 写入的配置文件: ${change.path}`)
        continue
      }

      const snapshot = this.readSnapshot(change.path)
      if (!snapshot) continue

      const cached = this.state.getConfigSnapshot(change.path)
      this.state.setConfigSnapshot(change.path, snapshot)
      this.noteIndexCache.updateConfig(change.noteIndex, snapshot)

      if (!cached) continue

      const statusChanged =
        cached.done !== snapshot.done ||
        cached.deprecated !== snapshot.deprecated
      const otherChanged =
        cached.enableDiscussions !== snapshot.enableDiscussions ||
        cached.description !== snapshot.description

      if (statusChanged) {
        changedIndexes.push(change.noteIndex)
        this.logger.info(
          `检测到配置状态变化: done(${cached.done}→${snapshot.done}), deprecated(${cached.deprecated}→${snapshot.deprecated})`
        )
      } else if (otherChanged) {
        this.logger.info('检测到配置非状态字段变化，已刷新缓存（无需全局更新）')
      }
    }

    return changedIndexes
  }
}
