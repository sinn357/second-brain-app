'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { addWeeks, format, subWeeks } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteEditorAdvanced } from '@/components/NoteEditorAdvanced'
import { useParseLinks } from '@/lib/hooks/useNotes'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { toast } from 'sonner'
import type { Note } from '@prisma/client'

const AUTO_SAVE_DELAY = 500

interface WeeklyNoteResponse {
  success: boolean
  note: Note
  error?: string
}

export default function WeeklyPage() {
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [content, setContent] = useState<string>('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const parseLinks = useParseLinks()
  const queryClient = useQueryClient()

  const { data: weeklyNote, isLoading, error } = useQuery({
    queryKey: ['weekly-note', currentDate],
    queryFn: async () => {
      const res = await fetch(`/api/weekly-notes?date=${currentDate}`)
      const data: WeeklyNoteResponse = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch weekly note')
      }
      return data.note
    },
    refetchOnWindowFocus: true,
  })

  const updateNote = useMutation({
    mutationFn: async (data: { title?: string; body?: string }) => {
      if (!weeklyNote?.id) throw new Error('Note ID is required')
      const res = await fetch(`/api/notes/${weeklyNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || 'Failed to update note')
      return result.note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-note'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const lastSavedRef = useRef<string | null>(null)
  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef<string | null>(null)
  const debouncedContent = useDebounce(content, AUTO_SAVE_DELAY)

  useEffect(() => {
    if (weeklyNote) {
      setContent(weeklyNote.body)
      lastSavedRef.current = weeklyNote.body
      setSaveStatus('idle')
    }
  }, [weeklyNote?.id])

  useEffect(() => {
    if (!weeklyNote) return
    if (lastSavedRef.current === debouncedContent) return

    const runSave = async () => {
      if (saveInFlightRef.current) {
        pendingSaveRef.current = debouncedContent
        return
      }

      saveInFlightRef.current = true
      setSaveStatus('saving')

      try {
        await updateNote.mutateAsync({ body: debouncedContent })
        await parseLinks.mutateAsync({ noteId: weeklyNote.id, body: debouncedContent })
        lastSavedRef.current = debouncedContent
        setSaveStatus('saved')
      } catch (err) {
        console.error('Failed to update weekly note:', err)
        setSaveStatus('error')
        toast.error('주간 노트 저장 실패')
      } finally {
        saveInFlightRef.current = false
        if (pendingSaveRef.current !== null) {
          const pending = pendingSaveRef.current
          pendingSaveRef.current = null
          if (lastSavedRef.current !== pending) setTimeout(runSave, 0)
        }
      }
    }

    runSave()
  }, [debouncedContent, parseLinks, updateNote, weeklyNote])

  const goToPreviousWeek = () => {
    setCurrentDate(format(subWeeks(new Date(currentDate), 1), 'yyyy-MM-dd'))
  }

  const goToNextWeek = () => {
    setCurrentDate(format(addWeeks(new Date(currentDate), 1), 'yyyy-MM-dd'))
  }

  const goToThisWeek = () => {
    setCurrentDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const handleContentUpdate = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

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
            <p className="dark:text-indigo-100">주간 노트를 불러오는데 실패했습니다: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-content max-w-4xl">
        <div className="panel p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              이전 주
            </Button>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                Weekly Note
              </h1>
              <Button variant="ghost" size="sm" onClick={goToThisWeek} className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                이번 주
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToNextWeek} className="flex items-center gap-2">
              다음 주
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="panel p-6">
          {weeklyNote && (
            <>
              <div className="mb-2 text-xs text-indigo-500 dark:text-indigo-300">
                {saveStatus === 'saving' && '저장 중...'}
                {saveStatus === 'saved' && '✓ 모든 변경사항 저장됨'}
                {saveStatus === 'error' && '⚠ 저장 실패'}
              </div>
              <NoteEditorAdvanced
                content={content}
                onUpdate={handleContentUpdate}
                placeholder="이번 주 계획과 회고를 작성하세요..."
                currentNoteId={weeklyNote.id}
                currentFolderId={weeklyNote.folderId ?? null}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
