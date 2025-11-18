import { z } from 'zod'

// Folder 생성/수정 스키마
export const folderSchema = z.object({
  name: z.string().min(1, '폴더 이름을 입력하세요').max(200, '폴더 이름은 최대 200자입니다'),
  parentId: z.string().optional().nullable(),
  position: z.number().int().nonnegative().optional().default(0),
})

export const folderUpdateSchema = z.object({
  name: z.string().min(1, '폴더 이름을 입력하세요').max(200, '폴더 이름은 최대 200자입니다').optional(),
  parentId: z.string().optional().nullable(),
  position: z.number().int().nonnegative().optional(),
})

// 타입 추론
export type FolderInput = z.infer<typeof folderSchema>
export type FolderUpdateInput = z.infer<typeof folderUpdateSchema>
