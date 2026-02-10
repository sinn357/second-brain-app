'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ResurfaceDialogProps {
  children: ReactNode
}

interface ResurfaceSectionItem {
  id: string
  title: string
  reason: string
}

interface ResurfaceResponse {
  staleImportant: ResurfaceSectionItem[]
  relatedToCurrent: ResurfaceSectionItem[]
  incomplete: ResurfaceSectionItem[]
}

export function ResurfaceDialog({ children }: ResurfaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sections, setSections] = useState<ResurfaceResponse | null>(null)
  const router = useRouter()

  const handleResurface = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes/resurface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '요청 실패')
      }
      setSections(data.sections)
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청 실패'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setIsLoading(false)
      setError(null)
      setSections(null)
    } else {
      void handleResurface()
    }
  }

  const renderSection = (title: string, items: ResurfaceSectionItem[]) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-indigo-400">표시할 노트가 없습니다.</div>
      ) : (
        items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setOpen(false)
              router.push(`/notes?noteId=${item.id}`)
            }}
            className="w-full text-left rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 p-3 text-sm text-indigo-900 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-100"
          >
            <div className="font-medium truncate">{item.title}</div>
            <div className="text-xs text-indigo-500 mt-1">{item.reason}</div>
          </button>
        ))
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Resurface
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-indigo-400 py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
            다시 떠오르는 노트 찾는 중...
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : sections ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {renderSection('오랫동안 안 본 중요 노트', sections.staleImportant)}
            {renderSection('현재 작업과 연결될 수 있는 노트', sections.relatedToCurrent)}
            {renderSection('발전시킬 만한 미완성 노트', sections.incomplete)}
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm text-indigo-400">
            아직 결과가 없습니다.
            <Button size="sm" onClick={handleResurface}>
              다시 찾기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
