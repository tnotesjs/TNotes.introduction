/**
 * fix-timestamps.ts
 *
 * 临时脚本：修复所有笔记的创建时间和更新时间
 * 使用方法：tsx fix-timestamps.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const NOTES_DIR = path.join(__dirname, 'notes')

interface NoteConfig {
  id: string
  created_at?: number
  updated_at?: number
  [key: string]: any
}

/**
 * 从 git 获取文件的时间戳
 */
function getGitTimestamps(noteDirPath: string): {
  created_at: number
  updated_at: number
} | null {
  try {
    // 获取首次提交时间（创建时间）
    const createdAtCmd = `git log --diff-filter=A --follow --format=%ct -- "${noteDirPath}" | tail -1`
    const createdAtOutput = execSync(createdAtCmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    // 获取最后修改时间
    const updatedAtCmd = `git log -1 --format=%ct -- "${noteDirPath}"`
    const updatedAtOutput = execSync(updatedAtCmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    if (!createdAtOutput || !updatedAtOutput) {
      return null
    }

    return {
      created_at: parseInt(createdAtOutput) * 1000, // 转换为毫秒
      updated_at: parseInt(updatedAtOutput) * 1000,
    }
  } catch (error) {
    return null
  }
}

/**
 * 修复单个笔记的时间戳
 */
function fixNoteTimestamps(noteDir: string): boolean {
  const configPath = path.join(NOTES_DIR, noteDir, '.tnotes.json')

  if (!fs.existsSync(configPath)) {
    console.log(`⚠️  跳过 ${noteDir} - 配置文件不存在`)
    return false
  }

  try {
    // 读取配置
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config: NoteConfig = JSON.parse(configContent)

    // 获取 git 时间戳
    const noteDirPath = path.join(NOTES_DIR, noteDir)
    const timestamps = getGitTimestamps(noteDirPath)

    if (!timestamps) {
      console.log(`⚠️  跳过 ${noteDir} - 无法从 git 获取时间戳`)
      return false
    }

    let modified = false
    const oldCreated = config.created_at
    const oldUpdated = config.updated_at

    // 修复 created_at（设置为首次提交时间）
    if (!config.created_at || config.created_at !== timestamps.created_at) {
      config.created_at = timestamps.created_at
      modified = true
    }

    // 修复 updated_at（设置为最后修改时间）
    if (!config.updated_at || config.updated_at !== timestamps.updated_at) {
      config.updated_at = timestamps.updated_at
      modified = true
    }

    if (modified) {
      // 保持字段顺序写回文件
      const lines: string[] = ['{']
      const keys = Object.keys(config)
      keys.forEach((key, index) => {
        const value = config[key]
        const jsonValue = JSON.stringify(value)
        const comma = index < keys.length - 1 ? ',' : ''
        lines.push(`  "${key}": ${jsonValue}${comma}`)
      })
      lines.push('}')

      fs.writeFileSync(configPath, lines.join('\n') + '\n', 'utf-8')

      console.log(`✅ ${noteDir}`)
      if (oldCreated !== config.created_at) {
        console.log(
          `   创建时间: ${new Date(
            oldCreated || 0
          ).toLocaleString()} -> ${new Date(
            config.created_at
          ).toLocaleString()}`
        )
      }
      if (oldUpdated !== config.updated_at) {
        console.log(
          `   更新时间: ${new Date(
            oldUpdated || 0
          ).toLocaleString()} -> ${new Date(
            config.updated_at
          ).toLocaleString()}`
        )
      }
      return true
    } else {
      console.log(`✓  ${noteDir} - 时间戳已正确`)
      return false
    }
  } catch (error) {
    console.error(`❌ ${noteDir} - 处理失败:`, error)
    return false
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始修复笔记时间戳...\n')

  if (!fs.existsSync(NOTES_DIR)) {
    console.error('❌ notes 目录不存在')
    process.exit(1)
  }

  const noteDirs = fs
    .readdirSync(NOTES_DIR)
    .filter((name) => {
      const fullPath = path.join(NOTES_DIR, name)
      return fs.statSync(fullPath).isDirectory() && /^\d{4}\./.test(name)
    })
    .sort()

  console.log(`📂 找到 ${noteDirs.length} 个笔记目录\n`)

  let fixedCount = 0
  let skippedCount = 0
  let correctCount = 0

  for (const noteDir of noteDirs) {
    const result = fixNoteTimestamps(noteDir)
    if (result === true) {
      fixedCount++
    } else if (result === false) {
      const configPath = path.join(NOTES_DIR, noteDir, '.tnotes.json')
      if (fs.existsSync(configPath)) {
        correctCount++
      } else {
        skippedCount++
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 修复统计:')
  console.log(`   ✅ 已修复: ${fixedCount} 个`)
  console.log(`   ✓  正确无需修复: ${correctCount} 个`)
  console.log(`   ⚠️  跳过: ${skippedCount} 个`)
  console.log(`   📝 总计: ${noteDirs.length} 个`)
  console.log('='.repeat(50))

  if (fixedCount > 0) {
    console.log('\n💡 提示: 时间戳已修复，建议执行以下操作：')
    console.log('   1. 检查修改是否正确')
    console.log('   2. 如果正确，可以提交这些修改')
    console.log('   3. 如果服务正在运行，会自动触发更新')
  }
}

// 执行
main()
