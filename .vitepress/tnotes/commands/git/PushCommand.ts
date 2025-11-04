/**
 * .vitepress/tnotes/commands/git/PushCommand.ts
 *
 * Git Push 命令 - 使用 GitService 和 TimestampService
 */
import { BaseCommand } from '../BaseCommand'
import { GitService, TimestampService, serviceManager } from '../../services'

export class PushCommand extends BaseCommand {
  private gitService: GitService
  private timestampService: TimestampService

  constructor() {
    super('push', '将知识库推送到 GitHub')
    this.gitService = new GitService()
    this.timestampService = new TimestampService()
  }

  protected async run(): Promise<void> {
    // 0. 暂停文件监听（如果正在运行）
    const isWatcherActive = serviceManager.isFileWatcherActive()
    if (isWatcherActive) {
      const fileWatcherService = serviceManager.getFileWatcherService()
      fileWatcherService.pause()
    }

    try {
      // 1. 先修复时间戳
      this.logger.info('正在检查并修复时间戳...')
      await this.timestampService.fixAllTimestamps()

      // 2. 检查是否有更改
      this.logger.info('检查是否有更改...')
      const hasChanges = await this.gitService.hasChanges()

      if (!hasChanges) {
        this.logger.info('没有更改需要推送')
        return
      }

      // 3. 推送到远程仓库
      this.logger.info('正在推送到远程仓库...')
      await this.gitService.quickPush()

      this.logger.success('推送完成')
    } finally {
      // 恢复文件监听
      if (isWatcherActive) {
        const fileWatcherService = serviceManager.getFileWatcherService()
        fileWatcherService.resume()
      }
    }
  }
}
