import { useState, useEffect } from 'react'

const HISTORY_KEY = 'search-history'
const MAX_HISTORY = 10

export interface SearchHistoryItem {
  query: string
  timestamp: number
  mode?: 'normal' | 'regex'
  filters?: {
    folderId?: string
    tagId?: string
    dateFrom?: string
    dateTo?: string
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [mounted, setMounted] = useState(false)

  // 히스토리 로드 (클라이언트에서만)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(HISTORY_KEY)
        if (stored) {
          setHistory(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
      setMounted(true)
    }
  }, [])

  // 히스토리 저장
  const saveHistory = (newHistory: SearchHistoryItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
        setHistory(newHistory)
      } catch (error) {
        console.error('Failed to save search history:', error)
      }
    }
  }

  // 검색어 추가
  const addToHistory = (item: Omit<SearchHistoryItem, 'timestamp'>) => {
    if (!item.query.trim()) return

    const newItem: SearchHistoryItem = {
      ...item,
      timestamp: Date.now(),
    }

    // 중복 제거 (같은 query, mode, filters)
    const filtered = history.filter((h) => {
      if (h.query !== newItem.query) return true
      if (h.mode !== newItem.mode) return true
      if (JSON.stringify(h.filters) !== JSON.stringify(newItem.filters)) return true
      return false
    })

    // 최신 항목을 맨 앞에 추가
    const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY)
    saveHistory(newHistory)
  }

  // 히스토리 삭제
  const removeFromHistory = (timestamp: number) => {
    const newHistory = history.filter((h) => h.timestamp !== timestamp)
    saveHistory(newHistory)
  }

  // 히스토리 전체 삭제
  const clearHistory = () => {
    saveHistory([])
  }

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    mounted, // SSR 방지용
  }
}
