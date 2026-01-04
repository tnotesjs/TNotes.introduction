/**
 * .vitepress/tnotes/services/VitepressService.ts
 *
 * VitePress 服务 - 封装 VitePress 开发服务器相关的业务逻辑
 */
import { ProcessManager } from '../lib/ProcessManager'
import { ConfigManager } from '../config/ConfigManager'
import { logger } from '../utils/logger'
import { ROOT_DIR_PATH } from '../config/constants'
import { runCommandSpawn } from '../utils/command'

/**
 * VitePress 服务类
 */
export class VitepressService {
  private processManager: ProcessManager
  private configManager: ConfigManager

  constructor() {
    this.processManager = new ProcessManager()
    this.configManager = ConfigManager.getInstance()
  }

  /**
   * 启动 VitePress 开发服务器
   * @returns 进程 ID（服务就绪后返回）
   */
  async startServer(): Promise<number | undefined> {
    const port = this.configManager.get('port')
    const processId = 'vitepress-dev'

    // 检查内存中的进程管理器（清理残留）
    if (
      this.processManager.has(processId) &&
      this.processManager.isRunning(processId)
    ) {
      this.processManager.kill(processId)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 检查目标端口是否被占用，如果是则强制清理
    const { isPortInUse, killPortProcess, waitForPort } = await import(
      '../utils/portUtils'
    )
    if (isPortInUse(port)) {
      logger.warn(`端口 ${port} 被占用，正在清理...`)
      killPortProcess(port)
      const available = await waitForPort(port, 3000)
      if (!available) {
        logger.error(`端口 ${port} 无法释放，服务可能会使用其他端口`)
      }
    }

    // 启动 VitePress 开发服务器
    const command = 'pnpm'
    const args = ['vitepress', 'dev', '--port', port.toString()]

    const processInfo = this.processManager.spawn(processId, command, args, {
      cwd: ROOT_DIR_PATH,
      stdio: ['inherit', 'pipe', 'pipe'], // stdin 继承，stdout/stderr 管道捕获
    })

    // 等待服务就绪，同时显示进度
    await this.waitForServerReady(processInfo.process)

    return processInfo.pid
  }

  /**
   * 等待服务就绪，显示进度条
   */
  private waitForServerReady(
    childProcess: import('child_process').ChildProcess
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      let serverReady = false
      let currentProgress = 0
      let totalFiles = 0
      let progressLine = ''

      // 更新进度条显示
      const updateProgress = (progress: number, message?: string) => {
        if (serverReady || progress <= currentProgress) return
        currentProgress = progress

        // 清除当前行
        process.stdout.write(`\r\x1b[K`)

        // 构建进度条
        const bar =
          '█'.repeat(Math.floor(currentProgress / 5)) +
          '░'.repeat(20 - Math.floor(currentProgress / 5))
        const fileInfo = totalFiles > 0 ? ` (${totalFiles} 个文件)` : ''
        progressLine = `⏳ 启动进度: [${bar}] ${currentProgress}%${fileInfo}${
          message ? ' - ' + message : ''
        }`

        process.stdout.write(progressLine)
      }

      // 显示初始进度
      updateProgress(0, '初始化')

      // 基于时间的进度定时器
      const progressTimer = setInterval(() => {
        if (serverReady) {
          clearInterval(progressTimer)
          return
        }

        const elapsed = Date.now() - startTime
        // 假设 30 秒完成（大型知识库可能需要更长时间）
        const timeBasedProgress = Math.min(
          90,
          Math.floor((elapsed / 30000) * 90)
        )

        if (timeBasedProgress > currentProgress) {
          let stage = '处理中...'
          if (timeBasedProgress < 20) stage = '启动 VitePress'
          else if (timeBasedProgress < 40) stage = '初始化 Vite'
          else if (timeBasedProgress < 60) stage = '转换文件中'
          else if (timeBasedProgress < 80) stage = '构建页面'
          else stage = '即将完成'

          updateProgress(timeBasedProgress, stage)
        }
      }, 300)

      // 处理输出
      const handleOutput = (data: string) => {
        if (serverReady) {
          // 服务就绪后直接输出
          process.stdout.write(data)
          return
        }

        const text = data.toString()

        // 检测服务就绪
        if (
          text.includes('Local:') ||
          text.includes('http://localhost') ||
          (text.includes('➜') && text.includes('Local'))
        ) {
          serverReady = true
          clearInterval(progressTimer)

          // 清除进度条，显示完成信息
          process.stdout.write(`\r\x1b[K`)
          const elapsed = Date.now() - startTime
          const seconds = (elapsed / 1000).toFixed(1)
          const bar = '█'.repeat(20)
          const fileInfo = totalFiles > 0 ? ` (${totalFiles} 个文件)` : ''
          console.log(
            `✅ 启动完成: [${bar}] 100%${fileInfo} - 耗时 ${seconds}s\n`
          )

          // 显示 VitePress 输出
          process.stdout.write(data)

          // 延迟 resolve，让 VitePress 的后续输出完成
          setTimeout(resolve, 200)
          return
        }

        // 解析文件数量更新进度
        if (text.includes('transforming') || text.includes('transform')) {
          const match =
            text.match(/(\d+)\s*(?:module|files?)/i) || text.match(/\((\d+)\)/)
          if (match) {
            const count = parseInt(match[1], 10)
            totalFiles = Math.max(totalFiles, count)
            const ratio = Math.log(count + 1) / Math.log(5000) // 假设最多 5000 个文件
            const transformProgress = Math.min(85, 50 + Math.floor(ratio * 35))
            updateProgress(transformProgress, `已处理 ${count} 个文件`)
          }
        } else if (
          text.includes('✓') &&
          (text.includes('modules') || text.includes('files'))
        ) {
          const match = text.match(/(\d+)\s*(?:module|files?)/i)
          if (match) {
            const count = parseInt(match[1], 10)
            totalFiles = Math.max(totalFiles, count)
            updateProgress(90, `完成处理 ${count} 个文件`)
          }
        }

        // 显示关键输出
        if (
          text.includes('vitepress v') ||
          (text.includes('Port') && text.includes('is in use'))
        ) {
          // 清除进度条，显示信息，然后恢复进度条
          process.stdout.write(`\r\x1b[K`)
          process.stdout.write(data)
          if (progressLine) {
            process.stdout.write(progressLine)
          }
        }
      }

      // 监听输出
      if (childProcess.stdout) {
        childProcess.stdout.setEncoding('utf8')
        childProcess.stdout.on('data', handleOutput)
      }

      if (childProcess.stderr) {
        childProcess.stderr.setEncoding('utf8')
        childProcess.stderr.on('data', handleOutput)
      }

      // 超时处理（60 秒）
      setTimeout(() => {
        if (!serverReady) {
          serverReady = true
          clearInterval(progressTimer)
          process.stdout.write(`\r\x1b[K`)
          console.log('⚠️  启动超时，请检查 VitePress 输出')
          resolve()
        }
      }, 60000)
    })
  }

  /**
   * 构建生产版本
   */
  async build(): Promise<void> {
    const command = 'pnpm vitepress build'
    logger.info(`执行命令:${command}`)
    logger.info('正在构建 VitePress 站点...')

    try {
      await runCommandSpawn(command, ROOT_DIR_PATH)
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
    const previewPort = 4173 // VitePress 默认预览端口

    // 检查端口是否被占用
    const { isPortInUse, killPortProcess, waitForPort } = await import(
      '../utils/portUtils'
    )

    if (isPortInUse(previewPort)) {
      logger.warn(`端口 ${previewPort} 已被占用，正在尝试清理...`)
      const killed = killPortProcess(previewPort)

      if (killed) {
        // 等待端口释放
        const available = await waitForPort(previewPort, 3000)
        if (!available) {
          logger.error(`端口 ${previewPort} 释放超时，请手动清理`)
          return undefined
        }
        logger.info(`端口 ${previewPort} 已释放`)
      } else {
        logger.error(
          `无法清理端口 ${previewPort}，请手动执行: taskkill /F /PID <PID>`
        )
        return undefined
      }
    }

    logger.info(`执行命令：${command} ${args.join(' ')}`)
    logger.info('正在启动预览服务...')

    const processInfo = this.processManager.spawn(processId, command, args, {
      cwd: ROOT_DIR_PATH,
      stdio: 'inherit',
    })

    logger.info(`预览服务已启动 (PID: ${processInfo.pid})`)
    return processInfo.pid
  }
}
