'use client'

import { useState } from 'react'
import { useProperties, useSetNoteProperty } from '@/lib/hooks/useProperties'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { NotePropertyValue, PropertyDefinition } from '@/lib/types/property'

interface PropertyPanelProps {
  noteId: string
  currentProperties?: NotePropertyValue[]
}

export function PropertyPanel({ noteId, currentProperties = [] }: PropertyPanelProps) {
  const { data: properties = [], isLoading } = useProperties()
  const setNoteProperty = useSetNoteProperty()
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-sm mb-2">Properties</h3>
        <Skeleton className="h-20" />
      </div>
    )
  }

  const handleSetProperty = async (propertyId: string, value: unknown) => {
    try {
      await setNoteProperty.mutateAsync({
        noteId,
        propertyId,
        value,
      })
      toast.success('속성이 설정되었습니다')
    } catch (error) {
      console.error('Set property error:', error)
      toast.error('속성 설정에 실패했습니다')
    }
  }

  const renderPropertyValue = (prop: PropertyDefinition) => {
    const currentValue = currentProperties.find((p) => p.propertyId === prop.id)?.value

    switch (prop.type) {
      case 'select':
        return (
          <Select
            value={typeof currentValue === 'string' ? currentValue : ''}
            onValueChange={(value) => handleSetProperty(prop.id, value)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {prop.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multi_select':
        return (
          <div className="space-y-2">
            {prop.options?.map((option: string) => {
              const selectedValues = Array.isArray(currentValue)
                ? currentValue.filter((v): v is string => typeof v === 'string')
                : []
              const selected = selectedValues.includes(option)
              return (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...selectedValues, option]
                        : selectedValues.filter((v) => v !== option)
                      handleSetProperty(prop.id, newValue)
                    }}
                  />
                  <label className="text-sm">{option}</label>
                </div>
              )
            })}
          </div>
        )

      case 'date':
        return (
          <Input
            type="date"
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => handleSetProperty(prop.id, e.target.value)}
            className="text-sm"
          />
        )

      case 'checkbox':
        return (
          <Checkbox
            checked={Boolean(currentValue)}
            onCheckedChange={(checked) => handleSetProperty(prop.id, checked)}
          />
        )

      default:
        return <span className="text-sm text-gray-500">Unknown type</span>
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-sm mb-3">Properties</h3>

      {currentProperties.length > 0 && (
        <div className="space-y-4 mb-4">
          {currentProperties.map((np) => (
            <div key={np.id}>
              <Label className="text-xs text-gray-600 mb-1 block">
                {np.property.name}
              </Label>
              {renderPropertyValue(np.property)}
            </div>
          ))}
        </div>
      )}

      {properties.length > currentProperties.length && (
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">
            속성 추가
          </Label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="속성 선택" />
            </SelectTrigger>
            <SelectContent>
              {properties
                .filter((p) => !currentProperties.find((cp) => cp.propertyId === p.id))
                .map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.name} ({prop.type})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
