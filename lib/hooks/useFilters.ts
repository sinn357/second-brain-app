import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { FilterGroup } from '@/lib/filterEngine'

interface Note {
  id: string
  title: string
  body: string
  folderId: string | null
  createdAt: string
  updatedAt: string
  folder?: {
    id: string
    name: string
  }
  tags?: Array<{
    tag: {
      id: string
      name: string
    }
  }>
  properties?: Array<{
    id: string
    propertyId: string
    value: unknown
    property: {
      id: string
      name: string
      type: string
      options: string[] | null
    }
  }>
}

/**
 * 필터된 노트 조회
 */
export function useFilteredNotes(filters: FilterGroup | null) {
  return useQuery<Note[], Error>({
    queryKey: ['notes', 'filtered', filters],
    queryFn: async () => {
      if (!filters || filters.conditions.length === 0) {
        // 필터가 없으면 전체 노트 조회
        const response = await fetch('/api/notes')
        const data = await response.json()
        if (!data.success) throw new Error(data.error)
        return data.notes
      }

      // 필터가 있으면 필터 API 호출
      const response = await fetch('/api/notes/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.notes
    },
    enabled: true,
  })
}

/**
 * SavedView 타입
 */
export interface SavedView {
  id: string
  name: string
  description: string | null
  filters: FilterGroup
  createdAt: string
  updatedAt: string
}

/**
 * 저장된 뷰 목록 조회
 */
export function useSavedViews() {
  return useQuery<SavedView[], Error>({
    queryKey: ['savedViews'],
    queryFn: async () => {
      const response = await fetch('/api/saved-views')
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.savedViews
    },
  })
}

/**
 * 저장된 뷰 생성
 */
export function useCreateSavedView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; description?: string; filters: FilterGroup }) => {
      const response = await fetch('/api/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.savedView as SavedView
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedViews'] })
    },
  })
}

/**
 * 저장된 뷰 삭제
 */
export function useDeleteSavedView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/saved-views/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedViews'] })
    },
  })
}
