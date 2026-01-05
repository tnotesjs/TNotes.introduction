/**
 * 监听状态存储：哈希缓存、配置缓存、目录缓存
 */
import * as fs from 'fs'
import * as crypto from 'crypto'
import * as path from 'path'
import type { ConfigSnapshot } from './internal'

export class WatchState {
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
  private fileHashes = new Map<string, string>()

  /**
   * 缓存所有笔记文件夹名称
   */
  private noteDirCache = new Set<string>()

  /**
   * 缓存配置状态（done、deprecated、enableDiscussions、description）
   */
  private configCache = new Map<string, ConfigSnapshot>()

  constructor(private notesDir: string) {}

  /**
   * 计算文件内容的哈希值
   */
  getFileHash(filePath: string): string | null {
    try {
      if (!fs.existsSync(filePath)) return null
      const content = fs.readFileSync(filePath, 'utf-8')
      return crypto.createHash('md5').update(content).digest('hex')
    } catch {
      return null
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
  updateFileHash(filePath: string): boolean {
    const current = this.getFileHash(filePath)
    if (!current) return false
    const prev = this.fileHashes.get(filePath)
    if (prev === current) return false
    this.fileHashes.set(filePath, current)
    return true
  }

  getFileHashCache() {
    return this.fileHashes
  }

  getNoteDirs() {
    return this.noteDirCache
  }

  hasNoteDir(name: string) {
    return this.noteDirCache.has(name)
  }

  addNoteDir(name: string) {
    this.noteDirCache.add(name)
  }

  deleteNoteDir(name: string) {
    this.noteDirCache.delete(name)
  }

  clearAll(): void {
    this.fileHashes.clear()
    this.noteDirCache.clear()
    this.configCache.clear()
  }

  clearNoteCaches(noteDirName: string): void {
    const readmePath = path.join(this.notesDir, noteDirName, 'README.md')
    const configPath = path.join(this.notesDir, noteDirName, '.tnotes.json')
    this.fileHashes.delete(readmePath)
    this.fileHashes.delete(configPath)
    this.configCache.delete(configPath)
  }

  getConfigSnapshot(configPath: string): ConfigSnapshot | undefined {
    return this.configCache.get(configPath)
  }

  setConfigSnapshot(configPath: string, snapshot: ConfigSnapshot): void {
    this.configCache.set(configPath, snapshot)
  }

  initializeFromDisk(
    readConfigSnapshot: (configPath: string) => ConfigSnapshot | null
  ): void {
    try {
      // 冷启动：扫描现有笔记目录并预热哈希与配置缓存，避免首次事件误判
      const noteDirs = fs.readdirSync(this.notesDir)
      this.clearAll()

      for (const noteDir of noteDirs) {
        const noteDirPath = path.join(this.notesDir, noteDir)
        if (!fs.statSync(noteDirPath).isDirectory()) continue

        this.noteDirCache.add(noteDir)

        const readmePath = path.join(noteDirPath, 'README.md')
        const readmeHash = this.getFileHash(readmePath)
        if (readmeHash) {
          this.fileHashes.set(readmePath, readmeHash)
        }

        const configPath = path.join(noteDirPath, '.tnotes.json')
        const configHash = this.getFileHash(configPath)
        if (configHash) {
          this.fileHashes.set(configPath, configHash)
          const snapshot = readConfigSnapshot(configPath)
          if (snapshot) this.configCache.set(configPath, snapshot)
        }
      }
    } catch {
      // 静默失败：初始化阶段不让监听直接崩溃
    }
  }
}
