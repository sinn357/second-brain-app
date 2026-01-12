'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Upload, FileJson, FolderArchive, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const obsidianInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  // Export Markdown ZIP
  const handleExportMarkdown = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/export/markdown')

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // 파일 다운로드
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `second-brain-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Markdown ZIP exported successfully')
    } catch (error) {
      console.error('Export markdown error:', error)
      toast.error('Failed to export markdown')
    } finally {
      setIsExporting(false)
    }
  }

  // Export JSON
  const handleExportJSON = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/export/json')

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // 파일 다운로드
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `second-brain-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('JSON exported successfully')
    } catch (error) {
      console.error('Export JSON error:', error)
      toast.error('Failed to export JSON')
    } finally {
      setIsExporting(false)
    }
  }

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

      toast.success(`Imported ${result.imported} notes from Obsidian vault`)

      if (result.errors && result.errors.length > 0) {
        console.warn('Import errors:', result.errors)
      }
    } catch (error) {
      console.error('Import Obsidian error:', error)
      toast.error('Failed to import Obsidian vault')
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
        '⚠️ This will DELETE all existing data and replace with imported data. Are you sure?'
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

      toast.success(`JSON data imported successfully (${importMode} mode)`)
      console.log('Import stats:', result.stats)
    } catch (error) {
      console.error('Import JSON error:', error)
      toast.error('Failed to import JSON data')
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
      </div>
    </div>
  )
}
