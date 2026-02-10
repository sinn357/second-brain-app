'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Loader2 } from 'lucide-react'
import { useNotes } from '@/lib/hooks/useNotes'

interface IncubationDialogProps {
  children: ReactNode
}

interface IncubationItem {
  id: string
  question: string
  noteIds: string[]
  reviewAt: string
  notes: Array<{ id: string; title: string }>
}

export function IncubationDialog({ children }: IncubationDialogProps) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [days, setDays] = useState('3')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [items, setItems] = useState<IncubationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: notes = [] } = useNotes()

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => a.title.localeCompare(b.title))
  }, [notes])

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

  const fetchItems = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes/incubation?status=ready')
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '요청 실패')
      }
      setItems(data.questions || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청 실패'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!question.trim()) {
      setError('질문을 입력하세요')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes/incubation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          noteIds: Array.from(selectedIds),
          days: Number(days) || 3,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '요청 실패')
      }
      setQuestion('')
      setSelectedIds(new Set())
      await fetchItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청 실패'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async (id: string, action: 'done' | 'snooze') => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notes/incubation/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, days: Number(days) || 3 }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '요청 실패')
      }
      await fetchItems()
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청 실패'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      void fetchItems()
    }
  }, [open])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuestion('')
      setSelectedIds(new Set())
      setError(null)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Incubation
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <Input
              placeholder="부화시킬 질문을 입력하세요"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-24"
              />
              <span className="text-xs text-indigo-400">일 후 다시 보기</span>
              <Button size="sm" onClick={handleCreate} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
              </Button>
            </div>

            <div className="rounded-lg border border-indigo-200/60 p-3 max-h-[260px] overflow-y-auto dark:border-indigo-800/60">
              <div className="text-xs text-indigo-400 mb-2">관련 노트 선택 (선택)</div>
              <div className="space-y-2">
                {sortedNotes.map((note) => (
                  <label key={note.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(note.id)}
                      onChange={() => toggleNote(note.id)}
                    />
                    <span className="truncate">{note.title}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
          </div>

          <div className="rounded-lg border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-800/60 dark:bg-indigo-900/20">
            <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-3">
              부화된 질문
            </div>
            {isLoading ? (
              <div className="text-sm text-indigo-400">불러오는 중...</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-indigo-400">아직 부화된 질문이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-dashed border-indigo-200 bg-white/70 p-3 text-sm dark:border-indigo-700 dark:bg-indigo-900/30"
                  >
                    <div className="font-medium text-indigo-900 dark:text-indigo-100">
                      {item.question}
                    </div>
                    {item.notes.length > 0 && (
                      <div className="text-xs text-indigo-500 mt-1">
                        관련 노트: {item.notes.map((note) => note.title).join(', ')}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Button size="sm" variant="outline" onClick={() => handleResolve(item.id, 'done')}>
                        완료
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleResolve(item.id, 'snooze')}>
                        다시 부화
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
