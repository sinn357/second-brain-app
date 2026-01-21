'use client'

import { use, useState, useEffect } from 'react'
import { useNote, useUpdateNote, useParseLinks, useParseTags, useDeleteNote } from '@/lib/hooks/useNotes'
import { useAutoPresence } from '@/lib/hooks/usePresence'
import { NoteEditorAdvanced } from '@/components/NoteEditorAdvanced'
import { BacklinkPanel } from '@/components/BacklinkPanel'
import { PropertyPanel } from '@/components/PropertyPanel'
import { FolderTree } from '@/components/FolderTree'
import { PresenceIndicator } from '@/components/PresenceIndicator'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeft, Save, Trash2, FolderOpen, Link2, Settings2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
  const deleteNote = useDeleteNote()
  const parseLinks = useParseLinks()
  const parseTags = useParseTags()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // 실시간 협업: Presence 자동 업데이트
  useAutoPresence(id)

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
      await parseTags.mutateAsync({ noteId: id, body })

      toast.success('저장되었습니다')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteNote.mutateAsync(id)
      toast.success('노트가 삭제되었습니다')
      router.push('/notes')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('삭제에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <Skeleton className="h-12 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="page-shell">
        <div className="page-content">
        <div className="panel p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류</h1>
          <p className="dark:text-indigo-100">{error?.message || '노트를 찾을 수 없습니다'}</p>
          <Link href="/notes">
            <Button className="mt-4 gradient-mesh hover-glow text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
          </Link>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      {/* 모바일 헤더 */}
      <header className="page-content pb-0 lg:hidden">
        <div className="panel px-4 py-3 flex items-center justify-between">
          <Link href="/notes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              목록
            </Button>
          </Link>
          <div className="flex items-center gap-1">
            {/* 모바일: 폴더 Bottom Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>폴더</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto max-h-[calc(60vh-80px)]">
                  <FolderTree />
                </div>
              </SheetContent>
            </Sheet>

            {/* 모바일: 백링크 Bottom Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Link2 className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>백링크</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto max-h-[calc(60vh-80px)]">
                  <BacklinkPanel noteId={id} />
                </div>
              </SheetContent>
            </Sheet>

            {/* 모바일: 속성 Bottom Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>속성</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto max-h-[calc(70vh-80px)]">
                  <PropertyPanel noteId={id} currentProperties={note.properties} />
                </div>
              </SheetContent>
            </Sheet>

            <Button onClick={handleSave} disabled={isSaving} size="sm" className="gradient-mesh hover-glow text-white">
              <Save className="h-4 w-4" />
            </Button>

            {/* 삭제 버튼 */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-indigo-900 w-[90vw] max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle className="dark:text-indigo-100">노트 삭제</DialogTitle>
                  <DialogDescription className="dark:text-indigo-300">
                    정말로 이 노트를 삭제하시겠습니까?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>취소</Button>
                  <Button variant="destructive" onClick={() => { handleDelete(); setIsDeleteDialogOpen(false); }}>삭제</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* 모바일 에디터 */}
      <div className="page-content lg:hidden">
        <div className="panel p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="노트 제목"
            className="text-xl font-bold border-none p-0 mb-4 focus-visible:ring-0 dark:bg-indigo-900 dark:text-indigo-100"
          />
          <NoteEditorAdvanced
            content={body}
            onUpdate={setBody}
            currentNoteId={id}
            placeholder="내용을 입력하세요..."
          />
        </div>
      </div>

      {/* 데스크톱 헤더 */}
      <header className="page-content pb-0 hidden lg:block">
        <div className="panel px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/notes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <PresenceIndicator noteId={id} />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="gradient-mesh hover-glow text-white">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-indigo-900">
              <DialogHeader>
                <DialogTitle className="dark:text-indigo-100">노트 삭제</DialogTitle>
                <DialogDescription className="dark:text-indigo-300">
                  정말로 이 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>취소</Button>
                <Button
                  variant="destructive"
                  onClick={() => { handleDelete(); setIsDeleteDialogOpen(false); }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        </div>
      </header>

      {/* 데스크톱: 3컬럼 레이아웃 */}
      <div className="page-content hidden lg:grid grid-cols-12 gap-6">
        {/* 좌측: 폴더 트리 */}
        <aside className="col-span-2 panel p-4">
          <FolderTree />
        </aside>

        {/* 중앙: 에디터 */}
        <main className="col-span-7 panel p-6">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="노트 제목"
            className="text-3xl font-bold border-none p-0 mb-4 focus-visible:ring-0 dark:bg-indigo-900 dark:text-indigo-100"
          />
          <NoteEditorAdvanced
            content={body}
            onUpdate={setBody}
            currentNoteId={id}
            placeholder="내용을 입력하세요. [[노트제목]]으로 링크, #태그로 태그를 추가할 수 있습니다."
          />
        </main>

        {/* 우측: 백링크 + 속성 */}
        <aside className="col-span-3 space-y-6">
          <div className="panel p-4">
            <BacklinkPanel noteId={id} />
          </div>
          <div className="panel p-4">
            <PropertyPanel noteId={id} currentProperties={note.properties} />
          </div>
        </aside>
      </div>
    </div>
  )
}
