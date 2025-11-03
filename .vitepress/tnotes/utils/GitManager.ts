/**
 * .vitepress/tnotes/utils/GitManager.ts
 *
 * Git 仓库管理器 - 提供统一的 Git 操作接口
 */
import { runCommand } from './runCommand'
import { Logger } from './logger'
import { createError, handleError } from './errorHandler'

/**
 * Git 状态信息接口
 */
export interface GitStatus {
  hasChanges: boolean
  changedFiles: number
  staged: number
  unstaged: number
  untracked: number
  branch: string
  ahead: number
  behind: number
}

/**
 * Git 远程信息接口
 */
export interface GitRemoteInfo {
  url: string
  type: 'https' | 'ssh' | 'unknown'
  owner?: string
  repo?: string
}

/**
 * Git 管理器类
 */
export class GitManager {
  private logger: Logger
  private dir: string

  constructor(dir: string, logger?: Logger) {
    this.dir = dir
    this.logger = logger?.child('git') || new Logger({ prefix: 'git' })
  }

  /**
   * 检查是否为有效的 Git 仓库
   */
  async isValidRepo(): Promise<boolean> {
    try {
      const result = await runCommand(
        'git rev-parse --is-inside-work-tree',
        this.dir
      )
      return result.trim() === 'true'
    } catch {
      return false
    }
  }

  /**
   * 确保是有效的 Git 仓库，否则抛出错误
   */
  async ensureValidRepo(): Promise<void> {
    if (!(await this.isValidRepo())) {
      throw createError.gitNotRepo(this.dir)
    }
  }

  /**
   * 获取 Git 状态
   */
  async getStatus(): Promise<GitStatus> {
    await this.ensureValidRepo()

    const statusOutput = await runCommand('git status --porcelain', this.dir)
    const lines = statusOutput
      .trim()
      .split('\n')
      .filter((line) => line)

    const staged = lines.filter((line) => /^[MADRC]/.test(line)).length
    const unstaged = lines.filter((line) => /^.[MD]/.test(line)).length
    const untracked = lines.filter((line) => line.startsWith('??')).length

    // 获取当前分支
    const branch = await runCommand('git branch --show-current', this.dir)

    // 获取远程同步状态
    let ahead = 0
    let behind = 0
    try {
      const aheadBehind = await runCommand(
        'git rev-list --left-right --count @{upstream}...HEAD',
        this.dir
      )
      const [behindStr, aheadStr] = aheadBehind.trim().split('\t')
      behind = parseInt(behindStr) || 0
      ahead = parseInt(aheadStr) || 0
    } catch {
      // 可能没有上游分支
    }

    return {
      hasChanges: lines.length > 0,
      changedFiles: lines.length,
      staged,
      unstaged,
      untracked,
      branch: branch.trim(),
      ahead,
      behind,
    }
  }

  /**
   * 获取远程仓库信息
   */
  async getRemoteInfo(): Promise<GitRemoteInfo | null> {
    try {
      await this.ensureValidRepo()
      const remoteUrl = await runCommand(
        'git config --get remote.origin.url',
        this.dir
      )
      const url = remoteUrl.trim()

      if (!url) return null

      // 解析 HTTPS URL
      const httpsMatch = url.match(
        /https:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/.]+)/
      )
      if (httpsMatch) {
        return {
          url,
          type: 'https',
          owner: httpsMatch[1],
          repo: httpsMatch[2],
        }
      }

      // 解析 SSH URL
      const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/.]+)/)
      if (sshMatch) {
        return {
          url,
          type: 'ssh',
          owner: sshMatch[1],
          repo: sshMatch[2],
        }
      }

      return { url, type: 'unknown' }
    } catch {
      return null
    }
  }

  /**
   * 检查是否有未提交的更改
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.getStatus()
    return status.hasChanges
  }

  /**
   * Stash 当前更改
   */
  async stash(message?: string): Promise<boolean> {
    try {
      await this.ensureValidRepo()
      const cmd = message ? `git stash push -m "${message}"` : 'git stash push'
      await runCommand(cmd, this.dir)
      this.logger.info('Stashed uncommitted changes')
      return true
    } catch (error) {
      this.logger.warn('Failed to stash changes')
      return false
    }
  }

  /**
   * Pop stash
   */
  async stashPop(): Promise<boolean> {
    try {
      await this.ensureValidRepo()
      await runCommand('git stash pop', this.dir)
      this.logger.info('Restored stashed changes')
      return true
    } catch (error) {
      this.logger.warn('Failed to restore stashed changes')
      return false
    }
  }

  /**
   * 拉取远程更新
   */
  async pull(options?: {
    rebase?: boolean
    autostash?: boolean
  }): Promise<void> {
    await this.ensureValidRepo()

    const { rebase = true, autostash = true } = options || {}

    // 检查是否有未提交的更改
    const hasChanges = await this.hasUncommittedChanges()
    let didStash = false

    if (hasChanges && !autostash) {
      this.logger.warn('Repository has uncommitted changes')
      didStash = await this.stash('Auto-stash before pull')
    }

    try {
      const status = await this.getStatus()
      this.logger.progress(
        `Pulling updates from remote (branch: ${status.branch})...`
      )

      const cmd = `git pull ${rebase ? '--rebase' : ''} ${
        autostash ? '--autostash' : ''
      }`.trim()
      await runCommand(cmd, this.dir)

      this.logger.success('Successfully pulled remote updates')
    } catch (error) {
      handleError(error)
      throw error
    } finally {
      // 如果之前手动 stash 了，尝试 pop
      if (didStash) {
        await this.stashPop()
      }
    }
  }

  /**
   * 提交更改
   */
  async commit(message: string): Promise<void> {
    await this.ensureValidRepo()

    try {
      await runCommand(`git commit -m "${message}"`, this.dir)
      this.logger.success(`Committed: ${message}`)
    } catch (error) {
      handleError(error)
      throw error
    }
  }

  /**
   * 添加文件到暂存区
   */
  async add(files: string | string[] = '.'): Promise<void> {
    await this.ensureValidRepo()

    const fileList = Array.isArray(files) ? files.join(' ') : files
    try {
      await runCommand(`git add ${fileList}`, this.dir)
      this.logger.info(`Staged changes: ${fileList}`)
    } catch (error) {
      handleError(error)
      throw error
    }
  }

  /**
   * 推送到远程仓库
   */
  async push(options?: {
    force?: boolean
    setUpstream?: boolean
  }): Promise<void> {
    await this.ensureValidRepo()

    const { force = false, setUpstream = false } = options || {}

    try {
      const status = await this.getStatus()
      this.logger.progress(`Pushing to remote (branch: ${status.branch})...`)

      let cmd = 'git push'
      if (force) cmd += ' --force'
      if (setUpstream) cmd += ` --set-upstream origin ${status.branch}`

      await runCommand(cmd, this.dir)

      const remoteInfo = await this.getRemoteInfo()
      if (remoteInfo) {
        this.logger.success(`Pushed to ${remoteInfo.owner}/${remoteInfo.repo}`)
      } else {
        this.logger.success('Successfully pushed to remote')
      }
    } catch (error) {
      this.logger.error('Failed to push to remote')
      handleError(error)
      throw error
    }
  }

  /**
   * 完整的推送流程：检查 -> 添加 -> 提交 -> 推送
   */
  async pushWithCommit(
    commitMessage?: string,
    options?: { force?: boolean }
  ): Promise<void> {
    await this.ensureValidRepo()

    const status = await this.getStatus()

    // 检查是否有更改
    if (!status.hasChanges) {
      this.logger.info('No changes to commit')
      return
    }

    try {
      // 显示状态摘要
      this.logger.info(
        `Changes: ${status.changedFiles} files (${status.staged} staged, ${status.unstaged} unstaged, ${status.untracked} untracked)`
      )

      // 添加所有更改
      await this.add('.')

      // 生成提交信息
      const message =
        commitMessage || `update: ${status.changedFiles} files modified`

      // 提交
      await this.commit(message)

      // 推送
      await this.push(options)
    } catch (error) {
      handleError(error)
      throw error
    }
  }

  /**
   * 完整的同步流程：拉取 -> 推送
   */
  async sync(options?: {
    commitMessage?: string
    rebase?: boolean
  }): Promise<void> {
    const { commitMessage, rebase = true } = options || {}

    try {
      // 先拉取
      await this.pull({ rebase, autostash: true })

      // 再推送
      await this.pushWithCommit(commitMessage)
    } catch (error) {
      this.logger.error('Sync failed')
      handleError(error)
      throw error
    }
  }

  /**
   * 显示状态摘要
   */
  async showStatus(): Promise<void> {
    const status = await this.getStatus()
    const remoteInfo = await this.getRemoteInfo()

    console.log('\n📊 Git Status:')
    console.log(`  Branch: ${status.branch}`)
    if (remoteInfo) {
      console.log(
        `  Remote: ${remoteInfo.owner}/${remoteInfo.repo} (${remoteInfo.type})`
      )
    }
    console.log(`  Changed files: ${status.changedFiles}`)
    console.log(
      `    - Staged: ${status.staged}, Unstaged: ${status.unstaged}, Untracked: ${status.untracked}`
    )
    if (status.ahead > 0 || status.behind > 0) {
      console.log(
        `  Sync status: ${status.ahead} ahead, ${status.behind} behind`
      )
    }
    console.log()
  }
}
