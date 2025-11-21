'use client'

import { use, useState, useEffect } from 'react'
import { useNote, useUpdateNote, useParseLinks } from '@/lib/hooks/useNotes'
import { NoteEditorAdvanced } from '@/components/NoteEditorAdvanced'
import { BacklinkPanel } from '@/components/BacklinkPanel'
import { PropertyPanel } from '@/components/PropertyPanel'
import { FolderTree } from '@/components/FolderTree'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  params: Promise<{ id: string }>
}

export default function NoteDetailPage({ params }: Props) {
  const { id } = use(params)
  const { data: note, isLoading, error } = useNote(id)
  const updateNote = useUpdateNote(id)
  const parseLinks = useParseLinks()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // note가 로드되면 title과 body 초기화
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setBody(note.body)
    }
  }, [note])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateNote.mutateAsync({ title, body })

      // 링크 파싱
      await parseLinks.mutateAsync({ noteId: id, body })

      // 태그 파싱 및 자동 연결
      await fetch(`/api/notes/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })

      toast.success('저장되었습니다')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <Skeleton className="h-12 mb-6" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <div className="bg-white dark:bg-indigo-900 p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="dark:text-indigo-100">{error?.message || 'Note not found'}</p>
          <Link href="/notes">
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950">
      {/* 헤더 */}
      <header className="bg-white dark:bg-indigo-900 border-b border-indigo-200 dark:border-indigo-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/notes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">
          <Save className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
        </Button>
      </header>

      <div className="lg:grid lg:grid-cols-12 gap-4 lg:gap-6 p-4 sm:p-6">
        {/* 좌측: 폴더 트리 (데스크톱만) */}
        <aside className="hidden lg:block lg:col-span-2 bg-white dark:bg-indigo-900 p-4 rounded-lg shadow-sm">
          <FolderTree />
        </aside>

        {/* 중앙: 에디터 */}
        <main className="lg:col-span-7 bg-white dark:bg-indigo-900 p-4 sm:p-6 rounded-lg shadow-sm mb-4 lg:mb-0">
          {/* 제목 */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="노트 제목"
            className="text-2xl sm:text-3xl font-bold border-none p-0 mb-4 focus-visible:ring-0 dark:bg-indigo-900 dark:text-indigo-100"
          />

          {/* 에디터 */}
          <NoteEditorAdvanced
            content={body}
            onUpdate={setBody}
            currentNoteId={id}
            placeholder="내용을 입력하세요. [[노트제목]]으로 링크, #태그로 태그를 추가할 수 있습니다."
          />
        </main>

        {/* 우측: 백링크 + 속성 */}
        <aside className="lg:col-span-3 space-y-4 lg:space-y-6">
          <div className="bg-white dark:bg-indigo-900 p-4 rounded-lg shadow-sm">
            <BacklinkPanel noteId={id} />
          </div>
          <div className="bg-white dark:bg-indigo-900 p-4 rounded-lg shadow-sm">
            <PropertyPanel noteId={id} currentProperties={note.properties} />
          </div>
        </aside>
      </div>
    </div>
  )
}
