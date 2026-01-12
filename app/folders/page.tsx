'use client'

import { useState } from 'react'
import { useFolders, useCreateFolder, useDeleteFolder } from '@/lib/hooks/useFolders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Folder, Plus, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function FoldersPage() {
  const { data: folders = [], isLoading } = useFolders()
  const createFolder = useCreateFolder()
  const deleteFolder = useDeleteFolder()
  const [newFolderName, setNewFolderName] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const depthMap = new Map<string, number>()
  const getDepth = (id: string | null): number => {
    if (!id) return 0
    if (depthMap.has(id)) return depthMap.get(id) ?? 0
    const folder = folders.find((f) => f.id === id)
    if (!folder) return 0
    const depth = getDepth(folder.parentId) + 1
    depthMap.set(id, depth)
    return depth
  }

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
        name: newFolderName,
        parentId,
        position: siblingCount,
      })
      setNewFolderName('')
      setParentId(null)
      toast.success('폴더가 생성되었습니다')
    } catch (error) {
      console.error('Create folder error:', error)
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
    } catch (error) {
      console.error('Delete folder error:', error)
      toast.error('폴더 삭제에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-content max-w-4xl">
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-content max-w-4xl space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title text-indigo-900 dark:text-indigo-100">Folders</h1>
            <p className="page-subtitle">폴더를 정리하고 구조를 관리하세요.</p>
          </div>
        </div>

        {/* 새 폴더 생성 */}
        <Card className="panel hover-lift hover-glow p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={parentId ?? ''} onValueChange={(value) => setParentId(value || null)}>
              <SelectTrigger className="min-w-[200px] text-sm">
                <SelectValue placeholder="상위 폴더 (선택)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">최상위</SelectItem>
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
            <Input
              placeholder="새 폴더 이름"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="dark:bg-indigo-800 dark:text-indigo-100"
            />
            <Button
              onClick={handleCreate}
              disabled={isCreating || isDepthLimitReached}
              className="gradient-mesh hover-glow text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-300">
            {isDepthLimitReached
              ? '선택한 상위 폴더는 최대 깊이에 도달했습니다.'
              : `폴더 깊이: ${nextDepth}/5`}
          </div>
        </Card>

        {/* 폴더 목록 */}
        <div className="space-y-2">
          {folders.length === 0 ? (
            <Card className="panel hover-lift hover-glow p-8 text-center text-gray-500 dark:text-indigo-300">
              폴더가 없습니다. 새 폴더를 만들어보세요!
            </Card>
          ) : (
            folders.map((folder) => (
              <Card
                key={folder.id}
                className="panel hover-lift hover-glow p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium">{folder.name}</h3>
                    <p className="text-sm text-gray-500">
                      {folder._count?.notes || 0} notes
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(folder.id, folder.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
