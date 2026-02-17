'use client'

import { useMemo, useState } from 'react'
import { useCreateNote } from '@/lib/hooks/useNotes'
import { useFolders } from '@/lib/hooks/useFolders'
import { useTemplates } from '@/lib/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Folder } from '@/lib/contracts/entities'

export function QuickAddButton() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createNote = useCreateNote()
  const { data } = useFolders()
  const folders = (data ?? []) as Folder[]
  const { data: templates = [] } = useTemplates()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const defaultFolder = useMemo(
    () => folders?.find((folder) => folder.isDefault),
    [folders]
  )
  const folderIdParam = searchParams.get('folderId')
  const selectedFolderId =
    folderIdParam === 'all' ? defaultFolder?.id || null : folderIdParam || defaultFolder?.id || null

  const handleCreateWithTemplate = async (templateId: string | null) => {
    setIsCreating(true)
    try {
      let content = ''
      let title = 'Untitled'

      if (templateId) {
        const template = templates.find((t) => t.id === templateId)
        if (template) {
          // 템플릿 변수 치환
          content = template.content
            .replace(/\{\{date\}\}/g, format(new Date(), 'yyyy-MM-dd'))
            .replace(/\{\{title\}\}/g, '')
          title = `Untitled ${template.name}`
        }
      }

      const note = await createNote.mutateAsync({
        title,
        body: content,
        folderId: selectedFolderId,
      })

      setIsOpen(false)
      const nextParams = new URLSearchParams({ noteId: note.id })
      if (selectedFolderId) {
        nextParams.set('folderId', selectedFolderId)
      }
      router.push(`/notes?${nextParams.toString()}`)
    } catch (error) {
      console.error('Quick add error:', error)
      toast.error('노트 생성에 실패했습니다')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 lg:right-10 z-40 gradient-mesh hover-glow text-white shadow-lg"
        size="lg"
      >
        <Plus className="h-5 w-5 mr-2" />
        Quick Add
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 노트 만들기</DialogTitle>
            <DialogDescription>템플릿을 선택해 새 노트를 생성합니다.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {/* 빈 노트 */}
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => handleCreateWithTemplate(null)}
              disabled={isCreating}
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">빈 노트</div>
                <div className="text-sm text-gray-500">템플릿 없이 시작</div>
              </div>
            </Button>

            {/* 템플릿 목록 */}
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleCreateWithTemplate(template.id)}
                disabled={isCreating}
              >
                <FileText className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">{template.name}</div>
                  {template.description && (
                    <div className="text-sm text-gray-500">{template.description}</div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
