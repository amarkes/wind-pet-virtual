import { create } from 'zustand'
import type { PetMood, PetStateWithProgress } from '../../../shared/types'
import { UNASSIGNED_PROJECT_FILTER, useTasksStore } from './tasks.store'

interface PetStore {
  pet:             PetStateWithProgress | null
  message:         string
  isLoading:       boolean
  lastMessageRefreshAt: number

  load:                () => Promise<void>
  addXP:               (action: string) => Promise<void>
  setMood:             (mood: PetMood) => Promise<void>
  setMessage:          (msg: string) => void
  triggerMoodTemporary:(mood: PetMood, durationMs: number) => void
  refreshMessage:      (force?: boolean) => Promise<void>
  updateWeight:        (score: number) => Promise<void>
}

const MOOD_MESSAGES: Record<PetMood, string[]> = {
  idle: [
    'O que vamos atacar agora?',
    'Aqui do seu lado.',
    'Pronto para a próxima missão.',
    'Me chama quando precisar.',
    'Tô acompanhando tudo daqui.',
    'Bora destravar esse projeto?',
    'Posso vigiar as tarefas com você.',
    'Sem pressão. Só constância.',
  ],
  happy: [
    'Ótimo trabalho! 👏',
    'Você arrasou.',
    'Continue assim! 💪',
    'Que dia produtivo!',
    'Orgulho de você.',
    'Mais uma pra conta.',
    'Boa, essa andou bem.',
    'Mandou muito bem agora.',
  ],
  excited: [
    'UAAAU! Incrível! 🎉',
    'Você é demais.',
    'Missão épica concluída! 🔥',
    'Isso aí!! 🚀',
    'Esse ritmo tá absurdo.',
    'Que execução bonita.',
    'Agora sim, foi pesado.',
    'Foi porrada de produtividade.',
  ],
  tired: [
    'Ei... ainda estou aqui.',
    'Hora de retomar?',
    'Posso te ajudar a recomeçar.',
    'Vamos voltar no ritmo?',
    'Uma tarefa de cada vez.',
    'Sem drama. Só voltar pro fluxo.',
    'Quer reaquecer com algo pequeno?',
    'Respira e pega a próxima.',
  ],
  sad: [
    'Tem coisa acumulando.',
    'Vamos resolver isso juntos?',
    'Não desanime.',
    'Eu acredito em você.',
    'Dá pra recuperar ainda.',
    'Vamos limpar essa fila.',
    'Começa por uma menorzinha.',
    'Ainda dá pra virar esse jogo.',
  ],
  focused: [
    'Concentração máxima.',
    'Sem distrações agora.',
    'Vai fundo! 🎯',
    'Você consegue.',
    'Modo foco ativado.',
    'Só mais um bloco bem feito.',
    'Linha reta até terminar.',
    'Segue no embalo.',
  ],
  celebrating: [
    'LEVEL UP! 🎉🎉🎉',
    'Novo nível desbloqueado.',
    'Você é lendário.',
    'WOW!! 🏆',
    'Essa merece comemoração.',
    'Subiu de nível com estilo.',
    'Marco novo desbloqueado.',
    'Hoje teve evolução real.',
  ],
  dancing: [
    'Bora dançar! 💃',
    'Olha o ritmo!',
    'Não consigo parar.',
    'Dança comigo!',
    'É isso aí!!',
    'Passinho da produtividade.',
    'Coreografia aprovada.',
    'Dançando entre deploys.',
  ],
}

const CONTEXT_MESSAGES = {
  noProject: [
    'Escolha um projeto para eu acompanhar.',
    'Me aponta um projeto e eu monitoro tudo.',
    'Sem projeto ativo eu fico só no radar.',
    'Seleciona um projeto pra gente focar.',
  ],
  noTasks: [
    'Nada por aqui ainda. Bora criar a primeira?',
    'Sem tarefas registradas neste projeto.',
    'Projeto quietinho. Quer puxar uma missão?',
    'Tá limpo demais por aqui. Cadê o trabalho?',
  ],
  completedMany: [
    'Você já limpou bastante coisa hoje.',
    'Dia forte. Muita tarefa concluída.',
    'Esse projeto andou bonito hoje.',
    'Você já fez um estrago bom na fila.',
  ],
  completedSome: [
    'Boa, já teve entrega hoje.',
    'Tem progresso real rolando aqui.',
    'Você já marcou algumas vitórias hoje.',
    'O projeto já sentiu seu impacto hoje.',
  ],
  overdue: [
    'Tem atraso pedindo atenção.',
    'Vamos atacar as pendentes mais antigas?',
    'Tem tarefa vencida esperando resposta.',
    'Se limpar uma atrasada, o resto flui melhor.',
  ],
  inProgress: [
    'Tem coisa em andamento pedindo fechamento.',
    'Se fechar uma das em andamento já muda o clima.',
    'Projeto aquecido. Falta converter em concluída.',
    'Uma finalização boa resolve metade da pressão.',
  ],
  pendingMany: [
    'Fila cheia. Bora priorizar antes de puxar mais.',
    'Tem bastante coisa pendente por aqui.',
    'Talvez seja hora de cortar a fila por prioridade.',
    'Muita pendência. Escolhe a próxima e vai seco.',
  ],
  streak: [
    'Sua streak está bonita. Não deixa cair.',
    'Constância forte. Mantém esse embalo.',
    'Essa sequência já virou patrimônio.',
    'Seu ritmo está ficando sólido.',
  ],
  morning: [
    'Manhã boa pra resolver o mais difícil.',
    'Se abrir bem o dia, o resto encaixa.',
    'Começa forte e o projeto agradece.',
    'Bom momento para atacar a tarefa chata.',
  ],
  afternoon: [
    'Tarde boa pra consolidar entregas.',
    'Se encaixar uma conclusão agora, fecha bonito.',
    'Ótima hora pra tirar algo do caminho.',
    'A tarde ainda rende bastante.',
  ],
  night: [
    'Noite pede fechamento inteligente.',
    'Se der, encerra o dia com uma vitória curta.',
    'Hora de reduzir a fila sem se estourar.',
    'Fecha o dia limpando uma pendência.',
  ],
} as const

function pickRandom(messages: readonly string[]): string {
  const msgs = messages
  return msgs[Math.floor(Math.random() * msgs.length)]
}

function randomMessage(mood: PetMood): string {
  return pickRandom(MOOD_MESSAGES[mood])
}

function contextualMessage(ctx: {
  mood: PetMood
  streak: number
  hour: number
  completedToday: number
  overdueCount: number
  pendingCount: number
  inProgressCount: number
}): string {
  const candidates: string[] = [...MOOD_MESSAGES[ctx.mood]]

  if (ctx.completedToday >= 4) {
    candidates.push(...CONTEXT_MESSAGES.completedMany)
  } else if (ctx.completedToday > 0) {
    candidates.push(...CONTEXT_MESSAGES.completedSome)
  }

  if (ctx.overdueCount > 0) {
    candidates.push(...CONTEXT_MESSAGES.overdue)
  }

  if (ctx.inProgressCount > 0) {
    candidates.push(...CONTEXT_MESSAGES.inProgress)
  }

  if (ctx.pendingCount >= 5) {
    candidates.push(...CONTEXT_MESSAGES.pendingMany)
  }

  if (ctx.streak >= 3) {
    candidates.push(...CONTEXT_MESSAGES.streak)
  }

  if (ctx.hour < 12) {
    candidates.push(...CONTEXT_MESSAGES.morning)
  } else if (ctx.hour < 18) {
    candidates.push(...CONTEXT_MESSAGES.afternoon)
  } else {
    candidates.push(...CONTEXT_MESSAGES.night)
  }

  return pickRandom(candidates)
}

function getScopedTasks() {
  const { tasks, projectFilter } = useTasksStore.getState()

  if (projectFilter === null) return []
  if (projectFilter === UNASSIGNED_PROJECT_FILTER) {
    return tasks.filter((t) => !t.projectId)
  }

  return tasks.filter((t) => t.projectId === projectFilter)
}

const MESSAGE_REFRESH_COOLDOWN = 90_000

export const usePetStore = create<PetStore>((set, get) => ({
  pet:           null,
  message:       'Olá! Pronto para ser produtivo? 🐾',
  isLoading:     false,
  lastMessageRefreshAt: 0,

  load: async () => {
    set({ isLoading: true })
    const pet = await window.api.pet.getState()
    await window.api.pet.updateStreak()
    set({ pet, isLoading: false, message: randomMessage(pet.mood) })
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

  refreshMessage: async (force = false) => {
    const { pet, lastMessageRefreshAt } = get()
    if (!pet) return

    const now = Date.now()
    if (!force && now - lastMessageRefreshAt < MESSAGE_REFRESH_COOLDOWN) return

    const tasks = getScopedTasks()
    const { projectFilter } = useTasksStore.getState()
    if (projectFilter === null) {
      set({
        message: pickRandom(CONTEXT_MESSAGES.noProject),
        lastMessageRefreshAt: force ? lastMessageRefreshAt : now,
      })
      return
    }

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

    const nextMessage = tasks.length === 0
      ? pickRandom(CONTEXT_MESSAGES.noTasks)
      : contextualMessage({
          mood: pet.mood,
          streak: pet.streak,
          hour: new Date().getHours(),
          completedToday,
          overdueCount,
          pendingCount,
          inProgressCount,
        })

    set({
      message: nextMessage,
      lastMessageRefreshAt: now,
    })
  },
}))
