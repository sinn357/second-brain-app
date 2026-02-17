'use client'

import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Lock, Pin } from 'lucide-react'
import { useNotesInfinite } from '@/lib/hooks/useNotesInfinite'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface NoteGalleryProps {
  folderId?: string
  selectedId?: string
  onSelect?: (noteId: string) => void
  sortBy?: 'title' | 'updated' | 'opened' | 'created' | 'manual'
  order?: 'asc' | 'desc'
}

export function NoteGallery({
  folderId,
  selectedId,
  onSelect,
  sortBy = 'title',
  order = 'asc',
}: NoteGalleryProps) {
  const { data, isLoading, error } = useNotesInfinite(folderId, sortBy, order)

  const notes = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.notes)
  }, [data])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-2 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 p-4 text-sm text-red-600">
        Error: {error.message}
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="panel-soft p-8 text-center text-gray-600 dark:text-indigo-300">
        노트가 없습니다. Quick Add 버튼으로 첫 노트를 만들어보세요.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-2 sm:grid-cols-2 xl:grid-cols-3">
      {notes.map((note) => {
        const previewSource = note.body?.split('\n').find((line) => line.trim()) ?? ''
        const preview = note.isLocked
          ? '잠긴 노트입니다.'
          : previewSource.replace(/\s+/g, ' ').trim()

        return (
          <button
            key={note.id}
            type="button"
            onClick={() => onSelect?.(note.id)}
            className="text-left"
          >
            <Card
              className={`panel hover-lift hover-glow h-full p-4 ${
                selectedId === note.id ? 'border border-indigo-400/70 shadow-lg' : ''
              }`}
            >
              <div className="mb-3 flex items-start gap-2">
                {note.isPinned ? <Pin className="h-4 w-4 text-amber-500" /> : null}
                {note.isLocked ? <Lock className="h-4 w-4 text-indigo-500" /> : null}
                <h3 className="line-clamp-1 flex-1 font-semibold text-indigo-900 dark:text-indigo-100">
                  {note.title || '제목 없음'}
                </h3>
              </div>
              <p className="line-clamp-4 min-h-[4.5rem] text-sm text-indigo-700 dark:text-indigo-300">
                {preview || '내용 없음'}
              </p>
              <p className="mt-3 text-[11px] text-indigo-500 dark:text-indigo-300">
                {formatDistanceToNow(new Date(note.updatedAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </Card>
          </button>
        )
      })}
    </div>
  )
}
