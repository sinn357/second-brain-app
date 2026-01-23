'use client'

import { useEffect, useMemo, useState } from 'react'
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SHORTCUT_DEFINITIONS, formatShortcut } from '@/lib/shortcuts'
import { useShortcutStore } from '@/lib/stores/shortcutStore'

type ShortcutItem = {
  label: string
  description: string
  keys: string
}

type ShortcutHelpButtonProps = {
  compact?: boolean
  className?: string
  variant?: 'ghost' | 'outline' | 'default'
  size?: 'sm' | 'default' | 'lg' | 'icon'
}

export function ShortcutHelpButton({
  compact = false,
  className,
  variant = 'ghost',
  size = 'sm',
}: ShortcutHelpButtonProps) {
  const { shortcuts } = useShortcutStore()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.includes('Mac'))
  }, [])

  const appShortcuts = useMemo<ShortcutItem[]>(() => {
    return SHORTCUT_DEFINITIONS.map((def) => ({
      label: def.label,
      description: def.description,
      keys: formatShortcut(shortcuts[def.id] ?? def.defaultKeys, isMac),
    }))
  }, [shortcuts, isMac])

  const editorShortcuts = useMemo<ShortcutItem[]>(
    () => [
      { label: 'Bold', description: '굵게', keys: formatShortcut('mod+b', isMac) },
      { label: 'Italic', description: '기울임', keys: formatShortcut('mod+i', isMac) },
      { label: 'Underline', description: '밑줄', keys: formatShortcut('mod+u', isMac) },
      { label: 'Strikethrough', description: '취소선', keys: formatShortcut('mod+shift+x', isMac) },
      { label: 'Code', description: '인라인 코드', keys: formatShortcut('mod+e', isMac) },
      { label: 'Heading 1', description: '제목 1', keys: formatShortcut('mod+alt+1', isMac) },
      { label: 'Heading 2', description: '제목 2', keys: formatShortcut('mod+alt+2', isMac) },
      { label: 'Heading 3', description: '제목 3', keys: formatShortcut('mod+alt+3', isMac) },
      { label: 'Bullet List', description: '글머리표', keys: formatShortcut('mod+shift+8', isMac) },
      { label: 'Numbered List', description: '번호 목록', keys: formatShortcut('mod+shift+7', isMac) },
      { label: 'Blockquote', description: '인용문', keys: formatShortcut('mod+shift+b', isMac) },
      { label: 'Code Block', description: '코드 블록', keys: formatShortcut('mod+alt+c', isMac) },
      { label: 'Undo', description: '되돌리기', keys: formatShortcut('mod+z', isMac) },
      { label: 'Redo', description: '다시 실행', keys: formatShortcut('mod+shift+z', isMac) },
    ],
    [isMac]
  )

  const renderShortcutList = (items: ShortcutItem[]) => (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              {item.label}
            </div>
            <div className="text-xs text-indigo-500 dark:text-indigo-300">{item.description}</div>
          </div>
          <kbd className="px-2 py-1 text-xs font-mono rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
            {item.keys}
          </kbd>
        </div>
      ))}
    </div>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={compact ? 'icon' : size}
          className={className}
          aria-label="단축키 보기"
        >
          <Keyboard className="h-4 w-4" />
          {!compact && <span className="ml-2 text-sm">Shortcuts</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>단축키 모음</DialogTitle>
          <DialogDescription>자주 쓰는 단축키를 한눈에 확인하세요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3">
              App
            </div>
            {renderShortcutList(appShortcuts)}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3">
              Editor
            </div>
            {renderShortcutList(editorShortcuts)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
