import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NoteInput, NoteUpdateInput } from '@/lib/validations/note'

interface Note {
  id: string
  title: string
  body: string
  folderId: string | null
  isPinned: boolean
  pinnedAt: Date | null
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
    propertyId: string
    value: any
    property: {
      id: string
      name: string
      type: string
      options: string[] | null
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
    refetchInterval: 10000, // 10초마다 자동 갱신 (실시간 협업)
    refetchOnWindowFocus: true, // 탭 포커스 시 갱신
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
    refetchInterval: 10000, // 10초마다 자동 갱신 (실시간 협업)
    refetchOnWindowFocus: true, // 탭 포커스 시 갱신
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
      queryClient.invalidateQueries({ queryKey: ['folders'] })
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
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['graph'] })
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
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['graph'] })
    },
  })
}

// 백링크 조회
export function useBacklinks(noteId: string) {
  return useQuery<any[], Error>({
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

// Unlinked Mentions 조회
export function useUnlinkedMentions(noteId: string) {
  return useQuery<any[], Error>({
    queryKey: ['unlinked-mentions', noteId],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${noteId}/unlinked-mentions`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.unlinkedMentions
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

// 태그 파싱
export function useParseTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, body }: { noteId: string; body: string }) => {
      const response = await fetch(`/api/notes/${noteId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.noteId] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
