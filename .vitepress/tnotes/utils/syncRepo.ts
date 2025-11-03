/**
 * .vitepress/tnotes/utils/syncRepo.ts
 *
 * 同步 Git 仓库的工具函数
 */
import { runCommand } from './runCommand'
import { TNOTES_BASE_DIR, ROOT_DIR_PATH, EN_WORDS_DIR } from '../constants'
import { getTargetDirs } from './getTargetDirs'
import { GitManager } from './GitManager'
import { logger } from './logger'
import { handleError } from './errorHandler'

/**
 * 拉取远程仓库的更新
 * @param dir - 本地仓库目录路径
 */
export async function pullRepo(dir: string = ROOT_DIR_PATH): Promise<void> {
  const git = new GitManager(dir, logger.child('pull'))

  try {
    // 检查是否为有效仓库
    if (!(await git.isValidRepo())) {
      logger.warn(`${dir} 不是一个合法的 git 仓库，跳过...`)
      return
    }

    await git.pull({ rebase: true, autostash: true })
  } catch (error) {
    logger.error(`Failed to pull ${dir}`)
    handleError(error)
  }
}

/**
 * 推送本地更改到远程仓库
 * @param dir - 本地仓库目录路径
 */
export async function pushRepo(dir: string = ROOT_DIR_PATH): Promise<void> {
  const git = new GitManager(dir, logger.child('push'))

  try {
    // 检查是否为有效仓库
    if (!(await git.isValidRepo())) {
      logger.warn(`${dir} 不是一个合法的 git 仓库，跳过...`)
      return
    }

    await git.pushWithCommit()
  } catch (error) {
    logger.error(`Failed to push ${dir}`)
    handleError(error)
    throw error // 重新抛出以便上层处理
  }
}

/**
 * 同步本地和远程 Git 仓库
 * @param dir - 本地仓库目录路径
 */
export async function syncRepo(dir: string = ROOT_DIR_PATH): Promise<void> {
  const git = new GitManager(dir, logger.child('sync'))

  try {
    // 检查是否为有效仓库
    if (!(await git.isValidRepo())) {
      logger.warn(`${dir} 不是一个合法的 git 仓库，跳过...`)
      return
    }

    await git.sync()
  } catch (error) {
    logger.error(`Failed to sync ${dir}`)
    handleError(error)
  }
}

/**
 * 批量操作结果接口
 */
interface BatchResult {
  dir: string
  success: boolean
  error?: string
}

/**
 * 在所有 TNotes.* 中执行推送操作
 * @param options - 选项
 * @param options.parallel - 是否并行执行（默认 false）
 * @param options.continueOnError - 遇到错误是否继续（默认 true）
 */
export async function pushAllRepos(options?: {
  parallel?: boolean
  continueOnError?: boolean
}): Promise<void> {
  const { parallel = false, continueOnError = true } = options || {}
  const targetDirs = getTargetDirs(TNOTES_BASE_DIR, 'TNotes.', [EN_WORDS_DIR])

  logger.start(`Pushing ${targetDirs.length} repositories...`)

  const results: BatchResult[] = []

  if (parallel) {
    // 并行执行
    const promises = targetDirs.map(async (dir) => {
      try {
        logger.progress(`Pushing ${dir}...`)
        await runCommand('pnpm tn:push', dir)
        logger.success(`✓ ${dir}`)
        return { dir, success: true }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        logger.error(`✗ ${dir}: ${errorMessage}`)
        return { dir, success: false, error: errorMessage }
      }
    })

    results.push(...(await Promise.all(promises)))
  } else {
    // 串行执行
    for (const dir of targetDirs) {
      try {
        logger.progress(`Pushing ${dir}...`)
        await runCommand('pnpm tn:push', dir)
        logger.success(`✓ ${dir}`)
        results.push({ dir, success: true })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        logger.error(`✗ ${dir}: ${errorMessage}`)
        results.push({ dir, success: false, error: errorMessage })

        if (!continueOnError) {
          throw error
        }
      }
    }
  }

  // 显示汇总
  const successCount = results.filter((r) => r.success).length
  const failCount = results.length - successCount

  console.log('\n📊 Push Summary:')
  console.log(`  Total: ${results.length}`)
  console.log(`  Success: ${successCount}`)
  console.log(`  Failed: ${failCount}`)

  if (failCount > 0) {
    console.log('\n❌ Failed repositories:')
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.dir}: ${r.error}`))
  }
}

/**
 * 在所有 TNotes.* 中执行拉取操作
 * @param options - 选项
 */
export async function pullAllRepos(options?: {
  parallel?: boolean
  continueOnError?: boolean
}): Promise<void> {
  const { parallel = false, continueOnError = true } = options || {}
  const targetDirs = getTargetDirs(TNOTES_BASE_DIR, 'TNotes.', [EN_WORDS_DIR])

  logger.start(`Pulling ${targetDirs.length} repositories...`)

  const results: BatchResult[] = []

  if (parallel) {
    // 并行执行
    const promises = targetDirs.map(async (dir) => {
      try {
        logger.progress(`Pulling ${dir}...`)
        await runCommand('pnpm tn:pull', dir)
        logger.success(`✓ ${dir}`)
        return { dir, success: true }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        logger.error(`✗ ${dir}: ${errorMessage}`)
        return { dir, success: false, error: errorMessage }
      }
    })

    results.push(...(await Promise.all(promises)))
  } else {
    // 串行执行
    for (const dir of targetDirs) {
      try {
        logger.progress(`Pulling ${dir}...`)
        await runCommand('pnpm tn:pull', dir)
        logger.success(`✓ ${dir}`)
        results.push({ dir, success: true })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        logger.error(`✗ ${dir}: ${errorMessage}`)
        results.push({ dir, success: false, error: errorMessage })

        if (!continueOnError) {
          throw error
        }
      }
    }
  }

  // 显示汇总
  const successCount = results.filter((r) => r.success).length
  const failCount = results.length - successCount

  console.log('\n📊 Pull Summary:')
  console.log(`  Total: ${results.length}`)
  console.log(`  Success: ${successCount}`)
  console.log(`  Failed: ${failCount}`)

  if (failCount > 0) {
    console.log('\n❌ Failed repositories:')
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.dir}: ${r.error}`))
  }
}

/**
 * 在所有 TNotes.* 中执行同步操作
 * @param options - 选项
 */
export async function syncAllRepos(options?: {
  parallel?: boolean
  continueOnError?: boolean
}): Promise<void> {
  const { parallel = false, continueOnError = true } = options || {}
  const targetDirs = getTargetDirs(TNOTES_BASE_DIR, 'TNotes.')

  logger.start(`Syncing ${targetDirs.length} repositories...`)

  const results: BatchResult[] = []

  if (parallel) {
    // 并行执行
    const promises = targetDirs.map(async (dir) => {
      try {
        logger.progress(`Syncing ${dir}...`)
        await runCommand('pnpm tn:sync', dir)
        logger.success(`✓ ${dir}`)
        return { dir, success: true }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        logger.error(`✗ ${dir}: ${errorMessage}`)
        return { dir, success: false, error: errorMessage }
      }
    })

    results.push(...(await Promise.all(promises)))
  } else {
    // 串行执行
    for (const dir of targetDirs) {
      try {
        logger.progress(`Syncing ${dir}...`)
        await runCommand('pnpm tn:sync', dir)
        logger.success(`✓ ${dir}`)
        results.push({ dir, success: true })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        logger.error(`✗ ${dir}: ${errorMessage}`)
        results.push({ dir, success: false, error: errorMessage })

        if (!continueOnError) {
          throw error
        }
      }
    }
  }

  // 显示汇总
  const successCount = results.filter((r) => r.success).length
  const failCount = results.length - successCount

  console.log('\n📊 Sync Summary:')
  console.log(`  Total: ${results.length}`)
  console.log(`  Success: ${successCount}`)
  console.log(`  Failed: ${failCount}`)

  if (failCount > 0) {
    console.log('\n❌ Failed repositories:')
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.dir}: ${r.error}`))
  }
}
