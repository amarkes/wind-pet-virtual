// ── Task ──────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'epic'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  difficulty: TaskDifficulty
  tags: string[]
  estimatedMinutes?: number
  dueDate?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

// ── Note ──────────────────────────────────────────────────────────────────

export interface Note {
  id: string
  title?: string
  content: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export type CreateNoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>

// ── Pet ───────────────────────────────────────────────────────────────────

export type PetMood = 'idle' | 'happy' | 'excited' | 'tired' | 'sad' | 'focused' | 'celebrating'

export interface PetState {
  name: string
  mood: PetMood
  xp: number
  level: number
  streak: number
  lastActive: string
}

export interface PetStateWithProgress extends PetState {
  xpProgress: {
    current: number
    needed: number
    percent: number
  }
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface AppSettings {
  userName: string
  pomodoroMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
}

// ── Window API (exposed by preload) ───────────────────────────────────────

export interface WindowApi {
  tasks: {
    getAll: () => Promise<Task[]>
    create: (data: CreateTaskInput) => Promise<Task>
    update: (id: string, data: Partial<Task>) => Promise<Task | null>
    delete: (id: string) => Promise<boolean>
    complete: (id: string) => Promise<Task | null>
  }
  notes: {
    getAll: () => Promise<Note[]>
    create: (data: CreateNoteInput) => Promise<Note>
    update: (id: string, data: Partial<Note>) => Promise<Note | null>
    delete: (id: string) => Promise<boolean>
  }
  pet: {
    getState: () => Promise<PetStateWithProgress>
    addXP: (action: string) => Promise<PetState>
    updateStreak: () => Promise<PetState>
    setMood: (mood: PetMood) => Promise<PetState>
  }
  settings: {
    get: () => Promise<AppSettings>
    update: (data: Partial<AppSettings>) => Promise<AppSettings>
  }
}

declare global {
  interface Window {
    api: WindowApi
  }
}
