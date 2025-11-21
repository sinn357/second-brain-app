import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

// AI로 태그 생성
export function useGenerateTags() {
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/ai/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tags')
      }

      return data.tags as string[]
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// AI로 요약 생성
export function useGenerateSummary() {
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary')
      }

      return data.summary as string
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// AI로 제목 제안
export function useSuggestTitle() {
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/ai/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to suggest title')
      }

      return data.title as string
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
