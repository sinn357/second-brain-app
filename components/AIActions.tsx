'use client'

import { useState } from 'react'
import { useGenerateTags, useGenerateSummary, useSuggestTitle } from '@/lib/hooks/useAI'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles, FileText, Lightbulb, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AIActionsProps {
  content: string
  onTagsGenerated?: (tags: string[]) => void
  onTitleSuggested?: (title: string) => void
}

export function AIActions({ content, onTagsGenerated, onTitleSuggested }: AIActionsProps) {
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [summary, setSummary] = useState('')

  const generateTags = useGenerateTags()
  const generateSummary = useGenerateSummary()
  const suggestTitle = useSuggestTitle()

  const handleGenerateTags = async () => {
    if (!content || content.length < 50) {
      toast.error('태그를 생성하려면 최소 50자 이상 작성해주세요')
      return
    }

    try {
      const tags = await generateTags.mutateAsync(content)
      toast.success(`${tags.length}개의 태그가 생성되었습니다`)
      onTagsGenerated?.(tags)
    } catch (error) {
      // Error already handled by mutation
    }
  }

  const handleGenerateSummary = async () => {
    if (!content || content.length < 200) {
      toast.error('요약을 생성하려면 최소 200자 이상 작성해주세요')
      return
    }

    try {
      const result = await generateSummary.mutateAsync(content)
      setSummary(result)
      setSummaryDialogOpen(true)
      toast.success('요약이 생성되었습니다')
    } catch (error) {
      // Error already handled by mutation
    }
  }

  const handleSuggestTitle = async () => {
    if (!content || content.length < 50) {
      toast.error('제목을 제안하려면 최소 50자 이상 작성해주세요')
      return
    }

    try {
      const title = await suggestTitle.mutateAsync(content)
      toast.success('제목이 제안되었습니다')
      onTitleSuggested?.(title)
    } catch (error) {
      // Error already handled by mutation
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <span className="text-sm font-medium text-purple-900 dark:text-purple-200">AI 기능</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSuggestTitle}
            disabled={suggestTitle.isPending}
            className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
          >
            {suggestTitle.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4 mr-2" />
            )}
            제목 제안
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTags}
            disabled={generateTags.isPending}
            className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
          >
            {generateTags.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            태그 생성
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={generateSummary.isPending}
            className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
          >
            {generateSummary.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            요약 생성
          </Button>
        </div>
      </div>

      {/* 요약 결과 다이얼로그 */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              AI 요약
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
            <p className="text-indigo-900 dark:text-indigo-100 whitespace-pre-wrap">{summary}</p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(summary)
                toast.success('클립보드에 복사되었습니다')
              }}
            >
              복사
            </Button>
            <Button onClick={() => setSummaryDialogOpen(false)} className="bg-purple-600 hover:bg-purple-700">
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
