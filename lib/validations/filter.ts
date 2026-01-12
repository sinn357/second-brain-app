import { z } from 'zod'

// 필터 연산자
export const filterOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'before',
  'after',
  'is_checked',
  'is_not_checked',
  'is_empty',
  'is_not_empty',
])

// 값이 필요한 조건
const valueConditionSchema = z.object({
  propertyId: z.string().min(1, '속성을 선택하세요'),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'before', 'after']),
  value: z.any(),
})

// 값이 필요 없는 조건
const checkboxConditionSchema = z.object({
  propertyId: z.string().min(1, '속성을 선택하세요'),
  operator: z.enum(['is_checked', 'is_not_checked', 'is_empty', 'is_not_empty']),
  value: z.any().optional(),
})

// 개별 필터 조건
export const filterConditionSchema = z.union([valueConditionSchema, checkboxConditionSchema])

// 필터 그룹 (AND/OR)
export const filterGroupSchema = z.object({
  operator: z.enum(['AND', 'OR']),
  conditions: z.array(filterConditionSchema),
})

// 타입 추론
export type FilterOperator = z.infer<typeof filterOperatorEnum>
export type FilterConditionInput = z.infer<typeof filterConditionSchema>
export type FilterGroupInput = z.infer<typeof filterGroupSchema>
