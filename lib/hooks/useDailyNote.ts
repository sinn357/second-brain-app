import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface DailyNoteResponse {
  success: boolean
  note: any
  error?: string
}

// 특정 날짜의 Daily Note 조회 (없으면 자동 생성)
export function useDailyNote(date?: string) {
  return useQuery({
    queryKey: ['daily-note', date],
    queryFn: async () => {
      const url = date
        ? `/api/daily-notes?date=${date}`
        : '/api/daily-notes'

      const res = await fetch(url)
      const data: DailyNoteResponse = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch daily note')
      }

      return data.note
    },
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // 10초마다 자동 refetch (실시간 동기화)
  })
}

// Daily Note 업데이트
export function useUpdateDailyNote(noteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { title?: string; body?: string }) => {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update note')
      }

      return result.note
    },
    onSuccess: () => {
      // Daily Note 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['daily-note'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
