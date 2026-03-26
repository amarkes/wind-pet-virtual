import { create } from 'zustand'
import type { AISuggestion, AINoteTaskSuggestion, CommitAnalysis, DailyReview } from '../../../shared/types'

const COMMIT_STORAGE_KEY = 'lastCommitAnalysis'
const REVIEW_STORAGE_KEY = 'lastDailyReview'

function loadPersisted<T>(key: string): { result: T; analyzedAt: string } | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface AIStore {
  isLoading: boolean
  error: string | null

  lastSuggestion: AISuggestion | null
  lastCommitAnalysis: CommitAnalysis | null
  lastCommitAnalysisAt: string | null
  lastDailyReview: DailyReview | null
  lastDailyReviewAt: string | null

  suggestTask: (title: string, description?: string) => Promise<AISuggestion | null>
  breakIntoSubtasks: (title: string, description?: string) => Promise<string[]>
  analyzeCommits: (repoPath: string, limit?: number) => Promise<CommitAnalysis | null>
  dailyReview: () => Promise<DailyReview | null>
  noteToTasks: (content: string) => Promise<AINoteTaskSuggestion[]>
  summarizeNote: (content: string) => Promise<string>
  clearError: () => void
}

const _persistedCommit  = loadPersisted<CommitAnalysis>(COMMIT_STORAGE_KEY)
const _persistedReview  = loadPersisted<DailyReview>(REVIEW_STORAGE_KEY)

export const useAIStore = create<AIStore>((set) => ({
  isLoading: false,
  error: null,
  lastSuggestion: null,
  lastCommitAnalysis: _persistedCommit?.result ?? null,
  lastCommitAnalysisAt: _persistedCommit?.analyzedAt ?? null,
  lastDailyReview: _persistedReview?.result ?? null,
  lastDailyReviewAt: _persistedReview?.analyzedAt ?? null,

  suggestTask: async (title, description) => {
    set({ isLoading: true, error: null })
    try {
      const suggestion = await window.api.ai.suggestTask(title, description)
      set({ isLoading: false, lastSuggestion: suggestion })
      return suggestion
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message })
      return null
    }
  },

  breakIntoSubtasks: async (title, description) => {
    set({ isLoading: true, error: null })
    try {
      const subtasks = await window.api.ai.breakIntoSubtasks(title, description)
      set({ isLoading: false })
      return subtasks
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message })
      return []
    }
  },

  analyzeCommits: async (repoPath, limit) => {
    set({ isLoading: true, error: null })
    try {
      const analysis = await window.api.ai.analyzeCommits(repoPath, limit)
      const analyzedAt = new Date().toISOString()
      set({ isLoading: false, lastCommitAnalysis: analysis, lastCommitAnalysisAt: analyzedAt })
      try {
        localStorage.setItem(COMMIT_STORAGE_KEY, JSON.stringify({ result: analysis, analyzedAt }))
      } catch { /* ignore */ }
      return analysis
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message })
      return null
    }
  },

  dailyReview: async () => {
    set({ isLoading: true, error: null })
    try {
      const review = await window.api.ai.dailyReview()
      const analyzedAt = new Date().toISOString()
      set({ isLoading: false, lastDailyReview: review, lastDailyReviewAt: analyzedAt })
      try {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify({ result: review, analyzedAt }))
      } catch { /* ignore */ }
      return review
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message })
      return null
    }
  },

  noteToTasks: async (content) => {
    set({ isLoading: true, error: null })
    try {
      const tasks = await window.api.ai.noteToTasks(content)
      set({ isLoading: false })
      return tasks
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message })
      return []
    }
  },

  summarizeNote: async (content) => {
    set({ isLoading: true, error: null })
    try {
      const summary = await window.api.ai.summarizeNote(content)
      set({ isLoading: false })
      return summary
    } catch (e) {
      set({ isLoading: false, error: (e as Error).message })
      return ''
    }
  },

  clearError: () => set({ error: null }),
}))
