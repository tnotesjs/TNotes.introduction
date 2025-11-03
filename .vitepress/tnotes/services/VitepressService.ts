/**
 * .vitepress/tnotes/services/VitepressService.ts
 *
 * VitePress 服务 - 封装 VitePress 开发服务器相关的业务逻辑
 */
import { ProcessManager } from '../lib/ProcessManager'
import { ConfigManager } from '../config/ConfigManager'
import { logger } from '../utils/logger'
import { VITEPRESS_PID_FILENAME, ROOT_DIR_PATH } from '../config/constants'
import { runCommand } from '../utils/command'
import * as path from 'path'

/**
 * VitePress 服务类
 */
export class VitepressService {
  private processManager: ProcessManager
  private configManager: ConfigManager
  private readonly pidFile: string

  constructor() {
    this.processManager = new ProcessManager()
    this.configManager = ConfigManager.getInstance()
    this.pidFile = path.join(ROOT_DIR_PATH, VITEPRESS_PID_FILENAME)
  }

  /**
   * 启动 VitePress 开发服务器
   * @returns 进程ID
   */
  async startServer(): Promise<number | undefined> {
    const port = this.configManager.get('port')
    const processId = 'vitepress-dev'

    // 检查是否已经有服务器在运行
    if (
      this.processManager.has(processId) &&
      this.processManager.isRunning(processId)
    ) {
      const existing = this.processManager.get(processId)
      logger.warn(`VitePress server already running on port ${port}`)
      return existing?.pid
    }

    logger.info(`Starting VitePress server on port ${port}...`)

    // 启动 VitePress 开发服务器
    const processInfo = this.processManager.spawn(
      processId,
      'pnpm',
      ['vitepress', 'dev', '--port', port.toString()],
      {
        cwd: ROOT_DIR_PATH,
        detached: true,
        stdio: 'ignore',
      }
    )

    logger.info(`VitePress server started with PID: ${processInfo.pid}`)
    return processInfo.pid
  }

  /**
   * 停止 VitePress 开发服务器
   */
  async stopServer(): Promise<void> {
    const processId = 'vitepress-dev'

    if (!this.processManager.has(processId)) {
      logger.warn('No VitePress server is running')
      return
    }

    const processInfo = this.processManager.get(processId)
    logger.info(`Stopping VitePress server (PID: ${processInfo?.pid})...`)

    const killed = this.processManager.kill(processId)

    if (killed) {
      logger.info('VitePress server stopped successfully')
    } else {
      logger.error('Failed to stop VitePress server')
    }
  }

  /**
   * 重启 VitePress 开发服务器
   */
  async restartServer(): Promise<number | undefined> {
    await this.stopServer()

    // 等待一小段时间确保端口释放
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return await this.startServer()
  }

  /**
   * 检查服务器是否正在运行
   * @returns 是否运行中
   */
  isServerRunning(): boolean {
    const processId = 'vitepress-dev'
    return (
      this.processManager.has(processId) &&
      this.processManager.isRunning(processId)
    )
  }

  /**
   * 获取服务器状态
   * @returns 服务器状态信息
   */
  getServerStatus(): {
    running: boolean
    pid?: number
    port?: number
    uptime?: number
  } {
    const processId = 'vitepress-dev'
    const processInfo = this.processManager.get(processId)

    if (!processInfo || !this.processManager.isRunning(processId)) {
      return { running: false }
    }

    const port = this.configManager.get('port')
    const uptime = Date.now() - processInfo.startTime

    return {
      running: true,
      pid: processInfo.pid,
      port,
      uptime,
    }
  }

  /**
   * 构建生产版本
   */
  async build(): Promise<void> {
    logger.info('Building VitePress site...')

    try {
      await runCommand('pnpm vitepress build', ROOT_DIR_PATH)
      logger.info('Build completed successfully')
    } catch (error) {
      logger.error('Build failed', error)
      throw error
    }
  }

  /**
   * 预览构建后的站点
   */
  async preview(): Promise<number | undefined> {
    logger.info('Starting preview server...')

    const processId = 'vitepress-preview'
    const processInfo = this.processManager.spawn(
      processId,
      'pnpm',
      ['vitepress', 'preview'],
      {
        cwd: ROOT_DIR_PATH,
        stdio: 'inherit',
      }
    )

    logger.info(`Preview server started with PID: ${processInfo.pid}`)
    return processInfo.pid
  }

  /**
   * 清理所有 VitePress 进程
   */
  async cleanup(): Promise<void> {
    const processes = this.processManager.getAllProcesses()
    const vitepressProcesses = processes.filter((p) =>
      p.command.includes('vitepress')
    )

    if (vitepressProcesses.length === 0) {
      logger.info('No VitePress processes to clean up')
      return
    }

    logger.info(
      `Cleaning up ${vitepressProcesses.length} VitePress processes...`
    )

    for (const process of vitepressProcesses) {
      this.processManager.kill(process.id)
    }

    logger.info('Cleanup complete')
  }

  /**
   * 显示服务器日志（占位方法，实际实现需要日志收集机制）
   */
  showLogs(): void {
    const status = this.getServerStatus()

    if (!status.running) {
      logger.info('Server is not running')
      return
    }

    logger.info('Server Status:')
    logger.info(`  PID: ${status.pid}`)
    logger.info(`  Port: ${status.port}`)
    logger.info(`  Uptime: ${status.uptime}ms`)
    logger.info(`  URL: http://localhost:${status.port}`)
  }
}
