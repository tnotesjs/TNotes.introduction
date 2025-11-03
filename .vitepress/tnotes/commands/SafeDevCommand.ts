/**
 * .vitepress/tnotes/commands/SafeDevCommand.ts
 *
 * 安全启动开发服务器命令 - 自动管理进程
 */
import { BaseCommand } from './BaseCommand'
import { VitepressService } from '../services'

export class SafeDevCommand extends BaseCommand {
  private vitepressService: VitepressService

  constructor() {
    super('safeDev', '安全启动知识库开发环境（自动管理进程）')
    this.vitepressService = new VitepressService()
  }

  protected async run(): Promise<void> {
    // 安全启动：先停止已有进程，再启动新进程
    await this.vitepressService.stopServer()
    await this.vitepressService.startServer()
  }
}
