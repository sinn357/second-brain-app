'use client'

import { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNotes, useDeleteNote } from '@/lib/hooks/useNotes'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SwipeableNoteItem } from './SwipeableNoteItem'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

interface NoteListProps {
  folderId?: string
  selectedId?: string
  onSelect?: (noteId: string) => void
  enableSwipe?: boolean
}

const ESTIMATED_ITEM_HEIGHT = 104

export function NoteList({ folderId, selectedId, onSelect, enableSwipe = false }: NoteListProps) {
  const { data: notes = [], isLoading, error } = useNotes(folderId)
  const deleteNote = useDeleteNote()
  const parentRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const virtualizer = useVirtualizer({
    count: notes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: 5,
  })

  const handleDelete = async (noteId: string) => {
    const confirmed = window.confirm('이 노트를 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      await deleteNote.mutateAsync(noteId)
      toast.success('노트가 삭제되었습니다')
    } catch (error) {
      console.error('Delete note error:', error)
      toast.error('노트 삭제에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded">
        Error: {error.message}
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="panel-soft text-center p-8 text-gray-600 dark:text-indigo-300">
        노트가 없습니다. Quick Add 버튼을 눌러 노트를 추가하세요.
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-260px)] overflow-auto pr-1"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const note = notes[virtualItem.index]
          const showSwipe = enableSwipe && isMobile

          return (
            <div
              key={note.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="pb-3"
            >
              {showSwipe ? (
                <SwipeableNoteItem
                  note={note}
                  isSelected={selectedId === note.id}
                  onSelect={onSelect}
                  onDelete={handleDelete}
                />
              ) : (
                <NoteItem
                  note={note}
                  isSelected={selectedId === note.id}
                  onSelect={onSelect}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface NoteItemProps {
  note: {
    id: string
    title: string
    body: string
    updatedAt: Date
    folder?: { name: string } | null
    tags?: { tag: { id: string; name: string; color?: string | null } }[]
  }
  isSelected: boolean
  onSelect?: (noteId: string) => void
}

function NoteItem({ note, isSelected, onSelect }: NoteItemProps) {
  const content = (
    <Card
      className={`panel hover-lift hover-glow p-3 cursor-pointer h-full ${
        isSelected ? 'border border-indigo-400/70 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1 text-indigo-900 dark:text-indigo-100">
            {note.title}
          </h3>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 line-clamp-2 mb-2">
            {note.body.slice(0, 150) || '내용 없음'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-indigo-500 dark:text-indigo-300">
            {note.folder && (
              <Badge variant="outline" className="text-[11px]">
                {note.folder.name}
              </Badge>
            )}
            {note.tags && note.tags.length > 0 && (
              <div className="flex gap-1">
                {note.tags.slice(0, 3).map((nt) => (
                  <Badge
                    key={nt.tag.id}
                    variant="secondary"
                    className="text-[11px]"
                    style={{
                      backgroundColor: nt.tag.color || undefined,
                    }}
                  >
                    {nt.tag.name}
                  </Badge>
                ))}
              </div>
            )}
            <span className="ml-auto">
              {formatDistanceToNow(new Date(note.updatedAt), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(note.id)}
        className="w-full text-left h-full"
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={`/notes?noteId=${note.id}`} className="block h-full">
      {content}
    </Link>
  )
}
