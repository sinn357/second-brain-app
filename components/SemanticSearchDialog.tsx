'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SemanticSearchDialogProps {
  children: ReactNode
}

interface SemanticNote {
  id: string
  title: string
  context?: string
  semanticReason?: string
}

export function SemanticSearchDialog({ children }: SemanticSearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query })
      const res = await fetch(`/api/notes/semantic-search?${params}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '요청 실패')
      }
      setResults(data.notes || [])
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
      setResults([])
      setError(null)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Semantic Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="의미로 검색해 보세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '검색'}
            </Button>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          {results.length === 0 && !isLoading && query.trim() && !error && (
            <div className="text-sm text-indigo-400">결과가 없습니다.</div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setOpen(false)
                    router.push(`/notes?noteId=${note.id}`)
                  }}
                  className="w-full text-left rounded-lg border border-indigo-200/60 bg-indigo-50/40 p-3 text-sm text-indigo-900 hover:bg-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-900/20 dark:text-indigo-100"
                >
                  <div className="font-medium truncate">{note.title}</div>
                  <div className="text-xs text-indigo-500 mt-1">
                    {note.semanticReason || note.context || ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
