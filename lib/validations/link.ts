import { z } from 'zod'

// Link 생성 스키마
export const linkSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
})

// 링크 파싱 요청 스키마
export const parseLinkSchema = z.object({
  noteId: z.string(),
  body: z.string(),
})

// 타입 추론
export type LinkInput = z.infer<typeof linkSchema>
export type ParseLinkInput = z.infer<typeof parseLinkSchema>
