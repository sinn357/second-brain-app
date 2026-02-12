import { z } from 'zod'

// Note 생성/수정 스키마
export const noteSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(500, '제목은 최대 500자입니다'),
  body: z.string(),
  folderId: z.string().optional().nullable(),
})

export const noteUpdateSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(500, '제목은 최대 500자입니다').optional(),
  body: z.string().optional(),
  folderId: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
  lastOpenedAt: z.coerce.date().optional().nullable(),
  manualOrder: z.number().int().optional(),
})

// 타입 추론
export type NoteInput = z.infer<typeof noteSchema>
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>
