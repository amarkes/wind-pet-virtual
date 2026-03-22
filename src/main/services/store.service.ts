import { randomUUID } from 'crypto'
import { getDb } from './db'
import type {
  Task, Note, PetState, AppSettings, AuditLog, AuditAction,
  Subtask, FocusSession, DayFocusSummary, Achievement, AchievementId,
  Project, CreateProjectInput,
} from '../../shared/types'

// ── Row mappers ────────────────────────────────────────────────────────────

type Row = Record<string, unknown>

function toTask(r: Row): Task {
  return {
    id:               r.id as string,
    title:            r.title as string,
    description:      r.description as string | undefined,
    status:           r.status as Task['status'],
    priority:         r.priority as Task['priority'],
    difficulty:       r.difficulty as Task['difficulty'],
    tags:             JSON.parse(r.tags as string || '[]'),
    estimatedMinutes: r.estimated_minutes as number | undefined,
    dueDate:          r.due_date as string | undefined,
    projectId:        r.project_id as string | undefined,
    createdAt:        r.created_at as string,
    updatedAt:        r.updated_at as string,
    completedAt:      r.completed_at as string | undefined,
    subtasks:         JSON.parse(r.subtasks as string || '[]'),
  }
}

function toProject(r: Row): Project {
  return {
    id:          r.id as string,
    name:        r.name as string,
    description: r.description as string | undefined,
    color:       r.color as string,
    createdAt:   r.created_at as string,
    updatedAt:   r.updated_at as string,
  }
}

function toNote(r: Row): Note {
  return {
    id:        r.id as string,
    title:     r.title as string | undefined,
    content:   r.content as string,
    tags:      JSON.parse(r.tags as string || '[]'),
    pinned:    Boolean(r.pinned),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

function toPet(r: Row): PetState {
  return {
    name:       r.name as string,
    mood:       r.mood as PetState['mood'],
    xp:         r.xp as number,
    level:      r.level as number,
    streak:     r.streak as number,
    lastActive: r.last_active as string,
    weight:     r.weight as number,
  }
}

function toSettings(r: Row): AppSettings {
  return {
    userName:            r.user_name as string,
    geminiApiKey:        r.gemini_api_key as string,
    workingDirectory:    r.working_directory as string,
    commitAnalysisLimit: r.commit_analysis_limit as number,
  }
}

// ── Tasks ──────────────────────────────────────────────────────────────────

export function getTasks(): Task[] {
  return (getDb().prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as Row[]).map(toTask)
}

export function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  const db  = getDb()
  const id  = randomUUID()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO tasks (id,title,description,status,priority,difficulty,tags,estimated_minutes,due_date,project_id,created_at,updated_at,completed_at,subtasks)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.title, data.description ?? null, data.status, data.priority, data.difficulty,
    JSON.stringify(data.tags ?? []), data.estimatedMinutes ?? null, data.dueDate ?? null,
    data.projectId ?? null, now, now, data.completedAt ?? null, JSON.stringify(data.subtasks ?? []))
  return toTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Row)
}

export function updateTask(id: string, data: Partial<Task>): Task | null {
  const db  = getDb()
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Row | undefined
  if (!row) return null
  const t   = { ...toTask(row), ...data, updatedAt: new Date().toISOString() }
  db.prepare(`
    UPDATE tasks SET title=?,description=?,status=?,priority=?,difficulty=?,tags=?,
    estimated_minutes=?,due_date=?,project_id=?,updated_at=?,completed_at=?,subtasks=? WHERE id=?
  `).run(t.title, t.description ?? null, t.status, t.priority, t.difficulty,
    JSON.stringify(t.tags ?? []), t.estimatedMinutes ?? null, t.dueDate ?? null,
    t.projectId ?? null, t.updatedAt, t.completedAt ?? null, JSON.stringify(t.subtasks ?? []), id)
  return t
}

export function deleteTask(id: string): boolean {
  return getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0
}

export function completeTask(id: string): Task | null {
  return updateTask(id, { status: 'completed', completedAt: new Date().toISOString() })
}

export function cancelTask(id: string): Task | null {
  return updateTask(id, { status: 'cancelled' })
}

export function addSubtask(taskId: string, title: string): Task | null {
  const task = getTasks().find((t) => t.id === taskId)
  if (!task) return null
  const subtask: Subtask = { id: randomUUID(), title, completed: false }
  return updateTask(taskId, { subtasks: [...(task.subtasks ?? []), subtask] })
}

export function toggleSubtask(taskId: string, subtaskId: string): Task | null {
  const task = getTasks().find((t) => t.id === taskId)
  if (!task) return null
  return updateTask(taskId, {
    subtasks: (task.subtasks ?? []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    ),
  })
}

export function removeSubtask(taskId: string, subtaskId: string): Task | null {
  const task = getTasks().find((t) => t.id === taskId)
  if (!task) return null
  return updateTask(taskId, { subtasks: (task.subtasks ?? []).filter((s) => s.id !== subtaskId) })
}

// ── Tag Colors ─────────────────────────────────────────────────────────────

export function getTagColors(): Record<string, string> {
  const rows = getDb().prepare('SELECT tag, color FROM tag_colors').all() as { tag: string; color: string }[]
  return Object.fromEntries(rows.map((r) => [r.tag, r.color]))
}

export function setTagColors(colors: Record<string, string>): Record<string, string> {
  const db     = getDb()
  const upsert = db.prepare('INSERT OR REPLACE INTO tag_colors (tag,color) VALUES (?,?)')
  const del    = db.prepare('DELETE FROM tag_colors WHERE tag = ?')
  const existing = getTagColors()
  db.transaction(() => {
    for (const tag of Object.keys(existing)) {
      if (!(tag in colors)) del.run(tag)
    }
    for (const [tag, color] of Object.entries(colors)) {
      upsert.run(tag, color)
    }
  })()
  return colors
}

// ── Audit Logs ─────────────────────────────────────────────────────────────

export function getAuditLogs(): AuditLog[] {
  return (getDb().prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all() as Row[]).map((r) => ({
    id:        r.id as string,
    taskId:    r.task_id as string,
    taskTitle: r.task_title as string,
    action:    r.action as AuditAction,
    timestamp: r.timestamp as string,
    details:   r.details as string | undefined,
  }))
}

export function addAuditLog(taskId: string, taskTitle: string, action: AuditAction, details?: string): AuditLog {
  const entry: AuditLog = { id: randomUUID(), taskId, taskTitle, action, timestamp: new Date().toISOString(), details }
  getDb().prepare(
    'INSERT INTO audit_logs (id,task_id,task_title,action,timestamp,details) VALUES (?,?,?,?,?,?)'
  ).run(entry.id, entry.taskId, entry.taskTitle, entry.action, entry.timestamp, entry.details ?? null)
  return entry
}

// ── Notes ──────────────────────────────────────────────────────────────────

export function getNotes(): Note[] {
  return (getDb().prepare('SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC').all() as Row[]).map(toNote)
}

export function createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
  const db  = getDb()
  const id  = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO notes (id,title,content,tags,pinned,created_at,updated_at) VALUES (?,?,?,?,?,?,?)'
  ).run(id, data.title ?? null, data.content, JSON.stringify(data.tags ?? []), data.pinned ? 1 : 0, now, now)
  return toNote(db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Row)
}

export function updateNote(id: string, data: Partial<Note>): Note | null {
  const db  = getDb()
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Row | undefined
  if (!row) return null
  const n = { ...toNote(row), ...data, updatedAt: new Date().toISOString() }
  db.prepare(
    'UPDATE notes SET title=?,content=?,tags=?,pinned=?,updated_at=? WHERE id=?'
  ).run(n.title ?? null, n.content, JSON.stringify(n.tags), n.pinned ? 1 : 0, n.updatedAt, id)
  return n
}

export function deleteNote(id: string): boolean {
  return getDb().prepare('DELETE FROM notes WHERE id = ?').run(id).changes > 0
}

// ── Pet ────────────────────────────────────────────────────────────────────

export function getPetState(): PetState {
  return toPet(getDb().prepare('SELECT * FROM pet WHERE id = 1').get() as Row)
}

export function updatePetState(data: Partial<PetState>): PetState {
  const p = { ...getPetState(), ...data }
  getDb().prepare(
    'UPDATE pet SET name=?,mood=?,xp=?,level=?,streak=?,last_active=?,weight=? WHERE id=1'
  ).run(p.name, p.mood, p.xp, p.level, p.streak, p.lastActive, p.weight)
  return p
}

export function updatePetWeight(score: number): PetState {
  const current = getPetState()
  const delta   = score >= 70 ? -0.04 : +0.06
  const weight  = Math.min(1.4, Math.max(0.75, (current.weight ?? 1.0) + delta))
  return updatePetState({ weight })
}

// ── Settings ───────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  return toSettings(getDb().prepare('SELECT * FROM settings WHERE id = 1').get() as Row)
}

export function updateSettings(data: Partial<AppSettings>): AppSettings {
  const s = { ...getSettings(), ...data }
  getDb().prepare(
    'UPDATE settings SET user_name=?,gemini_api_key=?,working_directory=?,commit_analysis_limit=? WHERE id=1'
  ).run(s.userName, s.geminiApiKey ?? '', s.workingDirectory ?? '', s.commitAnalysisLimit)
  return s
}

// ── Focus Sessions ─────────────────────────────────────────────────────────

export function getFocusSessions(): FocusSession[] {
  return (getDb().prepare('SELECT * FROM focus_sessions ORDER BY started_at DESC').all() as Row[]).map((r) => ({
    id:              r.id as string,
    startedAt:       r.started_at as string,
    endedAt:         r.ended_at as string | undefined,
    durationSeconds: r.duration_seconds as number | undefined,
  }))
}

export function startFocusSession(): FocusSession {
  const session: FocusSession = { id: randomUUID(), startedAt: new Date().toISOString() }
  getDb().prepare('INSERT INTO focus_sessions (id,started_at) VALUES (?,?)').run(session.id, session.startedAt)
  return session
}

export function endFocusSession(id: string): FocusSession | null {
  const db  = getDb()
  const row = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(id) as Row | undefined
  if (!row) return null
  const endedAt         = new Date().toISOString()
  const durationSeconds = Math.round(
    (new Date(endedAt).getTime() - new Date(row.started_at as string).getTime()) / 1000
  )
  db.prepare('UPDATE focus_sessions SET ended_at=?,duration_seconds=? WHERE id=?').run(endedAt, durationSeconds, id)
  return { id, startedAt: row.started_at as string, endedAt, durationSeconds }
}

export function getFocusSummaries(days = 7): DayFocusSummary[] {
  const result = new Map<string, DayFocusSummary>()
  const today  = new Date()
  for (let i = 0; i < days; i++) {
    const d   = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    result.set(key, { date: key, totalFocusSeconds: 0, totalAwaySeconds: 0, sessions: 0 })
  }
  const rows = getDb().prepare('SELECT * FROM focus_sessions WHERE duration_seconds IS NOT NULL').all() as Row[]
  for (const r of rows) {
    const key   = (r.started_at as string).split('T')[0]
    const entry = result.get(key)
    if (entry) { entry.totalFocusSeconds += r.duration_seconds as number; entry.sessions++ }
  }
  return Array.from(result.values()).sort((a, b) => a.date.localeCompare(b.date))
}

// ── Achievements ────────────────────────────────────────────────────────────

export function getAchievements(): Achievement[] {
  return (getDb().prepare('SELECT * FROM achievements').all() as Row[]).map((r) => ({
    id:          r.id as AchievementId,
    title:       r.title as string,
    description: r.description as string,
    icon:        r.icon as string,
    unlockedAt:  r.unlocked_at as string | undefined,
  }))
}

export function unlockAchievement(id: AchievementId, meta: Omit<Achievement, 'id' | 'unlockedAt'>): Achievement {
  const db  = getDb()
  const row = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id) as Row | undefined
  if (row?.unlocked_at) {
    return { id, title: row.title as string, description: row.description as string, icon: row.icon as string, unlockedAt: row.unlocked_at as string }
  }
  const unlockedAt = new Date().toISOString()
  db.prepare('INSERT OR REPLACE INTO achievements (id,title,description,icon,unlocked_at) VALUES (?,?,?,?,?)')
    .run(id, meta.title, meta.description, meta.icon, unlockedAt)
  return { id, ...meta, unlockedAt }
}

export function isAchievementUnlocked(id: AchievementId): boolean {
  const row = getDb().prepare('SELECT unlocked_at FROM achievements WHERE id = ?').get(id) as { unlocked_at: string | null } | undefined
  return !!row?.unlocked_at
}

// ── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(): Project[] {
  return (getDb().prepare('SELECT * FROM projects ORDER BY created_at ASC').all() as Row[]).map(toProject)
}

export function createProject(data: CreateProjectInput): Project {
  const db  = getDb()
  const id  = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO projects (id,name,description,color,created_at,updated_at) VALUES (?,?,?,?,?,?)'
  ).run(id, data.name, data.description ?? null, data.color, now, now)
  return toProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Row)
}

export function updateProject(id: string, data: Partial<Project>): Project | null {
  const db  = getDb()
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Row | undefined
  if (!row) return null
  const p = { ...toProject(row), ...data, updatedAt: new Date().toISOString() }
  db.prepare(
    'UPDATE projects SET name=?,description=?,color=?,updated_at=? WHERE id=?'
  ).run(p.name, p.description ?? null, p.color, p.updatedAt, id)
  return p
}

export function deleteProject(id: string): boolean {
  return getDb().prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0
}
