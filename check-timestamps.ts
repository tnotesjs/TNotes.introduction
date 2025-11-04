/**
 * check-timestamps.ts
 *
 * 检查并显示所有笔记的时间戳信息
 * 使用方法：tsx check-timestamps.ts
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
    const createdAtCmd = `git log --diff-filter=A --follow --format=%ct -- "${noteDirPath}" | tail -1`
    const createdAtOutput = execSync(createdAtCmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    const updatedAtCmd = `git log -1 --format=%ct -- "${noteDirPath}"`
    const updatedAtOutput = execSync(updatedAtCmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    if (!createdAtOutput || !updatedAtOutput) {
      return null
    }

    return {
      created_at: parseInt(createdAtOutput) * 1000,
      updated_at: parseInt(updatedAtOutput) * 1000,
    }
  } catch (error) {
    return null
  }
}

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 检查笔记时间戳
 */
function checkNoteTimestamps(noteDir: string): void {
  const configPath = path.join(NOTES_DIR, noteDir, '.tnotes.json')

  if (!fs.existsSync(configPath)) {
    console.log(`\n📁 ${noteDir}`)
    console.log(`   ⚠️  配置文件不存在`)
    return
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config: NoteConfig = JSON.parse(configContent)
    const noteDirPath = path.join(NOTES_DIR, noteDir)
    const gitTimestamps = getGitTimestamps(noteDirPath)

    console.log(`\n📁 ${noteDir}`)

    if (!gitTimestamps) {
      console.log(`   ⚠️  无法从 git 获取时间戳`)
      if (config.created_at) {
        console.log(`   📝 配置中的创建时间: ${formatTime(config.created_at)}`)
      }
      if (config.updated_at) {
        console.log(`   📝 配置中的更新时间: ${formatTime(config.updated_at)}`)
      }
      return
    }

    // 比对时间
    const createdMatch = config.created_at === gitTimestamps.created_at
    const updatedMatch = config.updated_at === gitTimestamps.updated_at
    const isSame = gitTimestamps.created_at === gitTimestamps.updated_at

    if (createdMatch && updatedMatch) {
      console.log(`   ✅ 时间戳正确`)
    } else {
      console.log(`   ❌ 时间戳不匹配`)
    }

    console.log(`   📅 创建时间:`)
    console.log(
      `      Git:  ${formatTime(gitTimestamps.created_at)} ${
        createdMatch ? '✓' : '✗'
      }`
    )
    if (!createdMatch && config.created_at) {
      console.log(`      配置: ${formatTime(config.created_at)}`)
    }

    console.log(`   🔄 更新时间:`)
    console.log(
      `      Git:  ${formatTime(gitTimestamps.updated_at)} ${
        updatedMatch ? '✓' : '✗'
      }`
    )
    if (!updatedMatch && config.updated_at) {
      console.log(`      配置: ${formatTime(config.updated_at)}`)
    }

    if (isSame) {
      console.log(`   ℹ️  创建后未修改`)
    } else {
      const daysDiff = Math.floor(
        (gitTimestamps.updated_at - gitTimestamps.created_at) /
          (1000 * 60 * 60 * 24)
      )
      console.log(`   ℹ️  创建后 ${daysDiff} 天更新`)
    }
  } catch (error) {
    console.log(`   ❌ 处理失败:`, error)
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 检查笔记时间戳信息...\n')
  console.log('='.repeat(60))

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

  for (const noteDir of noteDirs) {
    checkNoteTimestamps(noteDir)
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 总计检查了 ${noteDirs.length} 个笔记`)
}

// 执行
main()
