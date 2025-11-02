/**
 * .vitepress/tnotes/types.ts
 *
 * TNotes 项目类型定义
 */

/**
 * .tnotes.json 配置文件类型
 */
export interface TNotesConfig {
  author: string
  ignore_dirs: string[]
  repoName: string
  keywords: string[]
  socialLinks: SocialLink[]
  menuItems: MenuItem[]
  sidebar_isNotesIDVisible: boolean
  sidebar_isCollapsed: boolean
  port?: number
  rootSidebarDir: string
  root_item: RootItem
}

/**
 * 社交链接类型
 */
export interface SocialLink {
  icon: string
  link: string
}

/**
 * 菜单项类型
 */
export interface MenuItem {
  text: string
  link: string
}

/**
 * 根侧边栏项配置
 */
export interface RootItem {
  text: string
  collapsed?: boolean
  items: SidebarItem[]
}

/**
 * 侧边栏项类型
 */
export interface SidebarItem {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

/**
 * 笔记的 .tnotes.json 配置类型
 */
export interface NoteConfig {
  id: string
  bilibili: string[]
  tnotes: string[]
  yuque: string[]
  done: boolean
  deprecated?: boolean
  enableDiscussions: boolean
  created_at: number
  updated_at: number
}

/**
 * 笔记目录信息
 */
export interface NoteInfo {
  id: string
  path: string
  dirName: string
  readmePath: string
  configPath: string
  config?: NoteConfig
}

/**
 * Git 时间戳信息
 */
export interface GitTimestamp {
  created: number
  updated: number
}

/**
 * 命令执行选项
 */
export interface CommandOptions {
  cwd?: string
  stdio?: 'inherit' | 'pipe' | 'ignore'
  shell?: boolean
}

/**
 * 笔记更新映射表类型
 */
export type NotesLastUpdatedMap = Record<string, number>
