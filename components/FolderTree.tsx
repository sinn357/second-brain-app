'use client'

import { useFolders, useCreateFolder, useDeleteFolder, useUpdateFolder } from '@/lib/hooks/useFolders'
import { Skeleton } from '@/components/ui/skeleton'
import { Folder, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface FolderNode {
  id: string
  name: string
  parentId: string | null
  position: number
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
}) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = folder.children && folder.children.length > 0
  const isEditing = editingFolderId === folder.id
  const clickTimerRef = useRef<number | null>(null)

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800/60"
        onContextMenu={(event) => onContextMenu(event, folder)}
        style={{ paddingLeft: `${level * 10 + 8}px` }}
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

        <Folder className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
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
                  onRenameStart(folder)
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
      </div>

      {hasChildren && isOpen && (
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree() {
  const router = useRouter()
  const { data: folders = [], isLoading, error } = useFolders()
  const createFolder = useCreateFolder()
  const deleteFolder = useDeleteFolder()
  const [newFolderName, setNewFolderName] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const updateFolder = useUpdateFolder(editingFolderId ?? '')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    folder: FolderNode
  } | null>(null)

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
    const name = prompt('새 폴더 이름을 입력하세요')
    if (!name?.trim()) return

    const parentDepth = getDepth(folder.id)
    if (parentDepth + 1 > 5) {
      toast.error('폴더는 최대 5단계까지만 만들 수 있습니다')
      return
    }

    try {
      const siblingCount = folders.filter((f) => f.parentId === folder.id).length
      await createFolder.mutateAsync({
        name: name.trim(),
        parentId: folder.id,
        position: siblingCount,
      })
      toast.success('폴더가 생성되었습니다')
    } catch (createError) {
      console.error('Create child folder error:', createError)
      toast.error('폴더 생성에 실패했습니다')
    }
  }

  const handleNavigate = (folderId: string) => {
    router.push(`/notes?folderId=${folderId}`)
  }

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
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showCreate && (
        <div className="space-y-2 mb-3">
          <Select value={parentId ?? '__root__'} onValueChange={(value) => setParentId(value === '__root__' ? null : value)}>
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

      {rootFolders.length === 0 ? (
        <p className="text-sm text-indigo-500 dark:text-indigo-300">폴더가 없습니다</p>
      ) : (
        <div className="space-y-1">
          {rootFolders.map((folder) => (
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
            />
          ))}
        </div>
      )}
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
            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200"
          >
            폴더 이름변경
          </button>
          <button
            type="button"
            onClick={() => handleDelete(contextMenu.folder.id, contextMenu.folder.name)}
            className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-red-600"
          >
            폴더 삭제
          </button>
        </div>
      )}
    </div>
  )
}
