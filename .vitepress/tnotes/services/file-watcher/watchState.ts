/**
 * .vitepress/tnotes/services/file-watcher/watchState.ts
 *
 * 监听状态存储：哈希缓存、配置缓存、目录缓存
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { createHash } from 'crypto'
import { join } from 'path'
import type { ConfigSnapshot, ConfigSnapshotReader } from './internal'

interface WatchStateConfig {
  /** 笔记目录路径 */
  notesDir: string
}

export class WatchState {
  /** 文件哈希缓存 */
  private fileHashes = new Map<string, string>()

  /** 笔记目录缓存 */
  private noteDirCache = new Set<string>()

  /** 笔记配置缓存 */
  private configCache = new Map<string, ConfigSnapshot>()

  constructor(private config: WatchStateConfig) {}

  /**
   * 获取指定文件的 MD5 哈希值，若文件不存在或读取失败返回 null
   *
   * @param filePath 文件路径
   * @returns 文件哈希
   */
  private getFileHash(filePath: string): string | null {
    try {
      if (!existsSync(filePath)) return null
      const content = readFileSync(filePath, 'utf-8')
      return createHash('md5').update(content).digest('hex')
    } catch {
      return null
    }
  }

  /**
   * 更新文件哈希缓存，只有当文件内容发生变化时才更新并返回 true
   *
   * @param filePath 文件路径
   * @returns 是否发生变化
   */
  updateFileHash(filePath: string): boolean {
    const current = this.getFileHash(filePath)
    if (!current) return false
    const prev = this.fileHashes.get(filePath)
    if (prev === current) return false
    this.fileHashes.set(filePath, current)
    return true
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
    const readmePath = join(this.config.notesDir, noteDirName, 'README.md')
    const configPath = join(this.config.notesDir, noteDirName, '.tnotes.json')
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

  initializeFromDisk(readConfigSnapshot: ConfigSnapshotReader): void {
    try {
      const noteDirs = readdirSync(this.config.notesDir)
      this.clearAll()

      for (const noteDir of noteDirs) {
        const noteDirPath = join(this.config.notesDir, noteDir)
        if (!statSync(noteDirPath).isDirectory()) continue

        this.noteDirCache.add(noteDir)

        const readmePath = join(noteDirPath, 'README.md')
        const readmeHash = this.getFileHash(readmePath)
        if (readmeHash) {
          this.fileHashes.set(readmePath, readmeHash)
        }

        const configPath = join(noteDirPath, '.tnotes.json')
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
