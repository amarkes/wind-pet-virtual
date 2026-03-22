import { getPetState, updatePetState } from './store.service'
import type { PetState, TaskDifficulty } from '../../shared/types'

const XP_REWARDS: Record<string, number> = {
  task_easy: 10,
  task_medium: 20,
  task_hard: 35,
  task_epic: 50,
  task_created: 5,
  note_created: 5,
  pomodoro_completed: 15,
  daily_streak: 25,
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000]

function calcLevel(xp: number): number {
  return LEVEL_THRESHOLDS.filter((t) => xp >= t).length
}

export function addXP(action: string, difficulty?: TaskDifficulty): PetState {
  const key = difficulty ? `task_${difficulty}` : action
  const xpGained = XP_REWARDS[key] ?? 5

  const pet = getPetState()
  const newXP = pet.xp + xpGained
  const newLevel = calcLevel(newXP)
  const leveledUp = newLevel > pet.level

  return updatePetState({
    xp: newXP,
    level: newLevel,
    mood: leveledUp ? 'celebrating' : pet.mood,
    lastActive: new Date().toISOString(),
  })
}

export function updateStreak(): PetState {
  const pet = getPetState()
  const last = new Date(pet.lastActive)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

  let newStreak = pet.streak
  if (diffDays === 1) {
    newStreak = pet.streak + 1
  } else if (diffDays > 1) {
    newStreak = 1
  }

  return updatePetState({ streak: newStreak, lastActive: now.toISOString() })
}

export function setMood(mood: PetState['mood']): PetState {
  return updatePetState({ mood })
}

export function xpToNextLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = calcLevel(xp)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? Infinity

  if (nextThreshold === Infinity) {
    return { current: 0, needed: 0, percent: 100 }
  }

  const current = xp - currentThreshold
  const needed = nextThreshold - currentThreshold
  return { current, needed, percent: Math.round((current / needed) * 100) }
}
