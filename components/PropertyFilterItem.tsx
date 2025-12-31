'use client'

import type { FilterCondition } from '@/lib/filterEngine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface PropertyOption {
  id: string
  name: string
  type: string
  options?: string[] | null
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
  contains: '포함',
  before: '이전',
  after: '이후',
  is_checked: '체크됨',
  is_not_checked: '체크 안됨',
}

const operatorsByType: Record<string, FilterCondition['operator'][]> = {
  select: ['equals'],
  multi_select: ['contains'],
  date: ['before', 'after'],
  checkbox: ['is_checked', 'is_not_checked'],
}

function getOperators(type?: string) {
  return operatorsByType[type ?? ''] ?? ['equals']
}

function requiresValue(operator: FilterCondition['operator']) {
  return operator !== 'is_checked' && operator !== 'is_not_checked'
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

    if ((selectedProperty.type === 'select' || selectedProperty.type === 'multi_select') && selectedProperty.options) {
      return (
        <Select
          value={condition.value ?? ''}
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

    return (
      <Input
        type={selectedProperty.type === 'date' ? 'date' : 'text'}
        value={condition.value ?? ''}
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
          {properties.map((prop) => (
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
