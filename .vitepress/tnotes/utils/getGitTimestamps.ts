import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { getChangedIds } from './getChangedIds'
import { extractNoteIndex } from './noteIndex'

/**
 * Git 时间戳信息
 */
interface GitTimestamp {
  created: number
  updated: number
}

const execAsync = promisify(exec)
const changedIds = getChangedIds()

/**
 * 从 README.md 文件路径解析笔记索引
 * @param filePath - 文件路径
 * @returns 笔记索引或 null
 */
function parseNoteIndex(filePath: string): string | null {
  // 取 notes 下第一层目录名
  const parts = filePath.split(path.sep)
  const notesIndex = parts.findIndex((part) => part === 'notes')

  if (notesIndex >= 0 && parts.length > notesIndex + 1) {
    const dirName = parts[notesIndex + 1]
    return extractNoteIndex(dirName)
  }

  return null
}

/**
 * 异步获取 Git 时间戳（优化版：使用笔记索引缓存）
 * @param filePath - README.md 文件绝对路径
 * @param noteIndex - 笔记索引（可选，会自动解析）
 * @returns Git 时间戳对象或 undefined
 */
export async function getGitTimestamps(
  filePath: string,
  noteIndex?: string,
): Promise<GitTimestamp | undefined> {
  const id = noteIndex || parseNoteIndex(filePath)
  if (!id || !changedIds.has(id)) return

  const now = Date.now()
  let created = now
  let updated = now

  try {
    // 首次提交时间
    const { stdout: createdStdout } = await execAsync(
      `git log --diff-filter=A --format=%ct "${filePath}"`,
    )
    const createdTs = createdStdout.toString().trim()
    if (createdTs) created = parseInt(createdTs, 10) * 1000

    // 上一次 commit 的时间（已注释）
    // const { stdout: updatedStdout } = await execAsync(
    //   `git log -1 --format=%ct "${filePath}"`
    // )
    // const updatedTs = updatedStdout.toString().trim()
    // if (updatedTs) updated = parseInt(updatedTs, 10) * 1000
  } catch {
    // 文件可能未在 Git 中提交过，使用当前时间
  }

  const result: GitTimestamp = { created, updated }

  console.log(`Git 时间戳: ${filePath}`, result)
  return result
}
