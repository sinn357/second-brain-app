import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSessionId, getUserName } from '@/lib/session'

interface Presence {
  id: string
  sessionId: string
  userName: string
  lastSeenAt: string
}

// 특정 노트의 presence 목록 가져오기
export function usePresences(noteId: string) {
  return useQuery({
    queryKey: ['presences', noteId],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${noteId}/presence`)
      if (!response.ok) throw new Error('Failed to fetch presences')
      const data = await response.json()
      return data.presences as Presence[]
    },
    refetchInterval: 5000, // 5초마다 자동 갱신
    enabled: !!noteId,
  })
}

// Presence 업데이트
export function useUpdatePresence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId }: { noteId: string }) => {
      const sessionId = getSessionId()
      const userName = getUserName()

      const response = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, sessionId, userName }),
      })

      if (!response.ok) throw new Error('Failed to update presence')
      return response.json()
    },
    onSuccess: (_, { noteId }) => {
      // Presence 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['presences', noteId] })
    },
  })
}

// Presence 삭제 (페이지를 떠날 때)
export function useDeletePresence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId }: { noteId: string }) => {
      const sessionId = getSessionId()

      const response = await fetch(`/api/presence?noteId=${noteId}&sessionId=${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete presence')
      return response.json()
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['presences', noteId] })
    },
  })
}

// 자동 presence 업데이트 (커스텀 훅)
export function useAutoPresence(noteId: string | null) {
  const { mutate: updatePresence } = useUpdatePresence()
  const { mutate: deletePresence } = useDeletePresence()

  // 주기적으로 presence 업데이트 (10초마다)
  useEffect(() => {
    if (!noteId) return

    // 즉시 업데이트
    updatePresence({ noteId })

    // 10초마다 업데이트
    const interval = setInterval(() => {
      updatePresence({ noteId })
    }, 10000)

    // Cleanup: 페이지를 떠날 때 presence 삭제
    return () => {
      clearInterval(interval)
      deletePresence({ noteId })
    }
  }, [noteId, updatePresence, deletePresence])
}

// 내 세션 ID 제외한 다른 사용자만 필터링
export function useOtherPresences(noteId: string) {
  const { data: presences = [], ...query } = usePresences(noteId)
  const mySessionId = getSessionId()

  const others = presences.filter((p) => p.sessionId !== mySessionId)

  return { presences: others, ...query }
}
