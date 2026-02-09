/**
 * .vitepress/tnotes/core/NoteManager.ts
 *
 * 笔记管理器 - 负责笔记的扫描、验证和基本操作
 */
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { NoteInfo, NoteConfig, NoteCountResult } from '../types'
import { NOTES_PATH } from '../config/constants'
import { logger, validateAndFixConfig, extractNoteIndex } from '../utils'

/**
 * 笔记管理器类
 */
export class NoteManager {
  constructor() {}

  /**
   * 扫描所有笔记
   * @returns 笔记信息数组
   */
  scanNotes(): NoteInfo[] {
    const notes: NoteInfo[] = []

    /**
     * 用于检测重复编号，若发现重复编号的笔记出现，直接终止程序执行
     *
     * 隐射关系：
     * 笔记 4 位数编号 -> 笔记名称数组
     */
    const noteIndexMap = new Map<string, string[]>()

    if (!existsSync(NOTES_PATH)) {
      logger.warn(`Notes directory not found: ${NOTES_PATH}`)
      return notes
    }

    const noteDirs = readdirSync(NOTES_PATH)
      .filter((dir) => {
        const fullPath = join(NOTES_PATH, dir)
        return statSync(fullPath).isDirectory() && !dir.startsWith('.')
      })
      .sort()

    for (const dirName of noteDirs) {
      const notePath = join(NOTES_PATH, dirName)
      const readmePath = join(notePath, 'README.md')
      const configPath = join(notePath, '.tnotes.json')

      if (!existsSync(readmePath)) {
        logger.warn(`README not found in note: ${dirName}`)
        continue
      }

      let config: NoteConfig | undefined
      if (existsSync(configPath)) {
        try {
          // 使用 validateAndFixConfig 验证并修复配置
          config = validateAndFixConfig(configPath) || undefined
        } catch (error) {
          logger.error(`Failed to validate config for note: ${dirName}`, error)
        }
      }

      const id = this.getNoteIndexFromDir(dirName)

      // 记录笔记编号，用于检测重复
      if (!noteIndexMap.has(id)) noteIndexMap.set(id, [])
      noteIndexMap.get(id)!.push(dirName)

      notes.push({
        index: id,
        path: notePath,
        dirName,
        readmePath,
        configPath,
        config,
      })
    }

    // 检测并报告重复的笔记编号
    this.checkDuplicateNoteIndexes(noteIndexMap)

    // 移除日志输出，由调用方决定是否输出
    return notes
  }

  /**
   * 统计笔记数量（仅按目录名规则筛选，不读取文件）
   * @returns 包含去重前数量、去重后数量、冲突笔记列表的统计结果
   */
  countNotes(): NoteCountResult {
    if (!existsSync(NOTES_PATH)) {
      return { total: 0, unique: 0, conflicts: [] }
    }

    const entries = readdirSync(NOTES_PATH, { withFileTypes: true })

    // 筛选出符合 "XXXX. 笔记标题" 格式的目录
    const noteDirs = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        /^\d{4}\./.test(entry.name),
    )

    const total = noteDirs.length

    // 按 4 位数字编号分组，检测重复
    const indexMap = new Map<string, string[]>()
    for (const entry of noteDirs) {
      const index = entry.name.slice(0, 4)
      if (!indexMap.has(index)) indexMap.set(index, [])
      indexMap.get(index)!.push(entry.name)
    }

    const unique = indexMap.size
    const conflicts: NoteCountResult['conflicts'] = []
    for (const [index, dirNames] of indexMap.entries()) {
      if (dirNames.length > 1) {
        conflicts.push({ index, dirNames })
      }
    }

    return { total, unique, conflicts }
  }

  /**
   * 检测重复的笔记编号
   * @param noteIndexMap - 笔记编号映射表（笔记 4 位数编号 -> 笔记名称数组）
   */
  private checkDuplicateNoteIndexes(noteIndexMap: Map<string, string[]>): void {
    const duplicates: Array<{ id: string; dirNames: string[] }> = []

    for (const [id, dirNames] of noteIndexMap.entries()) {
      if (dirNames.length > 1) {
        duplicates.push({ id, dirNames })
      }
    }

    if (duplicates.length > 0) {
      logger.error('⚠️  检测到重复的笔记编号！')
      for (const { id, dirNames } of duplicates) {
        logger.error(`   编号 ${id} 被以下笔记重复使用：`)
        dirNames.forEach((dirName) => {
          logger.error(`      - ${dirName}`)
        })
      }
      logger.error(
        '\n请检查并删除或重命名重复的笔记文件夹，确保每个笔记编号唯一！\n',
      )
      // 终止执行
      process.exit(1)
    }
  }

  /**
   * 从目录名提取笔记索引
   * @param dirName - 目录名
   * @returns 笔记索引
   */
  private getNoteIndexFromDir(dirName: string): string {
    return extractNoteIndex(dirName) || dirName
  }

  /**
   * 验证笔记配置
   * @param config - 笔记配置
   * @returns 是否有效
   */
  validateConfig(config: NoteConfig): boolean {
    if (!config.id) {
      logger.error('Note config missing id')
      return false
    }

    if (!Array.isArray(config.bilibili)) {
      logger.error(`Invalid bilibili config in note: ${config.id}`)
      return false
    }

    if (!Array.isArray(config.tnotes)) {
      logger.error(`Invalid tnotes config in note: ${config.id}`)
      return false
    }

    if (!Array.isArray(config.yuque)) {
      logger.error(`Invalid yuque config in note: ${config.id}`)
      return false
    }

    if (typeof config.done !== 'boolean') {
      logger.error(`Invalid done status in note: ${config.id}`)
      return false
    }

    if (typeof config.enableDiscussions !== 'boolean') {
      logger.error(`Invalid enableDiscussions status in note: ${config.id}`)
      return false
    }

    return true
  }

  /**
   * 更新笔记配置
   * @param noteInfo - 笔记信息
   * @param config - 新的配置
   */
  updateNoteConfig(noteInfo: NoteInfo, config: NoteConfig): void {
    if (!this.validateConfig(config)) {
      throw new Error(`Invalid config for note: ${noteInfo.dirName}`)
    }

    config.updated_at = Date.now()
    const configContent = JSON.stringify(config, null, 2)
    writeFileSync(noteInfo.configPath, configContent, 'utf-8')
    logger.info(`Updated config for note: ${noteInfo.dirName}`)
  }

  /**
   * 获取笔记信息（通过索引）- 优化版本，直接查找不扫描所有笔记
   * @param noteIndex - 笔记索引
   * @returns 笔记信息，未找到时返回 undefined
   */
  getNoteByIndex(noteIndex: string): NoteInfo | undefined {
    if (!existsSync(NOTES_PATH)) {
      return undefined
    }

    // 直接遍历目录查找匹配的笔记，而不是扫描所有笔记
    const noteDirs = readdirSync(NOTES_PATH)

    for (const dirName of noteDirs) {
      const fullPath = join(NOTES_PATH, dirName)

      // 跳过非目录和隐藏目录
      if (!statSync(fullPath).isDirectory() || dirName.startsWith('.')) {
        continue
      }

      // 提取笔记索引
      const id = this.getNoteIndexFromDir(dirName)

      // 找到匹配的笔记
      if (id === noteIndex) {
        const notePath = fullPath
        const readmePath = join(notePath, 'README.md')
        const configPath = join(notePath, '.tnotes.json')

        if (!existsSync(readmePath)) {
          return undefined
        }

        let config: NoteConfig | undefined
        if (existsSync(configPath)) {
          try {
            config = validateAndFixConfig(configPath) || undefined
          } catch (error) {
            logger.error(
              `Failed to validate config for note: ${dirName}`,
              error,
            )
          }
        }

        return {
          index: id,
          path: notePath,
          dirName,
          readmePath,
          configPath,
          config,
        }
      }
    }

    return undefined
  }
}
