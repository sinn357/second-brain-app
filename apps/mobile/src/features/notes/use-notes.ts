import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Note } from '@nexus/contracts/entities'
import { createNote, deleteNote, fetchNote, fetchNotes, updateNote } from '@/src/api/client'

export function useNotes() {
  return useQuery<Note[], Error>({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  })
}

export function useNote(id: string) {
  return useQuery<Note, Error>({
    queryKey: ['notes', id],
    queryFn: () => fetchNote(id),
    enabled: Boolean(id),
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNote,
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.setQueryData(['notes', note.id], note)
    },
  })
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { title?: string; body?: string; folderId?: string | null; isPinned?: boolean }) =>
      updateNote(id, input),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.setQueryData(['notes', id], note)
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
