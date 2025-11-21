'use client'

import { memo, useMemo } from 'react'
import { useNotes } from '@/lib/hooks/useNotes'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface NoteListProps {
  folderId?: string
}

interface NoteItemProps {
  note: any
}

const NoteItem = memo(({ note }: NoteItemProps) => {
  const formattedDate = useMemo(
    () => formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: ko }),
    [note.updatedAt]
  )

  const previewText = useMemo(
    () => note.body.replace(/<[^>]*>/g, '').slice(0, 150) || '내용 없음',
    [note.body]
  )

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="p-4 hover:bg-gray-50 dark:hover:bg-indigo-800 transition-colors cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 text-indigo-900 dark:text-indigo-100">{note.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{previewText}</p>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {note.folder && (
                <Badge variant="outline" className="text-xs">
                  {note.folder.name}
                </Badge>
              )}
              {note.tags && note.tags.length > 0 && (
                <div className="flex gap-1">
                  {note.tags.slice(0, 3).map((nt: any) => (
                    <Badge
                      key={nt.tag.id}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: nt.tag.color || undefined,
                      }}
                    >
                      {nt.tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <span className="ml-auto">{formattedDate}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
})

NoteItem.displayName = 'NoteItem'

export function NoteList({ folderId }: NoteListProps) {
  const { data: notes = [], isLoading, error } = useNotes(folderId)

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
      <div className="text-gray-500 dark:text-gray-400 text-center p-8">
        노트가 없습니다. Quick Add 버튼을 눌러 노트를 추가하세요.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} />
      ))}
    </div>
  )
}
