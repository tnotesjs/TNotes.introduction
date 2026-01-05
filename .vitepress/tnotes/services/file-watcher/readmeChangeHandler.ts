/**
 * README 变更处理
 */
import type { WatchEvent } from './models'

export class ReadmeChangeHandler {
  constructor(private noteService: any) {}

  async handle(events: WatchEvent[]): Promise<void> {
    if (events.length === 0) return
    const indexes = [...new Set(events.map((c) => c.noteIndex))]
    for (const noteIndex of indexes) {
      const noteInfo = this.noteService.getNoteByIndex(noteIndex)
      if (noteInfo) {
        await this.noteService.fixNoteTitle(noteInfo)
      }
    }
  }
}
