/**
 * fs.watch 适配器：仅负责监听和事件分发
 */
import type { FSWatcher } from 'fs'
import { watch } from 'fs'
import { basename, dirname, join, sep } from 'path'
import type { WatchEvent, WatchEventType } from './internal'
import { WATCH_EVENT_TYPES } from './internal'
import { extractNoteIndex, warnInvalidNoteIndex } from '../../utils/noteIndex'

export class FsWatcherAdapter {
  private watcher: FSWatcher | null = null

  constructor(
    private notesDir: string,
    private isUpdating: () => boolean,
    private onRename: (folderName: string) => void,
    private onNoteEvent: (event: WatchEvent) => void,
    private logger: any
  ) {}

  start(): void {
    if (this.watcher) {
      this.logger.warn('文件监听服务已启动')
      return
    }

    this.watcher = watch(
      this.notesDir,
      { recursive: true },
      (eventType, filename) => this.handleFsEvent(eventType, filename)
    )

    this.logger.success(`文件监听服务已启动`)
    this.logger.success(`监听目录 - ${this.notesDir}`)
  }

  stop(): void {
    if (!this.watcher) return
    this.watcher.close()
    this.watcher = null
  }

  isWatching(): boolean {
    return this.watcher !== null
  }

  private handleFsEvent(eventType: string, filename: string | undefined): void {
    // 过滤无效事件
    // 处理需要跳过监听的场景
    if (
      !filename || // 忽略无文件变更
      this.isUpdating() // 如果正在更新，忽略所有变更
    ) {
      return
    }

    // 文件夹级事件
    // 处理笔记名称（笔记所属的直接父级文件夹名称）发生变化的场景
    // 根层 rename：文件夹创建/删除/重命名，交给 RenameDetector
    if (
      eventType === 'rename' && // 检测文件夹 rename 事件
      !filename.includes(sep) // 顶层文件夹名称发生变更
    ) {
      this.onRename(filename)
      return
    }

    // 文件级事件
    // 处理笔记文件内容（笔记 README.md 文件、笔记配置 .tnotes.json 文件）发生变化的场景
    const fullPath = join(this.notesDir, filename)
    const event = this.buildWatchEvent(fullPath, filename)
    if (!event) {
      // 无法构建变更事件 - 通常是笔记格式错误导致，比如笔记名的索引不是 0001-9999
      return
    }

    this.onNoteEvent(event)
  }

  private buildWatchEvent(
    fullPath: string,
    filename: string
  ): WatchEvent | null {
    const noteDirName = basename(dirname(fullPath))
    const noteIndex = extractNoteIndex(noteDirName)
    if (!noteIndex) {
      warnInvalidNoteIndex(noteDirName)
      return null
    }

    const fileType: WatchEventType = filename.endsWith('README.md')
      ? WATCH_EVENT_TYPES.README
      : WATCH_EVENT_TYPES.CONFIG

    return {
      path: fullPath,
      type: fileType,
      noteIndex,
      noteDirName,
      noteDirPath: dirname(fullPath),
    }
  }
}
