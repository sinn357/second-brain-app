'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Search, FileText, Tag, Folder, Hash, Loader2, SlidersHorizontal } from 'lucide-react'
import { useTags } from '@/lib/hooks/useTags'
import { useFolders } from '@/lib/hooks/useFolders'
import { useSearchHistory } from '@/lib/hooks/useSearchHistory'
import { AdvancedSearchDialog, type SearchParams } from '@/components/AdvancedSearchDialog'
import { SearchHighlight } from '@/components/SearchHighlight'

type SearchResult = {
  id: string
  type: 'note' | 'tag' | 'folder'
  title: string
  subtitle?: string
  context?: string
  url: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState<'normal' | 'regex'>('normal')
  const [advancedFilters, setAdvancedFilters] = useState<Partial<SearchParams>>({})
  const router = useRouter()

  // Data hooks (for tags and folders only)
  const { data: tags = [] } = useTags()
  const { data: folders = [] } = useFolders()
  const { addToHistory } = useSearchHistory()

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const delaySearch = setTimeout(async () => {
      setIsSearching(true)
      try {
        // 고급 필터 파라미터 구성
        const params = new URLSearchParams({
          q: query,
          mode: searchMode,
          ...(advancedFilters.folderId && { folderId: advancedFilters.folderId }),
          ...(advancedFilters.tagId && { tagId: advancedFilters.tagId }),
          ...(advancedFilters.dateFrom && { dateFrom: advancedFilters.dateFrom }),
          ...(advancedFilters.dateTo && { dateTo: advancedFilters.dateTo }),
        })

        const res = await fetch(`/api/notes/search?${params}`)
        const data = await res.json()
        if (data.success) {
          setSearchResults(data.notes || [])
          // 검색 히스토리에 추가
          addToHistory({
            query,
            mode: searchMode,
            filters: advancedFilters,
          })
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(delaySearch)
  }, [query, searchMode, advancedFilters])

  // Filter results based on query
  const results: SearchResult[] = []

  if (query.trim()) {
    const lowerQuery = query.toLowerCase()

    // Add search results (notes) with context
    searchResults.slice(0, 10).forEach((note) => {
        results.push({
          id: note.id,
          type: 'note',
          title: note.title,
          subtitle: note.folder?.name || 'No folder',
          context: note.context,
          url: `/notes?noteId=${note.id}`,
        })
    })

    // Search tags
    tags
      .filter((tag) => tag.name.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach((tag) => {
        results.push({
          id: tag.id,
          type: 'tag',
          title: `#${tag.name}`,
          subtitle: `${tag._count?.notes || 0} notes`,
          url: `/notes?tag=${tag.id}`,
        })
      })

    // Search folders
    folders
      .filter((folder) => folder.name.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach((folder) => {
        results.push({
          id: folder.id,
          type: 'folder',
          title: folder.name,
          subtitle: `${folder._count?.notes || 0} notes`,
          url: `/notes?folderId=${folder.id}`,
        })
      })
  }

  useEffect(() => {
    const handleToggle = () => setOpen((open) => !open)
    const handleOpen = () => setOpen(true)

    document.addEventListener('command-palette:toggle', handleToggle)
    document.addEventListener('command-palette:open', handleOpen)

    return () => {
      document.removeEventListener('command-palette:toggle', handleToggle)
      document.removeEventListener('command-palette:open', handleOpen)
    }
  }, [])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + results.length) % results.length)
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    },
    [results, selectedIndex]
  )

  // Navigate to selected item
  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    router.push(result.url)
  }

  // Icon for result type
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'tag':
        return <Hash className="h-4 w-4" />
      case 'folder':
        return <Folder className="h-4 w-4" />
    }
  }

  // 고급 검색 핸들러
  const handleAdvancedSearch = (params: SearchParams) => {
    setQuery(params.query)
    setSearchMode(params.mode)
    setAdvancedFilters({
      folderId: params.folderId,
      tagId: params.tagId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-2xl">
        <DialogDescription className="sr-only">
          검색어로 노트, 태그, 폴더를 찾아 이동합니다.
        </DialogDescription>
        <div className="flex flex-col">
          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 mr-2 text-gray-500" />
            <Input
              placeholder="Search notes, tags, folders..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            <AdvancedSearchDialog onSearch={handleAdvancedSearch}>
              <Button variant="ghost" size="sm" className="ml-2">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </AdvancedSearchDialog>
            <kbd className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded">
              {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {isSearching ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Searching...</p>
              </div>
            ) : query && results.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No results found
              </div>
            ) : query ? (
              <div className="space-y-1">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-gray-100'
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div
                      className={`${
                        index === selectedIndex ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {result.type === 'note' ? (
                          <SearchHighlight text={result.title} query={query} mode={searchMode} />
                        ) : (
                          result.title
                        )}
                      </div>
                      {result.context && (
                        <div className="text-xs text-gray-600 truncate mt-1">
                          <SearchHighlight text={result.context} query={query} mode={searchMode} />
                        </div>
                      )}
                      {result.subtitle && !result.context && (
                        <div className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {result.type}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">
                  Type to search notes, tags, and folders
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Use ↑↓ arrows to navigate, Enter to select
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
