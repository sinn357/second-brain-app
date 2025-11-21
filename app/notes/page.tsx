'use client'

import { Suspense, useState } from 'react'
import { NoteList } from '@/components/NoteList'
import { QuickAddButton } from '@/components/QuickAddButton'
import { FolderTree } from '@/components/FolderTree'
import { useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Folder, X } from 'lucide-react'

function NotesPageContent() {
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folderId') || undefined
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950">
      <QuickAddButton />

      <div className="relative lg:grid lg:grid-cols-12 gap-6 p-4 sm:p-6">
        {/* 모바일 폴더 토글 버튼 */}
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden mb-4 bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <Folder className="h-4 w-4 mr-2" />
          {sidebarOpen ? '폴더 숨기기' : '폴더 보기'}
        </Button>

        {/* 좌측: 폴더 트리 */}
        <aside
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-3 bg-white dark:bg-indigo-900 p-4 rounded-lg shadow-sm mb-4 lg:mb-0`}
        >
          <div className="flex items-center justify-between mb-4 lg:mb-0">
            <h2 className="font-semibold text-indigo-900 dark:text-indigo-100 lg:hidden">폴더</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-indigo-700 dark:text-indigo-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <FolderTree />
        </aside>

        {/* 중앙: 노트 리스트 */}
        <main className="lg:col-span-9">
          <div className="bg-white dark:bg-indigo-900 p-4 sm:p-6 rounded-lg shadow-sm">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-indigo-900 dark:text-indigo-100">
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
