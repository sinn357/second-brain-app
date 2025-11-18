'use client'

import { useState } from 'react'
import { TableView } from '@/components/TableView'
import { ListView } from '@/components/ListView'
import { Button } from '@/components/ui/button'
import { Table, List } from 'lucide-react'

export default function DatabasePage() {
  const [view, setView] = useState<'table' | 'list'>('table')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Database</h1>
            <p className="text-gray-600">노트를 테이블이나 리스트 형태로 관리하세요</p>
          </div>

          {/* View 전환 버튼 */}
          <div className="flex gap-2">
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              onClick={() => setView('table')}
              className="flex items-center gap-2"
            >
              <Table className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => setView('list')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>

        {/* View 렌더링 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {view === 'table' ? <TableView /> : <ListView />}
        </div>
      </div>
    </div>
  )
}
