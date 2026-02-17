'use client'

import { useState } from 'react'
import { Link2, X } from 'lucide-react'

interface AutoLinkSuggestion {
  noteId: string
  noteTitle: string
  reason: string
  preview?: string
}

interface AutoLinkMenuProps {
  suggestions: AutoLinkSuggestion[]
  isLoading: boolean
  error: string | null
  onApprove: (noteId: string) => void
  onApproveAll: () => void
  onDismiss: (noteId: string) => void
  onDismissAll: () => void
}

export function AutoLinkMenu({
  suggestions,
  isLoading,
  error,
  onApprove,
  onApproveAll,
  onDismiss,
  onDismissAll,
}: AutoLinkMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (suggestions.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-indigo-200/70 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700/60 dark:bg-indigo-900/30 dark:text-indigo-200"
        type="button"
      >
        <Link2 className="h-3.5 w-3.5" />
        링크 제안 {suggestions.length}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-lg border border-indigo-200/70 bg-white shadow-xl dark:border-indigo-800/60 dark:bg-indigo-950 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-200/70 dark:border-indigo-800/60">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  링크 제안
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                type="button"
              >
                <X className="h-4 w-4 text-indigo-400" />
              </button>
            </div>

            <div className="px-4 py-2 flex items-center justify-between border-b border-indigo-200/70 dark:border-indigo-800/60">
              <button
                onClick={onApproveAll}
                className="text-xs text-indigo-600 hover:underline"
                type="button"
              >
                모두 승인
              </button>
              <button
                onClick={onDismissAll}
                className="text-xs text-indigo-400 hover:underline"
                type="button"
              >
                모두 무시
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {isLoading && (
                <div className="text-xs text-indigo-400">추천을 업데이트하는 중...</div>
              )}
              {error && <div className="text-xs text-red-500">{error}</div>}
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.noteId}
                  className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-700 dark:bg-indigo-900/20"
                >
                  <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    {suggestion.noteTitle}
                  </div>
                  <p className="mt-1 text-xs text-indigo-700/70 dark:text-indigo-200/70">
                    {suggestion.reason}
                  </p>
                  {suggestion.preview && (
                    <p className="mt-1 text-xs text-indigo-400 line-clamp-2">
                      {suggestion.preview}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <button
                      onClick={() => onApprove(suggestion.noteId)}
                      className="text-indigo-600 hover:underline"
                      type="button"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => onDismiss(suggestion.noteId)}
                      className="text-indigo-400 hover:underline"
                      type="button"
                    >
                      무시
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-indigo-200/70 dark:border-indigo-800/60 bg-indigo-50/80 dark:bg-indigo-900/20 rounded-b-lg">
              <p className="text-xs text-indigo-400 text-center">
                승인한 링크만 실제로 생성됩니다
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
