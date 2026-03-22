import { ipcMain } from 'electron'
import * as store from '../services/store.service'

export function registerSettingsIpc(): void {
  ipcMain.handle('tagColors:get', () => store.getTagColors())
  ipcMain.handle('tagColors:set', (_, colors: Record<string, string>) => store.setTagColors(colors))
}
