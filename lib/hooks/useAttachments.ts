import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Attachment {
  id: string
  noteId: string
  fileName: string
  fileType: string
  fileSize: number
  cloudinaryId: string
  url: string
  thumbnailUrl: string | null
  createdAt: string
}

// 노트의 첨부파일 목록 조회
export function useAttachments(noteId: string) {
  return useQuery({
    queryKey: ['attachments', noteId],
    queryFn: async () => {
      const response = await fetch(`/api/attachments/upload?noteId=${noteId}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.attachments as Attachment[]
    },
    enabled: !!noteId,
  })
}

// 파일 업로드
export function useUploadAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, noteId }: { file: File; noteId: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('noteId', noteId)

      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.attachment as Attachment
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', noteId] })
      toast.success('파일이 업로드되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '파일 업로드에 실패했습니다')
    },
  })
}

// 첨부파일 삭제
export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, noteId }: { id: string; noteId: string }) => {
      const response = await fetch(`/api/attachments/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', noteId] })
      toast.success('파일이 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '파일 삭제에 실패했습니다')
    },
  })
}
