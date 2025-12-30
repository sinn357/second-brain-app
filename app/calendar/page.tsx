'use client'

import { useState } from 'react'
import { useCalendar } from '@/lib/hooks/useCalendar'
import { CalendarHeatmap } from '@/components/CalendarHeatmap'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data: calendarData, isLoading, error } = useCalendar(year)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <Skeleton className="h-12 mb-6" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <div className="bg-white dark:bg-indigo-900 p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="dark:text-indigo-100">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
      <div className="max-w-7xl mx-auto bg-white dark:bg-indigo-900 p-6 rounded-lg shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            Calendar View
          </h1>

          {/* 연도 선택 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setYear(year - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 min-w-16 text-center">
              {year}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setYear(year + 1)}
              disabled={year >= new Date().getFullYear()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-6">
          노트 생성 및 수정 활동을 날짜별로 시각화합니다. (GitHub 스타일 히트맵)
        </p>

        {/* 히트맵 */}
        {calendarData && (
          <CalendarHeatmap year={calendarData.year} activities={calendarData.activities} />
        )}
      </div>
    </div>
  )
}
