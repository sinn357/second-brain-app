import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type EditorSettings = {
  vimMode: boolean
  setVimMode: (enabled: boolean) => void
  toggleVimMode: () => void
}

export const useEditorStore = create<EditorSettings>()(
  persist(
    (set) => ({
      vimMode: false,
      setVimMode: (enabled) => set({ vimMode: enabled }),
      toggleVimMode: () => set((state) => ({ vimMode: !state.vimMode })),
    }),
    {
      name: 'nexus-editor-settings',
    }
  )
)
