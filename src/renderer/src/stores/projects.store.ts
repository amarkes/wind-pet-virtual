import { create } from 'zustand'
import type { Project, CreateProjectInput } from '../../../shared/types'
import { useTasksStore } from './tasks.store'

interface ProjectsStore {
  projects: Project[]
  isLoading: boolean

  load: () => Promise<void>
  create: (data: CreateProjectInput) => Promise<Project>
  update: (id: string, data: Partial<Project>) => Promise<void>
  remove: (id: string) => Promise<void>

  getById: (id: string) => Project | undefined
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true })
    const projects = await window.api.projects.getAll()
    set({ projects, isLoading: false })
  },

  create: async (data) => {
    const project = await window.api.projects.create(data)
    set((s) => ({ projects: [...s.projects, project] }))
    return project
  },

  update: async (id, data) => {
    const updated = await window.api.projects.update(id, data)
    if (!updated) return
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? updated : p)) }))
  },

  remove: async (id) => {
    await window.api.projects.delete(id)
    const tasksStore = useTasksStore.getState()
    tasksStore.setProjectFilter(tasksStore.projectFilter === id ? null : tasksStore.projectFilter)
    useTasksStore.setState((s) => ({
      tasks: s.tasks.filter((t) => t.projectId !== id),
    }))
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
  },

  getById: (id) => get().projects.find((p) => p.id === id),
}))
