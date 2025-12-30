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
    <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950">
      <QuickAddButton />

      <div className="grid grid-cols-12 gap-6 p-6">
        {/* 좌측: 폴더 트리 */}
        <aside className="col-span-3 glass-strong p-4 rounded-lg">
          <FolderTree />
        </aside>

        {/* 중앙: 노트 리스트 */}
        <main className="col-span-9">
          <div className="glass-strong p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-6 text-indigo-900 dark:text-indigo-100">
              {folderId ? '폴더 노트' : '모든 노트'}
            </h1>
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
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <Skeleton className="h-screen" />
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  )
}
