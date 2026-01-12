'use client'

import { Suspense } from 'react'
import { NoteList } from '@/components/NoteList'
import { QuickAddButton } from '@/components/QuickAddButton'
import { FolderTree } from '@/components/FolderTree'
import { useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

function NotesPageContent() {
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folderId') || undefined

  return (
    <div className="page-shell">
      <QuickAddButton />

      <div className="page-content grid grid-cols-12 gap-6">
        {/* 좌측: 폴더 트리 */}
        <aside className="col-span-3 panel p-4">
          <FolderTree />
        </aside>

        {/* 중앙: 노트 리스트 */}
        <main className="col-span-9">
          <div className="panel p-6">
            <div className="page-header">
              <div>
                <h1 className="page-title text-indigo-900 dark:text-indigo-100">
                  {folderId ? '폴더 노트' : '모든 노트'}
                </h1>
                <p className="page-subtitle">노트를 빠르게 탐색하고 연결하세요.</p>
              </div>
            </div>
            <NoteList folderId={folderId} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="page-shell">
        <div className="page-content">
          <Skeleton className="h-screen" />
        </div>
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  )
}
