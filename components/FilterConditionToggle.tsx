'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FilterConditionToggleProps {
  value: 'AND' | 'OR'
  onChange: (value: 'AND' | 'OR') => void
  className?: string
}

export function FilterConditionToggle({ value, onChange, className }: FilterConditionToggleProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        size="sm"
        variant={value === 'AND' ? 'default' : 'outline'}
        onClick={() => onChange('AND')}
      >
        AND
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === 'OR' ? 'default' : 'outline'}
        onClick={() => onChange('OR')}
      >
        OR
      </Button>
    </div>
  )
}
