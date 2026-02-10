'use client'

import { useState } from 'react'
import {
  FileText,
  Rocket,
  Search,
  LayoutList,
  Tag,
  HelpCircle,
  CheckSquare,
  ChevronDown,
} from 'lucide-react'
import type { AICommand } from '@/lib/ai/types'

interface AICommandMenuProps {
  onCommand: (command: AICommand) => void
  isLoading: boolean
}

const COMMANDS = [
  { id: 'summarize' as AICommand, label: '요약', icon: FileText, desc: '핵심 포인트 추출' },
  { id: 'expand' as AICommand, label: '확장', icon: Rocket, desc: '아이디어 확장 방향' },
  { id: 'clarify' as AICommand, label: '명확화', icon: Search, desc: '모호한 부분 찾기' },
  { id: 'structure' as AICommand, label: '구조화', icon: LayoutList, desc: '구조 정리 제안' },
  { id: 'tagSuggest' as AICommand, label: '태그', icon: Tag, desc: '태그 자동 제안' },
  { id: 'question' as AICommand, label: '질문', icon: HelpCircle, desc: '탐구 질문 생성' },
  { id: 'action' as AICommand, label: '액션', icon: CheckSquare, desc: '다음 단계 제안' },
]

export function AICommandMenu({ onCommand, isLoading }: AICommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
      >
        <span>🤖</span>
        <span>AI</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-2">
              <p className="px-3 py-2 text-xs text-gray-400 font-medium">AI 기능</p>
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onCommand(cmd.id)
                    setIsOpen(false)
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  <cmd.icon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{cmd.label}</p>
                    <p className="text-xs text-gray-400">{cmd.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
