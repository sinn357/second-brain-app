'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { NoteList } from '@/components/NoteList'
import { QuickAddButton } from '@/components/QuickAddButton'
import { FolderTree } from '@/components/FolderTree'
import { useRouter, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteEditorAdvanced } from '@/components/NoteEditorAdvanced'
import { useDeleteNote, useNote, useParseLinks, useUpdateNote } from '@/lib/hooks/useNotes'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2, FolderOpen, ChevronLeft } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useFolders } from '@/lib/hooks/useFolders'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
  const { data: folders = [] } = useFolders()
  const { data: note, isLoading: isNoteLoading } = useNote(noteId || '')
  const updateNote = useUpdateNote(noteId || '')
  const deleteNote = useDeleteNote()
  const parseLinks = useParseLinks()
  const queryClient = useQueryClient()

  const defaultFolder = useMemo(
    () => folders.find((folder) => folder.isDefault) ?? null,
    [folders]
  )
  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === folderId) ?? defaultFolder,
    [folders, folderId, defaultFolder]
  )
  const selectedFolderId = selectedFolder?.id

  useEffect(() => {
    if (!folderId && defaultFolder?.id) {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set('folderId', defaultFolder.id)
      router.replace(`/notes?${nextParams.toString()}`, { scroll: false })
    }
  }, [folderId, defaultFolder?.id, searchParams, router])

  const moveNoteMutation = useMutation({
    mutationFn: async ({ id, folderId: nextFolderId }: { id: string; folderId: string | null }) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: nextFolderId }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { parentId?: string | null; position?: number } }) => {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const resData = await response.json()
      if (!resData.success) throw new Error(resData.error)
      return resData.folder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const lastSavedRef = useRef<{ noteId: string; title: string; body: string } | null>(null)
  const saveInFlight = useRef(false)
  const pendingSave = useRef<{ title: string; body: string } | null>(null)
  const activeNoteIdRef = useRef<string | null>(null)
  const isHydratingRef = useRef(false)
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
    if (selectedFolderId) {
      nextParams.set('folderId', selectedFolderId)
    }
    router.push(`/notes?${nextParams.toString()}`, { scroll: false })
  }

  const buildEditorContent = (nextTitle: string, nextBody: string) => {
    const titleLine = `# ${nextTitle ?? ''}`
    if (!nextBody) return `${titleLine}\n`
    return `${titleLine}\n\n${nextBody}`
  }

  const parseEditorContent = (markdown: string) => {
    const normalized = markdown.replace(/\r\n/g, '\n')
    const lines = normalized.split('\n')
    const firstLine = lines[0] ?? ''
    const headingMatch = firstLine.match(/^#\s+(.*)$/)
    if (headingMatch) {
      return {
        title: headingMatch[1].trim(),
        body: lines.slice(1).join('\n').replace(/^\n+/, ''),
      }
    }

    return {
      title: firstLine.trim(),
      body: lines.slice(1).join('\n').replace(/^\n+/, ''),
    }
  }

  const handleEditorUpdate = (markdown: string) => {
    if (isHydratingRef.current) {
      isHydratingRef.current = false
      return
    }
    const parsed = parseEditorContent(markdown)
    setTitle(parsed.title)
    setBody(parsed.body)
    setEditorContent(markdown)
  }

  useEffect(() => {
    if (!noteId || !note) {
      setTitle('')
      setBody('')
      setEditorContent('')
      lastSavedRef.current = null
      activeNoteIdRef.current = null
      pendingSave.current = null
      saveInFlight.current = false
      return
    }
    activeNoteIdRef.current = noteId
    isHydratingRef.current = true
    setTitle(note.title)
    setBody(note.body)
    setEditorContent(buildEditorContent(note.title, note.body))
    lastSavedRef.current = { noteId, title: note.title, body: note.body }
    pendingSave.current = null
    saveInFlight.current = false
  }, [note?.id, noteId])

  // 디바운스된 값으로 자동 저장
  useEffect(() => {
    if (!noteId || !note) return
    if (isHydratingRef.current) return
    if (activeNoteIdRef.current !== noteId) return
    if (debouncedTitle !== title || debouncedBody !== body) return
    if (!debouncedTitle.trim()) return

    // 마지막 저장된 값과 같으면 저장하지 않음
    if (
      lastSavedRef.current &&
      lastSavedRef.current.noteId === noteId &&
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
        lastSavedRef.current = { noteId, title: debouncedTitle, body: debouncedBody }
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

  const folderById = useMemo(() => {
    return new Map(folders.map((folder) => [folder.id, folder]))
  }, [folders])

  const getSiblings = (parentId: string | null) => {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .sort((a, b) => a.position - b.position)
  }

  const getMovableSiblings = (parentId: string | null) => {
    const siblings = getSiblings(parentId)
    const hasDefault = siblings.some((folder) => folder.isDefault)
    return {
      movable: siblings.filter((folder) => !folder.isDefault),
      offset: hasDefault ? 1 : 0,
    }
  }

  const isDescendant = (parentId: string, targetId: string) => {
    let current = folderById.get(targetId)?.parentId ?? null
    while (current) {
      if (current === parentId) return true
      current = folderById.get(current)?.parentId ?? null
    }
    return false
  }

  const applyFolderUpdates = async (
    updates: Array<{ id: string; data: { parentId?: string | null; position?: number } }>
  ) => {
    await Promise.all(updates.map((update) => updateFolderMutation.mutateAsync(update)))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'note' && (overType === 'folder-drop' || overType === 'folder')) {
      const noteId = active.data.current?.id as string | undefined
      const nextFolderId = over.data.current?.id as string | undefined
      if (!noteId || !nextFolderId) return
      if (active.data.current?.folderId === nextFolderId) return
      moveNoteMutation.mutate({ id: noteId, folderId: nextFolderId })
      return
    }

    if (activeType !== 'folder') return

    const activeFolderId = active.data.current?.id as string | undefined
    if (!activeFolderId) return
    const activeFolder = folderById.get(activeFolderId)
    if (!activeFolder || activeFolder.isDefault) return

    if (overType === 'folder-drop') {
      const nextParentId = over.data.current?.id as string | null
      if (nextParentId === activeFolder.parentId) return
      if (nextParentId && isDescendant(activeFolderId, nextParentId)) return

      const oldGroup = getMovableSiblings(activeFolder.parentId)
      const newGroup = getMovableSiblings(nextParentId)
      const oldSiblings = oldGroup.movable.filter((folder) => folder.id !== activeFolderId)
      const newSiblings = newGroup.movable.filter((folder) => folder.id !== activeFolderId)
      const updatedNew = [...newSiblings, activeFolder]

      const updates = [
        ...oldSiblings.map((folder, index) => ({
          id: folder.id,
          data: { position: index + oldGroup.offset },
        })),
        ...updatedNew.map((folder, index) => ({
          id: folder.id,
          data: {
            parentId: folder.id === activeFolderId ? nextParentId : folder.parentId,
            position: index + newGroup.offset,
          },
        })),
      ]

      void applyFolderUpdates(updates)
      return
    }

    if (overType === 'folder') {
      const overFolderId = over.data.current?.id as string | undefined
      if (!overFolderId) return
      const overFolder = folderById.get(overFolderId)
      if (!overFolder) return
      if (overFolder.parentId !== activeFolder.parentId) {
        if (isDescendant(activeFolderId, overFolderId)) return
        const nextParentId = overFolderId
        const oldGroup = getMovableSiblings(activeFolder.parentId)
        const newGroup = getMovableSiblings(nextParentId)
        const oldSiblings = oldGroup.movable.filter((folder) => folder.id !== activeFolderId)
        const newSiblings = newGroup.movable.filter((folder) => folder.id !== activeFolderId)
        const updatedNew = [...newSiblings, activeFolder]

        const updates = [
          ...oldSiblings.map((folder, index) => ({
            id: folder.id,
            data: { position: index + oldGroup.offset },
          })),
          ...updatedNew.map((folder, index) => ({
            id: folder.id,
            data: {
              parentId: folder.id === activeFolderId ? nextParentId : folder.parentId,
              position: index + newGroup.offset,
            },
          })),
        ]

        void applyFolderUpdates(updates)
        return
      }

      const { movable, offset } = getMovableSiblings(activeFolder.parentId)
      const siblings = movable
      const oldIndex = siblings.findIndex((folder) => folder.id === activeFolderId)
      const newIndex = siblings.findIndex((folder) => folder.id === overFolderId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(siblings, oldIndex, newIndex)
      const updates = reordered.map((folder, index) => ({
        id: folder.id,
        data: { position: index + offset },
      }))
      void applyFolderUpdates(updates)
    }
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
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <QuickAddButton />

      {/* 모바일: 단일 컬럼 레이아웃 */}
      <div className="page-content page-content-fluid lg:hidden">
        {mobileView === 'list' ? (
          <div className="space-y-4">
            {/* 모바일 헤더 + 폴더 버튼 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-title text-indigo-900 dark:text-indigo-100">
                  {selectedFolder ? selectedFolder.name : '모든 노트'}
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
                    <FolderTree selectedFolderId={selectedFolderId} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {/* 노트 리스트 (스와이프 삭제 지원) */}
            <div className="p-4">
              <NoteList folderId={selectedFolderId} selectedId={noteId} onSelect={handleMobileSelectNote} enableSwipe />
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
            <div className="p-4">
              {isNoteLoading ? (
                <Skeleton className="h-96" />
              ) : note ? (
                <div className="space-y-4">
                  <NoteEditorAdvanced
                    content={editorContent}
                    onUpdate={handleEditorUpdate}
                    currentNoteId={noteId}
                    currentFolderId={selectedFolderId ?? null}
                    placeholder="내용을 입력하세요..."
                    forceFirstHeading
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
        className="page-content page-content-fluid hidden lg:grid gap-0"
        style={{
          gridTemplateColumns: `${folderWidth}px ${RESIZE_HANDLE_WIDTH}px ${listWidth}px ${RESIZE_HANDLE_WIDTH}px minmax(0, 1fr)`,
        }}
      >
        {/* 좌측: 폴더 트리 */}
        <aside className="p-3">
          <FolderTree selectedFolderId={selectedFolderId} />
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
        <section className="p-3">
          <div className="page-header">
            <div>
              <h1 className="page-title text-indigo-900 dark:text-indigo-100">
                {selectedFolder ? selectedFolder.name : '모든 노트'}
              </h1>
              <p className="page-subtitle">노트를 빠르게 탐색하고 연결하세요.</p>
            </div>
          </div>
          <NoteList folderId={selectedFolderId} selectedId={noteId} onSelect={handleSelectNote} />
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
        <section className="p-6 min-h-[600px]">
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
              <NoteEditorAdvanced
                content={editorContent}
                onUpdate={handleEditorUpdate}
                currentNoteId={noteId}
                currentFolderId={selectedFolderId ?? null}
                placeholder="내용을 입력하세요. [[노트제목]]으로 링크, #태그로 태그를 추가할 수 있습니다."
                forceFirstHeading
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
              노트를 불러올 수 없습니다.
            </div>
          )}
        </section>
      </div>
      </DndContext>
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
