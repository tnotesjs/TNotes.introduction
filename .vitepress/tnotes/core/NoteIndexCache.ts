/**
 * .vitepress/tnotes/core/NoteIndexCache.ts
 *
 * 笔记索引缓存 - 维护笔记的内存索引，避免重复扫描文件系统
 */
import type { NoteInfo, NoteConfig } from '../types'
import { logger } from '../utils'

/**
 * 索引项结构
 */
export interface NoteIndexItem {
  /** 笔记索引（文件夹名前 4 位数字，如 "0001"） */
  noteIndex: string
  /** 完整文件夹名称（如 "0001. TNotes 简介"） */
  folderName: string
  /** 笔记配置（与 .tnotes.json 结构一致） */
  noteConfig: NoteConfig
}

/**
 * 笔记索引缓存类
 * 提供快速的笔记查询和更新能力
 */
export class NoteIndexCache {
  private static instance: NoteIndexCache | null = null

  /** noteIndex -> NoteIndexItem 的映射 */
  private byNoteIndex: Map<string, NoteIndexItem> = new Map()

  /** configId (UUID) -> noteIndex 的映射，用于快速反向查询 */
  private byConfigId: Map<string, string> = new Map()

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): NoteIndexCache {
    if (!NoteIndexCache.instance) {
      NoteIndexCache.instance = new NoteIndexCache()
    }
    return NoteIndexCache.instance
  }

  /**
   * 初始化索引缓存
   * @param notes - 扫描得到的笔记列表
   * @throws 如果检测到重复的笔记 ID
   */
  initialize(notes: NoteInfo[]): void {
    this.byNoteIndex.clear()
    this.byConfigId.clear()

    // 检测重复的 noteIndex
    const duplicates = this.findDuplicateNoteIndexes(notes)
    if (duplicates.length > 0) {
      const errorMsg = `检测到重复的笔记索引，请修正后再启动服务:\n${duplicates
        .map((d) => `  - 索引 ${d.index}: ${d.folders.join(', ')}`)
        .join('\n')}`
      logger.error(errorMsg)
      throw new Error(errorMsg)
    }

    // 构建索引
    for (const note of notes) {
      const item: NoteIndexItem = {
        noteIndex: note.id,
        folderName: note.dirName,
        noteConfig: note.config,
      }

      this.byNoteIndex.set(note.id, item)
      this.byConfigId.set(note.config.id, note.id)
    }

    logger.info(`笔记索引初始化完成，共 ${notes.length} 篇笔记`)
  }

  /**
   * 检测重复的笔记索引
   */
  private findDuplicateNoteIndexes(
    notes: NoteInfo[],
  ): Array<{ index: string; folders: string[] }> {
    const indexMap = new Map<string, string[]>()

    for (const note of notes) {
      const existing = indexMap.get(note.id) || []
      existing.push(note.dirName)
      indexMap.set(note.id, existing)
    }

    const duplicates: Array<{ index: string; folders: string[] }> = []
    for (const [index, folders] of indexMap) {
      if (folders.length > 1) {
        duplicates.push({ index, folders })
      }
    }

    return duplicates
  }

  /**
   * 根据 noteIndex 获取索引项
   */
  getByNoteIndex(noteIndex: string): NoteIndexItem | undefined {
    return this.byNoteIndex.get(noteIndex)
  }

  /**
   * 根据 configId (UUID) 获取索引项
   */
  getByConfigId(configId: string): NoteIndexItem | undefined {
    const noteIndex = this.byConfigId.get(configId)
    return noteIndex ? this.byNoteIndex.get(noteIndex) : undefined
  }

  /**
   * 检查 noteIndex 是否存在
   */
  has(noteIndex: string): boolean {
    return this.byNoteIndex.has(noteIndex)
  }

  /**
   * 更新笔记配置
   * @param noteIndex - 笔记索引
   * @param configUpdates - 要更新的配置字段
   */
  updateConfig(noteIndex: string, configUpdates: Partial<NoteConfig>): void {
    const item = this.byNoteIndex.get(noteIndex)
    if (!item) {
      logger.warn(`尝试更新不存在的笔记: ${noteIndex}`)
      return
    }

    Object.assign(item.noteConfig, configUpdates)
    item.noteConfig.updated_at = Date.now()

    logger.debug(`更新笔记配置: ${noteIndex}`, configUpdates)
  }

  /**
   * 更新笔记的文件夹名称（标题变更时）
   * @param noteIndex - 笔记索引
   * @param newFolderName - 新的文件夹名称
   */
  updateFolderName(noteIndex: string, newFolderName: string): void {
    const item = this.byNoteIndex.get(noteIndex)
    if (!item) {
      logger.warn(`尝试更新不存在的笔记: ${noteIndex}`)
      return
    }

    item.folderName = newFolderName
    logger.debug(`更新笔记文件夹名称: ${noteIndex} -> ${newFolderName}`)
  }

  /**
   * 删除笔记
   * @param noteIndex - 笔记索引
   */
  delete(noteIndex: string): void {
    const item = this.byNoteIndex.get(noteIndex)
    if (!item) {
      logger.warn(`尝试删除不存在的笔记: ${noteIndex}`)
      return
    }

    // 同时删除两个索引
    this.byNoteIndex.delete(noteIndex)
    this.byConfigId.delete(item.noteConfig.id)

    logger.info(`删除笔记索引: ${noteIndex}`)
  }

  /**
   * 添加新笔记
   * @param note - 笔记信息
   */
  add(note: NoteInfo): void {
    const item: NoteIndexItem = {
      noteIndex: note.id,
      folderName: note.dirName,
      noteConfig: note.config,
    }

    this.byNoteIndex.set(note.id, item)
    this.byConfigId.set(note.config.id, note.id)

    logger.info(`添加笔记索引: ${note.id}`)
  }

  /**
   * 获取索引统计信息
   */
  getStats() {
    return {
      totalNotes: this.byNoteIndex.size,
      noteIndexes: Array.from(this.byNoteIndex.keys()).sort(),
    }
  }
}
