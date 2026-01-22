'use client'

import { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNotes, useDeleteNote, useCreateNote } from '@/lib/hooks/useNotes'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SwipeableNoteItem } from './SwipeableNoteItem'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { useDraggable } from '@dnd-kit/core'
import { Pin, PinOff, Copy, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
  const createNote = useCreateNote()
  const queryClient = useQueryClient()
  const parentRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    note: any
  } | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    const handleScroll = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
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

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const resData = await response.json()
      if (!resData.success) throw new Error(resData.error)
      return resData.note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const handleDuplicate = async (note: any) => {
    try {
      const duplicated = await createNote.mutateAsync({
        title: `${note.title} 복사본`,
        body: note.body,
        folderId: note.folderId ?? null,
      })
      toast.success('노트를 복제했습니다')
      if (onSelect) {
        onSelect(duplicated.id)
      }
    } catch (duplicateError) {
      console.error('Duplicate note error:', duplicateError)
      toast.error('노트 복제에 실패했습니다')
    }
  }

  const handleTogglePin = async (note: any) => {
    try {
      await updateNoteMutation.mutateAsync({
        id: note.id,
        data: { isPinned: !note.isPinned },
      })
      toast.success(note.isPinned ? '고정이 해제되었습니다' : '메모가 고정되었습니다')
    } catch (pinError) {
      console.error('Pin note error:', pinError)
      toast.error('메모 고정에 실패했습니다')
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
    <>
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
                    onContextMenu={(event) => {
                      event.preventDefault()
                      setContextMenu({ x: event.clientX, y: event.clientY, note })
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {contextMenu && (
        <div
          className="fixed z-50 w-48 rounded-md border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-indigo-950 shadow-lg py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={() => {
              handleTogglePin(contextMenu.note)
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 flex items-center gap-2"
          >
            {contextMenu.note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {contextMenu.note.isPinned ? '메모 고정 해제' : '메모 고정'}
          </button>
          <button
            type="button"
            onClick={() => {
              handleDuplicate(contextMenu.note)
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            메모 복제
          </button>
          <button
            type="button"
            onClick={() => {
              handleDelete(contextMenu.note.id)
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            메모 삭제
          </button>
        </div>
      )}
    </>
  )
}

interface NoteItemProps {
  note: {
    id: string
    title: string
    body: string
    folderId?: string | null
    isPinned?: boolean
    updatedAt: Date
    folder?: { name: string } | null
    tags?: { tag: { id: string; name: string; color?: string | null } }[]
  }
  isSelected: boolean
  onSelect?: (noteId: string) => void
  onContextMenu?: (event: React.MouseEvent) => void
}

function NoteItem({ note, isSelected, onSelect, onContextMenu }: NoteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `note:${note.id}`,
    data: { type: 'note', id: note.id, folderId: note.folderId ?? null },
  })

  const content = (
    <Card
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`panel hover-lift hover-glow p-3 cursor-pointer h-full ${
        isSelected ? 'border border-indigo-400/70 shadow-lg' : ''
      }`}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {note.isPinned && (
              <Pin className="h-3.5 w-3.5 text-amber-500" />
            )}
            <h3 className="font-semibold text-base mb-1 text-indigo-900 dark:text-indigo-100">
            {note.title}
          </h3>
          </div>
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
        {...attributes}
        {...listeners}
        className="w-full text-left h-full"
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={`/notes?noteId=${note.id}`} className="block h-full" {...attributes} {...listeners}>
      {content}
    </Link>
  )
}
