import { ipcMain } from 'electron'
import * as store from '../services/store.service'
import { addXP, updateStreak, setMood, xpToNextLevel } from '../services/pet.service'
import type { PetState } from '../../shared/types'


export function registerPetIpc(): void {
  ipcMain.handle('pet:getState', () => {
    const pet = store.getPetState()
    const progress = xpToNextLevel(pet.xp)
    return { ...pet, xpProgress: progress }
  })

  ipcMain.handle('pet:addXP', (_, action: string) => {
    return addXP(action)
  })

  ipcMain.handle('pet:updateStreak', () => {
    return updateStreak()
  })

  ipcMain.handle('pet:setMood', (_, mood: PetState['mood']) => {
    return setMood(mood)
  })

  ipcMain.handle('pet:updateWeight', (_, score: number) => {
    return store.updatePetWeight(score)
  })

  ipcMain.handle('settings:get', () => {
    return store.getSettings()
  })

  ipcMain.handle('settings:update', (_, data) => {
    return store.updateSettings(data)
  })
}
