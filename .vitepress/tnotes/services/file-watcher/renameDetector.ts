/**
 * .vitepress/tnotes/services/file-watcher/renameDetector.ts
 *
 * 文件夹重命名/删除检测
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { extractNoteIndex } from '../../utils'

const FOLDER_RENAME_DETECT_WINDOW_MS = 500

interface RenameDetectorConfig {
  /** 笔记目录路径 */
  notesDir: string
  /** 检查是否已存在笔记目录的方法 */
  hasNoteDir: (name: string) => boolean
  /** 添加笔记目录的方法 */
  addNoteDir: (name: string) => void
  /** 删除笔记目录的方法 */
  deleteNoteDir: (name: string) => void
  /** 笔记删除事件回调 */
  onDelete: (oldName: string) => void
  /** 笔记重命名事件回调 */
  onRename: (oldName: string, newName: string) => void
  /** 无效索引事件回调 */
  onInvalidIndex: (name: string) => void
  /** 重命名冲突事件回调 */
  onRenameConflict: (oldName: string, newName: string) => void
  /** 信息日志记录方法 */
  logInfo: (msg: string) => void
  /** 警告日志记录方法 */
  logWarn: (msg: string) => void
}

export interface PendingRename {
  oldName: string
  time: number
}

export class RenameDetector {
  /** 待处理的文件夹重命名 */
  private pendingFolderRename: PendingRename | null = null

  /** 文件夹重命名检测定时器 */
  private folderRenameTimer: NodeJS.Timeout | null = null

  constructor(private config: RenameDetectorConfig) {}

  handleFsRename(folderName: string) {
    const {
      notesDir,
      hasNoteDir,
      addNoteDir,
      deleteNoteDir,
      onDelete,
      onRename,
      onInvalidIndex,
      onRenameConflict,
      logInfo,
      logWarn,
    } = this.config

    const folderPath = join(notesDir, folderName)
    const folderExists = existsSync(folderPath)
    const noteIndex = extractNoteIndex(folderName)
    if (!noteIndex) {
      onInvalidIndex(folderName)
      return
    }

    if (!folderExists) {
      // 第一次收到“删除”，先假设是重命名的起点，延迟一段时间再决策
      if (hasNoteDir(folderName)) {
        logInfo(`检测到文件夹删除/重命名: ${folderName}`)
        this.pendingFolderRename = { oldName: folderName, time: Date.now() }
        if (this.folderRenameTimer) clearTimeout(this.folderRenameTimer)
        this.folderRenameTimer = setTimeout(() => {
          if (this.pendingFolderRename) {
            logWarn(`检测到笔记删除: ${this.pendingFolderRename.oldName}`)
            onDelete(this.pendingFolderRename.oldName)
          }
          this.pendingFolderRename = null
          this.folderRenameTimer = null
        }, FOLDER_RENAME_DETECT_WINDOW_MS)
      }
      return
    }

    // folder exists
    if (!hasNoteDir(folderName)) {
      logInfo(`检测到文件夹创建/重命名: ${folderName}`)
      if (
        this.pendingFolderRename &&
        Date.now() - this.pendingFolderRename.time <
          FOLDER_RENAME_DETECT_WINDOW_MS
      ) {
        const oldName = this.pendingFolderRename.oldName
        const oldNoteIndex = extractNoteIndex(oldName)
        if (oldNoteIndex && oldNoteIndex === noteIndex) {
          logInfo(`检测到文件夹重命名: ${oldName} → ${folderName}`)
          if (this.folderRenameTimer) {
            clearTimeout(this.folderRenameTimer)
            this.folderRenameTimer = null
          }
          onRename(oldName, folderName)
          this.pendingFolderRename = null
        } else if (oldNoteIndex && oldNoteIndex !== noteIndex) {
          onRenameConflict(oldName, folderName)
        }
      }

      // 新文件夹：无论是否匹配 rename，都把目录缓存补上，必要时移除旧目录
      addNoteDir(folderName)
      if (this.pendingFolderRename) {
        deleteNoteDir(this.pendingFolderRename.oldName)
      }
    }
  }

  clearTimers() {
    if (this.folderRenameTimer) clearTimeout(this.folderRenameTimer)
  }
}
