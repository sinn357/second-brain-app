'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lightbulb, Loader2, RefreshCcw } from 'lucide-react'
import { markdownToHtml } from '@/lib/markdown'

interface RandomSparkDialogProps {
  children: ReactNode
}

export function RandomSparkDialog({ children }: RandomSparkDialogProps) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSpark = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes/random-spark', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '요청 실패')
      }
      setResult(data.result || '')
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청 실패'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      void fetchSpark()
    } else {
      setResult('')
      setError(null)
      setIsLoading(false)
    }
  }

  const htmlResult = result ? markdownToHtml(result) : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Random Spark
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-indigo-400 py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
            우연한 연결을 찾는 중...
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : result ? (
          <div className="space-y-3">
            <div
              className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-800/60 dark:bg-indigo-900/20"
              dangerouslySetInnerHTML={{ __html: htmlResult }}
            />
            <Button onClick={fetchSpark} variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              다른 조합 보기
            </Button>
          </div>
        ) : (
          <div className="text-sm text-indigo-400">결과를 준비 중입니다.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
