/**
 * .vitepress/tnotes/commands/SafeUpdateCommand.ts
 *
 * 安全更新命令 - 更新后自动重启服务
 */
import { BaseCommand } from './BaseCommand'
import { ReadmeService } from '../services/ReadmeService'
import { VitepressService } from '../services/VitepressService'

export class SafeUpdateCommand extends BaseCommand {
  private readmeService: ReadmeService
  private vitepressService: VitepressService

  constructor() {
    super('safeUpdate', '安全更新知识库（自动重启服务）')
    this.readmeService = new ReadmeService()
    this.vitepressService = new VitepressService()
  }

  protected async run(): Promise<void> {
    // 1. 更新知识库
    await this.readmeService.updateAllReadmes({
      updateSidebar: true,
      updateToc: true,
      updateHome: true,
    })

    // 2. 重启服务器
    await this.vitepressService.restartServer()
  }
}
