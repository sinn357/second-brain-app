'use client'

import { useState } from 'react'
import { useBacklinks, useUnlinkedMentions } from '@/lib/hooks/useNotes'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Link as LinkIcon } from 'lucide-react'

interface BacklinkPanelProps {
  noteId: string
}

export function BacklinkPanel({ noteId }: BacklinkPanelProps) {
  const [activeTab, setActiveTab] = useState<'backlinks' | 'unlinked'>('backlinks')
  const { data: backlinks = [], isLoading: backlinksLoading, error: backlinksError } = useBacklinks(noteId)
  const { data: unlinkedMentions = [], isLoading: unlinkedLoading, error: unlinkedError } = useUnlinkedMentions(noteId)

  const isLoading = activeTab === 'backlinks' ? backlinksLoading : unlinkedLoading
  const error = activeTab === 'backlinks' ? backlinksError : unlinkedError
  const items = activeTab === 'backlinks' ? backlinks : unlinkedMentions

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'backlinks' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('backlinks')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Backlinks ({backlinks.length})
        </Button>
        <Button
          variant={activeTab === 'unlinked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('unlinked')}
          className="flex items-center gap-2"
        >
          <LinkIcon className="h-3 w-3" />
          Unlinked ({unlinkedMentions.length})
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">
          Error loading {activeTab === 'backlinks' ? 'backlinks' : 'unlinked mentions'}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeTab === 'backlinks'
            ? '이 노트를 링크한 노트가 없습니다'
            : '링크되지 않은 언급이 없습니다'}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((note: any) => (
            <Link key={note.id} href={`/notes?noteId=${note.id}`}>
              <Card className="p-3 hover:bg-gray-50 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm">{note.title}</h4>
                  {note.mentionCount > 1 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                      {note.mentionCount}x
                    </span>
                  )}
                </div>

                {/* Contexts */}
                {note.contexts && note.contexts.length > 0 && (
                  <div className="space-y-1">
                    {note.contexts.slice(0, 2).map((context: string, idx: number) => (
                      <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 italic">
                        "{context}"
                      </p>
                    ))}
                    {note.contexts.length > 2 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        +{note.contexts.length - 2} more mentions
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
