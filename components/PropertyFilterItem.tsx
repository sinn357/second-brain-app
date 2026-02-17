'use client'

import type { FilterCondition } from '@/lib/filterEngine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectSeparator } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface PropertyOption {
  id: string
  name: string
  type: string
  options?: string[] | null
  group?: 'system' | 'property'
}

interface PropertyFilterItemProps {
  condition: FilterCondition
  properties: PropertyOption[]
  onChange: (nextCondition: FilterCondition) => void
  onRemove?: () => void
  className?: string
}

const operatorLabels: Record<FilterCondition['operator'], string> = {
  equals: '같음',
  not_equals: '다름',
  contains: '포함',
  not_contains: '불포함',
  before: '이전',
  after: '이후',
  is_checked: '체크됨',
  is_not_checked: '체크 안됨',
  is_empty: '비어있음',
  is_not_empty: '비어있지 않음',
}

const operatorsByType: Record<string, FilterCondition['operator'][]> = {
  select: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  multi_select: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
  date: ['before', 'after'],
  checkbox: ['is_checked', 'is_not_checked'],
  text: ['contains', 'not_contains', 'equals', 'not_equals', 'is_empty', 'is_not_empty'],
  tag: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
  folder: ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
  boolean: ['is_checked', 'is_not_checked'],
}

function getOperators(type?: string) {
  return operatorsByType[type ?? ''] ?? ['equals']
}

function requiresValue(operator: FilterCondition['operator']) {
  return operator !== 'is_checked' && operator !== 'is_not_checked'
    && operator !== 'is_empty'
    && operator !== 'is_not_empty'
}

export function PropertyFilterItem({
  condition,
  properties,
  onChange,
  onRemove,
  className,
}: PropertyFilterItemProps) {
  const selectedProperty = properties.find((prop) => prop.id === condition.propertyId)
  const availableOperators = getOperators(selectedProperty?.type)
  const normalizedOperator = availableOperators.includes(condition.operator)
    ? condition.operator
    : availableOperators[0]

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find((prop) => prop.id === propertyId)
    const nextOperator = getOperators(property?.type)[0]
    onChange({
      propertyId,
      operator: nextOperator,
      value: requiresValue(nextOperator) ? '' : undefined,
    })
  }

  const handleOperatorChange = (operator: FilterCondition['operator']) => {
    onChange({
      ...condition,
      operator,
      value: requiresValue(operator) ? condition.value ?? '' : undefined,
    })
  }

  const renderValueInput = () => {
    if (!requiresValue(normalizedOperator)) {
      return null
    }

    if (!selectedProperty) {
      return (
        <Input
          value=""
          placeholder="값"
          disabled
          className="w-40 text-sm"
        />
      )
    }

    if (
      (selectedProperty.type === 'select' || selectedProperty.type === 'multi_select' || selectedProperty.type === 'tag' || selectedProperty.type === 'folder')
      && selectedProperty.options
      && selectedProperty.options.length > 0
    ) {
      const selectValue = typeof condition.value === 'string' ? condition.value : ''
      return (
        <Select
          value={selectValue}
          onValueChange={(value) => onChange({ ...condition, value })}
        >
          <SelectTrigger className="w-40 text-sm">
            <SelectValue placeholder="값 선택" />
          </SelectTrigger>
          <SelectContent>
            {selectedProperty.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    const inputValue = typeof condition.value === 'string' ? condition.value : ''
    return (
      <Input
        type={selectedProperty.type === 'date' ? 'date' : 'text'}
        value={inputValue}
        onChange={(event) => onChange({ ...condition, value: event.target.value })}
        className="w-40 text-sm"
      />
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Select value={condition.propertyId} onValueChange={handlePropertyChange}>
      <SelectTrigger className="w-44 text-sm">
        <SelectValue placeholder="속성 선택" />
      </SelectTrigger>
      <SelectContent>
        {properties.some((prop) => prop.group === 'system') && (
          <>
            <SelectLabel>System</SelectLabel>
            {properties.filter((prop) => prop.group === 'system').map((prop) => (
              <SelectItem key={prop.id} value={prop.id}>
                {prop.name}
              </SelectItem>
            ))}
            <SelectSeparator />
          </>
        )}
        {properties.filter((prop) => prop.group !== 'system').map((prop) => (
          <SelectItem key={prop.id} value={prop.id}>
            {prop.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

      <Select value={normalizedOperator} onValueChange={(value) => handleOperatorChange(value as FilterCondition['operator'])}>
        <SelectTrigger className="w-28 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((operator) => (
            <SelectItem key={operator} value={operator}>
              {operatorLabels[operator]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {renderValueInput()}

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="필터 삭제"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
