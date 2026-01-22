'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Upload, FileJson, FolderArchive, AlertCircle, CheckCircle2, Keyboard, RotateCcw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { SHORTCUT_DEFINITIONS, formatShortcut, type ShortcutId } from '@/lib/shortcuts'
import { useShortcutStore } from '@/lib/stores/shortcutStore'
import { useEditorStore } from '@/lib/stores/editorStore'

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [recordingId, setRecordingId] = useState<ShortcutId | null>(null)
  const obsidianInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const { shortcuts, setShortcut, resetShortcut, resetAll } = useShortcutStore()
  const { vimMode, setVimMode } = useEditorStore()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.includes('Mac'))
  }, [])

  useEffect(() => {
    if (!recordingId) return

    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (['shift', 'control', 'meta', 'alt'].includes(key)) return

      event.preventDefault()

      const parts: string[] = []
      if (event.metaKey || event.ctrlKey) parts.push('mod')
      if (event.shiftKey) parts.push('shift')
      if (event.altKey) parts.push('alt')
      parts.push(key)

      setShortcut(recordingId, parts.join('+'))
      setRecordingId(null)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [recordingId, setShortcut])

  // 파일 다운로드 유틸리티
  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Export 공통 로직
  const handleExport = async (
    endpoint: string,
    extension: string,
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      setIsExporting(true)
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const filename = `second-brain-${new Date().toISOString().split('T')[0]}.${extension}`
      downloadFile(blob, filename)

      toast.success(successMessage)
    } catch (error) {
      console.error(`Export ${extension} error:`, error)
      toast.error(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportMarkdown = () =>
    handleExport('/api/export/markdown', 'zip', 'Markdown ZIP 내보내기 완료', 'Markdown 내보내기 실패')

  const handleExportJSON = () =>
    handleExport('/api/export/json', 'json', 'JSON 내보내기 완료', 'JSON 내보내기 실패')

  // Import Obsidian Vault
  const handleImportObsidian = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/obsidian', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Import failed')
      }

      toast.success(`Obsidian에서 ${result.imported}개 노트 가져오기 완료`)

      if (result.errors && result.errors.length > 0) {
        console.warn('Import errors:', result.errors)
      }
    } catch (error) {
      console.error('Import Obsidian error:', error)
      toast.error('Obsidian 가져오기 실패')
    } finally {
      setIsImporting(false)
      if (obsidianInputRef.current) {
        obsidianInputRef.current.value = ''
      }
    }
  }

  // Import JSON
  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Confirm replace mode
    if (importMode === 'replace') {
      const confirmed = window.confirm(
        '⚠️ 기존 데이터가 모두 삭제되고 가져온 데이터로 대체됩니다. 계속하시겠습니까?'
      )
      if (!confirmed) {
        if (jsonInputRef.current) {
          jsonInputRef.current.value = ''
        }
        return
      }
    }

    try {
      setIsImporting(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', importMode)

      const response = await fetch('/api/import/json', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Import failed')
      }

      toast.success(`JSON 가져오기 완료 (${importMode === 'merge' ? '병합' : '교체'} 모드)`)
      console.log('Import stats:', result.stats)
    } catch (error) {
      console.error('Import JSON error:', error)
      toast.error('JSON 가져오기 실패')
    } finally {
      setIsImporting(false)
      if (jsonInputRef.current) {
        jsonInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="page-shell">
      <div className="page-content max-w-4xl space-y-6">
        {/* 헤더 */}
        <div className="page-header">
          <div>
            <h1 className="page-title text-indigo-900 dark:text-indigo-100">Settings</h1>
            <p className="page-subtitle">Export and import your data</p>
          </div>
        </div>

        {/* Export Section */}
        <Card className="panel hover-lift hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <Download className="w-5 h-5" />
              Export Data
            </CardTitle>
            <CardDescription className="dark:text-indigo-300">
              Download your notes and data for backup or migration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Markdown ZIP */}
            <div className="flex items-start justify-between p-4 panel-soft hover-lift rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FolderArchive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                    Export as Markdown ZIP
                  </h3>
                </div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Export all notes as markdown files in a ZIP archive (compatible with Obsidian)
                </p>
              </div>
              <Button
                onClick={handleExportMarkdown}
                disabled={isExporting}
                className="ml-4 gradient-mesh hover-glow text-white"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>

            {/* Export JSON */}
            <div className="flex items-start justify-between p-4 panel-soft hover-lift rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                    Export as JSON
                  </h3>
                </div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Export entire database as JSON (includes all metadata, links, and properties)
                </p>
              </div>
              <Button
                onClick={handleExportJSON}
                disabled={isExporting}
                className="ml-4 gradient-mesh hover-glow text-white"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card className="panel hover-lift hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <Upload className="w-5 h-5" />
              Import Data
            </CardTitle>
            <CardDescription className="dark:text-indigo-300">
              Import notes from Obsidian or restore from backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Import Obsidian Vault */}
            <div className="p-4 panel-soft hover-lift rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderArchive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                      Import Obsidian Vault
                    </h3>
                  </div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">
                    Upload a ZIP file containing markdown files from Obsidian
                  </p>
                </div>
              </div>
              <input
                ref={obsidianInputRef}
                type="file"
                accept=".zip"
                onChange={handleImportObsidian}
                disabled={isImporting}
                className="block w-full text-sm text-indigo-900 dark:text-indigo-100
                  file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-100 file:text-indigo-700
                  dark:file:bg-indigo-800 dark:file:text-indigo-200
                  hover:file:bg-indigo-200 dark:hover:file:bg-indigo-700
                  cursor-pointer"
              />
            </div>

            {/* Import JSON */}
            <div className="p-4 panel-soft hover-lift rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                      Import JSON Data
                    </h3>
                  </div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                    Restore from a JSON backup file
                  </p>
                </div>
              </div>

              {/* Import Mode Selection */}
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="text-sm text-indigo-900 dark:text-indigo-100 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Merge (keep existing data)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="text-sm text-indigo-900 dark:text-indigo-100 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Replace (delete all existing data)
                  </span>
                </label>
              </div>

              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                disabled={isImporting}
                className="block w-full text-sm text-indigo-900 dark:text-indigo-100
                  file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-100 file:text-indigo-700
                  dark:file:bg-indigo-800 dark:file:text-indigo-200
                  hover:file:bg-indigo-200 dark:hover:file:bg-indigo-700
                  cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Editor Settings */}
        <Card className="panel hover-lift hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <Settings2 className="w-5 h-5" />
              에디터 설정
            </CardTitle>
            <CardDescription className="dark:text-indigo-300">
              에디터 동작 방식을 커스터마이즈하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vim Mode */}
            <div className="panel-soft flex items-center justify-between px-4 py-3 rounded-lg">
              <div>
                <div className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Vim 모드
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-300">
                  에디터에서 Vim 스타일 키바인딩 사용 (h/j/k/l 이동, i 삽입, dd 삭제 등)
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={vimMode}
                  onChange={(e) => setVimMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {vimMode && (
              <div className="text-xs text-indigo-500 dark:text-indigo-400 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded">
                <strong>Vim 모드 활성화됨</strong>: ESC로 Normal 모드, i/a/o로 Insert 모드 진입.
                h/j/k/l 이동, dd 줄 삭제, yy 복사, p 붙여넣기, u Undo
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shortcuts */}
        <Card className="panel hover-lift hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </CardTitle>
            <CardDescription className="dark:text-indigo-300">
              작업 흐름에 맞게 단축키를 커스터마이즈하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SHORTCUT_DEFINITIONS.map((shortcut) => (
              <div
                key={shortcut.id}
                className="panel-soft flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <div className="font-semibold text-indigo-900 dark:text-indigo-100">
                    {shortcut.label}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-300">
                    {shortcut.description}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="toolbar-pill">
                    {shortcuts[shortcut.id]
                      ? formatShortcut(shortcuts[shortcut.id], isMac)
                      : 'Unassigned'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRecordingId(shortcut.id)}
                  >
                    {recordingId === shortcut.id ? 'Press keys...' : 'Record'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetShortcut(shortcut.id)}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
