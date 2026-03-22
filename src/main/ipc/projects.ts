import { ipcMain } from 'electron'
import * as store from '../services/store.service'

export function registerProjectsIpc(): void {
  ipcMain.handle('projects:getAll', () => store.getProjects())

  ipcMain.handle('projects:create', (_e, data) => store.createProject(data))

  ipcMain.handle('projects:update', (_e, id, data) => store.updateProject(id, data))

  ipcMain.handle('projects:delete', (_e, id) => store.deleteProject(id))
}
