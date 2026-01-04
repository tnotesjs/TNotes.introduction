/**
 * .vitepress/tnotes/types/command.ts
 *
 * 命令相关类型定义
 */

/**
 * TNotes 内置命令名称常量
 */
export const COMMAND_NAMES = {
  BUILD: 'build',
  CREATE_NOTES: 'create-notes',
  DEV: 'dev',
  FIX_TIMESTAMPS: 'fix-timestamps',
  HELP: 'help',
  PREVIEW: 'preview',
  PULL: 'pull',
  PUSH: 'push',
  RENAME_NOTE: 'rename-note',
  SYNC_SCRIPTS: 'sync-scripts',
  SYNC: 'sync',
  UPDATE: 'update',
  UPDATE_COMPLETED_COUNT: 'update-completed-count',
  UPDATE_NOTE_CONFIG: 'update-note-config',
} as const

/**
 * TNotes 内置命令名称类型（从常量派生）
 */
export type CommandName = (typeof COMMAND_NAMES)[keyof typeof COMMAND_NAMES]

/**
 * 命令参数类型
 */
export interface CommandArgs {
  dev?: boolean
  build?: boolean
  preview?: boolean
  update?: boolean
  push?: boolean
  pull?: boolean
  sync?: boolean
  'create-notes'?: boolean
  'sync-scripts'?: boolean
  'fix-timestamps'?: boolean
  'update-completed-count'?: boolean
  'update-note-config'?: boolean
  'rename-note'?: boolean
  help?: boolean
  /**
   * 是否包含所有仓库
   */
  all?: boolean
  /**
   * 静默模式 (用于 update 命令)
   */
  quiet?: boolean
  /**
   * 强制执行 (用于 push 命令)
   */
  force?: boolean
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
 * 检查是否为有效命令
 */
export function isValidCommand(command: string): command is CommandName {
  return Object.values(COMMAND_NAMES).includes(command as CommandName)
}
