/**
 * .vitepress/tnotes/utils/runCommand.ts
 *
 * 运行命令的工具函数
 */
import { spawn, exec } from 'child_process'
import path from 'path'
import { existsSync } from 'fs'
import type { CommandOptions } from '../types'

/**
 * 使用 spawn 执行命令
 * @param command - 要执行的命令
 * @param dir - 执行目录
 * @returns Promise<void>
 */
export async function runCommandSpawn(
  command: string,
  dir: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Running command: "${command}" in directory: "${dir}"`)

    const [cmd, ...args] = command.split(' ')
    const localCmdPath = path.join(dir, 'node_modules', '.bin', cmd)

    // 如果本地依赖存在，则优先使用本地路径
    const resolvedCmd = existsSync(localCmdPath) ? localCmdPath : cmd

    const child = spawn(resolvedCmd, args, {
      cwd: dir,
      stdio: 'inherit',
      shell: true,
    })

    child.on('error', (err) => {
      console.error(`Error occurred while running command: ${command}`)
      reject(err)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        console.error(`Command exited with code ${code}`)
        reject(new Error(`Command failed with code ${code}`))
      }
    })
  })
}

/**
 * 使用 exec 执行命令
 * @param command - 要执行的命令
 * @param dir - 执行目录
 * @returns Promise<string> 命令输出
 */
export async function runCommand(
  command: string,
  dir: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: dir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`处理 ${dir} 时出错：${stderr}`)
        reject(error)
      } else {
        resolve(stdout.trim())
      }
    })
  })
}
