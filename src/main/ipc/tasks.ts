import { ipcMain } from 'electron'
import * as store from '../services/store.service'
import { addXP } from '../services/pet.service'
import type { Task } from '../../shared/types'

export function registerTasksIpc(): void {
  ipcMain.handle('tasks:getAll', () => {
    return store.getTasks()
  })

  ipcMain.handle('tasks:create', (_, data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task = store.createTask(data)
    addXP('task_created')
    return task
  })

  ipcMain.handle('tasks:update', (_, id: string, data: Partial<Task>) => {
    return store.updateTask(id, data)
  })

  ipcMain.handle('tasks:delete', (_, id: string) => {
    return store.deleteTask(id)
  })

  ipcMain.handle('tasks:complete', (_, id: string) => {
    const tasks = store.getTasks()
    const task = tasks.find((t) => t.id === id)
    if (!task) return null

    const completed = store.completeTask(id)
    addXP('task_completed', task.difficulty)
    return completed
  })
}
