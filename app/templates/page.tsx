'use client'

import { useTemplates } from '@/lib/hooks/useTemplates'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Edit2, Trash2, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateTemplateDialog } from '@/components/CreateTemplateDialog'
import { EditTemplateDialog } from '@/components/EditTemplateDialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'

export default function TemplatesPage() {
  const { data: templates, isLoading, error } = useTemplates()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <Skeleton className="h-12 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <div className="bg-white dark:bg-indigo-900 p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="dark:text-indigo-100">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
              Templates
            </h1>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              Create and manage note templates
            </p>
          </div>
          <CreateTemplateDialog>
            <Button className="gradient-mesh hover-glow text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </CreateTemplateDialog>
        </div>

        {/* 템플릿 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <Card
              key={template.id}
              className="glass-strong hover-lift hover-glow cursor-pointer"
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
              <CardContent>
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
              No templates yet
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
              Create your first template to get started
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
