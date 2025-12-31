import { create } from 'zustand'
import type { FilterGroup, FilterCondition } from '@/lib/filterEngine'

interface FilterState {
  // 현재 활성화된 필터
  activeFilters: FilterGroup

  // 필터 추가
  addCondition: (condition: FilterCondition) => void

  // 필터 제거
  removeCondition: (index: number) => void

  // 필터 수정
  updateCondition: (index: number, condition: FilterCondition) => void

  // AND/OR 연산자 변경
  setOperator: (operator: 'AND' | 'OR') => void

  // 전체 필터 설정 (SavedView 불러오기용)
  setFilters: (filters: FilterGroup) => void

  // 필터 초기화
  resetFilters: () => void

  // 필터가 비어있는지 확인
  isEmpty: () => boolean
}

const initialFilters: FilterGroup = {
  operator: 'AND',
  conditions: [],
}

export const useFilterStore = create<FilterState>((set, get) => ({
  activeFilters: initialFilters,

  addCondition: (condition) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        conditions: [...state.activeFilters.conditions, condition],
      },
    }))
  },

  removeCondition: (index) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        conditions: state.activeFilters.conditions.filter((_, i) => i !== index),
      },
    }))
  },

  updateCondition: (index, condition) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        conditions: state.activeFilters.conditions.map((c, i) => (i === index ? condition : c)),
      },
    }))
  },

  setOperator: (operator) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        operator,
      },
    }))
  },

  setFilters: (filters) => {
    set({ activeFilters: filters })
  },

  resetFilters: () => {
    set({ activeFilters: initialFilters })
  },

  isEmpty: () => {
    return get().activeFilters.conditions.length === 0
  },
}))
