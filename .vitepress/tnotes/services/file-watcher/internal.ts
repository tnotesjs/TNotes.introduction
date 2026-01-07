/**
 * .vitepress/tnotes/services/file-watcher/internal.ts
 *
 * 文件监听层内部模型：仅供 file-watcher 层使用
 */

/**
 * 监听事件类型常量
 */
export const WATCH_EVENT_TYPES = {
  README: 'readme',
  CONFIG: 'config',
} as const

export type WatchEventType =
  (typeof WATCH_EVENT_TYPES)[keyof typeof WATCH_EVENT_TYPES]

export const NOTES_DIR_NOT_SET_ERROR = 'NOTES_DIR_PATH 未设置，无法启动文件监听'

/**
 * 监听到的文件变更事件
 *
 * 示例：
 *
 * ```js
 * {
 *   path: 'C:\\tnotesjs\\TNotes.introduction\\notes\\0001. TNotes 简介\\README.md',
 *   type: 'readme',
 *   noteIndex: '0001',
 *   noteDirName: '0001. TNotes 简介',
 *   noteDirPath: 'C:\\tnotesjs\\TNotes.introduction\\notes\\0001. TNotes 简介'
 * }
 * ```
 */
export interface WatchEvent {
  /**
   * 笔记文件（README.md、.tnotes.json）的绝对路径
   */
  path: string
  type: WatchEventType
  noteIndex: string
  noteDirName: string
  noteDirPath: string
  /**
   * 文件夹重命名时的旧名称
   */
  oldNoteDirName?: string
}

export type ConfigSnapshot = {
  done: boolean
  enableDiscussions: boolean
  description: string
}

/**
 * 配置快照读取器类型
 */
export type ConfigSnapshotReader = (configPath: string) => ConfigSnapshot | null
