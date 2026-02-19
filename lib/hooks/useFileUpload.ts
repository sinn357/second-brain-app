import { useState } from 'react'

interface UploadResult {
  url: string
  publicId: string
  filename: string
  bytes: number
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      return {
        url: data.url,
        publicId: data.publicId,
        filename: data.filename,
        bytes: data.bytes,
      }
    } catch (error) {
      console.error('File upload error:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadFile, isUploading }
}
