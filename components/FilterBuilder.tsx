'use client'

import { useState } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useProperties } from '@/lib/hooks/useProperties'
import { useTags } from '@/lib/hooks/useTags'
import { useFolders } from '@/lib/hooks/useFolders'
import { useSavedViews, useCreateSavedView, useDeleteSavedView } from '@/lib/hooks/useFilters'
import { PropertyFilterItem } from '@/components/PropertyFilterItem'
import { FilterConditionToggle } from '@/components/FilterConditionToggle'
import { SavedViewDialog } from '@/components/SavedViewDialog'
import { SavedViewButton } from '@/components/SavedViewButton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Plus, Filter } from 'lucide-react'
import { toast } from 'sonner'
import type { FilterCondition } from '@/lib/filterEngine'

export function FilterBuilder() {
  const {
    activeFilters,
    addCondition,
    removeCondition,
    updateCondition,
    setOperator,
    setFilters,
    resetFilters,
    isEmpty,
  } = useFilterStore()

  const { data: properties = [] } = useProperties()
  const { data: tags = [] } = useTags()
  const { data: folders = [] } = useFolders()
  const { data: savedViews = [] } = useSavedViews()
  const createSavedView = useCreateSavedView()
  const deleteSavedView = useDeleteSavedView()

  const [activeViewId, setActiveViewId] = useState<string | null>(null)

  const systemProperties = [
    {
      id: 'sys:title',
      name: '제목',
      type: 'text',
      group: 'system' as const,
    },
    {
      id: 'sys:body',
      name: '본문',
      type: 'text',
      group: 'system' as const,
    },
    {
      id: 'sys:folder',
      name: '폴더',
      type: 'folder',
      options: folders.map((folder) => folder.name),
      group: 'system' as const,
    },
    {
      id: 'sys:tag',
      name: '태그',
      type: 'tag',
      options: tags.map((tag) => tag.name),
      group: 'system' as const,
    },
    {
      id: 'sys:createdAt',
      name: '생성일',
      type: 'date',
      group: 'system' as const,
    },
    {
      id: 'sys:updatedAt',
      name: '수정일',
      type: 'date',
      group: 'system' as const,
    },
    {
      id: 'sys:hasLinks',
      name: '링크 있음',
      type: 'boolean',
      group: 'system' as const,
    },
  ]

  const availableProperties = [
    ...systemProperties,
    ...properties.map((prop) => ({ ...prop, group: 'property' as const })),
  ]

  // 새 필터 조건 추가 (기본값)
  const handleAddCondition = () => {
    const firstProperty = availableProperties.find((prop) => prop.group === 'property')
      ?? availableProperties[0]

    if (!firstProperty) {
      toast.error('필터를 추가할 수 없습니다')
      return
    }

    let newCondition: FilterCondition

    if (firstProperty.type === 'multi_select' || firstProperty.type === 'tag') {
      newCondition = { propertyId: firstProperty.id, operator: 'contains', value: '' }
    } else if (firstProperty.type === 'date') {
      newCondition = { propertyId: firstProperty.id, operator: 'after', value: '' }
    } else if (firstProperty.type === 'checkbox' || firstProperty.type === 'boolean') {
      newCondition = { propertyId: firstProperty.id, operator: 'is_checked', value: undefined }
    } else {
      newCondition = { propertyId: firstProperty.id, operator: 'equals', value: '' }
    }

    addCondition(newCondition)
  }

  // SavedView 저장
  const handleSaveView = async (input: { name: string; description: string | null }) => {
    if (isEmpty()) {
      toast.error('저장할 필터 조건이 없습니다')
      return
    }

    await createSavedView.mutateAsync({
      name: input.name,
      description: input.description ?? undefined,
      filters: activeFilters,
    })
  }

  // SavedView 불러오기
  const handleLoadView = (viewId: string) => {
    const view = savedViews.find((v) => v.id === viewId)
    if (view) {
      setFilters(view.filters)
      setActiveViewId(viewId)
      toast.success(`"${view.name}" 뷰를 불러왔습니다`)
    }
  }

  // SavedView 삭제
  const handleDeleteView = async (viewId: string) => {
    try {
      await deleteSavedView.mutateAsync(viewId)
      if (activeViewId === viewId) {
        setActiveViewId(null)
      }
      toast.success('뷰가 삭제되었습니다')
    } catch (error) {
      toast.error('뷰 삭제에 실패했습니다')
    }
  }

  return (
    <Card className="p-4 space-y-4 glass-strong">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100">필터</h3>
        </div>

        <div className="flex gap-2">
          {!isEmpty() && (
            <>
              <SavedViewDialog filters={activeFilters} onSave={handleSaveView}>
                <Button variant="outline" size="sm">
                  저장
                </Button>
              </SavedViewDialog>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                초기화
              </Button>
            </>
          )}
        </div>
      </div>

      {/* AND/OR 토글 */}
      {activeFilters.conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">조건 연산:</span>
          <FilterConditionToggle value={activeFilters.operator} onChange={setOperator} />
        </div>
      )}

      {/* 현재 필터 조건들 */}
      {activeFilters.conditions.length > 0 && (
        <div className="space-y-2">
          {activeFilters.conditions.map((condition, index) => (
            <PropertyFilterItem
              key={index}
              condition={condition}
              properties={availableProperties}
              onChange={(nextCondition) => updateCondition(index, nextCondition)}
              onRemove={() => removeCondition(index)}
              className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded"
            />
          ))}
        </div>
      )}

      {/* 필터 추가 버튼 */}
      <div className="pt-2 border-t">
        <Button onClick={handleAddCondition} size="sm" className="gradient-mesh hover-glow text-white">
          <Plus className="h-4 w-4 mr-1" />
          필터 조건 추가
        </Button>
      </div>

      {/* 저장된 뷰 목록 */}
      {savedViews.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">저장된 뷰</h4>
          <div className="space-y-1">
            {savedViews.map((view) => (
              <SavedViewButton
                key={view.id}
                name={view.name}
                description={view.description}
                isActive={activeViewId === view.id}
                onClick={() => handleLoadView(view.id)}
                onDelete={() => handleDeleteView(view.id)}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
