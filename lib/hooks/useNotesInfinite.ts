import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

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
}

interface NotesPage {
  notes: Note[]
  nextCursor: string | null
  hasMore: boolean
}

const PAGE_SIZE = 20

// 무한 스크롤 노트 목록 조회
export function useNotesInfinite(folderId?: string) {
  return useInfiniteQuery<NotesPage, Error>({
    queryKey: folderId ? ['notes', 'infinite', folderId] : ['notes', 'infinite'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (folderId) params.set('folderId', folderId)
      if (pageParam) params.set('cursor', pageParam as string)
      params.set('limit', String(PAGE_SIZE))

      const url = `/api/notes?${params.toString()}`
      const response = await fetch(url)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      return {
        notes: data.notes,
        nextCursor: data.nextCursor,
        hasMore: data.hasMore,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    refetchInterval: 30000, // 30초마다 자동 갱신 (무한 스크롤은 더 긴 간격)
    refetchOnWindowFocus: true,
  })
}

// 무한 스크롤 캐시 무효화 헬퍼
export function useInvalidateNotesInfinite() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['notes', 'infinite'] })
  }
}
