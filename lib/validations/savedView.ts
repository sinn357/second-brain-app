import { z } from 'zod'
import { filterGroupSchema } from '@/lib/validations/filter'

// SavedView 생성/수정 스키마
export const savedViewSchema = z.object({
  name: z.string().min(1, '뷰 이름을 입력하세요').max(200, '뷰 이름은 최대 200자입니다'),
  description: z
    .string()
    .max(500, '설명은 최대 500자입니다')
    .optional()
    .nullable(),
  filters: filterGroupSchema,
})

export const savedViewUpdateSchema = z.object({
  name: z.string().min(1, '뷰 이름을 입력하세요').max(200, '뷰 이름은 최대 200자입니다').optional(),
  description: z
    .string()
    .max(500, '설명은 최대 500자입니다')
    .optional()
    .nullable(),
  filters: filterGroupSchema.optional(),
})

// 타입 추론
export type SavedViewInput = z.infer<typeof savedViewSchema>
export type SavedViewUpdateInput = z.infer<typeof savedViewUpdateSchema>
