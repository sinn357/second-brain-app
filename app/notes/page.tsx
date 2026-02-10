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
import { Trash2, FolderOpen, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { VersionHistoryPanel } from '@/components/VersionHistoryPanel'
import { useFolders } from '@/lib/hooks/useFolders'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ThinkingPanel } from '@/components/ThinkingPanel'
import { ThinkingButton } from '@/components/ThinkingButton'
import { AICommandMenu } from '@/components/AICommandMenu'
import { AIResultPanel } from '@/components/AIResultPanel'
import { useNoteAI } from '@/lib/hooks/useNoteAI'
import type { AICommand } from '@/lib/ai/types'
import type { Folder } from '@/lib/contracts/entities'

const AUTO_SAVE_DELAY = 500 // ms
const MIN_LIST_WIDTH = 240
const MIN_EDITOR_WIDTH = 360
const RESIZE_HANDLE_WIDTH = 8
const COLLAPSED_COLUMN_WIDTH = 56

function NotesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const folderIdParam = searchParams.get('folderId')
  const isAllFolders = folderIdParam === 'all'
  const folderId = !folderIdParam || isAllFolders ? undefined : folderIdParam
  const noteId = searchParams.get('noteId') || undefined
  const { data } = useFolders()
  const folders = (data ?? []) as Folder[]
  const { data: note, isLoading: isNoteLoading } = useNote(noteId || '')
  const updateNote = useUpdateNote(noteId || '')
  const deleteNote = useDeleteNote()
  const parseLinks = useParseLinks()
  const queryClient = useQueryClient()
  const [showAIResult, setShowAIResult] = useState(false)
  const [aiTitle, setAITitle] = useState('')
  const {
    execute: executeAI,
    isLoading: isAILoading,
    data: aiData,
    error: aiError,
    reset: resetAI,
  } = useNoteAI({
    onSuccess: () => setShowAIResult(true),
    onError: (error) => toast.error(error.message),
  })

  const defaultFolder = useMemo(
    () => folders.find((folder) => folder.isDefault) ?? null,
    [folders]
  )
  const selectedFolder = useMemo(() => {
    if (isAllFolders) return null
    return folders.find((folder) => folder.id === folderId) ?? defaultFolder
  }, [folders, folderId, defaultFolder, isAllFolders])
  const selectedFolderId = selectedFolder?.id

  useEffect(() => {
    if (!folderIdParam && defaultFolder?.id) {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set('folderId', defaultFolder.id)
      router.replace(`/notes?${nextParams.toString()}`, { scroll: false })
    }
  }, [folderIdParam, defaultFolder?.id, searchParams, router])

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
    type: 'list' | null
    startX: number
    startList: number
  }>({ type: null, startX: 0, startList: 0 })

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
      setShowAIResult(false)
      resetAI()
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
  }, [note?.id, noteId, resetAI])

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

  useEffect(() => {
    if (noteId) {
      setMobileView('editor')
      return
    }
    setMobileView('list')
  }, [noteId])

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

  const [listWidth, setListWidth] = useState(300)
  const [isListCollapsed, setIsListCollapsed] = useState(false)
  const [isThinkingOpen, setIsThinkingOpen] = useState(false)

  const handleAICommand = (command: AICommand) => {
    if (!noteId) return
    const titles: Record<AICommand, string> = {
      summarize: '요약',
      expand: '확장',
      clarify: '명확화',
      structure: '구조화',
      tagSuggest: '태그 제안',
      question: '질문 생성',
      action: '액션 제안',
    }
    setAITitle(titles[command])
    executeAI({ noteId, command })
  }

  const handleCloseAI = () => {
    setShowAIResult(false)
    resetAI()
  }

  const handleSaveAIResult = (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    const nextBody = body ? `${body}\n\n---\n\n${trimmed}\n` : `${trimmed}\n`
    setBody(nextBody)
    setEditorContent(buildEditorContent(title, nextBody))
    setShowAIResult(false)
    resetAI()
    toast.success('AI 결과를 노트에 추가했습니다')
  }

  useEffect(() => {
    if (!noteId) {
      setIsThinkingOpen(false)
      return
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsThinkingOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [noteId])

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

      const maxList =
        containerWidth - MIN_EDITOR_WIDTH - RESIZE_HANDLE_WIDTH
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
  }, [listWidth])

  const startResize = (type: 'list') => (event: React.MouseEvent) => {
    event.preventDefault()
    if (type === 'list' && isListCollapsed) {
      setIsListCollapsed(false)
    }
    resizeStateRef.current = {
      type,
      startX: event.clientX,
      startList: listWidth,
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const resolvedListWidth = isListCollapsed ? COLLAPSED_COLUMN_WIDTH : listWidth

  return (
    <div className="page-shell">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <QuickAddButton />

      {/* 모바일: 단일 컬럼 레이아웃 */}
      <div className="page-content page-content-fluid lg:hidden pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
        {mobileView === 'list' ? (
          <div className="space-y-4">
            {/* 모바일 헤더 + 폴더 버튼 */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-indigo-200/60 bg-white/90 px-3 py-2 backdrop-blur dark:border-indigo-700/50 dark:bg-indigo-950/80">
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
              <NoteList
                folderId={isAllFolders ? undefined : selectedFolderId}
                selectedId={noteId}
                onSelect={handleMobileSelectNote}
                enableSwipe
              />
            </div>
          </div>
        ) : (
          /* 모바일 에디터 뷰 */
          <div className="space-y-4">
            {/* 뒤로가기 + 저장 상태 */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-indigo-200/60 bg-white/90 px-3 py-2 backdrop-blur dark:border-indigo-700/50 dark:bg-indigo-950/80">
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
                {noteId && (
                  <AICommandMenu onCommand={handleAICommand} isLoading={isAILoading} />
                )}
                {noteId && (
                  <ThinkingButton
                    onClick={() => setIsThinkingOpen((prev) => !prev)}
                    isActive={isThinkingOpen}
                  />
                )}
                {/* 모바일 버전 히스토리 */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <History className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
                    <SheetHeader>
                      <SheetTitle>버전 히스토리</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 overflow-y-auto max-h-[calc(70vh-80px)]">
                      <VersionHistoryPanel
                        noteId={noteId!}
                        currentTitle={title}
                        currentBody={body}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
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
                    currentFolderId={selectedFolderId ?? defaultFolder?.id ?? null}
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

      {/* 데스크톱: 상단 액션 바 */}
      <div className="hidden lg:flex items-center justify-between px-6 pt-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              폴더
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] sm:w-[360px]">
            <SheetHeader>
              <SheetTitle>폴더</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto max-h-[calc(100dvh-120px)]">
              <FolderTree selectedFolderId={selectedFolderId} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="text-xs text-indigo-500 dark:text-indigo-300">
          {saveStatus === 'saving' && '저장 중...'}
          {saveStatus === 'saved' && '✓ 저장됨'}
          {saveStatus === 'error' && '⚠ 저장 실패'}
        </div>
      </div>

      {/* 데스크톱: 2컬럼 레이아웃 */}
      <div
        ref={desktopGridRef}
        className="page-content page-content-fluid hidden lg:grid gap-0"
        style={{
          gridTemplateColumns: `${resolvedListWidth}px ${RESIZE_HANDLE_WIDTH}px minmax(0, 1fr)`,
        }}
      >
        {/* 중앙: 노트 리스트 */}
        <section className={isListCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'}>
          {isListCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsListCollapsed(false)}
              className="text-indigo-600 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-800"
              aria-label="노트 목록 펼치기"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title text-indigo-900 dark:text-indigo-100">
                    {isAllFolders ? '모든 노트' : selectedFolder ? selectedFolder.name : '모든 노트'}
                  </h1>
                  <p className="page-subtitle">노트를 빠르게 탐색하고 연결하세요.</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsListCollapsed(true)}
                  className="text-indigo-600 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-800"
                  aria-label="노트 목록 접기"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <NoteList
                folderId={isAllFolders ? undefined : selectedFolderId}
                selectedId={noteId}
                onSelect={handleSelectNote}
              />
            </>
          )}
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
        <section className="px-10 py-8 min-h-[600px]">
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
                <div className="flex items-center gap-2">
                  {noteId && (
                    <AICommandMenu onCommand={handleAICommand} isLoading={isAILoading} />
                  )}
                  {noteId && (
                    <ThinkingButton
                      onClick={() => setIsThinkingOpen((prev) => !prev)}
                      isActive={isThinkingOpen}
                    />
                  )}
                  {/* 버전 히스토리 */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-1" />
                        History
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                      <SheetHeader>
                        <SheetTitle>버전 히스토리</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <VersionHistoryPanel
                          noteId={noteId!}
                          currentTitle={title}
                          currentBody={body}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
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
              </div>
              <NoteEditorAdvanced
                content={editorContent}
                onUpdate={handleEditorUpdate}
                currentNoteId={noteId}
                currentFolderId={selectedFolderId ?? defaultFolder?.id ?? null}
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
      {showAIResult && (
        <AIResultPanel
          title={aiTitle}
          result={aiData?.result || null}
          isLoading={isAILoading}
          error={aiError as Error | null}
          onClose={handleCloseAI}
          onSave={handleSaveAIResult}
        />
      )}
      {noteId && (
        <ThinkingPanel
          noteId={noteId}
          isOpen={isThinkingOpen}
          onClose={() => setIsThinkingOpen(false)}
          onNoteClick={(targetId) => {
            const nextParams = new URLSearchParams(searchParams.toString())
            nextParams.set('noteId', targetId)
            if (selectedFolderId) {
              nextParams.set('folderId', selectedFolderId)
            }
            router.push(`/notes?${nextParams.toString()}`, { scroll: false })
          }}
        />
      )}
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
