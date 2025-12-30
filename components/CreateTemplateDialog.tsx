'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useCreateTemplate } from '@/lib/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CreateTemplateDialogProps {
  children: ReactNode
}

export function CreateTemplateDialog({ children }: CreateTemplateDialogProps) {
  const createTemplate = useCreateTemplate()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    isDefault: false,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      isDefault: false,
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
      toast.error('템플릿 이름을 입력하세요')
      return
    }

    if (!formData.content.trim()) {
      toast.error('템플릿 내용을 입력하세요')
      return
    }

    setIsSubmitting(true)
    try {
      await createTemplate.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() ? formData.description.trim() : null,
        content: formData.content,
        isDefault: formData.isDefault,
      })
      toast.success('템플릿이 생성되었습니다')
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('Create template error:', error)
      toast.error('템플릿 생성에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>새 템플릿 만들기</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">템플릿 이름</Label>
            <Input
              id="template-name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="템플릿 이름을 입력하세요"
              className="dark:bg-indigo-800 dark:text-indigo-100"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="template-description">설명</Label>
            <Textarea
              id="template-description"
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder="템플릿 설명을 입력하세요 (선택)"
              className="min-h-[80px] dark:bg-indigo-800 dark:text-indigo-100"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="template-content">내용</Label>
            <Textarea
              id="template-content"
              value={formData.content}
              onChange={(event) => setFormData({ ...formData, content: event.target.value })}
              placeholder="템플릿 내용을 입력하세요"
              className="min-h-[160px] dark:bg-indigo-800 dark:text-indigo-100"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked === true })
              }
            />
            기본 템플릿으로 설정
          </label>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
              {isSubmitting ? '생성 중...' : '템플릿 생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
