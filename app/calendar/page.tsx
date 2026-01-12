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
      <div className="page-shell">
        <div className="page-content">
          <Skeleton className="h-12 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <div className="panel p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="dark:text-indigo-100">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-content">
        <div className="panel p-6">
        {/* 헤더 */}
        <div className="page-header">
          <div>
            <h1 className="page-title text-indigo-900 dark:text-indigo-100">
              Calendar View
            </h1>
            <p className="page-subtitle">
              노트 생성 및 수정 활동을 날짜별로 시각화합니다.
            </p>
          </div>

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

        {/* 히트맵 */}
        {calendarData && (
          <CalendarHeatmap year={calendarData.year} activities={calendarData.activities} />
        )}
        </div>
      </div>
    </div>
  )
}
