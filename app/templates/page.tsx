'use client'

import { useTemplates } from '@/lib/hooks/useTemplates'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Edit2, Trash2, Star, Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateTemplateDialog } from '@/components/CreateTemplateDialog'
import { EditTemplateDialog } from '@/components/EditTemplateDialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'

export default function TemplatesPage() {
  const { data: templates, isLoading, error } = useTemplates()

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <Skeleton className="h-12 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-content">
          <div className="panel p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류</h1>
          <p className="dark:text-indigo-100">템플릿을 불러오는데 실패했습니다: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-content space-y-6">
        {/* 헤더 */}
        <div className="page-header">
          <div>
            <h1 className="page-title text-indigo-900 dark:text-indigo-100">Templates</h1>
            <p className="page-subtitle">Create and manage note templates</p>
          </div>
          <CreateTemplateDialog>
            <Button className="gradient-mesh hover-glow text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </CreateTemplateDialog>
        </div>

        {/* 템플릿 변수 가이드 */}
        <Card className="panel">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-sm text-indigo-900 dark:text-indigo-100">
              <Info className="w-4 h-4" />
              템플릿 변수 가이드
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-3 text-xs">
              <code className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 rounded">{'{{date}}'} - 오늘 날짜</code>
              <code className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 rounded">{'{{time}}'} - 현재 시간</code>
              <code className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 rounded">{'{{datetime}}'} - 날짜+시간</code>
              <code className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 rounded">{'{{title}}'} - 노트 제목</code>
              <code className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 rounded">{'{{cursor}}'} - 커서 위치</code>
            </div>
          </CardContent>
        </Card>

        {/* 템플릿 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <Card
              key={template.id}
              className="panel hover-lift hover-glow cursor-pointer"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-indigo-900 dark:text-indigo-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="truncate">{template.name}</span>
                  </div>
                  {template.isDefault && (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  )}
                </CardTitle>
                {template.description && (
                  <CardDescription className="dark:text-indigo-300">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 미리보기 */}
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/50 rounded text-xs text-indigo-700 dark:text-indigo-300 line-clamp-3 font-mono whitespace-pre-wrap">
                  {template.content?.substring(0, 150) || '(빈 템플릿)'}
                  {template.content?.length > 150 && '...'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <EditTemplateDialog template={template}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </EditTemplateDialog>
                    <DeleteConfirmDialog templateId={template.id} templateName={template.name}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DeleteConfirmDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 빈 상태 */}
        {templates?.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-indigo-300 dark:text-indigo-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
              템플릿이 없습니다
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
              첫 번째 템플릿을 만들어보세요
            </p>
            <CreateTemplateDialog>
              <Button className="gradient-mesh hover-glow text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CreateTemplateDialog>
          </div>
        )}
      </div>
    </div>
  )
}
