export type ShortcutId =
  | 'command_palette'
  | 'new_note'
  | 'open_notes'
  | 'open_daily'
  | 'open_graph'
  | 'open_settings'

export type ShortcutDefinition = {
  id: ShortcutId
  label: string
  description: string
  defaultKeys: string
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    id: 'command_palette',
    label: 'Command Palette',
    description: '검색 및 빠른 이동 열기',
    defaultKeys: 'mod+k',
  },
  {
    id: 'new_note',
    label: 'New Note',
    description: '새 노트 빠른 생성',
    defaultKeys: 'mod+n',
  },
  {
    id: 'open_notes',
    label: 'Open Notes',
    description: '노트 목록으로 이동',
    defaultKeys: 'mod+shift+n',
  },
  {
    id: 'open_daily',
    label: 'Open Daily Note',
    description: '일일 노트로 이동',
    defaultKeys: 'mod+shift+d',
  },
  {
    id: 'open_graph',
    label: 'Open Graph',
    description: '그래프 뷰로 이동',
    defaultKeys: 'mod+shift+g',
  },
  {
    id: 'open_settings',
    label: 'Open Settings',
    description: '설정으로 이동',
    defaultKeys: 'mod+,',
  },
]

export function getDefaultShortcuts() {
  return SHORTCUT_DEFINITIONS.reduce<Record<ShortcutId, string>>((acc, def) => {
    acc[def.id] = def.defaultKeys
    return acc
  }, {} as Record<ShortcutId, string>)
}

function splitShortcut(shortcut: string) {
  return shortcut
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function matchShortcut(event: KeyboardEvent, shortcut: string) {
  if (!shortcut) return false

  const parts = splitShortcut(shortcut)
  const keyPart = parts.find(
    (part) => !['mod', 'shift', 'alt', 'meta', 'ctrl'].includes(part)
  )

  if (!keyPart) return false

  const requiresShift = parts.includes('shift')
  const requiresAlt = parts.includes('alt')
  const requiresMeta = parts.includes('meta')
  const requiresCtrl = parts.includes('ctrl')
  const requiresMod = parts.includes('mod')

  const hasShift = event.shiftKey
  const hasAlt = event.altKey
  const hasMeta = event.metaKey
  const hasCtrl = event.ctrlKey

  if (requiresMod && !(hasMeta || hasCtrl)) return false
  if (requiresMeta && !hasMeta) return false
  if (requiresCtrl && !hasCtrl) return false
  if (requiresShift && !hasShift) return false
  if (requiresAlt && !hasAlt) return false

  if (!requiresShift && hasShift) return false
  if (!requiresAlt && hasAlt) return false
  if (!requiresMod && !requiresMeta && !requiresCtrl && (hasMeta || hasCtrl)) return false

  return event.key.toLowerCase() === keyPart
}

export function formatShortcut(shortcut: string, isMac: boolean) {
  const parts = splitShortcut(shortcut)
  const keyPart = parts.find(
    (part) => !['mod', 'shift', 'alt', 'meta', 'ctrl'].includes(part)
  )
  if (!keyPart) return ''

  const labels: string[] = []
  if (parts.includes('mod')) labels.push(isMac ? '⌘' : 'Ctrl')
  if (parts.includes('meta')) labels.push('⌘')
  if (parts.includes('ctrl')) labels.push('Ctrl')
  if (parts.includes('shift')) labels.push('Shift')
  if (parts.includes('alt')) labels.push(isMac ? '⌥' : 'Alt')

  labels.push(keyPart.length === 1 ? keyPart.toUpperCase() : keyPart)

  return labels.join(isMac ? '' : '+')
}
