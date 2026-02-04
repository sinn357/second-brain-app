'use client'

import { useState } from 'react'
import { useNoteVersions } from '@/lib/hooks/useNoteVersions'
import { VersionDiffDialog } from './VersionDiffDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { History, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface VersionHistoryPanelProps {
  noteId: string
  currentTitle: string
  currentBody: string
}

export function VersionHistoryPanel({
  noteId,
  currentTitle,
  currentBody,
}: VersionHistoryPanelProps) {
  const { data: versions = [], isLoading } = useNoteVersions(noteId)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-6 text-indigo-500 dark:text-indigo-400">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">버전 히스토리가 없습니다</p>
        <p className="text-xs mt-1 opacity-70">노트를 수정하면 자동으로 버전이 생성됩니다</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        {versions.map((version) => (
          <Button
            key={version.id}
            variant="ghost"
            className="w-full justify-between h-auto py-2 px-3 text-left"
            onClick={() => setSelectedVersionId(version.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                  v{version.version}
                </span>
                <span className="text-sm truncate text-indigo-900 dark:text-indigo-100">
                  {version.title}
                </span>
              </div>
              <div className="text-xs text-indigo-500 dark:text-indigo-400">
                {formatDistanceToNow(new Date(version.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-indigo-400" />
          </Button>
        ))}
      </div>

      <VersionDiffDialog
        noteId={noteId}
        versionId={selectedVersionId}
        currentTitle={currentTitle}
        currentBody={currentBody}
        onClose={() => setSelectedVersionId(null)}
      />
    </>
  )
}
