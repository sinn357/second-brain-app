import { z } from 'zod'

export const templateSchema = z.object({
  name: z.string().min(1, '템플릿 이름을 입력하세요').max(200, '템플릿 이름은 200자 이하여야 합니다'),
  content: z.string().min(1, '템플릿 내용을 입력하세요'),
  description: z.string().max(500, '설명은 500자 이하여야 합니다').optional().nullable(),
  isDefault: z.boolean().optional(),
})

export const templateUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  description: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().optional(),
})

export type TemplateInput = z.infer<typeof templateSchema>
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>
