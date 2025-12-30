import { useQuery } from '@tanstack/react-query'

interface CalendarActivity {
  date: string
  created: number
  updated: number
  total: number
}

interface CalendarData {
  year: number
  activities: CalendarActivity[]
}

// Calendar 데이터 조회
export function useCalendar(year?: number) {
  const currentYear = year || new Date().getFullYear()

  return useQuery<CalendarData, Error>({
    queryKey: ['calendar', currentYear],
    queryFn: async () => {
      const response = await fetch(`/api/calendar?year=${currentYear}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return {
        year: data.year,
        activities: data.activities,
      }
    },
  })
}
