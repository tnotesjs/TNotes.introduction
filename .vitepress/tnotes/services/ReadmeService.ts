/**
 * .vitepress/tnotes/services/ReadmeService.ts
 *
 * README 服务 - 封装 README 更新相关的业务逻辑
 */
import type { NoteInfo } from '../types'
import { NoteManager } from '../core/NoteManager'
import { ReadmeGenerator } from '../core/ReadmeGenerator'
import { SidebarGenerator } from '../core/SidebarGenerator'
import { TocGenerator } from '../core/TocGenerator'
import { ConfigManager } from '../config/ConfigManager'
import { logger } from '../utils/logger'
import {
  ROOT_README_PATH,
  VP_SIDEBAR_PATH,
  VP_TOC_PATH,
} from '../config/constants'
import * as fs from 'fs'

/**
 * README 更新选项
 */
export interface UpdateReadmeOptions {
  updateSidebar?: boolean
  updateToc?: boolean
  updateHome?: boolean
}

/**
 * README 服务类
 */
export class ReadmeService {
  private noteManager: NoteManager
  private readmeGenerator: ReadmeGenerator
  private sidebarGenerator: SidebarGenerator
  private tocGenerator: TocGenerator
  private configManager: ConfigManager

  constructor() {
    this.noteManager = new NoteManager()
    this.readmeGenerator = new ReadmeGenerator()
    this.sidebarGenerator = new SidebarGenerator()
    this.tocGenerator = new TocGenerator()
    this.configManager = ConfigManager.getInstance()
  }

  /**
   * 更新所有笔记的 README
   * @param options - 更新选项
   */
  async updateAllReadmes(options: UpdateReadmeOptions = {}): Promise<void> {
    const {
      updateSidebar = true,
      updateToc = true,
      updateHome = true,
    } = options

    logger.info('Starting README update process...')

    // 1. 扫描所有笔记
    const notes = this.noteManager.scanNotes()
    logger.info(`Found ${notes.length} notes`)

    // 2. 更新每个笔记的 README
    this.readmeGenerator.updateAllNoteReadmes(notes)

    // 3. 更新侧边栏配置
    if (updateSidebar) {
      await this.updateSidebar(notes)
    }

    // 4. 更新目录文件
    if (updateToc) {
      await this.updateTocFile(notes)
    }

    // 5. 更新首页 README
    if (updateHome) {
      await this.updateHomeReadme(notes)
    }

    logger.info('README update complete!')
  }

  /**
   * 更新单个笔记的 README
   * @param noteId - 笔记ID
   */
  async updateNoteReadme(noteId: string): Promise<void> {
    const note = this.noteManager.getNoteById(noteId)
    if (!note) {
      throw new Error(`Note not found: ${noteId}`)
    }

    this.readmeGenerator.updateNoteReadme(note)
    logger.info(`Updated README for note: ${noteId}`)
  }

  /**
   * 更新侧边栏配置
   * @param notes - 笔记信息数组
   */
  private async updateSidebar(notes: NoteInfo[]): Promise<void> {
    // 读取 README.md 解析层次结构
    if (!fs.existsSync(ROOT_README_PATH)) {
      logger.error('Home README not found, cannot generate sidebar')
      return
    }

    const content = fs.readFileSync(ROOT_README_PATH, 'utf-8')
    const lines = content.split('\n')

    // 解析 README.md 的层次结构
    const { genHierarchicalSidebar } = await import(
      '../utils/genHierarchicalSidebar'
    )

    const itemList: Array<{ text: string; link: string }> = []
    const titles: string[] = []
    const titlesNotesCount: number[] = []

    let currentNoteCount = 0
    let inTocRegion = false

    for (const line of lines) {
      // 跳过 toc region
      if (line.includes('<!-- region:toc -->')) {
        inTocRegion = true
        continue
      }
      if (line.includes('<!-- endregion:toc -->')) {
        inTocRegion = false
        continue
      }
      if (inTocRegion) {
        continue
      }

      // 匹配笔记链接: - [x] [0001. xxx](https://github.com/...)
      const noteMatch = line.match(
        /^- \[.\] \[(.+?)\]\(https:\/\/github\.com\/.+?\/notes\/(.+?)\/README(?:\.md)?\)/
      )
      if (noteMatch) {
        const [, text, encodedPath] = noteMatch
        // 解码路径，例如 0001.%20TNotes%20简介 -> 0001. TNotes 简介
        const decodedPath = decodeURIComponent(encodedPath)

        // 获取笔记配置，添加状态 emoji
        const note = notes.find((n) => n.dirName === decodedPath)
        let statusEmoji = '⏰ ' // 默认未完成
        if (note?.config) {
          if (note.config.deprecated) {
            statusEmoji = '❌ '
          } else if (note.config.done) {
            statusEmoji = '✅ '
          }
        }

        // 处理笔记 ID 显示
        const sidebarShowNoteId = this.configManager.get('sidebarShowNoteId')
        let displayText = text
        if (!sidebarShowNoteId) {
          // 移除笔记 ID (0001. )
          displayText = text.replace(/^\d{4}\.\s/, '')
        }

        itemList.push({
          text: statusEmoji + displayText,
          link: `/notes/${decodedPath}/README`,
        })
        currentNoteCount++
        continue
      }

      // 匹配标题: ## xxx
      const titleMatch = line.match(/^(#{2,})\s+(.+)$/)
      if (titleMatch) {
        // 保存上一个标题的笔记数量
        if (titles.length > 0) {
          titlesNotesCount.push(currentNoteCount)
        }

        titles.push(line)
        currentNoteCount = 0
      }
    }

    // 保存最后一个标题的笔记数量
    if (titles.length > 0) {
      titlesNotesCount.push(currentNoteCount)
    }

    // Sidebar 默认全部折叠
    const sidebarIsCollapsed = true
    const hierarchicalSidebar = genHierarchicalSidebar(
      itemList,
      titles,
      titlesNotesCount,
      sidebarIsCollapsed
    )

    // 写入 sidebar.json
    fs.writeFileSync(
      VP_SIDEBAR_PATH,
      JSON.stringify(hierarchicalSidebar, null, 2),
      'utf-8'
    )

    logger.info('Updated sidebar.json')
  }
  /**
   * 更新目录文件 (TOC.md)
   * 从 README.md 提取内容，移除 region:toc 区域
   * @param notes - 笔记信息数组
   */
  private async updateTocFile(notes: NoteInfo[]): Promise<void> {
    if (!fs.existsSync(ROOT_README_PATH)) {
      logger.error('Home README not found, cannot generate TOC')
      return
    }

    const content = fs.readFileSync(ROOT_README_PATH, 'utf-8')
    const lines = content.split('\n')

    // 找到 region:toc 区域
    let startIdx = -1
    let endIdx = -1

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<!-- region:toc -->')) {
        startIdx = i
      }
      if (lines[i].includes('<!-- endregion:toc -->')) {
        endIdx = i
        break
      }
    }

    if (startIdx === -1 || endIdx === -1) {
      logger.warn('Cannot find region:toc in README.md, using full content')
      fs.writeFileSync(VP_TOC_PATH, content, 'utf-8')
      logger.info('Updated TOC.md')
      return
    }

    // 移除 region:toc 区域，保留其他内容
    const tocLines = [...lines.slice(0, startIdx), ...lines.slice(endIdx + 1)]

    // 生成 TOC.md 内容
    const tocContent = tocLines.join('\n')

    fs.writeFileSync(VP_TOC_PATH, tocContent, 'utf-8')
    logger.info('Updated TOC.md')
  }

  /**
   * 更新首页 README
   * @param notes - 笔记信息数组
   */
  private async updateHomeReadme(notes: NoteInfo[]): Promise<void> {
    this.readmeGenerator.updateHomeReadme(notes, ROOT_README_PATH)
  }

  /**
   * 生成 VitePress 文档
   * @returns 生成的文件路径数组
   */
  async generateVitepressDocs(): Promise<string[]> {
    const notes = this.noteManager.scanNotes()
    const generatedFiles: string[] = []

    // 更新侧边栏
    await this.updateSidebar(notes)
    generatedFiles.push(VP_SIDEBAR_PATH)

    // 更新目录
    await this.updateTocFile(notes)
    generatedFiles.push(VP_TOC_PATH)

    // 更新首页
    await this.updateHomeReadme(notes)
    generatedFiles.push(ROOT_README_PATH)

    logger.info(`Generated ${generatedFiles.length} files`)
    return generatedFiles
  }

  /**
   * 验证所有 README 文件是否存在
   * @returns 验证结果 { valid: 有效数量, missing: 缺失数量 }
   */
  validateReadmeFiles(): { valid: number; missing: number } {
    const notes = this.noteManager.scanNotes()
    let valid = 0
    let missing = 0

    for (const note of notes) {
      if (fs.existsSync(note.readmePath)) {
        valid++
      } else {
        missing++
        logger.warn(`README missing for note: ${note.dirName}`)
      }
    }

    logger.info(`Validation complete: ${valid} valid, ${missing} missing`)
    return { valid, missing }
  }
}
