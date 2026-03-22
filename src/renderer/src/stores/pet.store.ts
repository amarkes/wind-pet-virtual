import { create } from 'zustand'
import type { PetMood, PetStateWithProgress } from '../../../shared/types'
import { useTasksStore } from './tasks.store'

interface PetStore {
  pet:             PetStateWithProgress | null
  message:         string
  isLoading:       boolean
  lastAiSpeakAt:   number   // ms timestamp — rate-limits AI calls

  load:                () => Promise<void>
  addXP:               (action: string) => Promise<void>
  setMood:             (mood: PetMood) => Promise<void>
  setMessage:          (msg: string) => void
  triggerMoodTemporary:(mood: PetMood, durationMs: number) => void
  refreshMessage:      () => Promise<void>
  updateWeight:        (score: number) => Promise<void>
}

const MOOD_MESSAGES: Record<PetMood, string[]> = {
  idle:        ['O que vamos fazer hoje?', 'Aqui do seu lado!', 'Pronto para ajudar! 🐾', 'Me chama quando precisar 👀', 'Tô de olho em você 🐾'],
  happy:       ['Ótimo trabalho! 👏', 'Você arrasou!', 'Continue assim! 💪', 'Que dia produtivo! ✨', 'Orgulho de você! 🥳'],
  excited:     ['UAAAU! Incrível! 🎉', 'Você é demais!!', 'Missão épica concluída! 🔥', 'Isso aí!! 🚀'],
  tired:       ['Ei... ainda estou aqui...', 'Saudades de você 🥺', 'Hora de trabalhar?', 'Acorda! Tenho saudades 😴'],
  sad:         ['Tem tarefas acumulando...', 'Vamos resolver isso juntos?', 'Não desanime! 💙', 'Eu acredito em você 🤍'],
  focused:     ['Concentração máxima!', 'Sem distrações agora!', 'Vai fundo! 🎯', 'Você consegue! 🧠'],
  celebrating: ['LEVEL UP! 🎉🎉🎉', 'Novo nível desbloqueado!', 'Você é lendário! 👑', 'WOW!! 🏆'],
  dancing:     ['Bora dançar! 💃', 'Olha o ritmo! 🎵', 'Não consigo parar! 🎶', 'Dança comigo! ✨', 'É isso aí!! 🕺'],
}

function randomMessage(mood: PetMood): string {
  const msgs = MOOD_MESSAGES[mood]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// Minimum ms between AI speak calls (90 seconds)
const AI_SPEAK_COOLDOWN = 90_000

export const usePetStore = create<PetStore>((set, get) => ({
  pet:           null,
  message:       'Olá! Pronto para ser produtivo? 🐾',
  isLoading:     false,
  lastAiSpeakAt: 0,

  load: async () => {
    set({ isLoading: true })
    const pet = await window.api.pet.getState()
    await window.api.pet.updateStreak()
    set({ pet, isLoading: false, message: randomMessage(pet.mood) })
    // Kick off AI message async — don't block load
    get().refreshMessage()
  },

  addXP: async (action: string) => {
    await window.api.pet.addXP(action)
    const updated = await window.api.pet.getState()
    set({ pet: updated })
  },

  setMood: async (mood: PetMood) => {
    await window.api.pet.setMood(mood)
    const updated = await window.api.pet.getState()
    // Show a random fallback immediately so UI doesn't lag
    set({ pet: updated, message: randomMessage(mood) })
    // Then try to replace with AI message
    get().refreshMessage()
  },

  setMessage: (msg: string) => set({ message: msg }),

  updateWeight: async (score: number) => {
    const updated = await window.api.pet.updateWeight(score)
    // Merge weight back into the existing pet state (weight isn't in xpProgress)
    set((state) => state.pet ? { pet: { ...state.pet, weight: updated.weight } } : {})
  },

  triggerMoodTemporary: (mood: PetMood, durationMs: number) => {
    const { setMood } = get()
    setMood(mood)
    setTimeout(() => setMood('idle'), durationMs)
  },

  refreshMessage: async () => {
    const { pet, lastAiSpeakAt } = get()
    if (!pet) return

    const now = Date.now()
    if (now - lastAiSpeakAt < AI_SPEAK_COOLDOWN) return

    set({ lastAiSpeakAt: now })

    // Gather real task context so the AI can comment meaningfully
    const tasks = useTasksStore.getState().tasks
    const todayStr = new Date().toDateString()
    const completedToday  = tasks.filter((t) =>
      t.status === 'completed' && t.completedAt &&
      new Date(t.completedAt).toDateString() === todayStr
    ).length
    const overdueCount    = tasks.filter((t) =>
      t.dueDate && t.status !== 'completed' && t.status !== 'cancelled' &&
      new Date(t.dueDate) < new Date()
    ).length
    const pendingCount    = tasks.filter((t) => t.status === 'pending').length
    const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length

    try {
      const msg = await window.api.ai.buddySpeak({
        mood:            pet.mood,
        name:            pet.name,
        level:           pet.level,
        streak:          pet.streak,
        hour:            new Date().getHours(),
        completedToday,
        overdueCount,
        pendingCount,
        inProgressCount,
      })
      if (msg && msg.trim()) set({ message: msg.trim() })
    } catch {
      // No API key or network error — already showing random message, nothing to do
    }
  },
}))
