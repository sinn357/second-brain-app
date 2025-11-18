import { z } from 'zod'

// Property 타입 정의
export const propertyTypes = ['select', 'multi_select', 'date', 'checkbox'] as const
export const propertyTypeEnum = z.enum(propertyTypes)

// Property 생성/수정 스키마
export const propertySchema = z.object({
  name: z.string().min(1, '속성 이름을 입력하세요').max(200, '속성 이름은 최대 200자입니다'),
  type: propertyTypeEnum,
  options: z.array(z.string()).optional().nullable(),
}).refine(
  (data) => {
    // select 또는 multi_select인 경우 options가 필수
    if (data.type === 'select' || data.type === 'multi_select') {
      return data.options && data.options.length > 0
    }
    return true
  },
  {
    message: 'Select/Multi-Select 속성은 옵션이 필요합니다',
    path: ['options'],
  }
)

export const propertyUpdateSchema = z.object({
  name: z.string().min(1, '속성 이름을 입력하세요').max(200, '속성 이름은 최대 200자입니다').optional(),
  type: propertyTypeEnum.optional(),
  options: z.array(z.string()).optional().nullable(),
})

// NoteProperty 값 스키마
export const notePropertySchema = z.object({
  noteId: z.string(),
  propertyId: z.string(),
  value: z.any(), // JSON 타입이므로 any 사용
})

// 타입 추론
export type PropertyType = z.infer<typeof propertyTypeEnum>
export type PropertyInput = z.infer<typeof propertySchema>
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>
export type NotePropertyInput = z.infer<typeof notePropertySchema>
