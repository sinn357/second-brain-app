import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { FolderInput, FolderUpdateInput } from '@/lib/validations/folder'

interface Folder {
  id: string
  name: string
  parentId: string | null
  position: number
  children?: Folder[]
  _count?: {
    notes: number
  }
}

// 폴더 트리 조회
export function useFolders() {
  return useQuery<Folder[], Error>({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await fetch('/api/folders')
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.folders
    },
  })
}

// 폴더 생성
export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FolderInput) => {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.folder as Folder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

// 폴더 수정
export function useUpdateFolder(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FolderUpdateInput) => {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.folder as Folder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

// 폴더 삭제
export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
