'use client'

import { useMemo, useState } from 'react'
import { X, Copy, Check, Save, Loader2 } from 'lucide-react'
import { markdownToHtml } from '@/lib/markdown'

interface AIResultPanelProps {
  title: string
  result: string | null
  isLoading: boolean
  error: Error | null
  onClose: () => void
  onSave?: (content: string) => void
  onCopy?: (content: string) => void
}

export function AIResultPanel({
  title,
  result,
  isLoading,
  error,
  onClose,
  onSave,
  onCopy,
}: AIResultPanelProps) {
  const [copied, setCopied] = useState(false)

  const htmlResult = useMemo(() => {
    if (!result) return ''
    return markdownToHtml(result)
  }, [result])

  const handleCopy = () => {
    if (!result) return
    onCopy?.(result)
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed right-4 top-20 w-96 max-h-[70vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-dashed border-gray-300 dark:border-gray-600 z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            임시
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">분석 중...</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm py-4">
            오류가 발생했습니다: {error.message}
          </div>
        )}

        {result && !isLoading && (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlResult }}
          />
        )}
      </div>

      {result && !isLoading && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-400">
            ※ 이것은 AI 제안입니다. 저장하지 않으면 사라집니다.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? '복사됨' : '복사'}
            </button>
            {onSave && (
              <button
                onClick={() => onSave(result)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
              >
                <Save className="w-3 h-3" />
                노트에 추가
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
