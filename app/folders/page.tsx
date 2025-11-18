'use client'

import { useState } from 'react'
import { useFolders, useCreateFolder, useDeleteFolder } from '@/lib/hooks/useFolders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Folder, Plus, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function FoldersPage() {
  const { data: folders = [], isLoading } = useFolders()
  const createFolder = useCreateFolder()
  const deleteFolder = useDeleteFolder()
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!newFolderName.trim()) {
      alert('폴더 이름을 입력하세요')
      return
    }

    setIsCreating(true)
    try {
      await createFolder.mutateAsync({
        name: newFolderName,
        parentId: null,
        position: folders.length,
      })
      setNewFolderName('')
    } catch (error) {
      console.error('Create folder error:', error)
      alert('폴더 생성에 실패했습니다')
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
    } catch (error) {
      console.error('Delete folder error:', error)
      alert('폴더 삭제에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Folders</h1>

        {/* 새 폴더 생성 */}
        <Card className="p-4 mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="새 폴더 이름"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </Card>

        {/* 폴더 목록 */}
        <div className="space-y-2">
          {folders.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              폴더가 없습니다. 새 폴더를 만들어보세요!
            </Card>
          ) : (
            folders.map((folder) => (
              <Card key={folder.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
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
