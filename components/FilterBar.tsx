'use client'

import { useState } from 'react'
import { useFolders } from '@/lib/hooks/useFolders'
import { useTags } from '@/lib/hooks/useTags'
import { useProperties } from '@/lib/hooks/useProperties'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, SlidersHorizontal } from 'lucide-react'

export interface FilterOptions {
  folderId?: string
  tagIds: string[]
  propertyFilters: Record<string, any>
  sortBy: 'title' | 'createdAt' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
}

interface FilterBarProps {
  filters: FilterOptions
  onFilterChange: (filters: FilterOptions) => void
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const { data: folders = [] } = useFolders()
  const { data: tags = [] } = useTags()
  const { data: properties = [] } = useProperties()
  const [showFilters, setShowFilters] = useState(false)

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const toggleTag = (tagId: string) => {
    const newTagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter(id => id !== tagId)
      : [...filters.tagIds, tagId]
    updateFilter('tagIds', newTagIds)
  }

  const clearFilters = () => {
    onFilterChange({
      folderId: undefined,
      tagIds: [],
      propertyFilters: {},
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })
  }

  const hasActiveFilters = filters.folderId || filters.tagIds.length > 0 || Object.keys(filters.propertyFilters).length > 0

  return (
    <div className="bg-white dark:bg-indigo-900 rounded-lg shadow-sm p-4 mb-4">
      {/* 필터 토글 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          필터 {showFilters ? '숨기기' : '보기'}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-sm">
            모든 필터 초기화
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="space-y-4">
          {/* 정렬 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-indigo-900 dark:text-indigo-100">정렬 기준</label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">제목</SelectItem>
                  <SelectItem value="createdAt">생성일</SelectItem>
                  <SelectItem value="updatedAt">수정일</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-indigo-900 dark:text-indigo-100">정렬 순서</label>
              <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">오름차순</SelectItem>
                  <SelectItem value="desc">내림차순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 폴더 필터 */}
          <div>
            <label className="text-sm font-medium mb-2 block text-indigo-900 dark:text-indigo-100">폴더</label>
            <Select
              value={filters.folderId || 'all'}
              onValueChange={(value) => updateFilter('folderId', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="모든 폴더" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 폴더</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 태그 필터 */}
          <div>
            <label className="text-sm font-medium mb-2 block text-indigo-900 dark:text-indigo-100">태그</label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-sm text-gray-500">태그가 없습니다</span>
              ) : (
                tags.map((tag) => {
                  const isSelected = filters.tagIds.includes(tag.id)
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'hover:bg-indigo-100 dark:hover:bg-indigo-800'
                      }`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      #{tag.name}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  )
                })
              )}
            </div>
          </div>

          {/* 속성 필터 */}
          {properties.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block text-indigo-900 dark:text-indigo-100">속성 필터</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((property) => (
                  <div key={property.id}>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{property.name}</label>
                    {property.type === 'checkbox' ? (
                      <Select
                        value={filters.propertyFilters[property.id] || 'all'}
                        onValueChange={(value) => {
                          const newFilters = { ...filters.propertyFilters }
                          if (value === 'all') {
                            delete newFilters[property.id]
                          } else {
                            newFilters[property.id] = value === 'true'
                          }
                          updateFilter('propertyFilters', newFilters)
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="true">완료</SelectItem>
                          <SelectItem value="false">미완료</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : property.type === 'select' && property.options ? (
                      <Select
                        value={filters.propertyFilters[property.id] || 'all'}
                        onValueChange={(value) => {
                          const newFilters = { ...filters.propertyFilters }
                          if (value === 'all') {
                            delete newFilters[property.id]
                          } else {
                            newFilters[property.id] = value
                          }
                          updateFilter('propertyFilters', newFilters)
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {(Array.isArray(property.options) ? property.options : []).map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
