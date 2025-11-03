/**
 * .vitepress/tnotes/core/TocGenerator.ts
 *
 * 目录生成器 - 负责生成各种目录（TOC）
 */
import {
  generateToc as generateTocUtil,
  createAddNumberToTitle,
} from '../utils/markdown'
import type { NoteConfig } from '../types'
import {
  BILIBILI_VIDEO_BASE_URL,
  TNOTES_YUQUE_BASE_URL,
  NOTES_TOC_START_TAG,
  NOTES_TOC_END_TAG,
  EOL,
} from '../config/constants'

/**
 * 目录生成器类
 */
export class TocGenerator {
  /**
   * 更新笔记目录
   * @param noteId - 笔记ID
   * @param lines - 笔记内容行数组
   * @param noteConfig - 笔记配置
   * @param repoName - 仓库名称
   */
  updateNoteToc(
    noteId: string,
    lines: string[],
    noteConfig: NoteConfig,
    repoName: string
  ): void {
    let startLineIdx = -1,
      endLineIdx = -1
    lines.forEach((line, idx) => {
      if (line.startsWith(NOTES_TOC_START_TAG)) startLineIdx = idx
      if (line.startsWith(NOTES_TOC_END_TAG)) endLineIdx = idx
    })
    if (startLineIdx === -1 || endLineIdx === -1) return

    const titles: string[] = []
    const headers = ['## ', '### ', '#### ', '##### ', '###### '] // 2~6 级标题，忽略 1 级标题
    const addNumberToTitle = createAddNumberToTitle()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isHeader = headers.some((header) => line.startsWith(header))
      if (isHeader) {
        const [numberedTitle] = addNumberToTitle(line)
        titles.push(numberedTitle)
        lines[i] = numberedTitle // 更新原行内容
      }
    }

    const toc = generateTocUtil(titles, 2)
    const bilibiliTOCItems: string[] = []
    const tnotesTOCItems: string[] = []
    const yuqueTOCItems: string[] = []

    if (noteConfig) {
      if (noteConfig.bilibili.length > 0) {
        noteConfig.bilibili.forEach((bvid, i) => {
          bilibiliTOCItems.push(
            `  - [bilibili.${repoName}.${noteId}.${i + 1}](${
              BILIBILI_VIDEO_BASE_URL + bvid
            })`
          )
        })
      }
      if (noteConfig.tnotes.length > 0) {
        noteConfig.tnotes.forEach(([tnotesName, notesID, notesName], i) => {
          tnotesTOCItems.push(
            `  - [TNotes.${tnotesName} - ${
              notesID + (notesName ? `. ${notesName}/README` : '')
            }](${
              `https://tnotesjs.github.io/TNotes.${tnotesName}/notes/` +
              notesID +
              (notesName ? `.%20${encodeURIComponent(notesName)}/README` : '')
            })`
          )
        })
      }
      if (noteConfig.yuque.length > 0) {
        noteConfig.yuque.forEach((slug, i) => {
          yuqueTOCItems.push(
            `  - [TNotes.yuque.${repoName.replace('TNotes.', '')}.${noteId}](${
              TNOTES_YUQUE_BASE_URL + slug
            })`
          )
        })
      }
    }

    const insertTocItems: string[] = []

    if (bilibiliTOCItems.length > 0) {
      insertTocItems.push(
        `- [📺 bilibili 👉 TNotes 合集](https://space.bilibili.com/407241004)`,
        ...bilibiliTOCItems
      )
    }

    if (tnotesTOCItems.length > 0) {
      insertTocItems.push(
        `- [📒 TNotes](https://tnotesjs.github.io/TNotes/)`,
        ...tnotesTOCItems
      )
    }

    if (yuqueTOCItems.length > 0) {
      insertTocItems.push(
        `- [📂 TNotes.yuque](${TNOTES_YUQUE_BASE_URL})`,
        ...yuqueTOCItems
      )
    }

    lines.splice(
      startLineIdx + 1,
      endLineIdx - startLineIdx - 1,
      '',
      ...insertTocItems,
      ...toc.replace(new RegExp(`^${EOL}`), '').split(EOL)
    )
  }

  /**
   * 更新首页目录
   * @param lines - 首页内容行数组
   * @param titles - 标题数组
   * @param titlesNotesCount - 每个标题下的笔记数量
   */
  updateHomeToc(
    lines: string[],
    titles: string[],
    titlesNotesCount: number[]
  ): void {
    let startLineIdx = -1,
      endLineIdx = -1
    lines.forEach((line, idx) => {
      if (line.startsWith(NOTES_TOC_START_TAG)) startLineIdx = idx
      if (line.startsWith(NOTES_TOC_END_TAG)) endLineIdx = idx
    })
    if (startLineIdx === -1 || endLineIdx === -1) return

    const toc = generateTocUtil(titles, 1)

    lines.splice(
      startLineIdx + 1,
      endLineIdx - startLineIdx - 1,
      ...toc.split(EOL)
    )
  }
}
