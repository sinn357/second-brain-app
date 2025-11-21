'use client'

import { useMemo } from 'react'
import { useNotes } from '@/lib/hooks/useNotes'
import { useProperties } from '@/lib/hooks/useProperties'
import { FilterOptions } from '@/components/FilterBar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ListViewProps {
  filters: FilterOptions
}

export function ListView({ filters }: ListViewProps) {
  const { data: notes = [], isLoading: notesLoading } = useNotes()
  const { data: properties = [], isLoading: propsLoading } = useProperties()

  if (notesLoading || propsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  // 필터링 및 정렬된 노트
  const filteredAndSortedNotes = useMemo(() => {
    let result = [...notes]

    // 폴더 필터
    if (filters.folderId) {
      result = result.filter(note => note.folderId === filters.folderId)
    }

    // 태그 필터
    if (filters.tagIds.length > 0) {
      result = result.filter(note => {
        if (!(note as any).tags) return false
        const noteTags = (note as any).tags.map((nt: any) => nt.tagId)
        return filters.tagIds.some(tagId => noteTags.includes(tagId))
      })
    }

    // 속성 필터
    Object.entries(filters.propertyFilters).forEach(([propertyId, filterValue]) => {
      result = result.filter(note => {
        if (!(note as any).properties) return false
        const noteProp = (note as any).properties.find((p: any) => p.propertyId === propertyId)
        if (!noteProp) return false

        const property = properties.find(p => p.id === propertyId)
        if (!property) return false

        if (property.type === 'checkbox') {
          return noteProp.value === filterValue
        } else if (property.type === 'select') {
          return noteProp.value === filterValue
        }
        return true
      })
    })

    // 정렬
    result.sort((a, b) => {
      let compareValue = 0

      if (filters.sortBy === 'title') {
        compareValue = a.title.localeCompare(b.title)
      } else if (filters.sortBy === 'createdAt') {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (filters.sortBy === 'updatedAt') {
        compareValue = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }

      return filters.sortOrder === 'asc' ? compareValue : -compareValue
    })

    return result
  }, [notes, filters, properties])

  // 속성 값 가져오기
  const getNoteProperties = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note || !(note as any).properties) return []
    return (note as any).properties
  }

  // 속성 값 렌더링
  const renderPropertyValue = (value: any, type: string) => {
    if (!value) return null

    switch (type) {
      case 'select':
        return <Badge variant="outline" className="bg-blue-50">{value}</Badge>
      case 'multi_select':
        if (Array.isArray(value)) {
          return value.map((v, i) => (
            <Badge key={i} variant="outline" className="bg-purple-50">{v}</Badge>
          ))
        }
        return null
      case 'date':
        return <Badge variant="outline">{value}</Badge>
      case 'checkbox':
        return <Badge variant={value ? 'default' : 'outline'}>{value ? '완료' : '미완료'}</Badge>
      default:
        return <span className="text-sm">{String(value)}</span>
    }
  }

  if (filteredAndSortedNotes.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        노트가 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredAndSortedNotes.map((note) => {
        const noteProperties = getNoteProperties(note.id)

        return (
          <Link key={note.id} href={`/notes/${note.id}`}>
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{note.title}</h3>
                {note.folder && (
                  <Badge variant="secondary" className="text-xs">
                    {note.folder.name}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {note.body.replace(/<[^>]*>/g, '').slice(0, 200) || '내용 없음'}
              </p>

              {noteProperties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {noteProperties.map((np: any) => {
                    const property = properties.find(p => p.id === np.propertyId)
                    if (!property) return null

                    return (
                      <div key={np.id} className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">{property.name}:</span>
                        {renderPropertyValue(np.value, property.type)}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1">
                    {note.tags.slice(0, 3).map((nt: any) => (
                      <Badge
                        key={nt.tag.id}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: nt.tag.color || undefined,
                        }}
                      >
                        #{nt.tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <span className="ml-auto">
                  {formatDistanceToNow(new Date(note.updatedAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
