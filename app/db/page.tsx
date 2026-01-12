'use client'

import { useState } from 'react'
import { TableView } from '@/components/TableView'
import { ListView } from '@/components/ListView'
import { FilterBuilder } from '@/components/FilterBuilder'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useFilteredNotes } from '@/lib/hooks/useFilters'
import { Button } from '@/components/ui/button'
import { Table, List } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function DatabasePage() {
  const [view, setView] = useState<'table' | 'list'>('table')
  const { activeFilters, isEmpty } = useFilterStore()

  // 필터 적용된 노트 조회
  const { data: filteredNotes = [], isLoading } = useFilteredNotes(
    isEmpty() ? null : activeFilters
  )

  return (
    <div className="page-shell">
      <div className="page-content space-y-6">
        {/* 헤더 */}
        <div className="page-header">
          <div>
            <h1 className="page-title text-indigo-900 dark:text-indigo-100">Database</h1>
            <p className="page-subtitle">노트를 테이블이나 리스트 형태로 관리하세요</p>
          </div>

          {/* View 전환 버튼 */}
          <div className="flex gap-2">
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              onClick={() => setView('table')}
              className={`flex items-center gap-2 ${view === 'table' ? 'gradient-mesh hover-glow text-white' : ''}`}
            >
              <Table className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => setView('list')}
              className={`flex items-center gap-2 ${view === 'list' ? 'gradient-mesh hover-glow text-white' : ''}`}
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>

        {/* 필터 빌더 */}
        <FilterBuilder />

        {/* 필터 결과 카운트 */}
        {!isEmpty() && (
          <div className="toolbar-pill">
            필터 결과: {filteredNotes.length}개의 노트
          </div>
        )}

        {/* View 렌더링 */}
        <div className="panel p-6">
          {isLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <>
              {view === 'table' ? (
                <TableView notes={filteredNotes} />
              ) : (
                <ListView notes={filteredNotes} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
