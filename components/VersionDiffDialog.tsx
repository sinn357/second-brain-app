'use client'

import { useNoteVersion, useRestoreVersion } from '@/lib/hooks/useNoteVersions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface VersionDiffDialogProps {
  noteId: string
  versionId: string | null
  currentTitle: string
  currentBody: string
  onClose: () => void
}

export function VersionDiffDialog({
  noteId,
  versionId,
  currentTitle,
  currentBody,
  onClose,
}: VersionDiffDialogProps) {
  const { data: version, isLoading } = useNoteVersion(noteId, versionId)
  const restoreVersion = useRestoreVersion(noteId)

  const handleRestore = async () => {
    if (!versionId) return

    const confirmed = window.confirm(
      `버전 ${version?.version}로 복원하시겠습니까?\n현재 내용은 새 버전으로 저장됩니다.`
    )
    if (!confirmed) return

    try {
      await restoreVersion.mutateAsync(versionId)
      toast.success(`버전 ${version?.version}로 복원되었습니다`)
      onClose()
    } catch (error) {
      console.error('Restore error:', error)
      toast.error('복원에 실패했습니다')
    }
  }

  return (
    <Dialog open={!!versionId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <>
                <span>버전 {version?.version}</span>
                <span className="text-sm font-normal text-indigo-500">
                  {version &&
                    formatDistanceToNow(new Date(version.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 space-y-4 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 gap-4 p-4">
              {/* 이전 버전 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-xs">
                    이전
                  </span>
                  버전 {version?.version}
                </h3>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium text-sm mb-2 text-indigo-900 dark:text-indigo-100">
                    {version?.title}
                  </h4>
                  <pre className="text-xs whitespace-pre-wrap text-indigo-700 dark:text-indigo-300 max-h-60 overflow-auto">
                    {version?.body || '(내용 없음)'}
                  </pre>
                </div>
              </div>

              {/* 현재 버전 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                    현재
                  </span>
                  최신 버전
                </h3>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-sm mb-2 text-indigo-900 dark:text-indigo-100">
                    {currentTitle}
                  </h4>
                  <pre className="text-xs whitespace-pre-wrap text-indigo-700 dark:text-indigo-300 max-h-60 overflow-auto">
                    {currentBody || '(내용 없음)'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            닫기
          </Button>
          <Button
            onClick={handleRestore}
            disabled={isLoading || restoreVersion.isPending}
            className="gradient-mesh hover-glow text-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            이 버전으로 복원
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
