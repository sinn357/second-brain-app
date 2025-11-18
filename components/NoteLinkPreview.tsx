'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface Note {
  id: string
  title: string
  body: string
}

interface NoteLinkPreviewProps {
  title: string
}

export function NoteLinkPreview({ title }: NoteLinkPreviewProps) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNote = async () => {
      try {
        // 제목으로 노트 검색
        const response = await fetch(`/api/notes/search?title=${encodeURIComponent(title)}`)
        const data = await response.json()
        if (data.success && data.note) {
          setNote(data.note)
        }
      } catch (error) {
        console.error('Failed to fetch note preview:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [title])

  if (loading) {
    return (
      <Card className="p-3 max-w-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </Card>
    )
  }

  if (!note) {
    return (
      <Card className="p-3 max-w-sm">
        <p className="text-sm text-gray-500">노트를 찾을 수 없습니다</p>
      </Card>
    )
  }

  return (
    <Card className="p-3 max-w-sm">
      <h4 className="font-semibold text-sm mb-1">{note.title}</h4>
      <p className="text-xs text-gray-600 line-clamp-3">
        {note.body.replace(/<[^>]*>/g, '').slice(0, 150)}...
      </p>
    </Card>
  )
}
