import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getDefaultShortcuts, type ShortcutId } from '@/lib/shortcuts'

type ShortcutState = {
  shortcuts: Record<ShortcutId, string>
  setShortcut: (id: ShortcutId, keys: string) => void
  resetShortcut: (id: ShortcutId) => void
  resetAll: () => void
}

const defaultShortcuts = getDefaultShortcuts()

export const useShortcutStore = create<ShortcutState>()(
  persist(
    (set, get) => ({
      shortcuts: defaultShortcuts,
      setShortcut: (id, keys) => {
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [id]: keys,
          },
        }))
      },
      resetShortcut: (id) => {
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [id]: defaultShortcuts[id],
          },
        }))
      },
      resetAll: () => {
        set({ shortcuts: defaultShortcuts })
      },
    }),
    {
      name: 'nexus-shortcuts',
    }
  )
)
