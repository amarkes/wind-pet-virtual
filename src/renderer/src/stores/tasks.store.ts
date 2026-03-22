import { create } from 'zustand'
import type { Task, CreateTaskInput, TaskStatus, TaskPriority } from '../../../shared/types'
import { usePetStore } from './pet.store'

export type TaskSort = 'created' | 'priority' | 'dueDate'
export type TaskDueDateFilter = 'overdue' | 'today' | 'week' | null
export const UNASSIGNED_PROJECT_FILTER = '__unassigned__'

interface TasksStore {
  tasks: Task[]
  filter: TaskStatus | 'all'
  search: string
  sort: TaskSort
  priorityFilter: TaskPriority[]
  dueDateFilter: TaskDueDateFilter
  projectFilter: string | null
  isLoading: boolean

  load: () => Promise<void>
  create: (data: CreateTaskInput) => Promise<Task>
  update: (id: string, data: Partial<Task>) => Promise<void>
  remove: (id: string) => Promise<void>
  complete: (id: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  addSubtask: (taskId: string, title: string) => Promise<void>
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>
  removeSubtask: (taskId: string, subtaskId: string) => Promise<void>
  setFilter: (filter: TaskStatus | 'all') => void
  setSearch: (search: string) => void
  setSort: (sort: TaskSort) => void
  setPriorityFilter: (priorities: TaskPriority[]) => void
  setDueDateFilter: (filter: TaskDueDateFilter) => void
  setProjectFilter: (projectId: string | null) => void

  getFiltered: () => Task[]
  getTodayCount: () => { total: number; completed: number }
}

const PRIORITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  filter: 'all',
  search: '',
  sort: 'created',
  priorityFilter: [],
  dueDateFilter: null,
  projectFilter: null,
  isLoading: false,

  load: async () => {
    set({ isLoading: true })
    const tasks = await window.api.tasks.getAll()
    set({ tasks, isLoading: false })
  },

  create: async (data) => {
    const task = await window.api.tasks.create(data)
    set((s) => ({ tasks: [task, ...s.tasks] }))

    const pet = usePetStore.getState()
    pet.triggerMoodTemporary('happy', 3000)
    pet.setMessage('Nova missão adicionada! 🎯')
    return task
  },

  update: async (id, data) => {
    const updated = await window.api.tasks.update(id, data)
    if (!updated) return
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
    }))
  },

  remove: async (id) => {
    await window.api.tasks.delete(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  complete: async (id) => {
    const completed = await window.api.tasks.complete(id)
    if (!completed) return

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? completed : t)),
    }))

    const pet = usePetStore.getState()
    const difficultyMoods: Record<string, 'happy' | 'excited'> = {
      easy: 'happy',
      medium: 'happy',
      hard: 'excited',
      epic: 'excited',
    }
    const mood = difficultyMoods[completed.difficulty] ?? 'happy'
    const duration = mood === 'excited' ? 5000 : 3000
    pet.triggerMoodTemporary(mood, duration)

    const messages: Record<string, string> = {
      easy: 'Feito! 👏',
      medium: 'Ótimo trabalho! 💪',
      hard: 'Tarefa difícil concluída! 🔥',
      epic: 'MISSÃO ÉPICA COMPLETA! 👑🎉',
    }
    pet.setMessage(messages[completed.difficulty] ?? 'Feito!')
  },

  cancel: async (id) => {
    const cancelled = await window.api.tasks.cancel(id)
    if (!cancelled) return
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? cancelled : t)),
    }))
    const pet = usePetStore.getState()
    pet.triggerMoodTemporary('sad', 2000)
    pet.setMessage('Missão cancelada... 😔')
  },

  addSubtask: async (taskId, title) => {
    const updated = await window.api.tasks.addSubtask(taskId, title)
    if (!updated) return
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)) }))
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const updated = await window.api.tasks.toggleSubtask(taskId, subtaskId)
    if (!updated) return
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)) }))
  },

  removeSubtask: async (taskId, subtaskId) => {
    const updated = await window.api.tasks.removeSubtask(taskId, subtaskId)
    if (!updated) return
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)) }))
  },

  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setSort: (sort) => set({ sort }),
  setPriorityFilter: (priorities) => set({ priorityFilter: priorities }),
  setDueDateFilter: (filter) => set({ dueDateFilter: filter }),
  setProjectFilter: (projectId) => set({ projectFilter: projectId }),

  getFiltered: () => {
    const { tasks, filter, search, sort, priorityFilter, dueDateFilter, projectFilter } = get()
    if (projectFilter === null) return []

    let result = projectFilter === UNASSIGNED_PROJECT_FILTER
      ? tasks.filter((t) => !t.projectId)
      : tasks.filter((t) => t.projectId === projectFilter)
    result = filter === 'all' ? result : result.filter((t) => t.status === filter)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }

    if (priorityFilter.length > 0) {
      result = result.filter((t) => priorityFilter.includes(t.priority))
    }

    if (dueDateFilter) {
      const now = new Date()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 8)
      result = result.filter((t) => {
        if (!t.dueDate) return false
        const hasTime = t.dueDate.includes('T')
        const due = new Date(hasTime ? t.dueDate : t.dueDate + 'T00:00:00')
        const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)
        if (dueDateFilter === 'overdue') return hasTime ? due < now : diff < 0
        if (dueDateFilter === 'today')   return diff === 0
        if (dueDateFilter === 'week')    return diff >= 0 && due < nextWeek
        return true
      })
    }

    result = [...result].sort((a, b) => {
      if (sort === 'priority') {
        return (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0)
      }
      if (sort === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  },

  getTodayCount: () => {
    const { tasks } = get()
    const today = new Date().toDateString()
    const todayTasks = tasks.filter(
      (t) => new Date(t.createdAt).toDateString() === today
    )
    return {
      total: todayTasks.length,
      completed: todayTasks.filter((t) => t.status === 'completed').length,
    }
  },
}))
