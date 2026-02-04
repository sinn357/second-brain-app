import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface NoteVersionSummary {
  id: string
  version: number
  title: string
  createdAt: string
}

interface NoteVersion extends NoteVersionSummary {
  body: string
}

// 버전 목록 조회
export function useNoteVersions(noteId: string) {
  return useQuery<NoteVersionSummary[], Error>({
    queryKey: ['note-versions', noteId],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${noteId}/versions`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.versions
    },
    enabled: !!noteId,
  })
}

// 특정 버전 조회
export function useNoteVersion(noteId: string, versionId: string | null) {
  return useQuery<NoteVersion, Error>({
    queryKey: ['note-versions', noteId, versionId],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${noteId}/versions/${versionId}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.version
    },
    enabled: !!noteId && !!versionId,
  })
}

// 버전 복원
export function useRestoreVersion(noteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await fetch(
        `/api/notes/${noteId}/versions/${versionId}/restore`,
        { method: 'POST' }
      )
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes', 'infinite'] })
      queryClient.invalidateQueries({ queryKey: ['notes', noteId] })
      queryClient.invalidateQueries({ queryKey: ['note-versions', noteId] })
    },
  })
}
