'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteEditorAdvanced } from '@/components/NoteEditorAdvanced'
import { useDailyNote, useUpdateDailyNote } from '@/lib/hooks/useDailyNote'
import { useParseLinks } from '@/lib/hooks/useNotes'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { toast } from 'sonner'

const AUTO_SAVE_DELAY = 500 // ms

export default function DailyPage() {
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [content, setContent] = useState<string>('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const { data: dailyNote, isLoading, error } = useDailyNote(currentDate)
  const updateNote = useUpdateDailyNote(dailyNote?.id)
  const parseLinks = useParseLinks()

  const lastSavedRef = useRef<string | null>(null)
  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef<string | null>(null)

  // Debounce content
  const debouncedContent = useDebounce(content, AUTO_SAVE_DELAY)

  // dailyNote가 로드되면 content 초기화
  useEffect(() => {
    if (dailyNote) {
      setContent(dailyNote.body)
      lastSavedRef.current = dailyNote.body
      setSaveStatus('idle')
    }
  }, [dailyNote?.id])

  // 디바운스된 content로 자동 저장
  useEffect(() => {
    if (!dailyNote) return

    // 마지막 저장된 값과 같으면 저장하지 않음
    if (lastSavedRef.current === debouncedContent) {
      return
    }

    const runSave = async () => {
      if (saveInFlightRef.current) {
        pendingSaveRef.current = debouncedContent
        return
      }

      saveInFlightRef.current = true
      setSaveStatus('saving')

      try {
        await updateNote.mutateAsync({ body: debouncedContent })
        await parseLinks.mutateAsync({
          noteId: dailyNote.id,
          body: debouncedContent,
        })
        lastSavedRef.current = debouncedContent
        setSaveStatus('saved')
      } catch (err) {
        console.error('Failed to update daily note:', err)
        setSaveStatus('error')
        toast.error('노트 저장 실패')
      } finally {
        saveInFlightRef.current = false

        // 대기 중인 저장이 있으면 실행
        if (pendingSaveRef.current !== null) {
          const pending = pendingSaveRef.current
          pendingSaveRef.current = null
          if (lastSavedRef.current !== pending) {
            setTimeout(runSave, 0)
          }
        }
      }
    }

    runSave()
  }, [debouncedContent, dailyNote, updateNote, parseLinks])

  // 에디터 내용 변경 핸들러
  const handleContentUpdate = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

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
            <h1 className="text-2xl font-bold text-red-600 mb-4">오류</h1>
            <p className="dark:text-indigo-100">일일 노트를 불러오는데 실패했습니다: {error.message}</p>
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
            <>
              <div className="mb-2 text-xs text-indigo-500 dark:text-indigo-300">
                {saveStatus === 'saving' && '저장 중...'}
                {saveStatus === 'saved' && '✓ 모든 변경사항 저장됨'}
                {saveStatus === 'error' && '⚠ 저장 실패'}
              </div>
              <NoteEditorAdvanced
                content={content}
                onUpdate={handleContentUpdate}
                placeholder={`${currentDate} 일일 노트를 작성하세요...`}
                currentNoteId={dailyNote.id}
                currentFolderId={dailyNote.folderId ?? null}
              />
            </>
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
