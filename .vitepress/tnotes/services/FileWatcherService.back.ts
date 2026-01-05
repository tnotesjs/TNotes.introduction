/**
 * .vitepress/tnotes/services/FileWatcherService.ts
 *
 * !确保重构后的 file-watche/** 没问题后删除
 *
 * 文件监听服务
 *
 * - 监听笔记文件标题的变化并自动更新 toc
 * - 监听笔记配置文件的变化并自动更新笔记的状态
 */
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { logger } from '../utils/logger'
import { extractNoteIndex, warnInvalidNoteIndex } from '../utils/noteIndex'
import { ReadmeService } from './ReadmeService'
import { NoteService } from './NoteService'
import { NoteIndexCache } from '../core/NoteIndexCache'
import { NOTES_DIR_PATH } from '../config/constants'
import type { NoteConfig } from '../types'

/**
 * 监听事件类型常量
 */
const WATCH_EVENT_TYPES = {
  README: 'readme',
  CONFIG: 'config',
} as const
type WatchEventType = (typeof WATCH_EVENT_TYPES)[keyof typeof WATCH_EVENT_TYPES]

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
interface WatchEvent {
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

type ConfigSnapshot = {
  done: boolean
  deprecated: boolean
  enableDiscussions: boolean
  description: string
}

/**
 * 文件监听服务类
 */
export class FileWatcherService {
  private readmeService: ReadmeService
  private noteService: NoteService
  private noteIndexCache: NoteIndexCache
  private watcher: fs.FSWatcher | null = null

  /**
   * 文件变更信息
   *
   * - key: 文件路径
   * - val: 变更信息
   */
  private pendingEvents: Map<string, WatchEvent> = new Map()

  /**
   * 文件内容哈希缓存
   *
   * - key: 文件路径
   * - val: 文件内容的哈希值
   *
   * 示例：
   *
   * ```js
   * // 笔记 README.md 文件：
   * {
   *   key: 'C:\tnotesjs\TNotes.introduction\notes\0001. TNotes 简介\README.md',
   *   val: 'f74ce0d9fd0bb1a150d2015e750786f2'
   * }
   *
   *
   * // 笔记 .tnotes.json 配置文件：
   * {
   *   key: 'C:\tnotesjs\TNotes.introduction\notes\0001. TNotes 简介\.tnotes.json',
   *   val: '901a6c270876661408c3e94ca8de14a4'
   * }
   * ```
   */
  private fileHashes: Map<string, string> = new Map()

  /**
   * 缓存所有笔记文件夹名称
   */
  private noteDirCache: Set<string> = new Set()

  /**
   * 文件夹重命名检测定时器
   */
  private folderRenameTimer: NodeJS.Timeout | null = null

  /**
   * 待处理的文件夹重命名
   */
  private pendingFolderRename: { oldName: string; time: number } | null = null

  /**
   * 缓存配置状态（done、deprecated、enableDiscussions、description）
   */
  private configCache: Map<string, ConfigSnapshot> = new Map()

  // #region - 更新频率控制

  /**
   * 防抖定时器
   */
  private updateTimer: NodeJS.Timeout | null = null

  /**
   * 防抖延迟（毫秒）
   *
   * 1s 内多次变更只触发一次更新
   */
  private readonly debounceDelay = 1000

  /**
   * 更新行为锁
   *
   * 标记是否正在更新，避免循环触发
   */
  private isUpdating: boolean = false

  // #endregion - 更新频率控制

  // #region - 批量更新检测

  /**
   * 批量更新检测窗口（毫秒）
   *
   * - 如果在 batchUpdateWindow 时间内检测到超过 batchUpdateThreshold 个文件变更，则判定为是批量更新
   * - 暂定是 1s 内 3 个文件变更的阈值，正常编写笔记的情况下，1s 内不会超过 3 个文件同时变更，通常不会误判
   * - 当批量更新的行为被检测到之后，会暂停监听服务（batchUpdateWindow + batchUpdateBuffer）后再恢复
   */
  private batchUpdateWindow = 1000

  /**
   * 批量更新阈值（文件数）
   */
  private batchUpdateThreshold = 3

  /**
   * 批量更新安全缓冲（毫秒）
   */
  private batchUpdateBuffer = 1000

  /**
   * 记录最近的变更时间戳
   */
  private recentChanges: number[] = []

  // #endregion - 批量更新检测

  constructor() {
    this.readmeService = new ReadmeService()
    this.noteService = new NoteService()
    this.noteIndexCache = NoteIndexCache.getInstance()
  }

  /**
   * 计算文件内容的哈希值
   */
  private getFileHash(filePath: string): string | null {
    try {
      if (!fs.existsSync(filePath)) {
        return null
      }
      const content = fs.readFileSync(filePath, 'utf-8')
      return crypto.createHash('md5').update(content).digest('hex')
    } catch {
      return null
    }
  }

  /**
   * 初始化文件哈希和内容缓存
   */
  private initializeFileHashes(): void {
    try {
      const noteDirs = fs.readdirSync(NOTES_DIR_PATH)
      this.noteDirCache.clear()
      this.configCache.clear()

      for (const noteDir of noteDirs) {
        const noteDirPath = path.join(NOTES_DIR_PATH, noteDir)
        if (!fs.statSync(noteDirPath).isDirectory()) continue

        // 缓存文件夹名称
        this.noteDirCache.add(noteDir)

        // 缓存 README.md 的哈希
        const readmePath = path.join(noteDirPath, 'README.md')
        const readmeHash = this.getFileHash(readmePath)
        if (readmeHash) {
          this.fileHashes.set(readmePath, readmeHash)
        }

        // 缓存 .tnotes.json 的哈希和状态
        const configPath = path.join(noteDirPath, '.tnotes.json')
        const configHash = this.getFileHash(configPath)
        if (configHash) {
          this.fileHashes.set(configPath, configHash)
          // 缓存配置状态
          this.cacheConfigSnapshot(configPath)
        }
      }
    } catch (error) {
      logger.warn('初始化文件哈希缓存失败', error)
    }
  }

  /**
   * 清理指定笔记的缓存（哈希与配置状态）
   */
  private clearNoteCaches(noteDirName: string): void {
    const readmePath = path.join(NOTES_DIR_PATH, noteDirName, 'README.md')
    const configPath = path.join(NOTES_DIR_PATH, noteDirName, '.tnotes.json')
    this.fileHashes.delete(readmePath)
    this.fileHashes.delete(configPath)
    this.configCache.delete(configPath)
  }

  /**
   * 缓存配置文件的状态
   */
  private cacheConfigSnapshot(configPath: string): void {
    const snapshot = this.readConfigSnapshot(configPath)
    if (!snapshot) return
    this.configCache.set(configPath, snapshot)
  }

  /**
   * 启动文件监听
   */
  start(): void {
    if (this.watcher) {
      logger.warn('文件监听服务已启动')
      return
    }

    // 初始化文件哈希缓存
    this.initializeFileHashes()

    this.watcher = fs.watch(
      NOTES_DIR_PATH, // 监听目录
      { recursive: true }, // 递归监听子目录
      (eventType, filename) => this.handleFsEvent(eventType, filename)
    )

    logger.success(`文件监听服务已启动`)
    logger.success(`监听目录 - ${NOTES_DIR_PATH}`)
  }

  /**
   * fs.watch 回调统一入口
   */
  private handleFsEvent(eventType: string, filename: string | undefined): void {
    // 1. 需要跳过监听的情况
    if (
      !filename || // 忽略无文件变更
      this.isUpdating // 如果正在更新，忽略所有变更
    ) {
      return
    }

    // 2. 笔记名称（笔记所属的直接父级文件夹名称）发生变化的情况
    if (
      eventType === 'rename' && // 检测文件夹重命名
      !filename.includes(path.sep) // 顶层文件夹名称发生变更
    ) {
      this.handleFolderRename(filename)
      return
    }

    // 3. 笔记文件内容（笔记 README.md 文件、笔记配置 .tnotes.json 文件）发生变化的情况
    const fullPath = path.join(NOTES_DIR_PATH, filename)
    const event = this.buildWatchEvent(fullPath, filename)
    if (
      !this.isNoteFile(filename) || // 不是笔记文件
      !this.recordIfFileChanged(fullPath) || // 文件内容未发生变更
      this.detectBatchUpdate() || // 检测到批量更新
      !event // 无法构建变更事件 - 通常是笔记格式错误导致，比如笔记名的索引不是 0001-9999
    ) {
      return
    }

    this.enqueueEvent(event)
  }

  /**
   * 判断是否是需要监听的笔记文件
   */
  private isNoteFile(filename: string): boolean {
    return filename.endsWith('README.md') || filename.endsWith('.tnotes.json')
  }

  /**
   * 构建标准 WatchEvent
   */
  private buildWatchEvent(
    fullPath: string,
    filename: string
  ): WatchEvent | null {
    const noteDirName = path.basename(path.dirname(fullPath))
    const noteIndex = extractNoteIndex(noteDirName)
    if (!noteIndex) {
      warnInvalidNoteIndex(noteDirName)
      return null
    }

    const noteDirPath = path.dirname(fullPath)
    const fileType: WatchEventType = filename.endsWith('README.md')
      ? WATCH_EVENT_TYPES.README
      : WATCH_EVENT_TYPES.CONFIG

    return {
      path: fullPath,
      type: fileType,
      noteIndex,
      noteDirName,
      noteDirPath,
    }
  }

  /**
   * 若内容变更则更新哈希缓存
   *
   * 返回值：
   *
   * ```js
   * false // 表示文件内容没有发生变化
   * true // 表示文件内容有发生变化
   * ```
   */
  private recordIfFileChanged(fullPath: string): boolean {
    const currentHash = this.getFileHash(fullPath)
    if (!currentHash) {
      return false
    }

    const previousHash = this.fileHashes.get(fullPath)
    if (previousHash === currentHash) {
      return false
    }

    this.fileHashes.set(fullPath, currentHash)
    return true
  }

  /**
   * 将事件加入队列并触发防抖
   */
  private enqueueEvent(event: WatchEvent): void {
    if (this.pendingEvents.has(event.path)) return

    this.pendingEvents.set(event.path, event)
    logger.info(`检测到笔记文件变更: ${event.noteDirName}`)
    logger.info(event.path)

    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }

    this.updateTimer = setTimeout(() => {
      this.handleFileChange()
    }, this.debounceDelay)
  }

  /**
   * 处理文件夹重命名事件
   */
  private handleFolderRename(folderName: string): void {
    const folderPath = path.join(NOTES_DIR_PATH, folderName)
    const folderExists = fs.existsSync(folderPath)

    // 检查是否是有效的笔记文件夹（以 4 位数字开头）
    const noteIndex = extractNoteIndex(folderName)
    if (!noteIndex) {
      return // 不是有效的笔记文件夹
    }

    if (!folderExists) {
      // 文件夹被删除或重命名（旧名称）
      if (this.noteDirCache.has(folderName)) {
        logger.info(`检测到文件夹删除/重命名: ${folderName}`)
        this.pendingFolderRename = {
          oldName: folderName,
          time: Date.now(),
        }

        // 设置定时器，等待新文件夹出现
        if (this.folderRenameTimer) {
          clearTimeout(this.folderRenameTimer)
        }

        this.folderRenameTimer = setTimeout(() => {
          // 超时后，如果仍有待处理的重命名，说明是删除操作
          if (this.pendingFolderRename) {
            logger.warn(`检测到笔记删除: ${this.pendingFolderRename.oldName}`)

            // 触发删除后的全局更新
            this.handleFolderDeletion(this.pendingFolderRename.oldName)
          }

          // 清除待处理的重命名
          this.pendingFolderRename = null
          this.folderRenameTimer = null
        }, 500) // 500ms 内如果没有新文件夹出现，则认为是删除操作
      }
    } else {
      // 文件夹被创建或重命名（新名称）
      if (!this.noteDirCache.has(folderName)) {
        logger.info(`检测到文件夹创建/重命名: ${folderName}`)

        // 检查是否有待处理的重命名
        if (
          this.pendingFolderRename &&
          Date.now() - this.pendingFolderRename.time < 500
        ) {
          const oldName = this.pendingFolderRename.oldName
          const oldNoteIndex = extractNoteIndex(oldName)

          // 确保是同一个笔记（索引相同）
          if (oldNoteIndex && oldNoteIndex === noteIndex) {
            logger.success(`检测到文件夹重命名: ${oldName} → ${folderName}`)

            // 清除定时器
            if (this.folderRenameTimer) {
              clearTimeout(this.folderRenameTimer)
              this.folderRenameTimer = null
            }

            // 触发全局文件更新
            this.handleFolderRenameUpdate(noteIndex, oldName, folderName)

            // 清除待处理的重命名
            this.pendingFolderRename = null
          }
        }

        // 更新缓存
        this.noteDirCache.add(folderName)

        // 如果有旧名称，删除旧名称的缓存
        if (this.pendingFolderRename) {
          this.noteDirCache.delete(this.pendingFolderRename.oldName)
        }
      }
    }
  }

  /**
   * 处理文件夹删除后的更新
   */
  private async handleFolderDeletion(deletedFolderName: string): Promise<void> {
    if (this.isUpdating) {
      logger.warn('正在更新中，跳过文件夹删除更新')
      return
    }

    this.isUpdating = true

    try {
      const startTime = Date.now()

      // 从文件夹名称提取笔记索引
      const noteIndex = extractNoteIndex(deletedFolderName)

      if (!noteIndex) {
        logger.warn(`无法从文件夹名称提取笔记索引: ${deletedFolderName}`)
        return
      }

      logger.info(`正在处理笔记删除: ${noteIndex} (${deletedFolderName})`)

      // 从缓存中删除已删除的文件夹
      this.noteDirCache.delete(deletedFolderName)
      this.clearNoteCaches(deletedFolderName)

      // 从索引缓存中删除笔记
      this.noteIndexCache.delete(noteIndex)

      // 使用增量删除
      await this.readmeService.deleteNoteFromReadme(noteIndex)
      await this.readmeService.regenerateSidebar()

      const duration = Date.now() - startTime
      logger.success(`笔记删除处理完成 (耗时 ${duration}ms)`)
      logger.info(`  - 已从 README.md 中删除笔记: ${noteIndex}`)
      logger.info(`  - 已重新生成 sidebar.json`)
      logger.info(`  - 已从索引缓存中移除: ${noteIndex}`)
    } catch (error) {
      logger.error('文件夹删除更新失败', error)
    } finally {
      // 延迟重置更新标志
      setTimeout(() => {
        this.isUpdating = false
        // 重新初始化缓存
        this.initializeFileHashes()
      }, 1000)
    }
  }

  /**
   * 处理文件夹重命名后的更新
   */
  private async handleFolderRenameUpdate(
    noteIndex: string,
    oldName: string,
    newName: string
  ): Promise<void> {
    if (this.isUpdating) {
      logger.warn('正在更新中，跳过文件夹重命名更新')
      return
    }

    this.isUpdating = true

    try {
      const startTime = Date.now()

      const { oldNoteIndex, newNoteIndex } = this.validateRenameIndexes(
        oldName,
        newName
      )
      if (!oldNoteIndex || !newNoteIndex) return

      logger.info(`正在处理文件夹重命名: ${oldName} → ${newName}`)

      if (oldNoteIndex === newNoteIndex) {
        await this.handleTitleOnlyRename(newNoteIndex, newName)
      } else {
        await this.handleIndexChangedRename(oldNoteIndex, newNoteIndex)
      }

      const duration = Date.now() - startTime
      logger.success(`文件夹重命名更新完成 (耗时 ${duration}ms)`)
      logger.info(`  - 已更新 README.md`)
      logger.info(`  - 已重新生成 sidebar.json`)
      logger.info(`  - 已更新索引缓存`)
    } catch (error) {
      logger.error('文件夹重命名更新失败', error)
    } finally {
      // 延迟重置更新标志
      setTimeout(() => {
        this.isUpdating = false
        // 重新初始化缓存
        this.initializeFileHashes()
      }, 1000)
    }
  }

  /**
   * 验证文件夹重命名的索引合法性与冲突
   */
  private validateRenameIndexes(
    oldName: string,
    newName: string
  ): { oldNoteIndex: string | null; newNoteIndex: string | null } {
    const oldNoteIndex = extractNoteIndex(oldName)
    const newNoteIndex = extractNoteIndex(newName)

    if (!oldNoteIndex || !newNoteIndex) {
      logger.error(`无效的文件夹重命名: ${oldName} → ${newName}`)
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

  /**
   * 仅标题变更（索引不变）的处理
   */
  private async handleTitleOnlyRename(
    noteIndex: string,
    newName: string
  ): Promise<void> {
    logger.info(`笔记索引未变 (${noteIndex})，只更新标题`)

    this.noteIndexCache.updateFolderName(noteIndex, newName)

    const item = this.noteIndexCache.getByNoteIndex(noteIndex)
    if (item) {
      await this.readmeService.updateNoteInReadme(noteIndex, item.noteConfig)
    }

    await this.readmeService.regenerateSidebar()
    logger.success(`标题更新完成`)
  }

  /**
   * 索引变更的处理（删除旧记录，添加新记录）
   */
  private async handleIndexChangedRename(
    oldNoteIndex: string,
    newNoteIndex: string
  ): Promise<void> {
    logger.info(`笔记索引变更: ${oldNoteIndex} → ${newNoteIndex}`)

    await this.readmeService.deleteNoteFromReadme(oldNoteIndex)

    const allNotes = this.noteService.getAllNotes()
    const newNote = allNotes.find((n) => n.id === newNoteIndex)

    if (newNote) {
      this.noteIndexCache.delete(oldNoteIndex)
      this.noteIndexCache.add(newNote)

      await this.readmeService.appendNoteToReadme(newNoteIndex)
      await this.readmeService.regenerateSidebar()

      logger.success(`笔记索引变更处理完成`)
    } else {
      logger.error(`未找到新笔记: ${newNoteIndex}`)
    }
  }

  /**
   * 回退文件夹重命名
   * @param oldName - 旧文件夹名称
   * @param newName - 新文件夹名称
   */
  private async revertFolderRename(
    oldName: string,
    newName: string
  ): Promise<void> {
    try {
      const oldPath = path.join(NOTES_DIR_PATH, oldName)
      const newPath = path.join(NOTES_DIR_PATH, newName)

      if (fs.existsSync(newPath)) {
        // 暂时忽略下一次文件变更事件（避免循环）
        this.isUpdating = true

        await fs.promises.rename(newPath, oldPath)
        logger.warn(`文件夹已回退: ${newName} → ${oldName}`)

        // 延迟恢复
        setTimeout(() => {
          this.isUpdating = false
          // 回退后刷新缓存，确保哈希/状态同步
          this.initializeFileHashes()
        }, 2000)
      }
    } catch (error) {
      logger.error(`回退文件夹重命名失败: ${error}`)
    }
  }

  /**
   * 处理文件变更
   */
  private async handleFileChange(): Promise<void> {
    if (this.pendingEvents.size === 0) return

    // 防止循环更新
    if (this.isUpdating) {
      logger.warn('正在更新中，跳过本次更新')
      return
    }

    this.isUpdating = true
    const changes = Array.from(this.pendingEvents.values())
    this.pendingEvents.clear()

    try {
      const startTime = Date.now()
      const configChanges = changes.filter(
        (c) => c.type === WATCH_EVENT_TYPES.CONFIG
      )
      const readmeChanges = changes.filter(
        (c) => c.type === WATCH_EVENT_TYPES.README
      )

      const changedNoteIndexes = await this.processConfigChanges(configChanges)

      if (changedNoteIndexes.length > 0) {
        await this.applyConfigUpdates(changedNoteIndexes)
        const duration = Date.now() - startTime
        logger.success(`增量更新完成 (耗时 ${duration}ms)`)
        logger.info(`  - 已更新 ${changedNoteIndexes.length} 个笔记`)
        logger.info(`  - 已重新生成 sidebar.json`)
        return
      }

      await this.processReadmeChanges(readmeChanges)
      const noteIndexesToUpdate = [...new Set(changes.map((c) => c.noteIndex))]
      logger.info(
        `检测到 ${changes.length} 个文件变更，更新 ${noteIndexesToUpdate.length} 个笔记...`
      )
      await this.readmeService.updateNoteReadmesOnly(noteIndexesToUpdate)

      const duration = Date.now() - startTime
      logger.success(`更新完成 (耗时 ${duration}ms)`)
      if (readmeChanges.length > 0) {
        logger.info(`  - README 变更: ${readmeChanges.length} 个`)
      }
      if (configChanges.length > 0) {
        logger.info(`  - 配置变更: ${configChanges.length} 个`)
      }
    } catch (error) {
      logger.error('自动更新失败', error)
    } finally {
      // 延迟重置更新标志，确保由更新引起的文件变更不会触发新的更新
      setTimeout(() => {
        this.isUpdating = false
      }, 500)
    }
  }

  /**
   * 批量更新检测
   *
   * 返回值：
   *
   * ```js
   * false // 判定是人为操作导致的更新，而非批量更新操作
   * true // 判定是批量更新操作，监听服务暂停一段时间后再恢复
   * ```
   */
  private detectBatchUpdate(now: number = Date.now()): boolean {
    this.recentChanges.push(now)
    this.recentChanges = this.recentChanges.filter(
      (time) => now - time < this.batchUpdateWindow
    )

    if (this.recentChanges.length < this.batchUpdateThreshold) return false

    logger.warn(`检测到批量文件变更 - ${this.recentChanges.length} 个文件)`)
    logger.warn('可能是 pnpm tn:update 执行中...')
    logger.warn('或者其它批量更新操作...')
    logger.warn('监听服务暂停 3s 等待批量更新完成...')

    this.pendingEvents.clear()
    this.recentChanges = []
    this.isUpdating = true

    setTimeout(() => {
      this.isUpdating = false
      this.initializeFileHashes()
      logger.info('恢复自动监听')
    }, this.batchUpdateWindow + this.batchUpdateBuffer)

    return true
  }

  /**
   * 处理配置文件变更，返回状态发生变化的笔记索引
   */
  private async processConfigChanges(
    configChanges: WatchEvent[]
  ): Promise<string[]> {
    if (configChanges.length === 0) return []

    const changedNoteIndexes: string[] = []

    for (const change of configChanges) {
      if (this.noteService.shouldIgnoreConfigChange(change.path)) {
        logger.debug(`忽略 API 写入的配置文件: ${change.path}`)
        continue
      }

      const snapshot = this.readConfigSnapshot(change.path)
      if (!snapshot) continue

      const cachedSnapshot = this.configCache.get(change.path)
      this.configCache.set(change.path, snapshot)

      // 同步内存中的索引数据，确保 tn:dev 维护的列表实时更新
      this.noteIndexCache.updateConfig(change.noteIndex, snapshot)

      if (!cachedSnapshot) {
        continue
      }

      const statusChanged =
        cachedSnapshot.done !== snapshot.done ||
        cachedSnapshot.deprecated !== snapshot.deprecated

      if (statusChanged) {
        changedNoteIndexes.push(change.noteIndex)
        logger.info(
          `检测到配置状态变化: done(${cachedSnapshot.done}→${snapshot.done}), deprecated(${cachedSnapshot.deprecated}→${snapshot.deprecated})`
        )
      }

      const otherFieldsChanged =
        cachedSnapshot.enableDiscussions !== snapshot.enableDiscussions ||
        cachedSnapshot.description !== snapshot.description

      if (otherFieldsChanged && !statusChanged) {
        logger.info('检测到配置非状态字段变化，已刷新缓存（无需全局更新）')
      }
    }

    return changedNoteIndexes
  }

  /**
   * 读取配置状态（单次 IO）
   */
  private readConfigSnapshot(configPath: string): ConfigSnapshot | null {
    try {
      if (!fs.existsSync(configPath)) return null
      const configContent = fs.readFileSync(configPath, 'utf-8')
      const config = JSON.parse(configContent) as NoteConfig
      return {
        done: Boolean(config.done),
        deprecated: Boolean(config.deprecated),
        enableDiscussions: Boolean(config.enableDiscussions),
        description: config.description || '',
      }
    } catch (error) {
      logger.error('检测配置状态失败', error)
      return null
    }
  }

  /**
   * 应用配置变更后的全局更新
   */
  private async applyConfigUpdates(
    changedNoteIndexes: string[]
  ): Promise<void> {
    if (changedNoteIndexes.length === 0) return

    logger.info('检测到笔记状态变化，增量更新全局文件...')

    for (const noteIndex of changedNoteIndexes) {
      try {
        const item = this.noteIndexCache.getByNoteIndex(noteIndex)
        if (item) {
          await this.readmeService.updateNoteInReadme(
            noteIndex,
            item.noteConfig
          )
          logger.info(`增量更新 README 中的笔记: ${noteIndex}`)
        }
      } catch (error) {
        logger.error(`增量更新失败: ${noteIndex}`, error)
      }
    }

    await this.readmeService.regenerateSidebar()
  }

  /**
   * 处理 README 变更，确保标题正确
   */
  private async processReadmeChanges(
    readmeChanges: WatchEvent[]
  ): Promise<void> {
    if (readmeChanges.length === 0) return

    const readmeChangedIndexes = [
      ...new Set(readmeChanges.map((c) => c.noteIndex)),
    ]
    for (const noteIndex of readmeChangedIndexes) {
      const noteInfo = this.noteService.getNoteByIndex(noteIndex)
      if (noteInfo) {
        await this.noteService.fixNoteTitle(noteInfo)
      }
    }
  }

  /**
   * 检查监听状态
   */
  isWatching(): boolean {
    return this.watcher !== null
  }

  /**
   * 暂停文件监听（用于 push 等批量操作）
   */
  pause(): void {
    if (!this.watcher) return
    this.isUpdating = true
    logger.info('文件监听已暂停')
  }

  /**
   * 恢复文件监听
   */
  resume(): void {
    if (!this.watcher) return
    // 重新初始化哈希缓存，确保下次检测准确
    this.initializeFileHashes()
    this.isUpdating = false
    this.pendingEvents.clear()
    this.recentChanges = []
    logger.info('文件监听已恢复')
  }
}
