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
import * as fs from 'fs'

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
   * @param onReady - 服务就绪回调
   * @returns 进程ID
   */
  async startServer(onReady?: () => void): Promise<number | undefined> {
    const port = this.configManager.get('port')
    const processId = 'vitepress-dev'

    // 先检查 PID 文件中是否有正在运行的进程
    const existingPid = await this.readPidFile()
    if (existingPid && this.isProcessRunning(existingPid)) {
      logger.warn(`检测到已有服务运行 (PID: ${existingPid})，正在停止旧服务...`)
      // 停止旧服务
      try {
        process.kill(existingPid, 'SIGTERM')
        // 等待进程结束
        await new Promise((resolve) => setTimeout(resolve, 1000))
        logger.info('旧服务已停止')
      } catch (error) {
        logger.error('停止旧服务失败', error)
      }
      await this.removePidFile()
    }

    // 如果有残留的 PID 文件但进程不存在，清理它
    if (existingPid && !this.isProcessRunning(existingPid)) {
      logger.info(`清理残留的 PID 文件 (进程 ${existingPid} 已不存在)`)
      await this.removePidFile()
    }

    // 检查内存中的进程管理器（清理残留）
    if (
      this.processManager.has(processId) &&
      this.processManager.isRunning(processId)
    ) {
      this.processManager.kill(processId)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 启动 VitePress 开发服务器
    const command = 'pnpm'
    const args = ['vitepress', 'dev', '--port', port.toString()]
    logger.info(`执行命令：${command} ${args.join(' ')}`)

    const processInfo = this.processManager.spawn(processId, command, args, {
      cwd: ROOT_DIR_PATH,
      stdio: ['inherit', 'pipe', 'pipe'], // stdin 继承，stdout/stderr 管道捕获
    })

    // 启动进度追踪
    const progressTracker = this.createProgressTracker(onReady)

    // 监听 stdout 和 stderr，解析启动进度
    if (processInfo.process.stdout) {
      processInfo.process.stdout.setEncoding('utf8')
      processInfo.process.stdout.on('data', (data: string) => {
        const shouldShowOutput = progressTracker.parseOutput(data)
        if (shouldShowOutput) {
          process.stdout.write(data)
        }
      })
    }

    if (processInfo.process.stderr) {
      processInfo.process.stderr.setEncoding('utf8')
      processInfo.process.stderr.on('data', (data: string) => {
        const shouldShowOutput = progressTracker.parseOutput(data)
        if (shouldShowOutput) {
          process.stderr.write(data)
        }
      })
    }

    // 将 PID 写入文件
    await this.writePidFile(processInfo.pid!)

    return processInfo.pid
  }

  /**
   * 创建进度追踪器
   */
  private createProgressTracker(onReady?: () => void) {
    const startTime = Date.now()
    let currentProgress = 0
    let serverReady = false
    let progressLine = ''
    let lastOutputTime = Date.now()
    let hasSeenOutput = false
    let totalFiles = 0

    const updateProgress = (progress: number, message?: string) => {
      if (serverReady || progress <= currentProgress) return

      currentProgress = progress

      // 清除之前的进度行
      if (progressLine) {
        process.stdout.write(`\r${' '.repeat(progressLine.length)}\r`)
      }

      // 构建新的进度行
      const bar =
        '█'.repeat(Math.floor(currentProgress / 5)) +
        '░'.repeat(20 - Math.floor(currentProgress / 5))
      progressLine = `⏳ 启动进度: [${bar}] ${currentProgress}%${
        message ? ' - ' + message : ''
      }`

      process.stdout.write(progressLine)
      lastOutputTime = Date.now()
    }

    // 启动一个定时器，在没有实际输出时也缓慢增长进度
    const progressTimer = setInterval(() => {
      if (serverReady) {
        clearInterval(progressTimer)
        return
      }

      const elapsed = Date.now() - startTime
      const timeSinceLastOutput = Date.now() - lastOutputTime

      // 如果长时间没有输出更新，说明可能在处理大量文件，缓慢增加进度
      if (timeSinceLastOutput > 1000 && currentProgress < 90 && hasSeenOutput) {
        const timeBasedProgress = Math.min(
          90,
          20 + Math.floor((elapsed / 60000) * 70)
        )
        if (timeBasedProgress > currentProgress) {
          updateProgress(timeBasedProgress, `处理中...`)
        }
      }
    }, 500)

    const parseOutput = (data: string): boolean => {
      if (serverReady) return true // 服务已就绪，显示所有输出

      const text = data.toString()
      hasSeenOutput = true

      // 先检测是否服务已就绪（优先级最高）
      if (
        text.includes('Local:') ||
        text.includes('http://localhost') ||
        (text.includes('➜') && text.includes('Local'))
      ) {
        if (!serverReady) {
          serverReady = true
          clearInterval(progressTimer)

          // 清除进度行
          if (progressLine) {
            process.stdout.write(`\r${' '.repeat(progressLine.length)}\r`)
            progressLine = ''
          }
        }
        return true // 显示服务地址信息
      }

      // 检测是否是 VitePress 的主要输出（版本信息等）
      if (
        text.includes('vitepress v') ||
        text.includes('Network:') ||
        text.includes('press h to show help') ||
        text.includes('➜')
      ) {
        // 清除进度条
        if (progressLine) {
          process.stdout.write(`\r${' '.repeat(progressLine.length)}\r`)
          progressLine = ''
        }
        return true // 显示这行输出
      }

      // Vite 启动阶段匹配规则 - 更新进度但不显示输出
      if (text.includes('vitepress') && currentProgress < 5) {
        updateProgress(5, '启动 VitePress')
        setTimeout(() => !serverReady && updateProgress(15, '加载配置'), 50)
        return false
      } else if (text.includes('VITE') && text.includes('v')) {
        updateProgress(20, '初始化 Vite')
        setTimeout(() => !serverReady && updateProgress(35, '准备构建'), 50)
        return false
      } else if (
        text.includes('Pre-bundling') ||
        text.includes('Dependencies')
      ) {
        updateProgress(40, '预构建依赖')
        return false
      } else if (
        text.includes('Optimizable dependencies detected') ||
        text.includes('optimized dependencies')
      ) {
        updateProgress(50, '优化依赖')
        return false
      } else if (text.includes('transforming') || text.includes('transform')) {
        const match =
          text.match(/(\d+)\s*(?:module|files?)/i) || text.match(/\((\d+)\)/)
        if (match) {
          const count = parseInt(match[1], 10)
          totalFiles = Math.max(totalFiles, count)
          const ratio = Math.log(count + 1) / Math.log(1000)
          const transformProgress = Math.min(85, 55 + Math.floor(ratio * 30))
          updateProgress(transformProgress, `已处理 ${count} 个文件`)
        } else if (currentProgress < 60) {
          updateProgress(60, '转换文件中')
        }
        return false
      } else if (
        text.includes('✓') &&
        (text.includes('modules') || text.includes('files'))
      ) {
        const match = text.match(/(\d+)\s*(?:module|files?)/i)
        if (match) {
          const count = parseInt(match[1], 10)
          totalFiles = Math.max(totalFiles, count)
          updateProgress(90, `完成处理 ${count} 个文件`)
        } else {
          updateProgress(90, '构建完成')
        }
        return false
      } else if (text.includes('Port') && text.includes('is in use')) {
        updateProgress(70, '切换端口')
        return true // 显示端口占用信息
      } else if (text.includes('page reload') || text.includes('hmr')) {
        updateProgress(85, '配置热更新')
        return false
      }

      // 默认返回 true，显示其他输出
      return true
    }

    // 启动初始进度
    updateProgress(0, '初始化')

    // 监听服务就绪后，延迟显示 100% 完成信息
    let readyCheckInterval: NodeJS.Timeout | null = null
    let lastReadyCheck = Date.now()

    readyCheckInterval = setInterval(() => {
      if (serverReady && Date.now() - lastReadyCheck > 200) {
        // 服务就绪后等待 200ms，让 VitePress 的输出完成
        clearInterval(readyCheckInterval!)

        const elapsed = Date.now() - startTime
        const seconds = (elapsed / 1000).toFixed(1)
        const bar = '█'.repeat(20)
        const fileInfo = totalFiles > 0 ? ` (${totalFiles} 个文件)` : ''
        process.stdout.write(
          `✅ 启动完成: [${bar}] 100%${fileInfo} - 耗时 ${seconds}s\n`
        )

        if (onReady) {
          onReady()
        }
      }

      if (serverReady) {
        lastReadyCheck = Date.now()
      }
    }, 50)

    return {
      parseOutput,
      isReady: () => serverReady,
    }
  }
  /**
   * 停止 VitePress 开发服务器
   */
  async stopServer(): Promise<void> {
    const processId = 'vitepress-dev'

    // 先尝试从 PID 文件读取
    const pidFromFile = await this.readPidFile()
    if (pidFromFile && this.isProcessRunning(pidFromFile)) {
      logger.info(`正在停止 VitePress 服务 (PID: ${pidFromFile})...`)
      try {
        process.kill(pidFromFile, 'SIGTERM')
        await this.removePidFile()
        logger.info('VitePress 服务已成功停止')
        return
      } catch (error) {
        logger.error('停止 VitePress 服务失败', error)
      }
    }

    // 如果 PID 文件中没有，尝试从内存中的进程管理器
    if (!this.processManager.has(processId)) {
      // 清理可能残留的 PID 文件
      await this.removePidFile()
      logger.warn('没有正在运行的 VitePress 服务')
      return
    }

    const processInfo = this.processManager.get(processId)
    logger.info(`正在停止 VitePress 服务 (PID: ${processInfo?.pid})...`)

    const killed = this.processManager.kill(processId)

    if (killed) {
      await this.removePidFile()
      logger.info('VitePress 服务已成功停止')
    } else {
      logger.error('停止 VitePress 服务失败')
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
    const port = this.configManager.get('port')

    // 先检查 PID 文件（同步版本）
    try {
      if (fs.existsSync(this.pidFile)) {
        const content = fs.readFileSync(this.pidFile, 'utf-8')
        const pid = parseInt(content.trim(), 10)
        if (!isNaN(pid) && this.isProcessRunning(pid)) {
          return {
            running: true,
            pid,
            port,
          }
        }
      }
    } catch {
      // 忽略错误，继续检查内存中的进程管理器
    }

    // 检查内存中的进程管理器
    const processInfo = this.processManager.get(processId)

    if (!processInfo || !this.processManager.isRunning(processId)) {
      return { running: false }
    }

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
    const command = 'pnpm vitepress build'
    logger.info(`执行命令：${command}`)
    logger.info('正在构建 VitePress 站点...')

    try {
      await runCommand(command, ROOT_DIR_PATH)
      logger.info('构建完成')
    } catch (error) {
      logger.error('构建失败', error)
      throw error
    }
  }

  /**
   * 预览构建后的站点
   */
  async preview(): Promise<number | undefined> {
    const processId = 'vitepress-preview'
    const command = 'pnpm'
    const args = ['vitepress', 'preview']
    logger.info(`执行命令：${command} ${args.join(' ')}`)
    logger.info('正在启动预览服务...')

    const processInfo = this.processManager.spawn(processId, command, args, {
      cwd: ROOT_DIR_PATH,
      stdio: 'inherit',
    })

    logger.info(`预览服务已启动 (PID: ${processInfo.pid})`)
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
      logger.info('没有需要清理的 VitePress 进程')
      return
    }

    logger.info(`正在清理 ${vitepressProcesses.length} 个 VitePress 进程...`)

    for (const process of vitepressProcesses) {
      this.processManager.kill(process.id)
    }

    logger.info('清理完成')
  }

  /**
   * 显示服务器日志（占位方法，实际实现需要日志收集机制）
   */
  showLogs(): void {
    const status = this.getServerStatus()

    if (!status.running) {
      logger.info('服务器未运行')
      return
    }

    logger.info('服务器状态:')
    logger.info(`  PID: ${status.pid}`)
    logger.info(`  端口: ${status.port}`)
    logger.info(`  运行时间: ${status.uptime}ms`)
    logger.info(`  访问地址: http://localhost:${status.port}`)
  }

  /**
   * 读取 PID 文件
   * @returns PID 或 undefined
   */
  private async readPidFile(): Promise<number | undefined> {
    const fs = await import('fs/promises')
    try {
      const content = await fs.readFile(this.pidFile, 'utf-8')
      const pid = parseInt(content.trim(), 10)
      return isNaN(pid) ? undefined : pid
    } catch {
      return undefined
    }
  }

  /**
   * 写入 PID 文件
   * @param pid - 进程ID
   */
  private async writePidFile(pid: number): Promise<void> {
    const fs = await import('fs/promises')
    try {
      await fs.writeFile(this.pidFile, pid.toString(), 'utf-8')
    } catch (error) {
      logger.error('写入 PID 文件失败', error)
    }
  }

  /**
   * 删除 PID 文件
   */
  private async removePidFile(): Promise<void> {
    const fs = await import('fs/promises')
    try {
      await fs.unlink(this.pidFile)
    } catch {
      // 文件可能不存在，忽略错误
    }
  }

  /**
   * 检查进程是否正在运行
   * @param pid - 进程ID
   * @returns 是否运行中
   */
  private isProcessRunning(pid: number): boolean {
    try {
      // process.kill(pid, 0) 不会真正杀死进程，只是检查进程是否存在
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }
}
