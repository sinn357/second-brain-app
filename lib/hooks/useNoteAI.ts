import { useMutation } from '@tanstack/react-query'
import type { AICommand, AIResponse } from '@/lib/ai/types'

interface UseNoteAIOptions {
  onSuccess?: (data: AIResponse) => void
  onError?: (error: Error) => void
}

async function parseJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (error) {
    return { raw: text }
  }
}

export function useNoteAI(options?: UseNoteAIOptions) {
  const mutation = useMutation({
    mutationFn: async ({
      noteId,
      command,
    }: {
      noteId: string
      command: AICommand
    }): Promise<AIResponse> => {
      const res = await fetch('/api/ai/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, command }),
      })

      const payload = await parseJsonResponse(res)

      if (!res.ok) {
        const message = payload?.error || payload?.raw || 'AI 요청 실패'
        throw new Error(message)
      }

      if (!payload || payload.raw) {
        throw new Error('AI 응답 형식이 올바르지 않습니다')
      }

      return payload as AIResponse
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })

  return {
    execute: mutation.mutate,
    executeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}

export function useSummarize(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options)
  return {
    summarize: (noteId: string) => execute({ noteId, command: 'summarize' }),
    ...rest,
  }
}

export function useExpand(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options)
  return {
    expand: (noteId: string) => execute({ noteId, command: 'expand' }),
    ...rest,
  }
}

export function useTagSuggest(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options)
  return {
    suggestTags: (noteId: string) => execute({ noteId, command: 'tagSuggest' }),
    ...rest,
  }
}

export function useStructure(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options)
  return {
    analyzeStructure: (noteId: string) => execute({ noteId, command: 'structure' }),
    ...rest,
  }
}

export function useClarify(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options)
  return {
    clarify: (noteId: string) => execute({ noteId, command: 'clarify' }),
    ...rest,
  }
}

export function useQuestion(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options)
  return {
    generateQuestions: (noteId: string) => execute({ noteId, command: 'question' }),
    ...rest,
  }
}

export function useAction(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options)
  return {
    suggestActions: (noteId: string) => execute({ noteId, command: 'action' }),
    ...rest,
  }
}
