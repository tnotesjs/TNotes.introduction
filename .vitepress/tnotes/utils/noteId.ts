/**
 * .vitepress/tnotes/utils/noteId.ts
 *
 * 笔记 ID 相关工具函数
 */
import { logger } from './logger'

/**
 * 笔记 ID 正则表达式
 *
 * 匹配格式: 4 位数字开头，后接小数点
 * 示例: "0001." 或 "9999."
 */
export const NOTE_ID_REGEX = /^(\d{4})\./

/**
 * 从文件夹名称或文本中提取笔记 ID
 *
 * @param text - 要解析的文本（通常是文件夹名称）
 * @returns 笔记 ID（4 位数字字符串）或 null
 *
 * @example
 * extractNoteId('0001. TNotes 简介') // '0001'
 * extractNoteId('0023. 处理 git log') // '0023'
 * extractNoteId('invalid-folder')     // null
 */
export function extractNoteId(text: string): string | null {
  const match = text.match(NOTE_ID_REGEX)
  return match ? match[1] : null
}

/**
 * 检查文本是否以有效的笔记 ID 开头
 *
 * @param text - 要检查的文本
 * @returns 是否匹配笔记 ID 格式
 */
export function isValidNoteIdFormat(text: string): boolean {
  return NOTE_ID_REGEX.test(text)
}

/**
 * 输出无效笔记名称的警告日志
 *
 * @param name - 无效的笔记名称
 */
export function warnInvalidNoteId(name: string): void {
  logger.warn(`无效的笔记名: ${name}`)
  logger.warn('笔记名必须以 4 个数字开头')
  logger.warn('范围：0001-9999')
  logger.warn('示例：0001. 笔记标题')
}
