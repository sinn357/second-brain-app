'use client'

import { memo } from 'react'
import { useBacklinks } from '@/lib/hooks/useNotes'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface BacklinkPanelProps {
  noteId: string
}

export const BacklinkPanel = memo(({ noteId }: BacklinkPanelProps) => {
  const { data: backlinks = [], isLoading, error } = useBacklinks(noteId)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-sm mb-2">Backlinks</h3>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Error loading backlinks
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Backlinks ({backlinks.length})
      </h3>

      {backlinks.length === 0 ? (
        <p className="text-sm text-gray-500">이 노트를 링크한 노트가 없습니다</p>
      ) : (
        <div className="space-y-2">
          {backlinks.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <Card className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <h4 className="font-medium text-sm mb-1">{note.title}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {note.body.slice(0, 100)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
})

BacklinkPanel.displayName = 'BacklinkPanel'
