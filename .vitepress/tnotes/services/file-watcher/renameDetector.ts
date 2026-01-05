/**
 * 文件夹重命名/删除检测
 */
import * as fs from 'fs'
import * as path from 'path'
import { extractNoteIndex } from '../../utils/noteIndex'
import type { FolderRenameConfig } from './internal'

export interface PendingRename {
  oldName: string
  time: number
}

export class RenameDetector {
  /**
   * 待处理的文件夹重命名
   */
  private pendingFolderRename: PendingRename | null = null

  /**
   * 文件夹重命名检测定时器
   */
  private folderRenameTimer: NodeJS.Timeout | null = null

  constructor(
    private notesDir: string,
    private cfg: FolderRenameConfig,
    private hasNoteDir: (name: string) => boolean,
    private addNoteDir: (name: string) => void,
    private deleteNoteDir: (name: string) => void,
    private onDelete: (oldName: string) => void,
    private onRename: (
      noteIndex: string,
      oldName: string,
      newName: string
    ) => void,
    private onInvalidIndex: (name: string) => void,
    private onRenameConflict: (oldName: string, newName: string) => void,
    private logInfo: (msg: string) => void,
    private logWarn: (msg: string) => void
  ) {}

  handleFsRename(folderName: string) {
    const folderPath = path.join(this.notesDir, folderName)
    const folderExists = fs.existsSync(folderPath)
    const noteIndex = extractNoteIndex(folderName)
    if (!noteIndex) return

    if (!folderExists) {
      // 第一次收到“删除”，先假设是重命名的起点，延迟一段时间再决策
      if (this.hasNoteDir(folderName)) {
        this.logInfo(`检测到文件夹删除/重命名: ${folderName}`)
        this.pendingFolderRename = { oldName: folderName, time: Date.now() }
        if (this.folderRenameTimer) clearTimeout(this.folderRenameTimer)
        this.folderRenameTimer = setTimeout(() => {
          if (this.pendingFolderRename) {
            this.logWarn(`检测到笔记删除: ${this.pendingFolderRename.oldName}`)
            this.onDelete(this.pendingFolderRename.oldName)
          }
          this.pendingFolderRename = null
          this.folderRenameTimer = null
        }, this.cfg.detectWindowMs)
      }
      return
    }

    // folder exists
    if (!this.hasNoteDir(folderName)) {
      this.logInfo(`检测到文件夹创建/重命名: ${folderName}`)
      if (
        this.pendingFolderRename &&
        Date.now() - this.pendingFolderRename.time < this.cfg.detectWindowMs
      ) {
        const oldName = this.pendingFolderRename.oldName
        const oldNoteIndex = extractNoteIndex(oldName)
        if (oldNoteIndex && oldNoteIndex === noteIndex) {
          this.logInfo(`检测到文件夹重命名: ${oldName} → ${folderName}`)
          if (this.folderRenameTimer) {
            clearTimeout(this.folderRenameTimer)
            this.folderRenameTimer = null
          }
          this.onRename(noteIndex, oldName, folderName)
          this.pendingFolderRename = null
        }
      }

      // 新文件夹：无论是否匹配 rename，都把目录缓存补上，必要时移除旧目录
      this.addNoteDir(folderName)
      if (this.pendingFolderRename) {
        this.deleteNoteDir(this.pendingFolderRename.oldName)
      }
    }
  }

  clearTimers() {
    if (this.folderRenameTimer) clearTimeout(this.folderRenameTimer)
  }
}
