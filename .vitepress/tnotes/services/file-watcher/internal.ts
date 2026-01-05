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
  deprecated: boolean
  enableDiscussions: boolean
  description: string
}

export interface BatchConfig {
  windowMs: number
  threshold: number
  bufferMs: number
}

export interface DebounceConfig {
  delayMs: number
}

export interface FolderRenameConfig {
  detectWindowMs: number
  revertDelayMs: number
  deleteReinitDelayMs: number
}

export interface UpdateUnlockConfig {
  delayMs: number
}

export interface WatcherDeps {
  notesDir: string
  readmeService: any
  noteService: any
  noteIndexCache: any
  logger: any
}

export const DEFAULT_DEBOUNCE_MS = 1000

/**
 * 批量更新检测窗口（毫秒）
 *
 * - 如果在 batchUpdateWindow 时间内检测到超过 batchUpdateThreshold 个文件变更，则判定为是批量更新
 * - 暂定是 1s 内 3 个文件变更的阈值，正常编写笔记的情况下，1s 内不会超过 3 个文件同时变更，通常不会误判
 * - 当批量更新的行为被检测到之后，会暂停监听服务（batchUpdateWindow + batchUpdateBuffer）后再恢复
 */
export const BATCH_UPDATE_WINDOW_MS = 1000

/**
 * 批量更新阈值（文件数）
 */
export const BATCH_UPDATE_THRESHOLD = 3

/**
 * 批量更新安全缓冲（毫秒）
 */
export const BATCH_UPDATE_BUFFER_MS = 1000

export const FOLDER_RENAME_DETECT_WINDOW_MS = 500
export const RENAME_REVERT_DELAY_MS = 2000
export const DELETE_REINIT_DELAY_MS = 1000
export const UPDATE_UNLOCK_DELAY_MS = 500

export const NOTES_DIR_NOT_SET_ERROR = 'NOTES_DIR_PATH 未设置，无法启动文件监听'
