'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useDeleteNote, useCreateNote } from '@/lib/hooks/useNotes'
import { useNotesInfinite } from '@/lib/hooks/useNotesInfinite'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { SwipeableNoteItem } from './SwipeableNoteItem'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { useDraggable } from '@dnd-kit/core'
import { Pin, PinOff, Copy, Trash2, Loader2, Lock } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface NoteListProps {
  folderId?: string
  selectedId?: string
  onSelect?: (noteId: string) => void
  enableSwipe?: boolean
  sortBy?: 'title' | 'updated' | 'opened' | 'created' | 'manual'
  order?: 'asc' | 'desc'
}

interface NoteListItem {
  id: string
  title: string
  body: string
  folderId: string | null
  isLocked: boolean
  isPinned: boolean
  manualOrder: number
  updatedAt: string | Date
  tags?: Array<{
    tag: {
      id: string
      name: string
      color?: string | null
    }
  }>
  folder?: {
    id: string
    name: string
  } | null
}

const ESTIMATED_ITEM_HEIGHT = 86

export function NoteList({
  folderId,
  selectedId,
  onSelect,
  enableSwipe = false,
  sortBy = 'title',
  order = 'asc',
}: NoteListProps) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotesInfinite(folderId, sortBy, order)

  // 모든 페이지의 노트를 평탄화
  const notes = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.notes)
  }, [data])

  useEffect(() => {
    if (selectedId || !onSelect || notes.length === 0) return
    onSelect(notes[0].id)
  }, [notes, onSelect, selectedId])

  const deleteNote = useDeleteNote()
  const createNote = useCreateNote()
  const queryClient = useQueryClient()
  const parentRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    note: NoteListItem
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

  // 무한 스크롤: 하단 도달 시 다음 페이지 로드
  const handleScroll = useCallback(() => {
    const container = parentRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // 하단 200px 이내 도달 시 다음 페이지 로드
    if (distanceFromBottom < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const container = parentRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

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
      queryClient.invalidateQueries({ queryKey: ['notes', 'infinite'] })
    },
  })

  const handleMoveManual = async (
    noteId: string,
    direction: 'up' | 'down' | 'top' | 'bottom'
  ) => {
    if (sortBy !== 'manual') return
    const currentIndex = notes.findIndex((note) => note.id === noteId)
    if (currentIndex === -1) return

    const sortedNotes = notes
    const current = sortedNotes[currentIndex]
    const previous = sortedNotes[currentIndex - 1]
    const next = sortedNotes[currentIndex + 1]
    const currentOrder = current.manualOrder ?? 0
    const directionFactor = order === 'asc' ? 1 : -1

    let nextOrder = currentOrder
    if (direction === 'up' && previous) {
      const targetOrder = previous.manualOrder ?? currentOrder
      nextOrder = targetOrder - 1 * directionFactor
    } else if (direction === 'down' && next) {
      const targetOrder = next.manualOrder ?? currentOrder
      nextOrder = targetOrder + 1 * directionFactor
    } else if (direction === 'top') {
      const minOrder = Math.min(...sortedNotes.map((note) => note.manualOrder ?? 0))
      nextOrder = minOrder - 1 * directionFactor
    } else if (direction === 'bottom') {
      const maxOrder = Math.max(...sortedNotes.map((note) => note.manualOrder ?? 0))
      nextOrder = maxOrder + 1 * directionFactor
    }

    try {
      await updateNoteMutation.mutateAsync({
        id: noteId,
        data: { manualOrder: nextOrder },
      })
      toast.success('순서를 변경했습니다')
    } catch (error) {
      console.error('Manual order update error:', error)
      toast.error('순서 변경에 실패했습니다')
    }
  }

  const handleDuplicate = async (note: NoteListItem) => {
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

  const handleTogglePin = async (note: NoteListItem) => {
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
        {/* 무한 스크롤 로딩 인디케이터 */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        )}
        {/* 더 이상 노트가 없을 때 */}
        {!hasNextPage && notes.length > 0 && (
          <div className="text-center py-4 text-sm text-indigo-400 dark:text-indigo-500">
            모든 노트를 불러왔습니다
          </div>
        )}
      </div>
      {contextMenu && (
        <div
          className="fixed z-50 w-48 rounded-md border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-indigo-950 shadow-lg py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {sortBy === 'manual' && (
            <>
              <button
                type="button"
                onClick={() => {
                  handleMoveManual(contextMenu.note.id, 'top')
                  setContextMenu(null)
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200"
              >
                맨 위로
              </button>
              <button
                type="button"
                onClick={() => {
                  handleMoveManual(contextMenu.note.id, 'up')
                  setContextMenu(null)
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200"
              >
                위로 한 칸
              </button>
              <button
                type="button"
                onClick={() => {
                  handleMoveManual(contextMenu.note.id, 'down')
                  setContextMenu(null)
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200"
              >
                아래로 한 칸
              </button>
              <button
                type="button"
                onClick={() => {
                  handleMoveManual(contextMenu.note.id, 'bottom')
                  setContextMenu(null)
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200"
              >
                맨 아래로
              </button>
              <div className="my-1 border-t border-indigo-100 dark:border-indigo-800" />
            </>
          )}
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
    isLocked?: boolean
    isPinned?: boolean
    manualOrder?: number
    updatedAt: Date
    folder?: { name: string } | null
    tags?: { tag: { id: string; name: string; color?: string | null } }[]
  }
  isSelected: boolean
  onSelect?: (noteId: string) => void
  onContextMenu?: (event: React.MouseEvent) => void
}

function NoteItem({ note, isSelected, onSelect, onContextMenu }: NoteItemProps) {
  const previewSource = note.body?.split('\n').find((line) => line.trim()) ?? ''
  const previewText = note.isLocked
    ? '잠긴 노트입니다.'
    : previewSource.replace(/\s+/g, ' ').trim()
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
            {note.isLocked && (
              <Lock className="h-3.5 w-3.5 text-indigo-500" />
            )}
            <h3 className="font-semibold text-base mb-1 text-indigo-900 dark:text-indigo-100">
              {note.title}
            </h3>
            <span className="ml-auto text-[11px] text-indigo-500 dark:text-indigo-300">
              {formatDistanceToNow(new Date(note.updatedAt), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 line-clamp-1 mb-2">
            {previewText || '내용 없음'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-indigo-500 dark:text-indigo-300">
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
