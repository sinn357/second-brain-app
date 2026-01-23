'use client'

import { useFolders, useCreateFolder, useDeleteFolder, useUpdateFolder } from '@/lib/hooks/useFolders'
import { useNotes } from '@/lib/hooks/useNotes'
import { Skeleton } from '@/components/ui/skeleton'
import { Folder, ChevronRight, ChevronDown, Plus, Minus } from 'lucide-react'
import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'

interface FolderNode {
  id: string
  name: string
  parentId: string | null
  position: number
  isDefault: boolean
  children?: FolderNode[]
  _count?: {
    notes: number
  }
}

function FolderItem({
  folder,
  level = 0,
  onDelete,
  onRenameStart,
  editingFolderId,
  editingName,
  onEditingNameChange,
  onRenameConfirm,
  onRenameCancel,
  onContextMenu,
  onNavigate,
  selectedFolderId,
}: {
  folder: FolderNode
  level?: number
  onDelete: (id: string, name: string) => void
  onRenameStart: (folder: FolderNode) => void
  editingFolderId: string | null
  editingName: string
  onEditingNameChange: (value: string) => void
  onRenameConfirm: (folder: FolderNode) => void
  onRenameCancel: () => void
  onContextMenu: (event: React.MouseEvent, folder: FolderNode) => void
  onNavigate: (folderId: string) => void
  selectedFolderId?: string
}) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = folder.children && folder.children.length > 0
  const isEditing = editingFolderId === folder.id
  const clickTimerRef = useRef<number | null>(null)
  const isSelected = selectedFolderId === folder.id

  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `folder:${folder.id}`,
    data: { type: 'folder', id: folder.id, parentId: folder.parentId, isDefault: folder.isDefault },
    disabled: folder.isDefault,
  })

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `folder-drop:${folder.id}`,
    data: { type: 'folder-drop', id: folder.id },
  })

  return (
    <div>
      <div
        ref={setSortableNodeRef}
        style={{
          paddingLeft: `${level * 10 + 8}px`,
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
        }}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          isSelected ? 'bg-indigo-100 dark:bg-indigo-800/70' : 'hover:bg-indigo-50 dark:hover:bg-indigo-800/60'
        }`}
        onContextMenu={(event) => onContextMenu(event, folder)}
        {...attributes}
        {...listeners}
      >
        {hasChildren ? (
          <button onClick={() => setIsOpen(!isOpen)} className="p-0.5 text-indigo-500 dark:text-indigo-300">
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <span
          className={`text-indigo-500 dark:text-indigo-300 ${folder.isDefault ? 'opacity-70' : ''}`}
          aria-hidden="true"
        >
          <Folder className="h-4 w-4" />
        </span>
        {isEditing ? (
          <div className="flex-1">
            <Input
              value={editingName}
              onChange={(event) => onEditingNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onRenameConfirm(folder)
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  onRenameCancel()
                }
              }}
              onBlur={() => onRenameConfirm(folder)}
              className="h-7 text-xs dark:bg-indigo-900 dark:text-indigo-100"
              autoFocus
            />
          </div>
        ) : (
            <button
              type="button"
              onClick={() => {
                if (clickTimerRef.current) {
                  window.clearTimeout(clickTimerRef.current)
                  clickTimerRef.current = null
                  if (!folder.isDefault) {
                    onRenameStart(folder)
                  }
                  return
                }
                clickTimerRef.current = window.setTimeout(() => {
                  onNavigate(folder.id)
                  clickTimerRef.current = null
                }, 180)
              }}
              className="text-left w-full text-sm text-indigo-900 dark:text-indigo-100"
            >
              {folder.name}
            </button>
        )}
        {folder._count && (
          <span className="text-[11px] text-indigo-500 dark:text-indigo-300">{folder._count.notes}</span>
        )}
        <div
          ref={setDroppableNodeRef}
          className={`ml-1 h-3.5 w-3.5 rounded-full border border-dashed transition-colors ${
            isOver
              ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/60'
              : 'border-transparent bg-transparent'
          }`}
          title="폴더 안으로 이동"
        />
      </div>

      {hasChildren && isOpen && (
        <SortableContext
          items={(folder.children ?? []).map((child) => `folder:${child.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {folder.children?.map((child) => (
              <FolderItem
                key={child.id}
                folder={child}
                level={level + 1}
                onDelete={onDelete}
                onRenameStart={onRenameStart}
                editingFolderId={editingFolderId}
                editingName={editingName}
                onEditingNameChange={onEditingNameChange}
                onRenameConfirm={onRenameConfirm}
                onRenameCancel={onRenameCancel}
                onContextMenu={onContextMenu}
                onNavigate={onNavigate}
                selectedFolderId={selectedFolderId}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

export function FolderTree({ selectedFolderId }: { selectedFolderId?: string }) {
  const router = useRouter()
  const { data: folders = [], isLoading, error } = useFolders()
  const { data: allNotes = [] } = useNotes()
  const createFolder = useCreateFolder()
  const deleteFolder = useDeleteFolder()
  const [newFolderName, setNewFolderName] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [hasSelectedParent, setHasSelectedParent] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const newFolderInputRef = useRef<HTMLInputElement | null>(null)
  const updateFolder = useUpdateFolder(editingFolderId ?? '')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    folder: FolderNode
  } | null>(null)
  const { setNodeRef: setRootDropRef, isOver: isRootOver } = useDroppable({
    id: 'folder-drop:root',
    data: { type: 'folder-drop', id: null },
  })

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    const handleScroll = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  const depthMap = useMemo(() => {
    const map = new Map<string, number>()

    const calculateDepth = (id: string | null): number => {
      if (!id) return 0
      if (map.has(id)) return map.get(id) ?? 0
      const folder = folders.find((f) => f.id === id)
      if (!folder) return 0
      const depth = calculateDepth(folder.parentId) + 1
      map.set(id, depth)
      return depth
    }

    folders.forEach((folder) => calculateDepth(folder.id))
    return map
  }, [folders])

  const getDepth = useCallback((id: string | null): number => {
    if (!id) return 0
    return depthMap.get(id) ?? 0
  }, [depthMap])

  const parentDepth = parentId ? getDepth(parentId) : 0
  const nextDepth = parentDepth + 1
  const isDepthLimitReached = nextDepth > 5

  const handleCreate = async () => {
    if (!newFolderName.trim()) {
      toast.error('폴더 이름을 입력하세요')
      return
    }

    if (isDepthLimitReached) {
      toast.error('폴더는 최대 5단계까지만 만들 수 있습니다')
      return
    }

    setIsCreating(true)
    try {
      const siblingCount = folders.filter((f) => f.parentId === parentId).length
      await createFolder.mutateAsync({
        name: newFolderName.trim(),
        parentId,
        position: siblingCount,
      })
      setNewFolderName('')
      setParentId(null)
      setShowCreate(false)
      toast.success('폴더가 생성되었습니다')
    } catch (createError) {
      console.error('Create folder error:', createError)
      toast.error('폴더 생성에 실패했습니다')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 폴더를 삭제하시겠습니까? 폴더 내 노트는 삭제되지 않습니다.`)) {
      return
    }

    try {
      await deleteFolder.mutateAsync(id)
      toast.success('폴더가 삭제되었습니다')
    } catch (deleteError) {
      console.error('Delete folder error:', deleteError)
      toast.error('폴더 삭제에 실패했습니다')
    }
  }

  const handleRenameStart = (folder: FolderNode) => {
    if (folder.isDefault) return
    setEditingFolderId(folder.id)
    setEditingFolderName(folder.name)
    setContextMenu(null)
  }

  const handleRenameCancel = () => {
    setEditingFolderId(null)
    setEditingFolderName('')
  }

  const handleRenameConfirm = async (folder: FolderNode) => {
    if (!editingFolderId) return
    const nextName = editingFolderName.trim()
    if (!nextName || nextName === folder.name) {
      handleRenameCancel()
      return
    }

    try {
      await updateFolder.mutateAsync({
        name: nextName,
      })
      toast.success('폴더 이름이 변경되었습니다')
    } catch (renameError) {
      console.error('Rename folder error:', renameError)
      toast.error('폴더 이름 변경에 실패했습니다')
    } finally {
      handleRenameCancel()
    }
  }

  const handleContextMenu = (event: React.MouseEvent, folder: FolderNode) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY, folder })
  }

  const handleCreateChildFolder = async (folder: FolderNode) => {
    setContextMenu(null)
    const parentDepth = getDepth(folder.id)
    if (parentDepth + 1 > 5) {
      toast.error('폴더는 최대 5단계까지만 만들 수 있습니다')
      return
    }

    setParentId(folder.id)
    setHasSelectedParent(true)
    setNewFolderName('')
    setShowCreate(true)
    setTimeout(() => {
      newFolderInputRef.current?.focus()
    }, 0)
  }

  const handleNavigate = (folderId: string) => {
    router.push(`/notes?folderId=${folderId}`)
  }
  const handleNavigateAll = () => {
    router.push('/notes?folderId=all')
  }

  const defaultFolder = useMemo(
    () => folders.find((folder) => folder.isDefault) ?? null,
    [folders]
  )

  useEffect(() => {
    if (hasSelectedParent) return
    if (!parentId && defaultFolder?.id) {
      setParentId(defaultFolder.id)
    }
  }, [hasSelectedParent, parentId, defaultFolder?.id])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-sm mb-2">Folders</h3>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Error loading folders
      </div>
    )
  }

  // 최상위 폴더만 필터링 (parentId가 null인 것)
  const rootFolders = folders.filter((f) => f.parentId === null)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">Folders</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreate((prev) => !prev)}
          className="h-7 w-7 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-800"
          aria-label="새 폴더 추가"
        >
          {showCreate ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {showCreate && (
        <div className="space-y-2 mb-3">
          <Select
            value={parentId ?? '__root__'}
            onValueChange={(value) => {
              setHasSelectedParent(true)
              setParentId(value === '__root__' ? null : value)
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="상위 폴더" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__root__">최상위</SelectItem>
              {folders.map((folder) => {
                const depth = getDepth(folder.id)
                return (
                  <SelectItem key={folder.id} value={folder.id}>
                    {'—'.repeat(depth)} {folder.name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="새 폴더 이름"
              onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
              className="h-8 text-xs dark:bg-indigo-900 dark:text-indigo-100"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isCreating || isDepthLimitReached}
              className="h-8 px-3 gradient-mesh hover-glow text-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="text-[11px] text-indigo-500 dark:text-indigo-300">
            {isDepthLimitReached
              ? '최대 깊이에 도달했습니다.'
              : `폴더 깊이: ${nextDepth}/5`}
          </div>
        </div>
      )}

      <div className="mb-2">
        <button
          type="button"
          onClick={handleNavigateAll}
          className={`flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            !selectedFolderId
              ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-800/70 dark:text-indigo-100'
              : 'text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-800/60'
          }`}
        >
          <Folder className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
          <span className="flex-1 text-left">전체</span>
          <span className="text-[11px] text-indigo-500 dark:text-indigo-300">{allNotes.length}</span>
        </button>
      </div>

      <div
        ref={setRootDropRef}
        className={`mb-2 flex items-center justify-between px-3 py-2 rounded-md border border-dashed text-xs transition-colors ${
          isRootOver
            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-200'
            : 'border-indigo-200 text-indigo-500 dark:border-indigo-800 dark:text-indigo-300'
        }`}
      >
        <span>최상위로 이동</span>
        <span className="text-[11px]">드롭</span>
      </div>

      <SortableContext
        items={rootFolders.map((folder) => `folder:${folder.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1 rounded-md">
          {rootFolders.length === 0 ? (
            <p className="text-sm text-indigo-500 dark:text-indigo-300">폴더가 없습니다</p>
          ) : (
            rootFolders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                onDelete={handleDelete}
                onRenameStart={handleRenameStart}
                editingFolderId={editingFolderId}
                editingName={editingFolderName}
                onEditingNameChange={setEditingFolderName}
                onRenameConfirm={handleRenameConfirm}
                onRenameCancel={handleRenameCancel}
                onContextMenu={handleContextMenu}
                onNavigate={handleNavigate}
                selectedFolderId={selectedFolderId}
              />
            ))
          )}
        </div>
      </SortableContext>
      {contextMenu && (
        <div
          className="fixed z-50 w-44 rounded-md border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-indigo-950 shadow-lg py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={() => handleCreateChildFolder(contextMenu.folder)}
            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200"
          >
            새로운 폴더
          </button>
          <button
            type="button"
            onClick={() => handleRenameStart(contextMenu.folder)}
            disabled={contextMenu.folder.isDefault}
            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            폴더 이름변경
          </button>
          <button
            type="button"
            onClick={() => handleDelete(contextMenu.folder.id, contextMenu.folder.name)}
            disabled={contextMenu.folder.isDefault}
            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            폴더 삭제
          </button>
        </div>
      )}
    </div>
  )
}
