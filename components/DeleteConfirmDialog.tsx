'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useDeleteTemplate } from '@/lib/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface DeleteConfirmDialogProps {
  templateId: string
  templateName: string
  children: ReactNode
}

export function DeleteConfirmDialog({
  templateId,
  templateName,
  children,
}: DeleteConfirmDialogProps) {
  const deleteTemplate = useDeleteTemplate()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteTemplate.mutateAsync(templateId)
      toast.success('템플릿이 삭제되었습니다')
      setOpen(false)
    } catch (error) {
      console.error('Delete template error:', error)
      toast.error('템플릿 삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>템플릿 삭제</DialogTitle>
          <DialogDescription>
            정말 삭제하시겠습니까? "{templateName}" 템플릿이 완전히 삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              취소
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
