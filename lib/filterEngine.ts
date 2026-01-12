// 필터 쿼리 빌더 엔진
// AND/OR 조건을 Prisma 쿼리로 변환

import type { Prisma } from '@prisma/client'

export interface FilterCondition {
  propertyId: string
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'before'
    | 'after'
    | 'is_checked'
    | 'is_not_checked'
    | 'is_empty'
    | 'is_not_empty'
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

  if (propertyId.startsWith('sys:')) {
    return buildSystemConditionQuery(propertyId, operator, value)
  }

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

    case 'not_equals':
      return {
        NOT: {
          properties: {
            some: {
              propertyId,
              value: { equals: value },
            },
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

    case 'not_contains':
      return {
        NOT: {
          properties: {
            some: {
              propertyId,
              value: { array_contains: value },
            },
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

    case 'is_empty':
      return {
        NOT: {
          properties: {
            some: {
              propertyId,
            },
          },
        },
      }

    case 'is_not_empty':
      return {
        properties: {
          some: {
            propertyId,
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

function buildSystemConditionQuery(
  propertyId: string,
  operator: FilterCondition['operator'],
  value: any
): Prisma.NoteWhereInput {
  switch (propertyId) {
    case 'sys:title':
      return buildTextConditionQuery('title', operator, value)
    case 'sys:body':
      return buildTextConditionQuery('body', operator, value)
    case 'sys:folder':
      return buildFolderConditionQuery(operator, value)
    case 'sys:tag':
      return buildTagConditionQuery(operator, value)
    case 'sys:createdAt':
      return buildDateConditionQuery('createdAt', operator, value)
    case 'sys:updatedAt':
      return buildDateConditionQuery('updatedAt', operator, value)
    case 'sys:hasLinks':
      return buildLinkConditionQuery(operator)
    default:
      return {}
  }
}

function buildTextConditionQuery(
  field: 'title' | 'body',
  operator: FilterCondition['operator'],
  value: any
): Prisma.NoteWhereInput {
  const safeValue = String(value ?? '')

  switch (operator) {
    case 'equals':
      return { [field]: { equals: safeValue, mode: 'insensitive' } }
    case 'not_equals':
      return { NOT: { [field]: { equals: safeValue, mode: 'insensitive' } } }
    case 'contains':
      return { [field]: { contains: safeValue, mode: 'insensitive' } }
    case 'not_contains':
      return { NOT: { [field]: { contains: safeValue, mode: 'insensitive' } } }
    case 'is_empty':
      return { [field]: { equals: '' } }
    case 'is_not_empty':
      return { NOT: { [field]: { equals: '' } } }
    default:
      return {}
  }
}

function buildFolderConditionQuery(
  operator: FilterCondition['operator'],
  value: any
): Prisma.NoteWhereInput {
  const safeValue = String(value ?? '')

  switch (operator) {
    case 'equals':
      return { folder: { is: { name: { equals: safeValue } } } }
    case 'not_equals':
      return { NOT: { folder: { is: { name: { equals: safeValue } } } } }
    case 'contains':
      return { folder: { is: { name: { contains: safeValue, mode: 'insensitive' } } } }
    case 'not_contains':
      return { NOT: { folder: { is: { name: { contains: safeValue, mode: 'insensitive' } } } } }
    case 'is_empty':
      return { folder: null }
    case 'is_not_empty':
      return { folder: { isNot: null } }
    default:
      return {}
  }
}

function buildTagConditionQuery(
  operator: FilterCondition['operator'],
  value: any
): Prisma.NoteWhereInput {
  const safeValue = String(value ?? '')

  switch (operator) {
    case 'equals':
    case 'contains':
      return {
        tags: {
          some: {
            tag: { name: { equals: safeValue } },
          },
        },
      }
    case 'not_equals':
    case 'not_contains':
      return {
        NOT: {
          tags: {
            some: {
              tag: { name: { equals: safeValue } },
            },
          },
        },
      }
    case 'is_empty':
      return { tags: { none: {} } }
    case 'is_not_empty':
      return { tags: { some: {} } }
    default:
      return {}
  }
}

function buildDateConditionQuery(
  field: 'createdAt' | 'updatedAt',
  operator: FilterCondition['operator'],
  value: any
): Prisma.NoteWhereInput {
  if (!value) return {}
  const dateValue = new Date(value)

  if (operator === 'before') {
    return { [field]: { lt: dateValue } }
  }
  if (operator === 'after') {
    return { [field]: { gt: dateValue } }
  }

  return {}
}

function buildLinkConditionQuery(operator: FilterCondition['operator']): Prisma.NoteWhereInput {
  if (operator === 'is_checked') {
    return {
      OR: [
        { linksFrom: { some: {} } },
        { linksTo: { some: {} } },
      ],
    }
  }

  if (operator === 'is_not_checked') {
    return {
      AND: [
        { linksFrom: { none: {} } },
        { linksTo: { none: {} } },
      ],
    }
  }

  return {}
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
