import { create } from 'zustand'
import type { AISuggestion, CommitAnalysis, DailyReview } from '../../../shared/types'

interface AIStore {
  isLoading: boolean
  error: string | null

  lastSuggestion: AISuggestion | null
  lastCommitAnalysis: CommitAnalysis | null
  lastDailyReview: DailyReview | null

  suggestTask: (title: string, description?: string) => Promise<AISuggestion | null>
  breakIntoSubtasks: (title: string, description?: string) => Promise<string[]>
  analyzeCommits: (repoPath: string, limit?: number) => Promise<CommitAnalysis | null>
  dailyReview: () => Promise<DailyReview | null>
  noteToTasks: (content: string) => Promise<string[]>
  summarizeNote: (content: string) => Promise<string>
  clearError: () => void
}

export const useAIStore = create<AIStore>((set) => ({
  isLoading: false,
  error: null,
  lastSuggestion: null,
  lastCommitAnalysis: null,
  lastDailyReview: null,

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
      set({ isLoading: false, lastCommitAnalysis: analysis })
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
      set({ isLoading: false, lastDailyReview: review })
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
