import { create } from 'zustand'

interface TagColorsStore {
  colors: Record<string, string>
  load: () => Promise<void>
  setColor: (tag: string, color: string) => Promise<void>
  removeColor: (tag: string) => Promise<void>
}

export const useTagColorsStore = create<TagColorsStore>((set, get) => ({
  colors: {},

  load: async () => {
    const colors = await window.api.tagColors.get()
    set({ colors })
  },

  setColor: async (tag, color) => {
    const colors = { ...get().colors, [tag]: color }
    await window.api.tagColors.set(colors)
    set({ colors })
  },

  removeColor: async (tag) => {
    const colors = { ...get().colors }
    delete colors[tag]
    await window.api.tagColors.set(colors)
    set({ colors })
  },
}))
