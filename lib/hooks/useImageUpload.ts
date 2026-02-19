import { useState } from 'react'

interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
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
        width: data.width,
        height: data.height,
      }
    } catch (error) {
      console.error('Image upload error:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadImage, isUploading }
}
