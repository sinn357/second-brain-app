import { useQuery } from '@tanstack/react-query'

interface TimelineNote {
  id: string
  title: string
  preview: string
  createdAt: Date
  updatedAt: Date
  folder: {
    id: string
    name: string
  } | null
  tags: Array<{
    id: string
    name: string
    color: string | null
  }>
  isRecentlyModified: boolean
}

interface TimelineGroup {
  date: string
  notes: TimelineNote[]
}

interface TimelineData {
  timeline: TimelineGroup[]
  range: string
  total: number
}

// Timeline 데이터 조회
export function useTimeline(range: 'all' | 'week' | 'month' = 'all') {
  return useQuery<TimelineData, Error>({
    queryKey: ['timeline', range],
    queryFn: async () => {
      const response = await fetch(`/api/timeline?range=${range}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return {
        timeline: data.timeline,
        range: data.range,
        total: data.total,
      }
    },
  })
}
