/**
 * .vitepress/tnotes/commands/update/UpdateCommand.ts
 *
 * 更新命令 - 使用 ReadmeService
 */
import { BaseCommand } from '../BaseCommand'
import { ReadmeService } from '../../services'

export class UpdateCommand extends BaseCommand {
  private readmeService: ReadmeService

  constructor() {
    super('update', '根据笔记内容更新知识库')
    this.readmeService = new ReadmeService()
  }

  protected async run(): Promise<void> {
    this.logger.info('开始更新知识库...')

    await this.readmeService.updateAllReadmes({
      updateSidebar: true,
      updateToc: true,
      updateHome: true,
    })

    this.logger.success('知识库更新完成')
  }
}
