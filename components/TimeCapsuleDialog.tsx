'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Hourglass, Loader2 } from 'lucide-react'
import { markdownToHtml } from '@/lib/markdown'

interface TimeCapsuleDialogProps {
  children: ReactNode
}

export function TimeCapsuleDialog({ children }: TimeCapsuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    if (!keyword.trim()) {
      setError('키워드를 입력하세요')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes/time-capsule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
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
    if (!nextOpen) {
      setKeyword('')
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
            <Hourglass className="h-5 w-5" />
            Time Capsule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="키워드를 입력하세요 (예: 생산성)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            />
            <Button onClick={handleRun} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '조회'}
            </Button>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          {result && (
            <div className="rounded-lg border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-800/60 dark:bg-indigo-900/20">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlResult }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
