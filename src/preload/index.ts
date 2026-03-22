import { contextBridge, ipcRenderer } from 'electron'
import type { WindowApi } from '../shared/types'

const api: WindowApi = {
  tasks: {
    getAll: () => ipcRenderer.invoke('tasks:getAll'),
    create: (data) => ipcRenderer.invoke('tasks:create', data),
    update: (id, data) => ipcRenderer.invoke('tasks:update', id, data),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    complete: (id) => ipcRenderer.invoke('tasks:complete', id),
  },
  notes: {
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    create: (data) => ipcRenderer.invoke('notes:create', data),
    update: (id, data) => ipcRenderer.invoke('notes:update', id, data),
    delete: (id) => ipcRenderer.invoke('notes:delete', id),
  },
  pet: {
    getState: () => ipcRenderer.invoke('pet:getState'),
    addXP: (action) => ipcRenderer.invoke('pet:addXP', action),
    updateStreak: () => ipcRenderer.invoke('pet:updateStreak'),
    setMood: (mood) => ipcRenderer.invoke('pet:setMood', mood),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (data) => ipcRenderer.invoke('settings:update', data),
  },
}

contextBridge.exposeInMainWorld('api', api)
