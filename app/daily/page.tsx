'use client'

import { useState, useEffect } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteEditorAdvanced } from '@/components/NoteEditorAdvanced'
import { useDailyNote, useUpdateDailyNote } from '@/lib/hooks/useDailyNote'
import { useParseLinks } from '@/lib/hooks/useNotes'
import { toast } from 'sonner'

export default function DailyPage() {
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const { data: dailyNote, isLoading, error } = useDailyNote(currentDate)
  const updateNote = useUpdateDailyNote(dailyNote?.id)
  const parseLinks = useParseLinks()

  // 에디터 내용 변경 시 자동 저장
  const handleContentUpdate = async (newContent: string) => {
    if (!dailyNote) return

    try {
      await updateNote.mutateAsync({ body: newContent })

      // 링크 파싱
      await parseLinks.mutateAsync({
        noteId: dailyNote.id,
        body: newContent,
      })
    } catch (error) {
      console.error('Failed to update daily note:', error)
      toast.error('노트 저장 실패')
    }
  }

  // 이전 날짜
  const goToPreviousDay = () => {
    const prevDay = format(subDays(new Date(currentDate), 1), 'yyyy-MM-dd')
    setCurrentDate(prevDay)
  }

  // 다음 날짜
  const goToNextDay = () => {
    const nextDay = format(addDays(new Date(currentDate), 1), 'yyyy-MM-dd')
    setCurrentDate(nextDay)
  }

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(format(new Date(), 'yyyy-MM-dd'))
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-content max-w-4xl">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
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

  return (
    <div className="page-shell">
      <div className="page-content max-w-4xl">
        {/* 날짜 네비게이션 */}
        <div className="panel p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousDay}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>

            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {currentDate}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                오늘
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDay}
              className="flex items-center gap-2"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 에디터 */}
        <div className="panel p-6">
          {dailyNote && (
            <NoteEditorAdvanced
              content={dailyNote.body}
              onUpdate={handleContentUpdate}
              placeholder={`${currentDate} 일일 노트를 작성하세요...`}
              currentNoteId={dailyNote.id}
            />
          )}
        </div>

        {/* 안내 */}
        <div className="mt-4 text-sm text-indigo-700 dark:text-indigo-300">
          <p>💡 Tip: [[노트제목]]으로 다른 노트와 연결하고, #태그로 분류하세요.</p>
        </div>
      </div>
    </div>
  )
}
