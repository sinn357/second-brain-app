'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { NoteList } from '@/components/NoteList'
import { QuickAddButton } from '@/components/QuickAddButton'
import { FolderTree } from '@/components/FolderTree'
import { useRouter, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteEditorAdvanced } from '@/components/NoteEditorAdvanced'
import { Input } from '@/components/ui/input'
import { useNote, useUpdateNote, useParseLinks } from '@/lib/hooks/useNotes'
import { toast } from 'sonner'

function NotesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const folderId = searchParams.get('folderId') || undefined
  const noteId = searchParams.get('noteId') || undefined
  const { data: note, isLoading: isNoteLoading } = useNote(noteId || '')
  const updateNote = useUpdateNote(noteId || '')
  const parseLinks = useParseLinks()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const lastSavedRef = useRef<{ title: string; body: string } | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSelectNote = (id: string) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('noteId', id)
    if (folderId) {
      nextParams.set('folderId', folderId)
    }
    router.push(`/notes?${nextParams.toString()}`, { scroll: false })
  }

  useEffect(() => {
    if (!note) {
      setTitle('')
      setBody('')
      lastSavedRef.current = null
      return
    }
    setTitle(note.title)
    setBody(note.body)
    lastSavedRef.current = { title: note.title, body: note.body }
  }, [note?.id])

  useEffect(() => {
    if (!noteId || !note) return

    if (
      lastSavedRef.current &&
      lastSavedRef.current.title === title &&
      lastSavedRef.current.body === body
    ) {
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        await updateNote.mutateAsync({ title, body })
        await parseLinks.mutateAsync({ noteId, body })
        lastSavedRef.current = { title, body }
      } catch (error) {
        console.error('Auto save error:', error)
        toast.error('자동 저장에 실패했습니다')
      } finally {
        setIsSaving(false)
      }
    }, 600)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, body, noteId, note, updateNote, parseLinks])

  return (
    <div className="page-shell">
      <QuickAddButton />

      <div className="page-content grid grid-cols-12 gap-6">
        {/* 좌측: 폴더 트리 */}
        <aside className="col-span-2 panel p-4">
          <FolderTree />
        </aside>

        {/* 중앙: 노트 리스트 */}
        <section className="col-span-4 panel p-4">
          <div className="page-header">
            <div>
              <h1 className="page-title text-indigo-900 dark:text-indigo-100">
                {folderId ? '폴더 노트' : '모든 노트'}
              </h1>
              <p className="page-subtitle">노트를 빠르게 탐색하고 연결하세요.</p>
            </div>
          </div>
          <NoteList folderId={folderId} selectedId={noteId} onSelect={handleSelectNote} />
        </section>

        {/* 우측: 노트 편집 */}
        <section className="col-span-6 panel p-6 min-h-[540px]">
          {!noteId ? (
            <div className="h-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
              오른쪽에서 편집할 노트를 선택하세요.
            </div>
          ) : isNoteLoading ? (
            <Skeleton className="h-96" />
          ) : note ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-indigo-500 dark:text-indigo-300">
                    {isSaving ? 'Saving...' : 'All changes saved'}
                  </div>
                </div>
              </div>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="노트 제목"
                className="text-2xl font-bold border-none p-0 focus-visible:ring-0 dark:bg-indigo-900 dark:text-indigo-100"
              />
              <NoteEditorAdvanced
                content={body}
                onUpdate={setBody}
                currentNoteId={noteId}
                placeholder="내용을 입력하세요. [[노트제목]]으로 링크, #태그로 태그를 추가할 수 있습니다."
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
              노트를 불러올 수 없습니다.
            </div>
          )}
        </section>
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
