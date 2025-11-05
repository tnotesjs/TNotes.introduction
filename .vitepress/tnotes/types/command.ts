/**
 * .vitepress/tnotes/types/command.ts
 *
 * 命令相关类型定义
 */

/**
 * 命令名称类型
 */
export type CommandName =
  | 'dev'
  | 'build'
  | 'preview'
  | 'update'
  | 'push'
  | 'pull'
  | 'sync'
  | 'create-note'
  | 'merge-notes'
  | 'split-notes'
  | 'sync-scripts'
  | 'fix-timestamps'
  | 'help'

/**
 * 命令参数接口
 */
export interface CommandArgs {
  _: string[]
  [key: string]: any
  dev?: boolean
  build?: boolean
  preview?: boolean
  update?: boolean
  push?: boolean
  pull?: boolean
  sync?: boolean
  'create-note'?: boolean
  'merge-notes'?: boolean
  'split-notes'?: boolean
  'sync-scripts'?: boolean
  'fix-timestamps'?: boolean
  help?: boolean
  all?: boolean
  force?: boolean
  quiet?: boolean
  'no-watch'?: boolean
}

/**
 * 命令接口
 */
export interface Command {
  name: CommandName
  description: string
  execute(): Promise<void>
}

/**
 * 类型守卫：检查是否为有效命令名称
 */
export function isValidCommand(cmd: string): cmd is CommandName {
  return [
    'dev',
    'build',
    'preview',
    'update',
    'push',
    'pull',
    'sync',
    'create-note',
    'merge-notes',
    'split-notes',
    'sync-scripts',
    'fix-timestamps',
    'help',
  ].includes(cmd)
}
