'use client'

import { useState } from 'react'
import { useTimeline } from '@/lib/hooks/useTimeline'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function TimelinePage() {
  const [range, setRange] = useState<'all' | 'week' | 'month'>('all')
  const { data: timelineData, isLoading, error } = useTimeline(range)

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-content max-w-4xl">
          <Skeleton className="h-12 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-content max-w-4xl">
          <div className="panel p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="dark:text-indigo-100">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!timelineData) return null

  const { timeline, total } = timelineData

  return (
    <div className="page-shell">
      <div className="page-content max-w-4xl">
        {/* 헤더 */}
        <div className="page-header">
          <div>
            <h1 className="page-title text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
              <Clock className="h-7 w-7" />
              Timeline
            </h1>
            <p className="page-subtitle">시간순으로 노트를 확인하세요. (총 {total}개)</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={range === 'all' ? 'default' : 'outline'}
            onClick={() => setRange('all')}
            className={range === 'all' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
          >
            All Time
          </Button>
          <Button
            variant={range === 'week' ? 'default' : 'outline'}
            onClick={() => setRange('week')}
            className={range === 'week' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
          >
            This Week
          </Button>
          <Button
            variant={range === 'month' ? 'default' : 'outline'}
            onClick={() => setRange('month')}
            className={range === 'month' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
          >
            This Month
          </Button>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {timeline.length > 0 ? (
            timeline.map((group) => (
              <div key={group.date} className="relative">
                {/* 날짜 헤더 */}
                <div className="sticky top-4 glass rounded-lg px-3 py-2 mb-4 z-10">
                  <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                    {new Date(group.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </h2>
                </div>

                {/* 노트 리스트 */}
                <div className="space-y-4 pl-6 border-l-2 border-indigo-300 dark:border-indigo-700">
                  {group.notes.map((note) => (
                    <Link key={note.id} href={`/notes/${note.id}`}>
                      <div className="relative panel hover-lift hover-glow p-4 cursor-pointer">
                        {/* Timeline 점 */}
                        <div className="absolute -left-[29px] top-6 w-3 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full border-2 border-indigo-50 dark:border-indigo-950" />

                        {/* 노트 정보 */}
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                            {note.title}
                            {note.isRecentlyModified && (
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                            )}
                          </h3>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400">
                            {new Date(note.updatedAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* 미리보기 */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                          {note.preview}...
                        </p>

                        {/* 메타 정보 */}
                        <div className="flex items-center gap-3 text-xs">
                          {note.folder && (
                            <span className="text-indigo-600 dark:text-indigo-400">
                              📁 {note.folder.name}
                            </span>
                          )}
                          {note.tags.length > 0 && (
                            <div className="flex gap-1">
                              {note.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  className="text-xs"
                                  style={{ borderColor: tag.color || undefined }}
                                >
                                  #{tag.name}
                                </Badge>
                              ))}
                              {note.tags.length > 3 && (
                                <span className="text-gray-500">+{note.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400">이 기간에 노트가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
