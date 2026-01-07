/**
 * .vitepress/tnotes/index.ts
 *
 * TNotes 内置命令入口模块
 */
import minimist from 'minimist'
import { getCommand } from './commands'
import {
  isValidCommand,
  COMMAND_NAMES,
  type CommandArgs,
} from './types/command'
import { handleError, createError } from './utils'
import type {
  UpdateCommand,
  UpdateCompletedCountCommand,
  PushCommand,
  PullCommand,
  SyncCommand,
} from './commands'

/**
 * TNotes 内置命令入口函数
 */
;(async (): Promise<void> => {
  try {
    // 解析命令行参数
    const args = minimist(process.argv.slice(2)) as CommandArgs

    // 查找第一个为 true 的参数作为命令名
    const commandName = Object.keys(args).find(
      (key) => key !== '_' && args[key] === true
    )

    // 如果没有找到命令，显示帮助信息
    if (!commandName) {
      const helpCommand = getCommand(COMMAND_NAMES.HELP)
      if (helpCommand) {
        await helpCommand.execute()
      }
      return
    }

    // 验证命令名
    if (!isValidCommand(commandName)) {
      throw createError.commandNotFound(commandName)
    }

    // 获取命令实例
    const command = getCommand(commandName)
    if (!command) {
      throw createError.commandNotFound(commandName)
    }

    // 处理命令选项
    if (commandName === COMMAND_NAMES.UPDATE) {
      const cmd = command as UpdateCommand
      if (args.quiet) cmd.setQuiet(true)
      if (args.all) cmd.setUpdateAll(true)
    } else if (commandName === COMMAND_NAMES.UPDATE_COMPLETED_COUNT) {
      const cmd = command as UpdateCompletedCountCommand
      if (args.all) cmd.setUpdateAll(true)
    } else if (commandName === COMMAND_NAMES.PUSH) {
      const cmd = command as PushCommand
      if (args.force) cmd.setOptions({ force: true })
      if (args.all) cmd.setPushAll(true)
    } else if (commandName === COMMAND_NAMES.PULL) {
      const cmd = command as PullCommand
      if (args.all) cmd.setPullAll(true)
    } else if (commandName === COMMAND_NAMES.SYNC) {
      const cmd = command as SyncCommand
      if (args.all) cmd.setSyncAll(true)
    }

    // 执行命令
    await command.execute()
  } catch (error) {
    handleError(error, true)
  }
})()
