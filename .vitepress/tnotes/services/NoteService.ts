/**
 * .vitepress/tnotes/services/NoteService.ts
 *
 * 笔记服务 - 封装笔记相关的业务逻辑
 */
import { writeFileSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { NoteInfo, NoteConfig } from '../types'
import { NoteManager } from '../core/NoteManager'
import { NoteIndexCache } from '../core/NoteIndexCache'
import { generateNoteTitle } from '../config/templates'
import {
  NOTES_PATH,
  README_FILENAME,
  TNOTES_JSON_FILENAME,
  CONSTANTS,
  REPO_NOTES_URL,
} from '../config/constants'
import { NEW_NOTES_README_MD_TEMPLATE } from '../config/templates'
import { logger } from '../utils/logger'
import { ensureDirectory } from '../utils/file'

/**
 * 创建新笔记的选项
 */
export interface CreateNoteOptions {
  title?: string
  category?: string
  enableDiscussions?: boolean
  configId?: string // 配置文件中的 UUID（跨所有知识库唯一）
}

/**
 * 笔记服务类
 */
export class NoteService {
  private noteManager: NoteManager
  private noteIndexCache: NoteIndexCache
  private ignoredConfigPaths: Set<string> = new Set()

  constructor() {
    this.noteManager = new NoteManager()
    this.noteIndexCache = NoteIndexCache.getInstance()
  }

  /**
   * 标记配置文件在下次变更时被忽略（防止 API 写入触发文件监听循环）
   * @param configPath - 配置文件路径
   */
  ignoreNextConfigChange(configPath: string): void {
    this.ignoredConfigPaths.add(configPath)
  }

  /**
   * 检查配置文件是否应该被忽略
   * @param configPath - 配置文件路径
   * @returns 是否应该忽略
   */
  shouldIgnoreConfigChange(configPath: string): boolean {
    if (this.ignoredConfigPaths.has(configPath)) {
      this.ignoredConfigPaths.delete(configPath)
      return true
    }
    return false
  }

  /**
   * 获取所有笔记
   * @returns 笔记信息数组
   */
  getAllNotes(): NoteInfo[] {
    return this.noteManager.scanNotes()
  }

  /**
   * 获取笔记（通过索引）
   * @param noteIndex - 笔记索引（文件夹前 4 位数字）
   * @returns 笔记信息，未找到时返回 undefined
   */
  getNoteByIndex(noteIndex: string): NoteInfo | undefined {
    return this.noteManager.getNoteByIndex(noteIndex)
  }

  /**
   * 创建新笔记
   * @param options - 创建选项
   * @returns 新创建的笔记信息
   */
  async createNote(options: CreateNoteOptions = {}): Promise<NoteInfo> {
    const {
      title = 'new',
      category,
      enableDiscussions = false,
      configId,
    } = options

    // 生成笔记索引（填充空缺）
    const noteIndex = this.generateNextNoteIndex()
    const dirName = `${noteIndex}. ${title}`
    const notePath = join(NOTES_PATH, dirName)

    // 确保目录存在
    await ensureDirectory(notePath)

    // 创建 README.md（包含一级标题）
    const readmePath = join(notePath, README_FILENAME)
    const noteTitle = generateNoteTitle(noteIndex, title, REPO_NOTES_URL)
    const readmeContent = noteTitle + '\n' + NEW_NOTES_README_MD_TEMPLATE
    writeFileSync(readmePath, readmeContent, 'utf-8')

    // 创建 .tnotes.json（使用 UUID 作为配置 ID）
    const configPath = join(notePath, TNOTES_JSON_FILENAME)
    const now = Date.now()
    const config: NoteConfig = {
      id: configId || uuidv4(), // 配置 ID 使用 UUID（跨知识库唯一）
      bilibili: [],
      tnotes: [],
      yuque: [],
      done: false,
      category,
      enableDiscussions,
      created_at: now,
      updated_at: now,
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')

    logger.info(`Created new note: ${dirName}`)

    return {
      id: noteIndex, // 返回的 id 是笔记索引（目录前缀）
      path: notePath,
      dirName,
      readmePath,
      configPath,
      config,
    }
  }

  /**
   * 生成下一个笔记索引（填充空缺）
   * @returns 新的笔记索引（4位数字字符串，从 0001 到 9999）
   */
  private generateNextNoteIndex(): string {
    const notes = this.getAllNotes()

    if (notes.length === 0) {
      return '0001'
    }

    // 获取所有已使用的编号
    const usedIds = new Set<number>()
    for (const note of notes) {
      const id = parseInt(note.id, 10)
      if (!isNaN(id) && id >= 1 && id <= 9999) {
        usedIds.add(id)
      }
    }

    // 从 1 开始查找第一个未使用的编号
    for (let i = 1; i <= 9999; i++) {
      if (!usedIds.has(i)) {
        return i.toString().padStart(CONSTANTS.NOTE_INDEX_LENGTH, '0')
      }
    }

    // 如果所有编号都被占用（极端情况）
    throw new Error('所有笔记编号 (0001-9999) 已被占用，无法创建新笔记')
  }

  /**
   * 删除笔记
   * @param noteIndex - 笔记索引
   */
  async deleteNote(noteIndex: string): Promise<void> {
    const note = this.getNoteByIndex(noteIndex)
    if (!note) {
      throw new Error(`Note not found: ${noteIndex}`)
    }

    // 删除笔记目录
    rmSync(note.path, { recursive: true, force: true })
    logger.info(`Deleted note: ${note.dirName}`)
  }

  /**
   * 更新笔记配置
   * @param noteIndex - 笔记索引
   * @param updates - 配置更新
   */
  async updateNoteConfig(
    noteIndex: string,
    updates: Partial<NoteConfig>
  ): Promise<void> {
    const note = this.getNoteByIndex(noteIndex)
    if (!note || !note.config) {
      throw new Error(`Note not found or no config: ${noteIndex}`)
    }

    const oldConfig = { ...note.config }
    const updatedConfig: NoteConfig = {
      ...note.config,
      ...updates,
      updated_at: Date.now(),
    }

    // 标记配置文件为忽略（防止文件监听触发循环更新）
    this.ignoreNextConfigChange(note.configPath)

    // 更新笔记配置文件
    this.noteManager.updateNoteConfig(note, updatedConfig)

    // 更新内存索引
    this.noteIndexCache.updateConfig(noteIndex, updatedConfig)

    // 检查是否需要更新全局文件
    const needsGlobalUpdate = this.checkNeedsGlobalUpdate(
      oldConfig,
      updatedConfig
    )

    if (needsGlobalUpdate) {
      logger.info(`检测到全局字段变更 (${noteIndex})，正在增量更新全局文件...`)

      // 使用增量更新
      const ReadmeService = require('./ReadmeService').ReadmeService
      const readmeService = new ReadmeService()

      // 增量更新 README.md 中的笔记
      await readmeService.updateNoteInReadme(noteIndex, updates)

      // 重新生成 sidebar.json（基于更新后的 README.md）
      await readmeService.regenerateSidebar()

      logger.info(`全局文件增量更新完成 (${noteIndex})`)
    } else {
      logger.debug(`配置更新不影响全局文件 (${noteIndex})`)
    }
  }

  /**
   * 检查配置更新是否需要触发全局更新
   * @param oldConfig - 旧配置
   * @param newConfig - 新配置
   * @returns 是否需要全局更新
   */
  private checkNeedsGlobalUpdate(
    oldConfig: NoteConfig,
    newConfig: NoteConfig
  ): boolean {
    // 影响全局的字段：done
    const globalFields: (keyof NoteConfig)[] = ['done']

    for (const field of globalFields) {
      if (oldConfig[field] !== newConfig[field]) {
        return true
      }
    }

    return false
  }

  /**
   * 标记笔记为完成
   * @param noteIndex - 笔记索引
   */
  async markNoteAsDone(noteIndex: string): Promise<void> {
    await this.updateNoteConfig(noteIndex, { done: true })
    logger.info(`Marked note as done: ${noteIndex}`)
  }

  /**
   * 标记笔记为未完成
   * @param noteIndex - 笔记索引
   */
  async markNoteAsUndone(noteIndex: string): Promise<void> {
    await this.updateNoteConfig(noteIndex, { done: false })
    logger.info(`Marked note as undone: ${noteIndex}`)
  }

  /**
   * 验证所有笔记配置
   * @returns 验证结果 { valid: 有效数量, invalid: 无效数量 }
   */
  validateAllNotes(): { valid: number; invalid: number } {
    const notes = this.getAllNotes()
    let valid = 0
    let invalid = 0

    for (const note of notes) {
      if (note.config && this.noteManager.validateConfig(note.config)) {
        valid++
      } else {
        invalid++
        logger.warn(`Invalid config for note: ${note.dirName}`)
      }
    }

    logger.info(`Validation complete: ${valid} valid, ${invalid} invalid`)
    return { valid, invalid }
  }

  /**
   * 获取笔记统计信息
   * @returns 统计信息对象
   */
  getStatistics() {
    const notes = this.getAllNotes()

    const total = notes.length
    const done = notes.filter((n) => n.config?.done).length
    const withDiscussions = notes.filter(
      (n) => n.config?.enableDiscussions
    ).length

    const bilibiliCount = notes.reduce(
      (sum, n) => sum + (n.config?.bilibili?.length || 0),
      0
    )
    const tnotesCount = notes.reduce(
      (sum, n) => sum + (n.config?.tnotes?.length || 0),
      0
    )
    const yuqueCount = notes.reduce(
      (sum, n) => sum + (n.config?.yuque?.length || 0),
      0
    )

    return {
      total,
      done,
      inProgress: total - done,
      withDiscussions,
      externalResources: {
        bilibili: bilibiliCount,
        tnotes: tnotesCount,
        yuque: yuqueCount,
      },
    }
  }

  /**
   * 搜索笔记
   * @param keyword - 搜索关键词
   * @returns 匹配的笔记数组
   */
  searchNotes(keyword: string): NoteInfo[] {
    const notes = this.getAllNotes()
    const lowerKeyword = keyword.toLowerCase()

    return notes.filter((note) => {
      const dirNameMatch = note.dirName.toLowerCase().includes(lowerKeyword)
      const idMatch = note.id.includes(lowerKeyword)
      const categoryMatch = note.config?.category
        ?.toLowerCase()
        .includes(lowerKeyword)

      return dirNameMatch || idMatch || categoryMatch
    })
  }

  /**
   * 修正笔记标题
   * @param noteInfo - 笔记信息
   * @returns 是否进行了修正
   */
  async fixNoteTitle(noteInfo: NoteInfo): Promise<boolean> {
    try {
      const readmeContent = readFileSync(noteInfo.readmePath, 'utf-8')
      const lines = readmeContent.split('\n')

      // 提取目录名中的标题（去掉编号）
      const match = noteInfo.dirName.match(/^\d{4}\.\s+(.+)$/)
      if (!match) {
        logger.warn(`检测到错误的笔记目录名称：${noteInfo.dirName}`)
        return false
      }

      const expectedTitle = match[1]
      const expectedH1 = generateNoteTitle(
        noteInfo.id,
        expectedTitle,
        REPO_NOTES_URL
      )

      // 检查第一行是否为一级标题
      const firstLine = lines[0].trim()

      if (!firstLine.startsWith('# ')) {
        // 缺少一级标题，在第一行插入
        lines.unshift(expectedH1)
        writeFileSync(noteInfo.readmePath, lines.join('\n'), 'utf-8')
        logger.info(`Added title to: ${noteInfo.dirName}`)
        return true
      }

      // 检查标题是否正确
      if (firstLine !== expectedH1) {
        // 标题不正确，替换第一行
        lines[0] = expectedH1
        writeFileSync(noteInfo.readmePath, lines.join('\n'), 'utf-8')
        logger.info(`Fixed title for: ${noteInfo.dirName}`)
        return true
      }

      return false
    } catch (error) {
      logger.error(`Failed to fix title for: ${noteInfo.dirName}`, error)
      return false
    }
  }

  /**
   * 修正所有笔记的标题
   * @returns 修正的笔记数量
   */
  async fixAllNoteTitles(): Promise<number> {
    const notes = this.getAllNotes()
    // logger.debug('打印前 3 篇笔记信息：', notes.slice(0, 3))
    let fixedCount = 0

    for (const note of notes) {
      const fixed = await this.fixNoteTitle(note)
      if (fixed) {
        fixedCount++
      }
    }

    if (fixedCount > 0) {
      logger.info(`Fixed ${fixedCount} note titles`)
    }

    return fixedCount
  }
}
