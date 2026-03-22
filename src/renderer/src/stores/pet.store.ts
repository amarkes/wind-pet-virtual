import { create } from 'zustand'
import type { PetMood, PetStateWithProgress } from '../../../shared/types'

interface PetStore {
  pet: PetStateWithProgress | null
  message: string
  isLoading: boolean

  load: () => Promise<void>
  addXP: (action: string) => Promise<void>
  setMood: (mood: PetMood) => Promise<void>
  setMessage: (msg: string) => void
  triggerMoodTemporary: (mood: PetMood, durationMs: number) => void
}

const MOOD_MESSAGES: Record<PetMood, string[]> = {
  idle:        ['O que vamos fazer hoje?', 'Aqui do seu lado!', 'Pronto para ajudar! 🐾'],
  happy:       ['Ótimo trabalho! 👏', 'Você arrasou!', 'Continue assim! 💪'],
  excited:     ['UAAAU! Incrível! 🎉', 'Você é demais!!', 'Missão épica concluída! 🔥'],
  tired:       ['Ei... ainda estou aqui...', 'Saudades de você 🥺', 'Hora de trabalhar?'],
  sad:         ['Tem tarefas acumulando...', 'Vamos resolver isso juntos?', 'Não desanime! 💙'],
  focused:     ['Modo foco ativado! 🎯', 'Sem distrações agora!', 'Concentração máxima!'],
  celebrating: ['LEVEL UP! 🎉🎉🎉', 'Novo nível desbloqueado!', 'Você é lendário! 👑'],
}

function randomMessage(mood: PetMood): string {
  const msgs = MOOD_MESSAGES[mood]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

export const usePetStore = create<PetStore>((set, get) => ({
  pet: null,
  message: 'Olá! Pronto para ser produtivo? 🐾',
  isLoading: false,

  load: async () => {
    set({ isLoading: true })
    const pet = await window.api.pet.getState()
    await window.api.pet.updateStreak()
    set({ pet, isLoading: false, message: randomMessage(pet.mood) })
  },

  addXP: async (action: string) => {
    const pet = await window.api.pet.addXP(action)
    const updated = await window.api.pet.getState()
    set({ pet: updated })
  },

  setMood: async (mood: PetMood) => {
    await window.api.pet.setMood(mood)
    const updated = await window.api.pet.getState()
    set({ pet: updated, message: randomMessage(mood) })
  },

  setMessage: (msg: string) => set({ message: msg }),

  triggerMoodTemporary: (mood: PetMood, durationMs: number) => {
    const { setMood } = get()
    setMood(mood)
    setTimeout(() => setMood('idle'), durationMs)
  },
}))
