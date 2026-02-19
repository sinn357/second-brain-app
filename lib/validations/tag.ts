import { z } from 'zod'

const nestedTagRegex = /^[\w가-힣_]+(\/[\w가-힣_]+)*$/

// Tag 생성/수정 스키마
export const tagSchema = z.object({
  name: z
    .string()
    .min(1, '태그 이름을 입력하세요')
    .max(100, '태그 이름은 최대 100자입니다')
    .regex(nestedTagRegex, '유효하지 않은 태그명입니다'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '올바른 hex 컬러 형식이 아닙니다').optional().nullable(),
})

export const tagUpdateSchema = z.object({
  name: z
    .string()
    .min(1, '태그 이름을 입력하세요')
    .max(100, '태그 이름은 최대 100자입니다')
    .regex(nestedTagRegex, '유효하지 않은 태그명입니다')
    .optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '올바른 hex 컬러 형식이 아닙니다').optional().nullable(),
})

// NoteTag 연결 스키마
export const noteTagSchema = z.object({
  noteId: z.string(),
  tagId: z.string(),
})

// 타입 추론
export type TagInput = z.infer<typeof tagSchema>
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>
export type NoteTagInput = z.infer<typeof noteTagSchema>
