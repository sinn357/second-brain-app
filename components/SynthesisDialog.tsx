'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Network } from 'lucide-react'
import { markdownToHtml } from '@/lib/markdown'
import { useNotes } from '@/lib/hooks/useNotes'

interface SynthesisDialogProps {
  children: ReactNode
}

export function SynthesisDialog({ children }: SynthesisDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: notes = [], isLoading: isNotesLoading } = useNotes()

  const filteredNotes = useMemo(() => {
    if (!query.trim()) return notes
    const lower = query.toLowerCase()
    return notes.filter((note) => note.title.toLowerCase().includes(lower))
  }, [notes, query])

  const toggleNote = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSynthesis = async () => {
    if (selectedIds.size < 3) {
      setError('최소 3개의 노트를 선택해주세요')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds: Array.from(selectedIds) }),
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
      setQuery('')
      setSelectedIds(new Set())
      setResult('')
      setError(null)
      setIsLoading(false)
    }
  }

  const htmlResult = result ? markdownToHtml(result) : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Synthesis
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <Input
              placeholder="노트 제목 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="rounded-lg border border-indigo-200/60 p-3 max-h-[320px] overflow-y-auto dark:border-indigo-800/60">
              {isNotesLoading ? (
                <div className="text-sm text-indigo-400">노트를 불러오는 중...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-sm text-indigo-400">노트가 없습니다</div>
              ) : (
                <div className="space-y-2">
                  {filteredNotes.map((note) => (
                    <label
                      key={note.id}
                      className="flex items-center gap-2 text-sm text-indigo-900 dark:text-indigo-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(note.id)}
                        onChange={() => toggleNote(note.id)}
                      />
                      <span className="truncate">{note.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-indigo-400">
              <span>선택된 노트: {selectedIds.size}</span>
              <Button onClick={handleSynthesis} disabled={isLoading} size="sm">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '종합하기'}
              </Button>
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
          </div>

          <div className="rounded-lg border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-800/60 dark:bg-indigo-900/20">
            {result ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlResult }}
              />
            ) : (
              <div className="text-sm text-indigo-400">
                종합 결과가 여기에 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
