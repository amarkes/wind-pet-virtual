import Store from 'electron-store'
import { randomUUID } from 'crypto'
import type { Task, Note, PetState, AppSettings } from '../../shared/types'

interface StoreSchema {
  tasks: Task[]
  notes: Note[]
  pet: PetState
  settings: AppSettings
}

const store = new Store<StoreSchema>({
  defaults: {
    tasks: [],
    notes: [],
    pet: {
      name: 'Buddy',
      mood: 'idle',
      xp: 0,
      level: 1,
      streak: 0,
      lastActive: new Date().toISOString(),
    },
    settings: {
      userName: '',
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
    },
  },
})

// ── Tasks ──────────────────────────────────────────────────────────────────

export function getTasks(): Task[] {
  return store.get('tasks')
}

export function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  const task: Task = {
    ...data,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const tasks = store.get('tasks')
  store.set('tasks', [...tasks, task])
  return task
}

export function updateTask(id: string, data: Partial<Task>): Task | null {
  const tasks = store.get('tasks')
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) return null

  const updated = { ...tasks[index], ...data, updatedAt: new Date().toISOString() }
  tasks[index] = updated
  store.set('tasks', tasks)
  return updated
}

export function deleteTask(id: string): boolean {
  const tasks = store.get('tasks')
  const filtered = tasks.filter((t) => t.id !== id)
  if (filtered.length === tasks.length) return false
  store.set('tasks', filtered)
  return true
}

export function completeTask(id: string): Task | null {
  return updateTask(id, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  })
}

// ── Notes ──────────────────────────────────────────────────────────────────

export function getNotes(): Note[] {
  return store.get('notes')
}

export function createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
  const note: Note = {
    ...data,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const notes = store.get('notes')
  store.set('notes', [note, ...notes])
  return note
}

export function updateNote(id: string, data: Partial<Note>): Note | null {
  const notes = store.get('notes')
  const index = notes.findIndex((n) => n.id === id)
  if (index === -1) return null

  const updated = { ...notes[index], ...data, updatedAt: new Date().toISOString() }
  notes[index] = updated
  store.set('notes', notes)
  return updated
}

export function deleteNote(id: string): boolean {
  const notes = store.get('notes')
  const filtered = notes.filter((n) => n.id !== id)
  if (filtered.length === notes.length) return false
  store.set('notes', filtered)
  return true
}

// ── Pet ────────────────────────────────────────────────────────────────────

export function getPetState(): PetState {
  return store.get('pet')
}

export function updatePetState(data: Partial<PetState>): PetState {
  const pet = store.get('pet')
  const updated = { ...pet, ...data }
  store.set('pet', updated)
  return updated
}

// ── Settings ───────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  return store.get('settings')
}

export function updateSettings(data: Partial<AppSettings>): AppSettings {
  const settings = store.get('settings')
  const updated = { ...settings, ...data }
  store.set('settings', updated)
  return updated
}
