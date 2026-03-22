import { ipcMain } from 'electron'
import * as achievements from '../services/achievements.service'
import * as store from '../services/store.service'
import type { AchievementId } from '../../shared/types'

export function registerAchievementsIpc(): void {
  ipcMain.handle('achievements:getAll', () => {
    achievements.checkRetroactive()
    return achievements.getAllAchievements()
  })

  ipcMain.handle('achievements:unlock', (_, id: AchievementId) => {
    const def = achievements.ACHIEVEMENT_DEFS[id]
    if (!def) throw new Error(`Unknown achievement: ${id}`)
    return store.unlockAchievement(id, def)
  })
}
