/**
 * .vitepress/tnotes/services/file-watcher/service.ts
 *
 * 文件监听服务
 *
 * - 监听笔记文件标题的变化并自动更新 toc
 * - 监听笔记配置文件的变化并自动更新笔记的状态
 */

import { existsSync, readFileSync, promises as fsPromises } from 'fs'
import { join } from 'path'
import { NOTES_DIR_NOT_SET_ERROR, WATCH_EVENT_TYPES } from './internal'
import type { WatchEvent, ConfigSnapshotReader } from './internal'
import { WatchState } from './watchState'
import { EventScheduler } from './eventScheduler'
import { RenameDetector } from './renameDetector'
import { ConfigChangeHandler } from './configChangeHandler'
import { ReadmeChangeHandler } from './readmeChangeHandler'
import { GlobalUpdateCoordinator } from './globalUpdateCoordinator'
import { FsWatcherAdapter } from './fsWatcherAdapter'
import { logger } from '../../utils'
import { ReadmeService } from '../readme/service'
import { NoteService } from '../note/service'
import { NoteIndexCache } from '../../core/NoteIndexCache'
import { NOTES_DIR_PATH } from '../../config/constants'

const RENAME_REVERT_DELAY_MS = 2000

/**
 * 检测到笔记目录名称变更或者被删除的事件时，需要更新根目录下的 README.md 和 sidebar.json
 *
 * 暂定 1s 作为缓冲，1s 过后再恢复监听
 */
const DELETE_REINIT_DELAY_MS = 1000

const UPDATE_UNLOCK_DELAY_MS = 500

export class FileWatcherService {
  private watchState: WatchState
  private scheduler: EventScheduler
  private renameDetector: RenameDetector
  private configHandler: ConfigChangeHandler
  private readmeHandler: ReadmeChangeHandler
  private coordinator: GlobalUpdateCoordinator
  private adapter: FsWatcherAdapter
  private noteService: NoteService
  private readmeService: ReadmeService
  private noteIndexCache: NoteIndexCache

  constructor(private notesDir: string = NOTES_DIR_PATH) {
    if (!this.notesDir) {
      throw new Error(NOTES_DIR_NOT_SET_ERROR)
    }
    this.init()
  }

  private init(): void {
    this.noteService = new NoteService()
    this.readmeService = new ReadmeService()
    this.noteIndexCache = NoteIndexCache.getInstance()

    this.watchState = this.initWatchState()
    this.scheduler = this.initScheduler()
    this.renameDetector = this.initRenameDetector()
    this.configHandler = this.initConfigHandler()
    this.readmeHandler = this.initReadmeHandler()
    this.coordinator = this.initCoordinator()
    this.adapter = this.initAdapter()
  }

  private initWatchState(): WatchState {
    const watchState = new WatchState({ notesDir: this.notesDir })
    watchState.initializeFromDisk(this.readConfigSnapshot)
    return watchState
  }

  private initScheduler(): EventScheduler {
    return new EventScheduler({
      onFlush: (events) => this.handleFileChange(events),
      onPauseForBatch: () => logger.warn('监听服务暂停 3s 等待批量更新完成...'),
      onResumeAfterBatch: () => logger.info('恢复自动监听'),
      reinit: () => this.watchState.initializeFromDisk(this.readConfigSnapshot),
    })
  }

  private initRenameDetector(): RenameDetector {
    return new RenameDetector({
      notesDir: this.notesDir,
      hasNoteDir: (name) => this.watchState.hasNoteDir(name),
      addNoteDir: (name) => this.watchState.addNoteDir(name),
      deleteNoteDir: (name) => this.watchState.deleteNoteDir(name),
      onDelete: (oldName) => this.handleFolderDeletion(oldName),
      onRename: (oldName, newName) =>
        this.handleFolderRenameUpdate(oldName, newName),
      onInvalidIndex: (name) =>
        logger.warn(`无法从文件夹名称提取笔记索引: ${name}`),
      onRenameConflict: (oldName, newName) =>
        logger.warn(`索引冲突，回退: ${oldName} -> ${newName}`),
      logInfo: (msg) => logger.info(msg),
      logWarn: (msg) => logger.warn(msg),
    })
  }

  private initConfigHandler(): ConfigChangeHandler {
    return new ConfigChangeHandler({
      state: this.watchState,
      readSnapshot: this.readConfigSnapshot,
      noteService: this.noteService,
      noteIndexCache: this.noteIndexCache,
      logger,
    })
  }

  private initReadmeHandler(): ReadmeChangeHandler {
    return new ReadmeChangeHandler({ noteService: this.noteService })
  }

  private initCoordinator(): GlobalUpdateCoordinator {
    return new GlobalUpdateCoordinator({
      readmeService: this.readmeService,
      noteIndexCache: this.noteIndexCache,
      logger,
    })
  }

  private initAdapter(): FsWatcherAdapter {
    return new FsWatcherAdapter({
      notesDir: this.notesDir,
      isUpdating: () => this.scheduler.getUpdating(),
      onRename: (folderName) => this.renameDetector.handleFsRename(folderName),
      onNoteEvent: (event) => this.onNoteEvent(event),
      logger,
    })
  }

  start(): void {
    this.watchState.initializeFromDisk(this.readConfigSnapshot)
    this.adapter.start()
  }

  pause(): void {
    this.scheduler.setUpdating(true)
    logger.info('文件监听已暂停')
  }

  resume(): void {
    this.watchState.initializeFromDisk(this.readConfigSnapshot)
    this.scheduler.setUpdating(false)
    logger.info('文件监听已恢复')
  }

  isWatching(): boolean {
    return this.adapter.isWatching()
  }

  // === 私有实现 ===

  private onNoteEvent(event: WatchEvent): void {
    if (!this.isNoteFile(event.path)) return
    if (!this.watchState.updateFileHash(event.path)) return
    if (this.scheduler.recordChangeAndDetectBatch()) return
    this.scheduler.enqueue(event)
  }

  private async handleFileChange(events: WatchEvent[]): Promise<void> {
    try {
      // 优先处理配置状态变更；仅当配置未变更时再处理 README 内容更新
      const configChanges = events.filter(
        (e) => e.type === WATCH_EVENT_TYPES.CONFIG,
      )
      const readmeChanges = events.filter(
        (e) => e.type === WATCH_EVENT_TYPES.README,
      )

      const changedNoteIndexes = await this.configHandler.handle(configChanges)

      if (changedNoteIndexes.length > 0) {
        await this.coordinator.applyConfigUpdates(changedNoteIndexes)
        return
      }

      await this.readmeHandler.handle(readmeChanges)
      await this.coordinator.updateNoteReadmesOnly(events)
    } finally {
      setTimeout(
        () => this.scheduler.setUpdating(false),
        UPDATE_UNLOCK_DELAY_MS,
      )
    }
  }

  private async handleFolderDeletion(deletedFolderName: string): Promise<void> {
    if (this.scheduler.getUpdating()) return
    this.scheduler.setUpdating(true)

    try {
      const noteIndex = this.extractNoteIndexOrWarn(deletedFolderName)
      if (!noteIndex) return

      logger.info(`正在处理笔记删除: ${noteIndex} (${deletedFolderName})`)

      // 清理缓存
      this.watchState.deleteNoteDir(deletedFolderName)
      this.watchState.clearNoteCaches(deletedFolderName)
      this.noteIndexCache.delete(noteIndex)

      // 更新根 README.md、sidebar.json
      await this.readmeService.deleteNoteFromReadme(noteIndex)
      await this.readmeService.regenerateSidebar()
    } finally {
      setTimeout(() => {
        this.scheduler.setUpdating(false)
        this.watchState.initializeFromDisk(this.readConfigSnapshot)
      }, DELETE_REINIT_DELAY_MS)
    }
  }

  private async handleFolderRenameUpdate(
    oldName: string,
    newName: string,
  ): Promise<void> {
    if (this.scheduler.getUpdating()) return
    this.scheduler.setUpdating(true)

    try {
      const { oldNoteIndex, newNoteIndex } = this.validateRenameIndexes(
        oldName,
        newName,
      )
      if (!oldNoteIndex || !newNoteIndex) return

      logger.info(`正在处理文件夹重命名: ${oldName} → ${newName}`)

      if (oldNoteIndex === newNoteIndex) {
        await this.handleTitleOnlyRename(newNoteIndex, newName)
      } else {
        await this.handleIndexChangedRename(oldNoteIndex, newNoteIndex)
      }
    } finally {
      setTimeout(() => {
        this.scheduler.setUpdating(false)
        this.watchState.initializeFromDisk(this.readConfigSnapshot)
      }, UPDATE_UNLOCK_DELAY_MS)
    }
  }

  private validateRenameIndexes(
    oldName: string,
    newName: string,
  ): { oldNoteIndex: string | null; newNoteIndex: string | null } {
    const oldNoteIndex = this.extractNoteIndexOrWarn(oldName)
    const newNoteIndex = this.extractNoteIndexOrWarn(newName)

    if (!oldNoteIndex || !newNoteIndex) {
      return { oldNoteIndex: null, newNoteIndex: null }
    }

    if (!/^\d{4}$/.test(newNoteIndex)) {
      logger.error(`新笔记索引格式非法: ${newNoteIndex}，自动回退`)
      this.revertFolderRename(oldName, newName)
      return { oldNoteIndex: null, newNoteIndex: null }
    }

    if (
      oldNoteIndex !== newNoteIndex &&
      this.noteIndexCache.has(newNoteIndex)
    ) {
      logger.error(`新笔记索引 ${newNoteIndex} 已存在，自动回退`)
      this.revertFolderRename(oldName, newName)
      return { oldNoteIndex: null, newNoteIndex: null }
    }

    return { oldNoteIndex, newNoteIndex }
  }

  private async handleTitleOnlyRename(
    noteIndex: string,
    newName: string,
  ): Promise<void> {
    logger.info(`笔记索引未变 (${noteIndex})，只更新标题`)
    const cache = this.noteIndexCache
    cache.updateFolderName(noteIndex, newName)
    const item = cache.getByNoteIndex(noteIndex)
    if (item) {
      await this.readmeService.updateNoteInReadme(noteIndex, item.noteConfig)
    }
    await this.readmeService.regenerateSidebar()
    logger.success(`标题更新完成`)
  }

  private async handleIndexChangedRename(
    oldNoteIndex: string,
    newNoteIndex: string,
  ): Promise<void> {
    logger.info(`笔记索引变更: ${oldNoteIndex} → ${newNoteIndex}`)

    await this.readmeService.deleteNoteFromReadme(oldNoteIndex)

    const allNotes = this.noteService.getAllNotes()
    const newNote = allNotes.find((n) => n.index === newNoteIndex)

    if (newNote) {
      const cache = this.noteIndexCache
      cache.delete(oldNoteIndex)
      cache.add(newNote)

      await this.readmeService.appendNoteToReadme(newNoteIndex)
      await this.readmeService.regenerateSidebar()
      logger.success(`笔记索引变更处理完成`)
    } else {
      logger.error(`未找到新笔记: ${newNoteIndex}`)
    }
  }

  private async revertFolderRename(
    oldName: string,
    newName: string,
  ): Promise<void> {
    try {
      const oldPath = join(this.notesDir, oldName)
      const newPath = join(this.notesDir, newName)

      if (existsSync(newPath)) {
        this.scheduler.setUpdating(true)
        await fsPromises.rename(newPath, oldPath)
        logger.warn(`文件夹已回退: ${newName} → ${oldName}`)
        setTimeout(() => {
          this.scheduler.setUpdating(false)
          this.watchState.initializeFromDisk(this.readConfigSnapshot)
        }, RENAME_REVERT_DELAY_MS)
      }
    } catch (error) {
      logger.error(`回退文件夹重命名失败: ${error}`)
    }
  }

  private extractNoteIndexOrWarn(name: string): string | null {
    const noteIndex = name.match(/^(\d{4})/)?.[1] || null
    if (!noteIndex) {
      logger.warn(`无法从文件夹名称提取笔记索引: ${name}`)
    }
    return noteIndex
  }

  private isNoteFile(filePath: string): boolean {
    return filePath.endsWith('README.md') || filePath.endsWith('.tnotes.json')
  }

  private readConfigSnapshot: ConfigSnapshotReader = (configPath) => {
    try {
      if (!existsSync(configPath)) return null
      const content = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(content) as any
      return {
        done: Boolean(config.done),
        enableDiscussions: Boolean(config.enableDiscussions),
        description: config.description || '',
      }
    } catch (error) {
      logger.error('检测配置状态失败', error)
      return null
    }
  }
}
