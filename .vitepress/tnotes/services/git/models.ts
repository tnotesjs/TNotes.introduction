/**
 * .vitepress/tnotes/services/git-service/models.ts
 *
 * Git 服务相关的类型定义
 */

/**
 * Git 推送选项
 */
export interface PushOptions {
  message?: string
  branch?: string
  force?: boolean
}

/**
 * Git 拉取选项
 */
export interface PullOptions {
  branch?: string
  rebase?: boolean
}
