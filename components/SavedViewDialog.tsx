'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { FilterGroup } from '@/lib/filterEngine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface SavedViewDialogProps {
  children: ReactNode
  filters: FilterGroup
  onSave: (input: { name: string; description: string | null; filters: FilterGroup }) => Promise<void> | void
  defaultName?: string
  defaultDescription?: string
}

export function SavedViewDialog({
  children,
  filters,
  onSave,
  defaultName = '',
  defaultDescription = '',
}: SavedViewDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: defaultName,
    description: defaultDescription,
  })

  const resetForm = () => {
    setFormData({
      name: defaultName,
      description: defaultDescription,
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      toast.error('뷰 이름을 입력하세요')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim() ? formData.description.trim() : null,
        filters,
      })
      toast.success('뷰가 저장되었습니다')
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('Save view error:', error)
      toast.error('뷰 저장에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>뷰 저장</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Input
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="뷰 이름을 입력하세요"
              className="dark:bg-indigo-800 dark:text-indigo-100"
            />
          </div>

          <div className="grid gap-2">
            <Textarea
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder="설명을 입력하세요 (선택)"
              className="min-h-[80px] dark:bg-indigo-800 dark:text-indigo-100"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? '저장 중...' : '뷰 저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
