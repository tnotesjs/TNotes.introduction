/**
 * .vitepress/tnotes/core/index.ts
 *
 * Core 层统一导出
 */

export { NoteManager } from './NoteManager'
export { ReadmeGenerator } from './ReadmeGenerator'
export { TocGenerator } from './TocGenerator'
export { SidebarGenerator } from './SidebarGenerator'
export { GitManager } from './GitManager'
export { ProcessManager } from './ProcessManager'

export type { SidebarConfig, SidebarGroup } from './SidebarGenerator'
