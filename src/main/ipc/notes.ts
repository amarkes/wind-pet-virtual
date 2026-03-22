import { ipcMain, BrowserWindow } from 'electron'
import * as store from '../services/store.service'
import { addXP } from '../services/pet.service'
import * as ach from '../services/achievements.service'
import type { Note } from '../../shared/types'

export function registerNotesIpc(): void {
  ipcMain.handle('notes:getAll', () => {
    return store.getNotes()
  })

  ipcMain.handle('notes:create', (_, data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const note = store.createNote(data)
    addXP('note_created')
    const unlocked = ach.checkAfterNoteCreate()
    unlocked.forEach((a) => BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('achievement:unlocked', a)))
    return note
  })

  ipcMain.handle('notes:update', (_, id: string, data: Partial<Note>) => {
    return store.updateNote(id, data)
  })

  ipcMain.handle('notes:delete', (_, id: string) => {
    return store.deleteNote(id)
  })
}
