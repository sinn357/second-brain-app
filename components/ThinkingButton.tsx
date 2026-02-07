'use client'

import { Brain } from 'lucide-react'

interface ThinkingButtonProps {
  onClick: () => void
  isActive?: boolean
}

export function ThinkingButton({ onClick, isActive }: ThinkingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200'
          : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300'
      }`}
      title="Thinking (Cmd+/)"
      type="button"
    >
      <Brain className="w-4 h-4" />
      <span className="text-sm">Think</span>
    </button>
  )
}
