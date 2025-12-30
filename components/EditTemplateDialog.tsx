'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useUpdateTemplate } from '@/lib/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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

interface Template {
  id: string
  name: string
  description?: string | null
  content: string
  isDefault?: boolean
}

interface EditTemplateDialogProps {
  template: Template
  children: ReactNode
}

export function EditTemplateDialog({ template, children }: EditTemplateDialogProps) {
  const updateTemplate = useUpdateTemplate(template.id)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description ?? '',
    content: template.content,
    isDefault: Boolean(template.isDefault),
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: template.name,
        description: template.description ?? '',
        content: template.content,
        isDefault: Boolean(template.isDefault),
      })
    }
  }, [open, template])

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
      await updateTemplate.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() ? formData.description.trim() : null,
        content: formData.content,
        isDefault: formData.isDefault,
      })
      toast.success('템플릿이 수정되었습니다')
      setOpen(false)
    } catch (error) {
      console.error('Update template error:', error)
      toast.error('템플릿 수정에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>템플릿 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`edit-template-name-${template.id}`}>템플릿 이름</Label>
            <Input
              id={`edit-template-name-${template.id}`}
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="dark:bg-indigo-800 dark:text-indigo-100"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`edit-template-description-${template.id}`}>설명</Label>
            <Textarea
              id={`edit-template-description-${template.id}`}
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              className="min-h-[80px] dark:bg-indigo-800 dark:text-indigo-100"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`edit-template-content-${template.id}`}>내용</Label>
            <Textarea
              id={`edit-template-content-${template.id}`}
              value={formData.content}
              onChange={(event) => setFormData({ ...formData, content: event.target.value })}
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
              {isSubmitting ? '저장 중...' : '변경 사항 저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
