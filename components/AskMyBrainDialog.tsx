'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Brain, Loader2 } from 'lucide-react'
import { markdownToHtml } from '@/lib/markdown'

interface AskMyBrainDialogProps {
  children: ReactNode
}

export function AskMyBrainDialog({ children }: AskMyBrainDialogProps) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAsk = async () => {
    if (!question.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes/ask-my-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
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
      setQuestion('')
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
            <Brain className="h-5 w-5" />
            Ask My Brain
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="예: 내가 생산성에 대해 뭘 알고 있지?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            />
            <Button onClick={handleAsk} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '질문'}
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
