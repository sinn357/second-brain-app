'use client'

import { NoteList } from '@/components/NoteList'
import { QuickAddButton } from '@/components/QuickAddButton'
import { FolderTree } from '@/components/FolderTree'
import { useSearchParams } from 'next/navigation'

export default function NotesPage() {
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folderId') || undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <QuickAddButton />

      <div className="grid grid-cols-12 gap-6 p-6">
        {/* 좌측: 폴더 트리 */}
        <aside className="col-span-3 bg-white p-4 rounded-lg shadow-sm">
          <FolderTree />
        </aside>

        {/* 중앙: 노트 리스트 */}
        <main className="col-span-9">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold mb-6">
              {folderId ? '폴더 노트' : '모든 노트'}
            </h1>
            <NoteList folderId={folderId} />
          </div>
        </main>
      </div>
    </div>
  )
}
