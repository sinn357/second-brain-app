import { useState } from 'react'

export interface OgPreviewData {
  title: string
  description: string
  image: string
  siteName: string
  url: string
}

export function useOgPreview() {
  const [isLoading, setIsLoading] = useState(false)

  const fetchOg = async (url: string): Promise<OgPreviewData | null> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      if (!data.success) return null
      return data.data as OgPreviewData
    } catch (error) {
      console.error('OG fetch error:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { fetchOg, isLoading }
}
