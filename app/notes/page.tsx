'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { NoteList } from '@/components/NoteList'
import { QuickAddButton } from '@/components/QuickAddButton'
import { FolderTree } from '@/components/FolderTree'
import { useRouter, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteEditorAdvanced } from '@/components/NoteEditorAdvanced'
import { Input } from '@/components/ui/input'
import { useDeleteNote, useNote, useParseLinks, useUpdateNote } from '@/lib/hooks/useNotes'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2, FolderOpen, ChevronLeft, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const AUTO_SAVE_DELAY = 500 // ms
const MIN_FOLDER_WIDTH = 160
const MIN_LIST_WIDTH = 240
const MIN_EDITOR_WIDTH = 360
const RESIZE_HANDLE_WIDTH = 8

function NotesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const folderId = searchParams.get('folderId') || undefined
  const noteId = searchParams.get('noteId') || undefined
  const { data: note, isLoading: isNoteLoading } = useNote(noteId || '')
  const updateNote = useUpdateNote(noteId || '')
  const deleteNote = useDeleteNote()
  const parseLinks = useParseLinks()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const lastSavedRef = useRef<{ title: string; body: string } | null>(null)
  const saveInFlight = useRef(false)
  const pendingSave = useRef<{ title: string; body: string } | null>(null)
  const desktopGridRef = useRef<HTMLDivElement>(null)
  const resizeStateRef = useRef<{
    type: 'folder' | 'list' | null
    startX: number
    startFolder: number
    startList: number
  }>({ type: null, startX: 0, startFolder: 0, startList: 0 })

  // Debounce title and body
  const debouncedTitle = useDebounce(title, AUTO_SAVE_DELAY)
  const debouncedBody = useDebounce(body, AUTO_SAVE_DELAY)

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

  // 디바운스된 값으로 자동 저장
  useEffect(() => {
    if (!noteId || !note) return
    if (!debouncedTitle.trim()) return

    // 마지막 저장된 값과 같으면 저장하지 않음
    if (
      lastSavedRef.current &&
      lastSavedRef.current.title === debouncedTitle &&
      lastSavedRef.current.body === debouncedBody
    ) {
      return
    }

    const runSave = async () => {
      // 이미 저장 중이면 대기열에 추가
      if (saveInFlight.current) {
        pendingSave.current = { title: debouncedTitle, body: debouncedBody }
        return
      }

      saveInFlight.current = true
      setIsSaving(true)
      setSaveStatus('saving')

      try {
        await updateNote.mutateAsync({ title: debouncedTitle, body: debouncedBody })
        await parseLinks.mutateAsync({ noteId, body: debouncedBody })
        lastSavedRef.current = { title: debouncedTitle, body: debouncedBody }
        setSaveStatus('saved')
      } catch (error) {
        console.error('Auto save error:', error)
        setSaveStatus('error')
        toast.error('자동 저장에 실패했습니다')
      } finally {
        saveInFlight.current = false
        setIsSaving(false)

        // 대기 중인 저장이 있으면 실행
        if (pendingSave.current) {
          const pending = pendingSave.current
          pendingSave.current = null
          // 다음 틱에서 저장 실행
          setTimeout(() => {
            if (
              lastSavedRef.current?.title !== pending.title ||
              lastSavedRef.current?.body !== pending.body
            ) {
              runSave()
            }
          }, 0)
        }
      }
    }

    runSave()
  }, [debouncedTitle, debouncedBody, noteId, updateNote, parseLinks])

  const handleDelete = async () => {
    if (!noteId) return
    const confirmed = window.confirm('이 노트를 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      await deleteNote.mutateAsync(noteId)
      toast.success('노트가 삭제되었습니다')
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.delete('noteId')
      router.push(`/notes?${nextParams.toString()}`, { scroll: false })
    } catch (error) {
      console.error('Delete note error:', error)
      toast.error('노트 삭제에 실패했습니다')
    }
  }

  // 모바일: 노트 선택 시 에디터 뷰로 전환
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list')

  // 노트 선택 시 모바일에서 에디터 뷰로 전환
  const handleMobileSelectNote = (id: string) => {
    handleSelectNote(id)
    setMobileView('editor')
  }

  // 모바일 뒤로가기
  const handleMobileBack = () => {
    setMobileView('list')
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('noteId')
    router.push(`/notes?${nextParams.toString()}`, { scroll: false })
  }

  const [folderWidth, setFolderWidth] = useState(180)
  const [listWidth, setListWidth] = useState(300)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const resizeState = resizeStateRef.current
      if (!resizeState.type) return

      const containerWidth = desktopGridRef.current?.clientWidth ?? 0
      if (!containerWidth) return

      const delta = event.clientX - resizeState.startX
      const clampWithin = (value: number, min: number, max: number) => {
        if (max < min) return min
        return Math.min(max, Math.max(min, value))
      }

      if (resizeState.type === 'folder') {
        const maxFolder =
          containerWidth - listWidth - MIN_EDITOR_WIDTH - RESIZE_HANDLE_WIDTH * 2
        setFolderWidth(clampWithin(resizeState.startFolder + delta, MIN_FOLDER_WIDTH, maxFolder))
        return
      }

      const maxList =
        containerWidth - folderWidth - MIN_EDITOR_WIDTH - RESIZE_HANDLE_WIDTH * 2
      setListWidth(clampWithin(resizeState.startList + delta, MIN_LIST_WIDTH, maxList))
    }

    const handleMouseUp = () => {
      if (!resizeStateRef.current.type) return
      resizeStateRef.current.type = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [folderWidth, listWidth])

  const startResize = (type: 'folder' | 'list') => (event: React.MouseEvent) => {
    event.preventDefault()
    resizeStateRef.current = {
      type,
      startX: event.clientX,
      startFolder: folderWidth,
      startList: listWidth,
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div className="page-shell">
      <QuickAddButton />

      {/* 모바일: 단일 컬럼 레이아웃 */}
      <div className="page-content lg:hidden">
        {mobileView === 'list' ? (
          <div className="space-y-4">
            {/* 모바일 헤더 + 폴더 버튼 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-title text-indigo-900 dark:text-indigo-100">
                  {folderId ? '폴더 노트' : '모든 노트'}
                </h1>
                <p className="page-subtitle">노트를 탐색하고 연결하세요.</p>
              </div>
              {/* 폴더 Bottom Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    폴더
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle>폴더 선택</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 overflow-y-auto max-h-[calc(70vh-80px)]">
                    <FolderTree />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {/* 노트 리스트 (스와이프 삭제 지원) */}
            <div className="panel p-4">
              <NoteList folderId={folderId} selectedId={noteId} onSelect={handleMobileSelectNote} enableSwipe />
            </div>
          </div>
        ) : (
          /* 모바일 에디터 뷰 */
          <div className="space-y-4">
            {/* 뒤로가기 + 저장 상태 */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleMobileBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                목록
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-500 dark:text-indigo-300">
                  {saveStatus === 'saving' && '저장 중...'}
                  {saveStatus === 'saved' && '✓ 저장됨'}
                  {saveStatus === 'error' && '⚠ 실패'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* 에디터 */}
            <div className="panel p-4">
              {isNoteLoading ? (
                <Skeleton className="h-96" />
              ) : note ? (
                <div className="space-y-4">
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="노트 제목"
                    className="text-xl font-bold border-none p-0 focus-visible:ring-0 dark:bg-indigo-900 dark:text-indigo-100"
                  />
                  <NoteEditorAdvanced
                    content={body}
                    onUpdate={setBody}
                    currentNoteId={noteId}
                    placeholder="내용을 입력하세요..."
                  />
                </div>
              ) : (
                <div className="text-center text-indigo-600 dark:text-indigo-300 py-8">
                  노트를 불러올 수 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 데스크톱: 3컬럼 레이아웃 */}
      <div
        ref={desktopGridRef}
        className="page-content hidden lg:grid gap-0"
        style={{
          gridTemplateColumns: `${folderWidth}px ${RESIZE_HANDLE_WIDTH}px ${listWidth}px ${RESIZE_HANDLE_WIDTH}px minmax(0, 1fr)`,
        }}
      >
        {/* 좌측: 폴더 트리 */}
        <aside className="panel p-3">
          <FolderTree />
        </aside>

        {/* 리사이즈 핸들: 폴더 */}
        <div
          onMouseDown={startResize('folder')}
          role="separator"
          aria-orientation="vertical"
          className="group cursor-col-resize"
        >
          <div className="mx-auto h-full w-px bg-indigo-200/70 dark:bg-indigo-700/60 group-hover:bg-indigo-400/80 transition-colors" />
        </div>

        {/* 중앙: 노트 리스트 */}
        <section className="panel p-3">
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

        {/* 리사이즈 핸들: 노트 리스트 */}
        <div
          onMouseDown={startResize('list')}
          role="separator"
          aria-orientation="vertical"
          className="group cursor-col-resize"
        >
          <div className="mx-auto h-full w-px bg-indigo-200/70 dark:bg-indigo-700/60 group-hover:bg-indigo-400/80 transition-colors" />
        </div>

        {/* 우측: 노트 편집 */}
        <section className="panel p-6 min-h-[600px]">
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
                    {saveStatus === 'saving' && '저장 중...'}
                    {saveStatus === 'saved' && '✓ 모든 변경사항 저장됨'}
                    {saveStatus === 'error' && '⚠ 저장 실패'}
                    {saveStatus === 'idle' && ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
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
