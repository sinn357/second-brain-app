'use client'

import { useRef, useState } from 'react'
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/lib/hooks/useAttachments'
import { Button } from '@/components/ui/button'
import { Paperclip, Upload, X, Loader2, File, Image, FileText } from 'lucide-react'
import { CldImage } from 'next-cloudinary'

interface FileAttachmentProps {
  noteId: string
}

export function FileAttachment({ noteId }: FileAttachmentProps) {
  const { data: attachments = [], isLoading } = useAttachments(noteId)
  const uploadAttachment = useUploadAttachment()
  const deleteAttachment = useDeleteAttachment()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    uploadAttachment.mutate({ file, noteId })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-100">
          <Paperclip className="h-4 w-4" />
          첨부파일 ({attachments.length})
        </h3>
      </div>

      {/* 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-indigo-300 dark:border-indigo-700 hover:border-purple-400 dark:hover:border-purple-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />

        {uploadAttachment.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">업로드 중...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              파일 선택
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              최대 10MB (이미지, PDF, 문서)
            </p>
          </div>
        )}
      </div>

      {/* 첨부파일 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg group hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              {/* 썸네일 또는 아이콘 */}
              <div className="flex-shrink-0">
                {attachment.fileType.startsWith('image/') ? (
                  <CldImage
                    src={attachment.cloudinaryId}
                    width="40"
                    height="40"
                    alt={attachment.fileName}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-indigo-800 rounded">
                    {getFileIcon(attachment.fileType)}
                  </div>
                )}
              </div>

              {/* 파일 정보 */}
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-900 dark:text-indigo-100 hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                >
                  {attachment.fileName}
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>

              {/* 삭제 버튼 */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteAttachment.mutate({ id: attachment.id, noteId })}
                disabled={deleteAttachment.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          첨부파일이 없습니다
        </p>
      )}
    </div>
  )
}
