'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useShortcutStore } from '@/lib/stores/shortcutStore'
import { matchShortcut, type ShortcutId } from '@/lib/shortcuts'
import { useCreateNote } from '@/lib/hooks/useNotes'
import { useFolders } from '@/lib/hooks/useFolders'
import type { Folder } from '@/lib/contracts/entities'

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return true
  return Boolean(target.closest('[contenteditable="true"]'))
}

export function ShortcutManager() {
  const router = useRouter()
  const { shortcuts } = useShortcutStore()
  const createNote = useCreateNote()
  const { data } = useFolders()
  const folders = (data ?? []) as Folder[]

  const defaultFolderId = useMemo(() => {
    const defaultFolder = folders.find((folder) => folder.isDefault)
    return defaultFolder?.id ?? null
  }, [folders])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const editable = isEditableTarget(event.target)

      const actions: Array<{ id: ShortcutId; fn: () => void; allowInInput?: boolean }> = [
        {
          id: 'command_palette',
          allowInInput: true,
          fn: () => {
            document.dispatchEvent(new CustomEvent('command-palette:toggle'))
          },
        },
        {
          id: 'new_note',
          fn: async () => {
            try {
              const note = await createNote.mutateAsync({
                title: 'Untitled',
                body: '',
                folderId: defaultFolderId,
              })
              const nextParams = new URLSearchParams({ noteId: note.id })
              if (defaultFolderId) {
                nextParams.set('folderId', defaultFolderId)
              }
              router.push(`/notes?${nextParams.toString()}`)
            } catch (error) {
              console.error('Shortcut new note failed:', error)
            }
          },
        },
        {
          id: 'open_notes',
          fn: () => router.push('/notes'),
        },
        {
          id: 'open_daily',
          fn: () => router.push('/daily'),
        },
        {
          id: 'open_graph',
          fn: () => router.push('/graph'),
        },
        {
          id: 'open_settings',
          fn: () => router.push('/settings'),
        },
      ]

      for (const action of actions) {
        const shortcut = shortcuts[action.id]
        if (!shortcut) continue
        if (editable && !action.allowInInput) continue

        if (matchShortcut(event, shortcut)) {
          event.preventDefault()
          void action.fn()
          break
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcuts, router, createNote, defaultFolderId])

  return null
}
