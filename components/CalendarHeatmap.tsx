'use client'

import { useMemo } from 'react'

interface Activity {
  date: string
  total: number
}

interface CalendarHeatmapProps {
  year: number
  activities: Activity[]
}

export function CalendarHeatmap({ year, activities }: CalendarHeatmapProps) {
  // 활동 데이터를 Map으로 변환 (빠른 조회)
  const activityMap = useMemo(() => {
    const map = new Map<string, number>()
    activities.forEach((a) => map.set(a.date, a.total))
    return map
  }, [activities])

  // 연도의 모든 날짜 생성
  const dates = useMemo(() => {
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)
    const dates: Date[] = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }

    return dates
  }, [year])

  // 주차별로 그룹화 (일요일 시작)
  const weeks = useMemo(() => {
    const weeks: Date[][] = []
    let week: Date[] = []

    // 첫 주의 시작일 (일요일)
    const firstDay = dates[0]
    const startDay = firstDay.getDay() // 0 (일요일) ~ 6 (토요일)

    // 첫 주 앞부분을 빈 날짜로 채움
    for (let i = 0; i < startDay; i++) {
      week.push(new Date(0)) // Epoch (표시하지 않을 빈 날짜)
    }

    dates.forEach((date) => {
      week.push(date)
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
    })

    // 마지막 주 뒷부분 채움
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(new Date(0))
      }
      weeks.push(week)
    }

    return weeks
  }, [dates])

  // 활동 강도 → 색상
  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (count <= 2) return 'bg-indigo-200 dark:bg-indigo-800'
    if (count <= 5) return 'bg-indigo-400 dark:bg-indigo-600'
    if (count <= 10) return 'bg-indigo-600 dark:bg-indigo-500'
    return 'bg-indigo-800 dark:bg-indigo-400'
  }

  // 최대 활동 수
  const maxActivity = Math.max(...activities.map((a) => a.total), 0)

  return (
    <div className="space-y-4">
      {/* 통계 */}
      <div className="flex gap-6 text-sm">
        <div>
          <span className="font-semibold text-indigo-900 dark:text-indigo-100">Total:</span>{' '}
          <span className="text-indigo-700 dark:text-indigo-300">
            {activities.reduce((sum, a) => sum + a.total, 0)} activities
          </span>
        </div>
        <div>
          <span className="font-semibold text-indigo-900 dark:text-indigo-100">Max/Day:</span>{' '}
          <span className="text-indigo-700 dark:text-indigo-300">{maxActivity}</span>
        </div>
        <div>
          <span className="font-semibold text-indigo-900 dark:text-indigo-100">Active Days:</span>{' '}
          <span className="text-indigo-700 dark:text-indigo-300">{activities.length}</span>
        </div>
      </div>

      {/* 히트맵 */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 요일 레이블 */}
          <div className="flex gap-1 mb-2">
            <div className="w-8"></div>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <div key={day} className="text-xs text-gray-600 dark:text-gray-400 w-3" style={{ marginLeft: idx * 14 }}>
                {day}
              </div>
            ))}
          </div>

          {/* 월별 + 주차 그리드 */}
          <div className="flex gap-1">
            {/* 월 레이블 (세로) */}
            <div className="flex flex-col gap-1 pr-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                <div key={month} className="text-xs text-gray-600 dark:text-gray-400 h-3 leading-3">
                  {month}
                </div>
              ))}
            </div>

            {/* 주차 그리드 */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((date, dayIdx) => {
                    if (date.getTime() === 0) {
                      // 빈 날짜
                      return <div key={dayIdx} className="w-3 h-3" />
                    }

                    const dateStr = date.toISOString().split('T')[0]
                    const count = activityMap.get(dateStr) || 0
                    const color = getColor(count)

                    return (
                      <div
                        key={dayIdx}
                        className={`w-3 h-3 rounded-sm ${color} hover:ring-2 hover:ring-indigo-500 cursor-pointer transition-all`}
                        title={`${dateStr}: ${count} activities`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span>Less</span>
        <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm" />
        <div className="w-3 h-3 bg-indigo-200 dark:bg-indigo-800 rounded-sm" />
        <div className="w-3 h-3 bg-indigo-400 dark:bg-indigo-600 rounded-sm" />
        <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-500 rounded-sm" />
        <div className="w-3 h-3 bg-indigo-800 dark:bg-indigo-400 rounded-sm" />
        <span>More</span>
      </div>
    </div>
  )
}
