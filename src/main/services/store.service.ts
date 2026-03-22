import Store from 'electron-store'
import { randomUUID } from 'crypto'
import type { Task, Note, PetState, AppSettings, AuditLog, AuditAction, Subtask, FocusSession, DayFocusSummary, Achievement, AchievementId } from '../../shared/types'

interface StoreSchema {
  tasks: Task[]
  notes: Note[]
  pet: PetState
  settings: AppSettings
  auditLogs: AuditLog[]
  focusSessions: FocusSession[]
  achievements: Achievement[]
  tagColors: Record<string, string>
}

const store = new Store<StoreSchema>({
  defaults: {
    tasks: [],
    notes: [],
    auditLogs: [],
    focusSessions: [],
    achievements: [],
    tagColors: {},
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
      geminiApiKey: '',
      workingDirectory: '',
      commitAnalysisLimit: 1,
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

export function cancelTask(id: string): Task | null {
  return updateTask(id, { status: 'cancelled' })
}

export function addSubtask(taskId: string, title: string): Task | null {
  const tasks = getTasks()
  const task = tasks.find((t) => t.id === taskId)
  if (!task) return null
  const subtask: Subtask = { id: randomUUID(), title, completed: false }
  const subtasks = [...(task.subtasks ?? []), subtask]
  return updateTask(taskId, { subtasks })
}

export function toggleSubtask(taskId: string, subtaskId: string): Task | null {
  const tasks = getTasks()
  const task = tasks.find((t) => t.id === taskId)
  if (!task) return null
  const subtasks = (task.subtasks ?? []).map((s) =>
    s.id === subtaskId ? { ...s, completed: !s.completed } : s,
  )
  return updateTask(taskId, { subtasks })
}

export function removeSubtask(taskId: string, subtaskId: string): Task | null {
  const tasks = getTasks()
  const task = tasks.find((t) => t.id === taskId)
  if (!task) return null
  const subtasks = (task.subtasks ?? []).filter((s) => s.id !== subtaskId)
  return updateTask(taskId, { subtasks })
}

// ── Tag Colors ─────────────────────────────────────────────────────────────

export function getTagColors(): Record<string, string> {
  return store.get('tagColors')
}

export function setTagColors(colors: Record<string, string>): Record<string, string> {
  store.set('tagColors', colors)
  return colors
}

// ── Audit Logs ──────────────────────────────────────────────────────────────

export function getAuditLogs(): AuditLog[] {
  return store.get('auditLogs')
}

export function addAuditLog(taskId: string, taskTitle: string, action: AuditAction, details?: string): AuditLog {
  const entry: AuditLog = {
    id: randomUUID(),
    taskId,
    taskTitle,
    action,
    timestamp: new Date().toISOString(),
    details,
  }
  const logs = store.get('auditLogs')
  store.set('auditLogs', [entry, ...logs])
  return entry
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

// ── Focus Sessions ──────────────────────────────────────────────────────────

export function getFocusSessions(): FocusSession[] {
  return store.get('focusSessions')
}

export function startFocusSession(): FocusSession {
  const session: FocusSession = { id: randomUUID(), startedAt: new Date().toISOString() }
  const sessions = store.get('focusSessions')
  store.set('focusSessions', [session, ...sessions])
  return session
}

export function endFocusSession(id: string): FocusSession | null {
  const sessions = store.get('focusSessions')
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx === -1) return null
  const endedAt = new Date().toISOString()
  const durationSeconds = Math.round(
    (new Date(endedAt).getTime() - new Date(sessions[idx].startedAt).getTime()) / 1000,
  )
  sessions[idx] = { ...sessions[idx], endedAt, durationSeconds }
  store.set('focusSessions', sessions)
  return sessions[idx]
}

export function getFocusSummaries(days = 7): DayFocusSummary[] {
  const sessions = store.get('focusSessions').filter((s) => s.durationSeconds !== undefined)
  const result: Map<string, DayFocusSummary> = new Map()

  const today = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    result.set(key, { date: key, totalFocusSeconds: 0, totalAwaySeconds: 0, sessions: 0 })
  }

  for (const s of sessions) {
    const key = s.startedAt.split('T')[0]
    const entry = result.get(key)
    if (entry && s.durationSeconds !== undefined) {
      entry.totalFocusSeconds += s.durationSeconds
      entry.sessions += 1
    }
  }

  return Array.from(result.values()).sort((a, b) => a.date.localeCompare(b.date))
}

// ── Achievements ────────────────────────────────────────────────────────────

export function getAchievements(): Achievement[] {
  return store.get('achievements')
}

export function unlockAchievement(id: AchievementId, meta: Omit<Achievement, 'id' | 'unlockedAt'>): Achievement {
  const achievements = store.get('achievements')
  const existing = achievements.find((a) => a.id === id)
  if (existing?.unlockedAt) return existing  // already unlocked

  const achievement: Achievement = { ...meta, id, unlockedAt: new Date().toISOString() }
  if (existing) {
    const idx = achievements.findIndex((a) => a.id === id)
    achievements[idx] = achievement
    store.set('achievements', achievements)
  } else {
    store.set('achievements', [...achievements, achievement])
  }
  return achievement
}

export function isAchievementUnlocked(id: AchievementId): boolean {
  return store.get('achievements').some((a) => a.id === id && !!a.unlockedAt)
}
