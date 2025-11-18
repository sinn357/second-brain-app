import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PropertyInput, PropertyUpdateInput, NotePropertyInput } from '@/lib/validations/property'

interface Property {
  id: string
  name: string
  type: string
  options: string[] | null
  _count?: {
    values: number
  }
}

interface NoteProperty {
  id: string
  noteId: string
  propertyId: string
  value: any
  property: Property
}

// 속성 목록 조회
export function useProperties() {
  return useQuery<Property[], Error>({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties')
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.properties
    },
  })
}

// 속성 생성
export function useCreateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PropertyInput) => {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.property as Property
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

// 속성 수정
export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PropertyUpdateInput) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.property as Property
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

// 속성 삭제
export function useDeleteProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

// 노트에 속성 값 설정
export function useSetNoteProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NotePropertyInput) => {
      const response = await fetch('/api/note-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.noteProperty as NoteProperty
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.noteId] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
