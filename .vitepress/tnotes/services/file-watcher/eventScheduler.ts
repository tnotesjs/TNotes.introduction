/**
 * .vitepress/tnotes/services/file-watcher/eventScheduler.ts
 *
 * 事件调度：防抖 + 批量检测 + 队列
 */
import type { WatchEvent } from './internal'

/**
 * 批量更新检测窗口（毫秒）
 *
 * - 如果在 BATCH_UPDATE_WINDOW_MS 时间内检测到超过 BATCH_UPDATE_THRESHOLD 个文件变更，则判定为是批量更新
 * - 暂定是 1s 内 3 个文件变更的阈值，正常编写笔记的情况下，1s 内不会超过 3 个文件同时变更，通常不会误判
 * - 当批量更新的行为被检测到之后，会暂停监听服务（BATCH_UPDATE_WINDOW_MS + BATCH_UPDATE_BUFFER_MS）后再恢复
 */
const BATCH_UPDATE_WINDOW_MS = 1000

/**
 * 批量更新阈值（文件数）
 */
const BATCH_UPDATE_THRESHOLD = 3

/**
 * 批量更新安全缓冲（毫秒）
 */
const BATCH_UPDATE_BUFFER_MS = 2000

/**
 * 默认防抖延迟（毫秒）
 */
const DEFAULT_DEBOUNCE_MS = 1000

interface EventSchedulerConfig {
  /** 当事件队列需要刷新处理时的回调函数 */
  onFlush: (events: WatchEvent[]) => void
  /** 检测到批量更新时暂停监听服务的回调函数 */
  onPauseForBatch: () => void
  /** 批量更新结束后恢复监听服务的回调函数 */
  onResumeAfterBatch: () => void
  /** 重新初始化调度器的回调函数 */
  reinit: () => void
}

export class EventScheduler {
  /** 待处理的文件变更事件队列 */
  private pendingEvents: Map<string, WatchEvent> = new Map()

  /** 防抖定时器 */
  private updateTimer: NodeJS.Timeout | null = null

  /** 记录最近的变更时间戳 */
  private recentChanges: number[] = []

  /** 标记是否正在更新，避免循环触发 - 类似一把更新行为锁 */
  private isUpdating = false

  constructor(private config: EventSchedulerConfig) {}

  setUpdating(flag: boolean) {
    this.isUpdating = flag
  }

  getUpdating() {
    return this.isUpdating
  }

  enqueue(event: WatchEvent) {
    // 事件去重：同一路径的变更只保留一次，降低抖动
    if (this.pendingEvents.has(event.path)) return
    this.pendingEvents.set(event.path, event)
    if (this.updateTimer) clearTimeout(this.updateTimer)
    this.updateTimer = setTimeout(() => this.flush(), DEFAULT_DEBOUNCE_MS)
  }

  flush() {
    if (this.isUpdating) return
    if (this.pendingEvents.size === 0) return
    const events = Array.from(this.pendingEvents.values())
    this.pendingEvents.clear()
    this.isUpdating = true
    this.config.onFlush(events)
  }

  recordChangeAndDetectBatch(now: number = Date.now()): boolean {
    // 记录近期变更时间戳，用于检测“短时间高频”场景并切换到批量模式
    this.recentChanges.push(now)
    this.recentChanges = this.recentChanges.filter(
      (t) => now - t < BATCH_UPDATE_WINDOW_MS
    )

    if (this.recentChanges.length < BATCH_UPDATE_THRESHOLD) return false

    this.pendingEvents.clear()
    this.recentChanges = []
    this.isUpdating = true
    this.config.onPauseForBatch()

    setTimeout(() => {
      // 批量结束后重建状态并恢复监听
      this.isUpdating = false
      this.config.reinit()
      this.config.onResumeAfterBatch()
    }, BATCH_UPDATE_WINDOW_MS + BATCH_UPDATE_BUFFER_MS)

    return true
  }
}
