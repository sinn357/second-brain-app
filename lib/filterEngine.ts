// 필터 쿼리 빌더 엔진
// AND/OR 조건을 Prisma 쿼리로 변환

import type { Prisma } from '@prisma/client'

export interface FilterCondition {
  propertyId: string
  operator: 'equals' | 'contains' | 'before' | 'after' | 'is_checked' | 'is_not_checked'
  value: any
}

export interface FilterGroup {
  operator: 'AND' | 'OR'
  conditions: FilterCondition[]
}

/**
 * 필터 조건을 Prisma where 절로 변환
 */
export function buildFilterQuery(filters: FilterGroup): Prisma.NoteWhereInput {
  if (filters.conditions.length === 0) {
    return {}
  }

  const conditions = filters.conditions.map((condition) => {
    return buildConditionQuery(condition)
  })

  // AND/OR 연산자에 따라 쿼리 구성
  if (filters.operator === 'AND') {
    return { AND: conditions }
  } else {
    return { OR: conditions }
  }
}

/**
 * 개별 필터 조건을 Prisma where 절로 변환
 */
function buildConditionQuery(condition: FilterCondition): Prisma.NoteWhereInput {
  const { propertyId, operator, value } = condition

  switch (operator) {
    case 'equals':
      // Select 속성: 값이 정확히 일치
      return {
        properties: {
          some: {
            propertyId,
            value: { equals: value },
          },
        },
      }

    case 'contains':
      // Multi-Select 속성: 값이 배열에 포함
      return {
        properties: {
          some: {
            propertyId,
            value: { array_contains: value },
          },
        },
      }

    case 'before':
      // Date 속성: 날짜가 value 이전
      return {
        properties: {
          some: {
            propertyId,
            value: { lt: value },
          },
        },
      }

    case 'after':
      // Date 속성: 날짜가 value 이후
      return {
        properties: {
          some: {
            propertyId,
            value: { gt: value },
          },
        },
      }

    case 'is_checked':
      // Checkbox 속성: 체크됨
      return {
        properties: {
          some: {
            propertyId,
            value: { equals: true },
          },
        },
      }

    case 'is_not_checked':
      // Checkbox 속성: 체크 안 됨
      return {
        properties: {
          some: {
            propertyId,
            value: { equals: false },
          },
        },
      }

    default:
      return {}
  }
}

/**
 * 필터가 유효한지 검증
 */
export function validateFilter(filters: FilterGroup): boolean {
  if (!filters.operator || !Array.isArray(filters.conditions)) {
    return false
  }

  if (filters.operator !== 'AND' && filters.operator !== 'OR') {
    return false
  }

  for (const condition of filters.conditions) {
    if (!condition.propertyId || !condition.operator) {
      return false
    }
  }

  return true
}
