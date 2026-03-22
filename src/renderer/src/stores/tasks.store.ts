import { create } from 'zustand'
import type { Task, CreateTaskInput, TaskStatus } from '../../../shared/types'
import { usePetStore } from './pet.store'

interface TasksStore {
  tasks: Task[]
  filter: TaskStatus | 'all'
  isLoading: boolean

  load: () => Promise<void>
  create: (data: CreateTaskInput) => Promise<Task>
  update: (id: string, data: Partial<Task>) => Promise<void>
  remove: (id: string) => Promise<void>
  complete: (id: string) => Promise<void>
  setFilter: (filter: TaskStatus | 'all') => void

  getFiltered: () => Task[]
  getTodayCount: () => { total: number; completed: number }
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  filter: 'all',
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

  setFilter: (filter) => set({ filter }),

  getFiltered: () => {
    const { tasks, filter } = get()
    if (filter === 'all') return tasks
    return tasks.filter((t) => t.status === filter)
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
