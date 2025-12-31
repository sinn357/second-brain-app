'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface SavedViewButtonProps {
  name: string
  description?: string | null
  isActive?: boolean
  onClick?: () => void
  onDelete?: () => void
  className?: string
}

export function SavedViewButton({
  name,
  description,
  isActive = false,
  onClick,
  onDelete,
  className,
}: SavedViewButtonProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          buttonVariants({
            variant: isActive ? 'default' : 'outline',
            size: 'sm',
            className: 'flex-1 justify-between h-auto py-3 px-4',
          })
        )}
      >
        <div className="text-left">
          <div className="font-medium">{name}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      </button>

      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          aria-label="저장된 뷰 삭제"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
