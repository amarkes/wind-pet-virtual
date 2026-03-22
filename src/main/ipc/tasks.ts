import { ipcMain, BrowserWindow } from 'electron'
import * as store from '../services/store.service'
import { addXP } from '../services/pet.service'
import * as ach from '../services/achievements.service'
import type { Task } from '../../shared/types'

function broadcast(event: string, data: unknown): void {
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(event, data))
}

export function registerTasksIpc(): void {
  ipcMain.handle('tasks:getAll', () => {
    return store.getTasks()
  })

  ipcMain.handle('tasks:create', (_, data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task = store.createTask(data)
    addXP('task_created')
    store.addAuditLog(task.id, task.title, 'created')
    return task
  })

  ipcMain.handle('tasks:update', (_, id: string, data: Partial<Task>) => {
    const tasks = store.getTasks()
    const task = tasks.find((t) => t.id === id)
    const updated = store.updateTask(id, data)
    if (updated && task) {
      store.addAuditLog(id, task.title, 'updated')
    }
    return updated
  })

  ipcMain.handle('tasks:delete', (_, id: string) => {
    const tasks = store.getTasks()
    const task = tasks.find((t) => t.id === id)
    const result = store.deleteTask(id)
    if (result && task) {
      store.addAuditLog(id, task.title, 'deleted')
    }
    return result
  })

  ipcMain.handle('tasks:complete', (_, id: string) => {
    const tasks = store.getTasks()
    const task = tasks.find((t) => t.id === id)
    if (!task) return null

    const completed = store.completeTask(id)
    addXP('task_completed', task.difficulty)
    if (completed) {
      store.addAuditLog(id, task.title, 'completed')
      const unlocked = ach.checkAfterTaskComplete(task.difficulty)
      unlocked.forEach((a) => broadcast('achievement:unlocked', a))
    }
    return completed
  })

  ipcMain.handle('tasks:cancel', (_, id: string) => {
    const tasks = store.getTasks()
    const task = tasks.find((t) => t.id === id)
    if (!task) return null

    const cancelled = store.cancelTask(id)
    if (cancelled) {
      store.addAuditLog(id, task.title, 'cancelled')
    }
    return cancelled
  })

  ipcMain.handle('audit:getAll', () => {
    return store.getAuditLogs()
  })

  ipcMain.handle('tasks:addSubtask', (_, taskId: string, title: string) => {
    return store.addSubtask(taskId, title)
  })

  ipcMain.handle('tasks:toggleSubtask', (_, taskId: string, subtaskId: string) => {
    return store.toggleSubtask(taskId, subtaskId)
  })

  ipcMain.handle('tasks:removeSubtask', (_, taskId: string, subtaskId: string) => {
    return store.removeSubtask(taskId, subtaskId)
  })

  ipcMain.handle('tagColors:get', () => store.getTagColors())
  ipcMain.handle('tagColors:set', (_, colors: Record<string, string>) => store.setTagColors(colors))
}
