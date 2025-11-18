import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NoteInput, NoteUpdateInput } from '@/lib/validations/note'

interface Note {
  id: string
  title: string
  body: string
  folderId: string | null
  createdAt: Date
  updatedAt: Date
  folder?: {
    id: string
    name: string
  } | null
  tags?: Array<{
    tag: {
      id: string
      name: string
      color: string | null
    }
  }>
  properties?: Array<{
    id: string
    value: any
    property: {
      id: string
      name: string
      type: string
      options: any
    }
  }>
}

// 노트 목록 조회
export function useNotes(folderId?: string) {
  return useQuery<Note[], Error>({
    queryKey: folderId ? ['notes', folderId] : ['notes'],
    queryFn: async () => {
      const url = folderId ? `/api/notes?folderId=${folderId}` : '/api/notes'
      const response = await fetch(url)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.notes
    },
  })
}

// 노트 상세 조회
export function useNote(id: string) {
  return useQuery<Note, Error>({
    queryKey: ['notes', id],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${id}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.note
    },
    enabled: !!id,
  })
}

// 노트 생성
export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NoteInput) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.note as Note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

// 노트 수정
export function useUpdateNote(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NoteUpdateInput) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.note as Note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes', id] })
    },
  })
}

// 노트 삭제
export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

// 백링크 조회
export function useBacklinks(noteId: string) {
  return useQuery<Note[], Error>({
    queryKey: ['backlinks', noteId],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${noteId}/backlinks`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.backlinks
    },
    enabled: !!noteId,
  })
}

// 링크 파싱
export function useParseLinks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, body }: { noteId: string; body: string }) => {
      const response = await fetch('/api/links/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, body }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.noteId] })
      queryClient.invalidateQueries({ queryKey: ['backlinks'] })
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}
