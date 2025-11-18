import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TagInput, TagUpdateInput } from '@/lib/validations/tag'

interface Tag {
  id: string
  name: string
  color: string | null
  _count?: {
    notes: number
  }
}

interface Note {
  id: string
  title: string
  body: string
  folderId: string | null
  folder?: {
    id: string
    name: string
  } | null
}

// 태그 목록 조회
export function useTags() {
  return useQuery<Tag[], Error>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags')
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.tags
    },
  })
}

// 태그별 노트 조회
export function useTagNotes(tagId: string) {
  return useQuery<Note[], Error>({
    queryKey: ['tags', tagId, 'notes'],
    queryFn: async () => {
      const response = await fetch(`/api/tags/${tagId}/notes`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.notes
    },
    enabled: !!tagId,
  })
}

// 태그 생성
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TagInput) => {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.tag as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

// 태그 수정
export function useUpdateTag(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TagUpdateInput) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.tag as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

// 태그 삭제
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
