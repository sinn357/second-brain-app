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
      <div className="min-h-screen bg-gray-50 p-6">
        <Skeleton className="h-12 mb-6" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p>{error?.message || 'Note not found'}</p>
          <Link href="/notes">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/notes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </header>

      <div className="grid grid-cols-12 gap-6 p-6">
        {/* 좌측: 폴더 트리 */}
        <aside className="col-span-2 bg-white p-4 rounded-lg shadow-sm">
          <FolderTree />
        </aside>

        {/* 중앙: 에디터 */}
        <main className="col-span-7 bg-white p-6 rounded-lg shadow-sm">
          {/* 제목 */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="노트 제목"
            className="text-3xl font-bold border-none p-0 mb-4 focus-visible:ring-0"
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
        <aside className="col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <BacklinkPanel noteId={id} />
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <PropertyPanel noteId={id} currentProperties={note.properties} />
          </div>
        </aside>
      </div>
    </div>
  )
}
