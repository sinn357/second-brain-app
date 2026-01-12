'use client'

import { useNotes } from '@/lib/hooks/useNotes'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface NoteListProps {
  folderId?: string
  selectedId?: string
  onSelect?: (noteId: string) => void
}

export function NoteList({ folderId, selectedId, onSelect }: NoteListProps) {
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
      <div className="panel-soft text-center p-8 text-gray-600 dark:text-indigo-300">
        노트가 없습니다. Quick Add 버튼을 눌러 노트를 추가하세요.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div key={note.id}>
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(note.id)}
              className="w-full text-left"
            >
              <Card
                className={`panel hover-lift hover-glow p-4 cursor-pointer ${
                  selectedId === note.id
                    ? 'border border-indigo-400/70 shadow-lg'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-indigo-900 dark:text-indigo-100">{note.title}</h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 line-clamp-2 mb-2">
                      {note.body.slice(0, 150) || '내용 없음'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-300">
                      {note.folder && (
                        <Badge variant="outline" className="text-xs">
                          {note.folder.name}
                        </Badge>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.slice(0, 3).map((nt) => (
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
            </button>
          ) : (
            <Link href={`/notes/${note.id}`}>
              <Card className="panel hover-lift hover-glow p-4 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-indigo-900 dark:text-indigo-100">{note.title}</h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 line-clamp-2 mb-2">
                      {note.body.slice(0, 150) || '내용 없음'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-300">
                      {note.folder && (
                        <Badge variant="outline" className="text-xs">
                          {note.folder.name}
                        </Badge>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1">
                          {note.tags.slice(0, 3).map((nt) => (
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
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
