import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TemplateInput, TemplateUpdateInput } from '@/lib/validations/template'
import type { Template } from '@prisma/client'

interface TemplatesResponse {
  success: boolean
  templates: Template[]
  error?: string
}

interface TemplateResponse {
  success: boolean
  template: Template
  error?: string
}

// 템플릿 목록 조회
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await fetch('/api/templates')
      const data: TemplatesResponse = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch templates')
      }

      return data.templates
    },
  })
}

// 템플릿 생성
export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TemplateInput) => {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result: TemplateResponse = await res.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create template')
      }

      return result.template
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

// 템플릿 수정
export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TemplateUpdateInput) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result: TemplateResponse = await res.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update template')
      }

      return result.template
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

// 템플릿 삭제
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete template')
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
