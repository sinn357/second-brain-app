'use client'

import { useState } from 'react'
import { TableView } from '@/components/TableView'
import { ListView } from '@/components/ListView'
import { FilterBar, FilterOptions } from '@/components/FilterBar'
import { Button } from '@/components/ui/button'
import { Table, List } from 'lucide-react'

export default function DatabasePage() {
  const [view, setView] = useState<'table' | 'list'>('table')
  const [filters, setFilters] = useState<FilterOptions>({
    folderId: undefined,
    tagIds: [],
    propertyFilters: {},
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-indigo-900 dark:text-indigo-100">Database</h1>
            <p className="text-sm sm:text-base text-indigo-700 dark:text-indigo-300">노트를 테이블이나 리스트 형태로 관리하세요</p>
          </div>

          {/* View 전환 버튼 */}
          <div className="flex gap-2">
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              onClick={() => setView('table')}
              size="sm"
              className={`flex items-center gap-2 ${view === 'table' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            >
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => setView('list')}
              size="sm"
              className={`flex items-center gap-2 ${view === 'list' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
        </div>

        {/* 필터 바 */}
        <FilterBar filters={filters} onFilterChange={setFilters} />

        {/* View 렌더링 */}
        <div className="bg-white dark:bg-indigo-900 rounded-lg shadow-sm p-6">
          {view === 'table' ? <TableView filters={filters} /> : <ListView filters={filters} />}
        </div>
      </div>
    </div>
  )
}
