import { contextBridge, ipcRenderer } from 'electron'
import type { WindowApi, Achievement, PetStateWithProgress } from '../shared/types'

const api: Omit<WindowApi, 'platform'> = {
  tasks: {
    getAll:        ()                          => ipcRenderer.invoke('tasks:getAll'),
    create:        (data)                      => ipcRenderer.invoke('tasks:create', data),
    update:        (id, data)                  => ipcRenderer.invoke('tasks:update', id, data),
    delete:        (id)                        => ipcRenderer.invoke('tasks:delete', id),
    complete:      (id)                        => ipcRenderer.invoke('tasks:complete', id),
    cancel:        (id)                        => ipcRenderer.invoke('tasks:cancel', id),
    addSubtask:    (taskId, title)             => ipcRenderer.invoke('tasks:addSubtask', taskId, title),
    toggleSubtask: (taskId, subtaskId)         => ipcRenderer.invoke('tasks:toggleSubtask', taskId, subtaskId),
    removeSubtask: (taskId, subtaskId)         => ipcRenderer.invoke('tasks:removeSubtask', taskId, subtaskId),
  },
  notes: {
    getAll:  ()             => ipcRenderer.invoke('notes:getAll'),
    create:  (data)         => ipcRenderer.invoke('notes:create', data),
    update:  (id, data)     => ipcRenderer.invoke('notes:update', id, data),
    delete:  (id)           => ipcRenderer.invoke('notes:delete', id),
  },
  pet: {
    getState:      ()       => ipcRenderer.invoke('pet:getState'),
    addXP:         (action) => ipcRenderer.invoke('pet:addXP', action),
    updateStreak:  ()       => ipcRenderer.invoke('pet:updateStreak'),
    setMood:       (mood)   => ipcRenderer.invoke('pet:setMood', mood),
  },
  settings: {
    get:    ()      => ipcRenderer.invoke('settings:get'),
    update: (data)  => ipcRenderer.invoke('settings:update', data),
  },
  audit: {
    getAll: () => ipcRenderer.invoke('audit:getAll'),
  },
  tagColors: {
    get:  ()        => ipcRenderer.invoke('tagColors:get'),
    set:  (colors)  => ipcRenderer.invoke('tagColors:set', colors),
  },
  ai: {
    suggestTask:       (title)               => ipcRenderer.invoke('ai:suggestTask', title),
    breakIntoSubtasks: (title, description)  => ipcRenderer.invoke('ai:breakIntoSubtasks', title, description),
    analyzeCommits:    (repoPath, limit)     => ipcRenderer.invoke('ai:analyzeCommits', repoPath, limit),
    dailyReview:       ()                    => ipcRenderer.invoke('ai:dailyReview'),
    noteToTasks:       (content)             => ipcRenderer.invoke('ai:noteToTasks', content),
    summarizeNote:     (content)             => ipcRenderer.invoke('ai:summarizeNote', content),
  },
  focus: {
    getSummaries:       (days)  => ipcRenderer.invoke('focus:getSummaries', days),
    getCurrentSession:  ()      => ipcRenderer.invoke('focus:getCurrentSession'),
  },
  achievements: {
    getAll:  ()     => ipcRenderer.invoke('achievements:getAll'),
    unlock:  (id)   => ipcRenderer.invoke('achievements:unlock', id),
  },
  float: {
    show:       () => ipcRenderer.invoke('float:show'),
    hide:       () => ipcRenderer.invoke('float:hide'),
    toggle:     () => ipcRenderer.invoke('float:toggle'),
    focusMain:  () => ipcRenderer.invoke('float:focusMain'),
    exportPdf:  () => ipcRenderer.invoke('float:exportPdf'),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  },
  events: {
    onAchievementUnlocked: (cb: (a: Achievement) => void) => {
      const handler = (_: unknown, a: Achievement) => cb(a)
      ipcRenderer.on('achievement:unlocked', handler as Parameters<typeof ipcRenderer.on>[1])
      return () => ipcRenderer.removeListener('achievement:unlocked', handler as Parameters<typeof ipcRenderer.on>[1])
    },
    onPetStateUpdate: (cb: (s: PetStateWithProgress) => void) => {
      const handler = (_: unknown, s: PetStateWithProgress) => cb(s)
      ipcRenderer.on('pet:state-update', handler as Parameters<typeof ipcRenderer.on>[1])
      return () => ipcRenderer.removeListener('pet:state-update', handler as Parameters<typeof ipcRenderer.on>[1])
    },
    onDistractionAlert: (cb: (d: { awaySeconds: number }) => void) => {
      const handler = (_: unknown, d: { awaySeconds: number }) => cb(d)
      ipcRenderer.on('focus:distraction-alert', handler as Parameters<typeof ipcRenderer.on>[1])
      return () => ipcRenderer.removeListener('focus:distraction-alert', handler as Parameters<typeof ipcRenderer.on>[1])
    },
    onFocusLost: (cb: () => void) => {
      ipcRenderer.on('focus:lost', cb as Parameters<typeof ipcRenderer.on>[1])
      return () => ipcRenderer.removeListener('focus:lost', cb as Parameters<typeof ipcRenderer.on>[1])
    },
    onFocusRegained: (cb: () => void) => {
      ipcRenderer.on('focus:regained', cb as Parameters<typeof ipcRenderer.on>[1])
      return () => ipcRenderer.removeListener('focus:regained', cb as Parameters<typeof ipcRenderer.on>[1])
    },
  },
}

contextBridge.exposeInMainWorld('api', {
  ...api,
  platform: process.platform,
})
