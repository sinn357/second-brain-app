'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShortcutStore } from '@/lib/stores/shortcutStore'
import { SHORTCUT_DEFINITIONS, formatShortcut, type ShortcutId } from '@/lib/shortcuts'
import { Keyboard, RotateCcw, Search } from 'lucide-react'

// 에디터 단축키 (Tiptap)
const EDITOR_SHORTCUTS = [
  { keys: 'mod+b', label: 'Bold', description: '텍스트 굵게' },
  { keys: 'mod+i', label: 'Italic', description: '텍스트 기울임' },
  { keys: 'mod+u', label: 'Underline', description: '밑줄' },
  { keys: 'mod+shift+x', label: 'Strikethrough', description: '취소선' },
  { keys: 'mod+`', label: 'Code', description: '인라인 코드' },
  { keys: 'mod+shift+h', label: 'Highlight', description: '하이라이트' },
  { keys: 'mod+shift+1', label: 'Heading 1', description: '제목 1' },
  { keys: 'mod+shift+2', label: 'Heading 2', description: '제목 2' },
  { keys: 'mod+shift+3', label: 'Heading 3', description: '제목 3' },
  { keys: 'mod+shift+7', label: 'Ordered List', description: '번호 목록' },
  { keys: 'mod+shift+8', label: 'Bullet List', description: '글머리 기호' },
  { keys: 'mod+shift+9', label: 'Blockquote', description: '인용문' },
  { keys: 'mod+enter', label: 'Task Item', description: '체크박스 토글' },
  { keys: 'mod+z', label: 'Undo', description: '실행 취소' },
  { keys: 'mod+shift+z', label: 'Redo', description: '다시 실행' },
]

// 네비게이션 단축키 (브라우저)
const BROWSER_SHORTCUTS = [
  { keys: 'mod+l', label: 'Address Bar', description: '주소창 포커스' },
  { keys: 'mod+r', label: 'Refresh', description: '새로고침' },
  { keys: 'mod+shift+r', label: 'Hard Refresh', description: '강제 새로고침' },
  { keys: 'mod+w', label: 'Close Tab', description: '탭 닫기' },
  { keys: 'mod+t', label: 'New Tab', description: '새 탭' },
]

export default function ShortcutsPage() {
  const { shortcuts, setShortcut, resetShortcut, resetAll } = useShortcutStore()
  const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')
  const [editingId, setEditingId] = useState<ShortcutId | null>(null)
  const [recordingKeys, setRecordingKeys] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault()

    const parts: string[] = []
    if (event.metaKey || event.ctrlKey) parts.push('mod')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')

    const key = event.key.toLowerCase()
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key)
    }

    const newShortcut = parts.join('+')
    setRecordingKeys(newShortcut)
  }

  const handleKeyUp = (id: ShortcutId) => {
    if (recordingKeys && !['mod', 'shift', 'alt'].includes(recordingKeys)) {
      setShortcut(id, recordingKeys)
      setEditingId(null)
      setRecordingKeys('')
    }
  }

  const startEditing = (id: ShortcutId) => {
    setEditingId(id)
    setRecordingKeys('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setRecordingKeys('')
  }

  const filteredAppShortcuts = SHORTCUT_DEFINITIONS.filter(
    def => def.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
           def.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredEditorShortcuts = EDITOR_SHORTCUTS.filter(
    s => s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="page-shell">
      <div className="page-content max-w-4xl mx-auto">
        <div className="page-header">
          <div>
            <h1 className="page-title text-indigo-900 dark:text-indigo-100 flex items-center gap-3">
              <Keyboard className="h-8 w-8" />
              키보드 단축키
            </h1>
            <p className="page-subtitle">
              앱 전체와 에디터에서 사용할 수 있는 단축키입니다. 앱 단축키는 커스터마이징 가능합니다.
            </p>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
            <Input
              type="text"
              placeholder="단축키 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 플랫폼 표시 */}
        <div className="mb-6 flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {isMac ? '⌘ Mac' : '⊞ Windows/Linux'}
          </Badge>
          <span className="text-sm text-indigo-500 dark:text-indigo-400">
            {isMac ? 'mod = ⌘ Command' : 'mod = Ctrl'}
          </span>
        </div>

        {/* 앱 단축키 (커스터마이징 가능) */}
        <Card className="panel p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100">
              앱 단축키
            </h2>
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              모두 초기화
            </Button>
          </div>
          <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-4">
            단축키를 클릭하여 변경할 수 있습니다.
          </p>
          <div className="space-y-3">
            {filteredAppShortcuts.map((def) => (
              <div
                key={def.id}
                className="flex items-center justify-between py-2 border-b border-indigo-100 dark:border-indigo-800 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium text-indigo-900 dark:text-indigo-100">
                    {def.label}
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">
                    {def.description}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === def.id ? (
                    <>
                      <Input
                        autoFocus
                        value={recordingKeys ? formatShortcut(recordingKeys, isMac) : '키 입력...'}
                        onKeyDown={handleKeyDown}
                        onKeyUp={() => handleKeyUp(def.id)}
                        onBlur={cancelEditing}
                        className="w-32 text-center font-mono text-sm"
                        readOnly
                      />
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(def.id)}
                        className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-800 rounded font-mono text-sm hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
                      >
                        {formatShortcut(shortcuts[def.id], isMac)}
                      </button>
                      {shortcuts[def.id] !== def.defaultKeys && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetShortcut(def.id)}
                          title="기본값으로 복원"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 에디터 단축키 */}
        <Card className="panel p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
            에디터 단축키
          </h2>
          <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-4">
            노트 에디터에서 사용할 수 있는 서식 단축키입니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredEditorShortcuts.map((shortcut) => (
              <div
                key={shortcut.keys}
                className="flex items-center justify-between py-2 px-3 bg-indigo-50/50 dark:bg-indigo-900/30 rounded"
              >
                <div>
                  <span className="font-medium text-indigo-900 dark:text-indigo-100">
                    {shortcut.label}
                  </span>
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 ml-2">
                    {shortcut.description}
                  </span>
                </div>
                <kbd className="px-2 py-1 bg-white dark:bg-indigo-800 rounded border border-indigo-200 dark:border-indigo-700 font-mono text-xs">
                  {formatShortcut(shortcut.keys, isMac)}
                </kbd>
              </div>
            ))}
          </div>
        </Card>

        {/* 위키링크 & 태그 */}
        <Card className="panel p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
            위키링크 & 태그
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-indigo-50/50 dark:bg-indigo-900/30 rounded">
              <div>
                <span className="font-medium text-indigo-900 dark:text-indigo-100">Wiki Link</span>
                <span className="text-sm text-indigo-600 dark:text-indigo-400 ml-2">
                  다른 노트와 연결
                </span>
              </div>
              <kbd className="px-2 py-1 bg-white dark:bg-indigo-800 rounded border border-indigo-200 dark:border-indigo-700 font-mono text-xs">
                [[노트 제목]]
              </kbd>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-indigo-50/50 dark:bg-indigo-900/30 rounded">
              <div>
                <span className="font-medium text-indigo-900 dark:text-indigo-100">Tag</span>
                <span className="text-sm text-indigo-600 dark:text-indigo-400 ml-2">
                  태그 추가
                </span>
              </div>
              <kbd className="px-2 py-1 bg-white dark:bg-indigo-800 rounded border border-indigo-200 dark:border-indigo-700 font-mono text-xs">
                #태그이름
              </kbd>
            </div>
          </div>
        </Card>

        {/* 브라우저 단축키 참고 */}
        <Card className="panel p-6">
          <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
            브라우저 단축키 (참고)
          </h2>
          <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-4">
            웹 브라우저 기본 단축키입니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BROWSER_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.keys}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded"
              >
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {shortcut.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {shortcut.description}
                  </span>
                </div>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 font-mono text-xs text-gray-600 dark:text-gray-300">
                  {formatShortcut(shortcut.keys, isMac)}
                </kbd>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
