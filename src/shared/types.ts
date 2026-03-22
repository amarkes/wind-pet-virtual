// ── Audit Log ─────────────────────────────────────────────────────────────

export type AuditAction = 'created' | 'updated' | 'completed' | 'cancelled' | 'deleted'

export interface AuditLog {
  id: string
  taskId: string
  taskTitle: string
  action: AuditAction
  timestamp: string
  details?: string
}

// ── Task ──────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'epic'

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

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
  subtasks?: Subtask[]
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

export type PetMood = 'idle' | 'happy' | 'excited' | 'tired' | 'sad' | 'focused' | 'celebrating' | 'dancing'

export interface PetState {
  name: string
  mood: PetMood
  xp: number
  level: number
  streak: number
  lastActive: string
  weight: number   // 0.75 (thin/good coder) → 1.0 (normal) → 1.4 (fat/bad coder)
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
  geminiApiKey?: string
  workingDirectory?: string
  commitAnalysisLimit: number
}

// ── AI ────────────────────────────────────────────────────────────────────

export interface AISuggestion {
  difficulty: TaskDifficulty
  estimatedMinutes: number
  reasoning: string
  improvedTitle?: string
  improvedDescription?: string
  suggestedTags?: string[]
}

export interface CommitReview {
  issues: string[]
  suggestions: string[]
  rating: 'good' | 'ok' | 'needs_work'
}

export interface CommitInfo {
  hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  review?: CommitReview
}

export interface CommitAnalysis {
  commits: CommitInfo[]
  feedback: string
  score: number
  tips: string[]
  petMood: PetMood
  petMessage: string
}

export interface DailyReview {
  tasksCompleted: number
  tasksCreated: number
  tasksOverdue: number
  score: number
  summary: string
  tips: string[]
  petMessage: string
  petMood: PetMood
}

// ── Focus Monitoring ──────────────────────────────────────────────────────

export interface FocusSession {
  id: string
  startedAt: string
  endedAt?: string
  durationSeconds?: number
}

export interface DayFocusSummary {
  date: string               // YYYY-MM-DD
  totalFocusSeconds: number  // time window was focused
  totalAwaySeconds: number   // time window was away
  sessions: number
}

// ── Achievements ──────────────────────────────────────────────────────────

export type AchievementId =
  | 'first_task'
  | 'tasks_10'
  | 'tasks_50'
  | 'streak_7'
  | 'epic_slayer'
  | 'note_taker'
  | 'commit_analyzer'
  | 'level_5'
  | 'subtask_master'
  | 'daily_reviewer'
  | 'focus_hour'

export interface Achievement {
  id: AchievementId
  title: string
  description: string
  icon: string
  unlockedAt?: string
}

// ── Window API (exposed by preload) ───────────────────────────────────────

export interface WindowApi {
  tasks: {
    getAll: () => Promise<Task[]>
    create: (data: CreateTaskInput) => Promise<Task>
    update: (id: string, data: Partial<Task>) => Promise<Task | null>
    delete: (id: string) => Promise<boolean>
    complete: (id: string) => Promise<Task | null>
    cancel: (id: string) => Promise<Task | null>
    addSubtask: (taskId: string, title: string) => Promise<Task | null>
    toggleSubtask: (taskId: string, subtaskId: string) => Promise<Task | null>
    removeSubtask: (taskId: string, subtaskId: string) => Promise<Task | null>
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
    updateWeight: (score: number) => Promise<PetState>
  }
  settings: {
    get: () => Promise<AppSettings>
    update: (data: Partial<AppSettings>) => Promise<AppSettings>
  }
  audit: {
    getAll: () => Promise<AuditLog[]>
  }
  tagColors: {
    get: () => Promise<Record<string, string>>
    set: (colors: Record<string, string>) => Promise<Record<string, string>>
  }
  ai: {
    suggestTask: (title: string, description?: string) => Promise<AISuggestion>
    breakIntoSubtasks: (taskTitle: string, taskDescription?: string) => Promise<string[]>
    analyzeCommits: (repoPath: string, limit?: number) => Promise<CommitAnalysis>
    dailyReview: () => Promise<DailyReview>
    noteToTasks: (content: string) => Promise<string[]>
    summarizeNote: (content: string) => Promise<string>
    buddySpeak: (ctx: { mood: string; name: string; level: number; streak: number; hour: number; completedToday: number; overdueCount: number; pendingCount: number; inProgressCount: number }) => Promise<string | null>
  }
  focus: {
    getSummaries: (days?: number) => Promise<DayFocusSummary[]>
    getCurrentSession: () => Promise<FocusSession | null>
  }
  achievements: {
    getAll: () => Promise<Achievement[]>
    unlock: (id: AchievementId) => Promise<Achievement>
  }
  float: {
    show: () => Promise<void>
    hide: () => Promise<void>
    toggle: () => Promise<void>
    focusMain: () => Promise<void>
    exportPdf: () => Promise<string>
  }
  dialog: {
    openDirectory: () => Promise<string | null>
  }
  platform: string
  events: {
    onAchievementUnlocked: (cb: (achievement: Achievement) => void) => () => void
    onPetStateUpdate: (cb: (state: PetStateWithProgress) => void) => () => void
    onDistractionAlert: (cb: (data: { awaySeconds: number }) => void) => () => void
    onFocusLost: (cb: () => void) => () => void
    onFocusRegained: (cb: () => void) => () => void
  }
}

declare global {
  interface Window {
    api: WindowApi
  }
}
