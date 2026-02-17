'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFolders } from '@/lib/hooks/useFolders'
import { useTags } from '@/lib/hooks/useTags'
import { useSearchHistory } from '@/lib/hooks/useSearchHistory'
import { SlidersHorizontal, X, Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Folder, Tag } from '@/lib/contracts/entities'
import type { SearchHistoryItem } from '@/lib/hooks/useSearchHistory'

interface AdvancedSearchDialogProps {
  children: ReactNode
  onSearch: (params: SearchParams) => void
}

export interface SearchParams {
  query: string
  mode: 'normal' | 'regex' | 'semantic'
  folderId?: string
  tagId?: string
  dateFrom?: string
  dateTo?: string
}

export function AdvancedSearchDialog({ children, onSearch }: AdvancedSearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'normal' | 'regex' | 'semantic'>('normal')
  const [folderId, setFolderId] = useState<string | undefined>()
  const [tagId, setTagId] = useState<string | undefined>()
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const { data: folderData } = useFolders()
  const { data: tagData } = useTags()
  const folders = (folderData ?? []) as Folder[]
  const tags = (tagData ?? []) as Tag[]
  const { history, addToHistory, removeFromHistory, clearHistory, mounted } = useSearchHistory()

  const handleSearch = () => {
    if (!query.trim()) return

    const params: SearchParams = {
      query,
      mode,
      folderId,
      tagId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }

    // 히스토리에 추가
    addToHistory({
      query,
      mode,
      filters: {
        folderId,
        tagId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
    })

    onSearch(params)
    setOpen(false)
  }

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setQuery(item.query)
    setMode(item.mode || 'normal')
    setFolderId(item.filters?.folderId)
    setTagId(item.filters?.tagId)
    setDateFrom(item.filters?.dateFrom || '')
    setDateTo(item.filters?.dateTo || '')
  }

  const resetFilters = () => {
    setMode('normal')
    setFolderId(undefined)
    setTagId(undefined)
    setDateFrom('')
    setDateTo('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Advanced Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 검색어 */}
          <div className="space-y-2">
            <Label>Search Query</Label>
            <Input
              placeholder="Enter search term or regex pattern..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* 검색 모드 */}
          <div className="space-y-2">
            <Label>Search Mode</Label>
            <Select
              value={mode}
              onValueChange={(v: SearchParams['mode']) => setMode(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (case-insensitive)</SelectItem>
                <SelectItem value="regex">Regular Expression</SelectItem>
                <SelectItem value="semantic">Semantic (AI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 폴더 필터 */}
            <div className="space-y-2">
              <Label>Folder</Label>
              <Select value={folderId || 'all'} onValueChange={(v) => setFolderId(v === 'all' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All folders</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 태그 필터 */}
            <div className="space-y-2">
              <Label>Tag</Label>
              <Select value={tagId || 'all'} onValueChange={(v) => setTagId(v === 'all' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      #{tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 날짜 범위 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* 검색 히스토리 */}
          {mounted && history.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </Label>
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  Clear
                </Button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.timestamp}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <span className="text-sm truncate flex-1">
                      {item.query}
                      {item.mode === 'regex' && ' (regex)'}
                      {item.mode === 'semantic' && ' (semantic)'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromHistory(item.timestamp)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSearch} className="flex-1 gradient-mesh hover-glow text-white">
              Search
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
