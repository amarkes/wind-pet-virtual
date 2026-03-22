import { ipcMain } from 'electron'
import * as store from '../services/store.service'
import * as focus from '../services/focus.service'

export function registerFocusIpc(): void {
  ipcMain.handle('focus:getSummaries', (_, days?: number) => {
    return store.getFocusSummaries(days)
  })

  ipcMain.handle('focus:getCurrentSession', () => {
    const id = focus.getActiveSessionId()
    if (!id) return null
    const sessions = store.getFocusSessions()
    const session = sessions.find((s) => s.id === id)
    if (!session) return null
    // Augment with live duration
    return {
      ...session,
      durationSeconds: focus.getCurrentSessionDurationSeconds(),
    }
  })
}
