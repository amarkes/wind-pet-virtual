import type { Achievement, AchievementId } from '../../shared/types'
import * as store from './store.service'

// ── Definitions ─────────────────────────────────────────────────────────────

export const ACHIEVEMENT_DEFS: Record<AchievementId, Omit<Achievement, 'id' | 'unlockedAt'>> = {
  first_task: {
    title: 'Primeira Missão',
    description: 'Complete sua primeira tarefa.',
    icon: '🎯',
  },
  tasks_10: {
    title: 'Em Ritmo',
    description: 'Complete 10 tarefas no total.',
    icon: '🔥',
  },
  tasks_50: {
    title: 'Máquina de Produtividade',
    description: 'Complete 50 tarefas no total.',
    icon: '⚡',
  },
  streak_7: {
    title: 'Semana Perfeita',
    description: 'Mantenha uma sequência de 7 dias.',
    icon: '📅',
  },
  epic_slayer: {
    title: 'Mata-Épico',
    description: 'Complete uma tarefa épica.',
    icon: '👑',
  },
  note_taker: {
    title: 'Anotador',
    description: 'Crie 10 notas.',
    icon: '📝',
  },
  commit_analyzer: {
    title: 'Inspetor de Código',
    description: 'Analise seus commits pela primeira vez.',
    icon: '🔍',
  },
  level_5: {
    title: 'Dedicado',
    description: 'Alcance o nível 5.',
    icon: '⭐',
  },
  subtask_master: {
    title: 'Mestre das Subtarefas',
    description: 'Quebre uma tarefa épica em subtarefas com IA.',
    icon: '🧩',
  },
  daily_reviewer: {
    title: 'Reflexivo',
    description: 'Gere seu primeiro daily review.',
    icon: '📊',
  },
  focus_hour: {
    title: 'Focado',
    description: 'Acumule 1 hora de foco no app em um dia.',
    icon: '🎯',
  },
}

// ── Unlock Helper ────────────────────────────────────────────────────────────

export function tryUnlock(id: AchievementId): Achievement | null {
  if (store.isAchievementUnlocked(id)) return null
  return store.unlockAchievement(id, ACHIEVEMENT_DEFS[id])
}

// ── Check Functions (called after relevant events) ───────────────────────────

export function checkAfterTaskComplete(difficulty: string): Achievement[] {
  const unlocked: Achievement[] = []

  const completed = store.getTasks().filter((t) => t.status === 'completed')
  const count = completed.length

  const r0 = tryUnlock('first_task')
  if (r0) unlocked.push(r0)

  if (count >= 10) {
    const r = tryUnlock('tasks_10')
    if (r) unlocked.push(r)
  }
  if (count >= 50) {
    const r = tryUnlock('tasks_50')
    if (r) unlocked.push(r)
  }
  if (difficulty === 'epic') {
    const r = tryUnlock('epic_slayer')
    if (r) unlocked.push(r)
  }

  return unlocked
}

export function checkAfterStreakUpdate(streak: number): Achievement[] {
  const unlocked: Achievement[] = []
  if (streak >= 7) {
    const r = tryUnlock('streak_7')
    if (r) unlocked.push(r)
  }
  return unlocked
}

export function checkAfterNoteCreate(): Achievement[] {
  const unlocked: Achievement[] = []
  const notes = store.getNotes()
  if (notes.length >= 10) {
    const r = tryUnlock('note_taker')
    if (r) unlocked.push(r)
  }
  return unlocked
}

export function checkAfterLevelUp(level: number): Achievement[] {
  const unlocked: Achievement[] = []
  if (level >= 5) {
    const r = tryUnlock('level_5')
    if (r) unlocked.push(r)
  }
  return unlocked
}

export function checkAfterSubtaskBreak(): Achievement[] {
  const r = tryUnlock('subtask_master')
  return r ? [r] : []
}

export function checkAfterCommitAnalysis(): Achievement[] {
  const r = tryUnlock('commit_analyzer')
  return r ? [r] : []
}

export function checkAfterDailyReview(): Achievement[] {
  const r = tryUnlock('daily_reviewer')
  return r ? [r] : []
}

export function checkAfterFocusHour(): Achievement[] {
  const r = tryUnlock('focus_hour')
  return r ? [r] : []
}

// ── Retroactive check (runs on app start / page open) ────────────────────────

export function checkRetroactive(): Achievement[] {
  const unlocked: Achievement[] = []

  const tasks = store.getTasks()
  const completed = tasks.filter((t) => t.status === 'completed')
  const count = completed.length

  if (count >= 1) {
    const r = tryUnlock('first_task')
    if (r) unlocked.push(r)
  }
  if (count >= 10) {
    const r = tryUnlock('tasks_10')
    if (r) unlocked.push(r)
  }
  if (count >= 50) {
    const r = tryUnlock('tasks_50')
    if (r) unlocked.push(r)
  }
  if (completed.some((t) => t.difficulty === 'epic')) {
    const r = tryUnlock('epic_slayer')
    if (r) unlocked.push(r)
  }

  const notes = store.getNotes()
  if (notes.length >= 10) {
    const r = tryUnlock('note_taker')
    if (r) unlocked.push(r)
  }

  const pet = store.getPetState()
  if (pet.level >= 5) {
    const r = tryUnlock('level_5')
    if (r) unlocked.push(r)
  }
  if (pet.streak >= 7) {
    const r = tryUnlock('streak_7')
    if (r) unlocked.push(r)
  }

  return unlocked
}

// ── Get all with definitions filled in ──────────────────────────────────────

export function getAllAchievements(): Achievement[] {
  const stored = store.getAchievements()
  const storedMap = new Map(stored.map((a) => [a.id, a]))

  return (Object.keys(ACHIEVEMENT_DEFS) as AchievementId[]).map((id) => {
    const def = ACHIEVEMENT_DEFS[id]
    const stored = storedMap.get(id)
    return {
      ...def,
      id,
      unlockedAt: stored?.unlockedAt,
    }
  })
}
