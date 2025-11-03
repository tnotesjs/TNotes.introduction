/**
 * .vitepress/tnotes/commands/dev/DevCommand.ts
 *
 * 开发服务器命令 - 使用 VitepressService
 */
import { BaseCommand } from '../BaseCommand'
import { VitepressService } from '../../services'

export class DevCommand extends BaseCommand {
  private vitepressService: VitepressService

  constructor() {
    super('dev', '启动知识库开发服务')
    this.vitepressService = new VitepressService()
  }

  protected async run(): Promise<void> {
    const status = this.vitepressService.getServerStatus()

    if (status.running) {
      this.logger.warn(
        `服务器已在运行中 (PID: ${status.pid}, Port: ${status.port})`
      )
      this.logger.info(`访问地址: http://localhost:${status.port}`)
      return
    }

    this.logger.info('正在启动开发服务器...')

    const pid = await this.vitepressService.startServer()

    if (pid) {
      const newStatus = this.vitepressService.getServerStatus()
      this.logger.success(`服务器已启动 (PID: ${pid})`)
      this.logger.info(`访问地址: http://localhost:${newStatus.port}`)
    } else {
      this.logger.error('启动服务器失败')
    }
  }
}
