import { create } from 'zustand'
import type { Note, CreateNoteInput } from '../../../shared/types'
import { usePetStore } from './pet.store'

interface NotesStore {
  notes: Note[]
  selectedId: string | null
  search: string
  isLoading: boolean

  load: () => Promise<void>
  create: (data: CreateNoteInput) => Promise<Note>
  update: (id: string, data: Partial<Note>) => Promise<void>
  remove: (id: string) => Promise<void>
  select: (id: string | null) => void
  setSearch: (q: string) => void

  getFiltered: () => Note[]
  getSelected: () => Note | null
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  selectedId: null,
  search: '',
  isLoading: false,

  load: async () => {
    set({ isLoading: true })
    const notes = await window.api.notes.getAll()
    set({ notes, isLoading: false, selectedId: notes[0]?.id ?? null })
  },

  create: async (data) => {
    const note = await window.api.notes.create(data)
    set((s) => ({ notes: [note, ...s.notes], selectedId: note.id }))

    const pet = usePetStore.getState()
    pet.triggerMoodTemporary('happy', 2000)
    pet.setMessage('Boa ideia anotar! 📝')
    return note
  },

  update: async (id, data) => {
    const updated = await window.api.notes.update(id, data)
    if (!updated) return
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? updated : n)),
    }))
  },

  remove: async (id) => {
    await window.api.notes.delete(id)
    set((s) => {
      const notes = s.notes.filter((n) => n.id !== id)
      return { notes, selectedId: notes[0]?.id ?? null }
    })
  },

  select: (id) => set({ selectedId: id }),

  setSearch: (q) => set({ search: q }),

  getFiltered: () => {
    const { notes, search } = get()
    if (!search.trim()) return notes
    const q = search.toLowerCase()
    return notes.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    )
  },

  getSelected: () => {
    const { notes, selectedId } = get()
    return notes.find((n) => n.id === selectedId) ?? null
  },
}))
