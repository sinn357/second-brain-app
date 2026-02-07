'use client'

import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Brain, Link2, Loader2, Save, X } from 'lucide-react'

interface ConnectResult {
  noteId: string
  noteTitle: string
  reason: string
  preview?: string
}

interface ThinkingPanelProps {
  noteId: string
  isOpen: boolean
  onClose: () => void
  onNoteClick?: (noteId: string) => void
}

export function ThinkingPanel({ noteId, isOpen, onClose, onNoteClick }: ThinkingPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [results, setResults] = useState<ConnectResult[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSessionId(null)
    setResults([])
    setSavingId(null)
    setSavedIds(new Set())
  }, [noteId])

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/thinking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      })
      if (!res.ok) throw new Error('Connect 실패')
      return res.json()
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setResults(data.results || [])
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (resultNoteId: string) => {
      const res = await fetch('/api/thinking/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          resultNoteId,
          saveAs: 'new_note',
        }),
      })
      if (!res.ok) throw new Error('저장 실패')
      return res.json()
    },
    onSuccess: (_, resultNoteId) => {
      setSavedIds((prev) => new Set(prev).add(resultNoteId))
      setSavingId(null)
    },
    onError: () => {
      setSavingId(null)
    },
  })

  const handleConnect = () => {
    setResults([])
    setSessionId(null)
    setSavedIds(new Set())
    connectMutation.mutate()
  }

  const handleSave = (resultNoteId: string) => {
    setSavingId(resultNoteId)
    saveMutation.mutate(resultNoteId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-4 top-20 w-80 bg-white dark:bg-indigo-950 rounded-lg shadow-xl border border-indigo-200/70 dark:border-indigo-800/60 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-200/70 dark:border-indigo-800/60">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
          <span className="font-medium text-indigo-900 dark:text-indigo-100">Thinking</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
          type="button"
        >
          <X className="w-4 h-4 text-indigo-400" />
        </button>
      </div>

      <div className="p-4 border-b border-indigo-200/70 dark:border-indigo-800/60">
        <button
          onClick={handleConnect}
          disabled={connectMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
          type="button"
        >
          {connectMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          <span>Connect</span>
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {connectMutation.isPending && (
          <div className="text-center py-8 text-indigo-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">관련 노트를 찾고 있습니다...</p>
          </div>
        )}

        {!connectMutation.isPending && results.length === 0 && sessionId && (
          <div className="text-center py-8 text-indigo-400">
            <p className="text-sm">연결된 노트가 없습니다</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.noteId}
                className={`p-3 rounded-lg border transition-colors ${
                  savedIds.has(result.noteId)
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-dashed border-indigo-200 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-900/20'
                }`}
              >
                <div
                  className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300"
                  onClick={() => onNoteClick?.(result.noteId)}
                >
                  <span className="text-sm">Note</span>
                  <span className="font-medium text-sm truncate">{result.noteTitle}</span>
                  <ArrowRight className="w-3 h-3 ml-auto flex-shrink-0" />
                </div>

                <p className="text-xs text-indigo-700/70 dark:text-indigo-200/70 mt-2">
                  {result.reason}
                </p>

                {result.preview && (
                  <p className="text-xs text-indigo-400 mt-1 line-clamp-2">
                    {result.preview}...
                  </p>
                )}

                {!savedIds.has(result.noteId) && (
                  <button
                    onClick={() => handleSave(result.noteId)}
                    disabled={savingId === result.noteId}
                    className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-300 hover:underline disabled:opacity-50"
                    type="button"
                  >
                    {savingId === result.noteId ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    <span>저장</span>
                  </button>
                )}

                {savedIds.has(result.noteId) && (
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">
                    저장됨
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!sessionId && !connectMutation.isPending && (
          <div className="text-center py-8 text-indigo-300">
            <p className="text-sm">Connect를 눌러 관련 노트를 찾아보세요</p>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-indigo-200/70 dark:border-indigo-800/60 bg-indigo-50/80 dark:bg-indigo-900/20 rounded-b-lg">
        <p className="text-xs text-indigo-400 text-center">
          임시 결과 · 저장하지 않으면 사라집니다
        </p>
      </div>
    </div>
  )
}
