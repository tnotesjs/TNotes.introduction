/**
 * .vitepress/tnotes/services/VitepressService.ts
 *
 * VitePress 服务 - 封装 VitePress 开发服务器相关的业务逻辑
 */
import { spawn } from 'child_process'
import { ProcessManager } from '../../lib/ProcessManager'
import { ConfigManager } from '../../config/ConfigManager'
import { logger } from '../../utils'
import { ROOT_DIR_PATH } from '../../config/constants'
import { NoteManager } from '../../core/NoteManager'

export class VitepressService {
  private processManager: ProcessManager
  private configManager: ConfigManager
  private noteManager: NoteManager

  constructor() {
    this.processManager = new ProcessManager()
    this.configManager = ConfigManager.getInstance()
    this.noteManager = new NoteManager()
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
      '../../utils'
    )
    if (isPortInUse(port)) {
      logger.warn(`端口 ${port} 被占用，正在清理...`)
      killPortProcess(port)
      const available = await waitForPort(port, 3000)

      if (available) {
        logger.info(`端口 ${port} 已释放，继续启动服务`)
      } else {
        logger.warn(
          `端口 ${port} 未确认释放，仍将尝试启动；如启动失败，请手动清理该端口`
        )
      }
    }

    // 启动 VitePress 开发服务器
    const command = 'pnpm'
    const args = ['vitepress', 'dev', '--port', port.toString()]

    const processInfo = this.processManager.spawn(processId, command, args, {
      cwd: ROOT_DIR_PATH,
      stdio: ['inherit', 'pipe', 'pipe'], // stdin 继承，stdout/stderr 管道捕获
    })

    // 预扫描笔记数量
    const noteCount = this.noteManager.countNotes()

    // 等待服务就绪，显示启动状态
    await this.waitForServerReady(processInfo.process, noteCount)

    return processInfo.pid
  }

  /**
   * 等待服务就绪，显示启动状态
   * @param childProcess - 子进程
   * @param noteCount - 笔记数量
   */
  private waitForServerReady(
    childProcess: import('child_process').ChildProcess,
    noteCount: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      let serverReady = false

      // 定时器：显示启动状态（真实的已用时间）
      const statusTimer = setInterval(() => {
        if (serverReady) {
          clearInterval(statusTimer)
          return
        }

        const elapsed = Date.now() - startTime
        const seconds = (elapsed / 1000).toFixed(1)
        // 使用 stderr 输出，避免与 VitePress 输出混在一起
        process.stderr.clearLine?.(0)
        process.stderr.cursorTo?.(0)
        process.stderr.write(
          `⏳ 启动中: 共 ${noteCount} 篇笔记，已用 ${seconds}s...`
        )
      }, 1000)

      // 处理输出
      const handleOutput = (data: string) => {
        const text = data.toString()

        // 检测服务就绪
        if (
          !serverReady &&
          (text.includes('Local:') ||
            text.includes('http://localhost') ||
            (text.includes('➜') && text.includes('Local')))
        ) {
          serverReady = true
          clearInterval(statusTimer)

          // 清除状态行，显示完成信息
          process.stderr.clearLine?.(0)
          process.stderr.cursorTo?.(0)
          const elapsed = Date.now() - startTime
          const seconds = (elapsed / 1000).toFixed(1)
          console.log(
            `✅ 服务已就绪 - 共 ${noteCount} 篇笔记，启动耗时 ${seconds}s\n`
          )

          // 显示 VitePress 输出
          process.stdout.write(data)

          // 延迟 resolve，让后续输出完成
          setTimeout(resolve, 200)
          return
        }

        // 服务就绪前隐藏大部分输出，只显示关键信息
        if (!serverReady) {
          if (
            text.includes('vitepress v') ||
            text.includes('error') ||
            text.includes('Error') ||
            (text.includes('Port') && text.includes('is in use'))
          ) {
            process.stderr.clearLine?.(0)
            process.stderr.cursorTo?.(0)
            process.stdout.write(data)
          }
        } else {
          // 服务就绪后直接输出
          process.stdout.write(data)
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
          clearInterval(statusTimer)
          process.stderr.clearLine?.(0)
          process.stderr.cursorTo?.(0)
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
    logger.info('正在构建 VitePress 站点...\n')

    try {
      await this.runBuildWithProgress()
      logger.info('构建完成')
    } catch (error) {
      logger.error('构建失败', error)
      throw error
    }
  }

  /**
   * 运行构建命令并过滤输出
   */
  private runBuildWithProgress(): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('pnpm', ['vitepress', 'build'], {
        cwd: ROOT_DIR_PATH,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
      })

      // 过滤 VitePress 的 spinner 和状态输出，但保留我们的进度条
      const filterOutput = (data: Buffer) => {
        const str = data.toString()

        // 允许我们的进度条和结果输出
        if (
          str.includes('🔨') ||
          str.includes('✅ 构建成功') ||
          str.includes('❌ 构建失败') ||
          str.includes('📁') ||
          str.includes('📊') ||
          str.includes('📦') ||
          str.includes('⏱️') ||
          str.includes('Building [') ||
          str.includes('error') ||
          str.includes('Error')
        ) {
          process.stdout.write(data)
          return
        }

        // 过滤掉 VitePress 的 spinner 和状态输出
        // 包括: ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏ spinner 字符, ✓ 完成标记, vitepress 版本信息等
        if (
          /^[\s⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏✓\r\n]*$/.test(str) ||
          str.includes('building client + server') ||
          str.includes('rendering pages') ||
          str.includes('generating sitemap') ||
          str.includes('build complete in') ||
          str.includes('vitepress v')
        ) {
          return // 静默这些输出
        }

        // 其他输出也静默（插件已经在内部拦截了）
      }

      child.stdout?.on('data', filterOutput)
      child.stderr?.on('data', filterOutput)

      child.on('error', (err: Error) => {
        reject(err)
      })

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command failed with code ${code}`))
        }
      })
    })
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
      '../../utils'
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
