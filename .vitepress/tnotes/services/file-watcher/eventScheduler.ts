/**
 * 事件调度：防抖 + 批量检测 + 队列
 */
import type { WatchEvent, BatchConfig, DebounceConfig } from './internal'

export class EventScheduler {
  /**
   * 待处理的文件变更事件队列
   *
   * - key: 文件路径
   * - val: 变更信息
   */
  private pendingEvents: Map<string, WatchEvent> = new Map()

  /**
   * 防抖定时器
   */
  private updateTimer: NodeJS.Timeout | null = null

  /**
   * 记录最近的变更时间戳
   */
  private recentChanges: number[] = []

  /**
   * 是否有更新任务正在执行中
   *
   * 标记是否正在更新，避免循环触发 - 类似一把更新行为锁
   */
  private isUpdating = false

  constructor(
    private batchCfg: BatchConfig,
    private debounceCfg: DebounceConfig,
    private onFlush: (events: WatchEvent[]) => void,
    private onPauseForBatch: () => void,
    private onResumeAfterBatch: () => void,
    private reinit: () => void
  ) {}

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
    this.updateTimer = setTimeout(() => this.flush(), this.debounceCfg.delayMs)
  }

  flush() {
    if (this.isUpdating) return
    if (this.pendingEvents.size === 0) return
    const events = Array.from(this.pendingEvents.values())
    this.pendingEvents.clear()
    this.isUpdating = true
    this.onFlush(events)
  }

  recordChangeAndDetectBatch(now: number = Date.now()): boolean {
    // 记录近期变更时间戳，用于检测“短时间高频”场景并切换到批量模式
    this.recentChanges.push(now)
    this.recentChanges = this.recentChanges.filter(
      (t) => now - t < this.batchCfg.windowMs
    )

    if (this.recentChanges.length < this.batchCfg.threshold) return false

    this.pendingEvents.clear()
    this.recentChanges = []
    this.isUpdating = true
    this.onPauseForBatch()

    setTimeout(() => {
      // 批量结束后重建状态并恢复监听
      this.isUpdating = false
      this.reinit()
      this.onResumeAfterBatch()
    }, this.batchCfg.windowMs + this.batchCfg.bufferMs)

    return true
  }
}
