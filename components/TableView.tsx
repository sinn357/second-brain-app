'use client'

import { useProperties } from '@/lib/hooks/useProperties'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { format } from 'date-fns'
import type { NotePropertyValue, PropertyDefinition } from '@/lib/types/property'

interface TableViewProps {
  notes?: TableNote[]
}

interface TableNote {
  id: string
  title: string
  updatedAt: string | Date
  folder?: {
    name: string
  } | null
  properties?: NotePropertyValue[]
}

export function TableView({ notes = [] }: TableViewProps) {
  const { data: properties = [], isLoading: propsLoading } = useProperties()

  if (propsLoading) {
    return <Skeleton className="h-96" />
  }

  // 속성 값 가져오기 헬퍼
  const getPropertyValue = (noteId: string, propertyId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note?.properties) return null

    const noteProp = note.properties.find((p) => p.propertyId === propertyId)
    return noteProp?.value
  }

  // 속성 값 렌더링
  const renderPropertyValue = (value: unknown, type: PropertyDefinition['type']) => {
    if (!value) return <span className="text-gray-400">-</span>

    switch (type) {
      case 'select':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{String(value)}</span>
      case 'multi_select':
        if (Array.isArray(value)) {
          return (
            <div className="flex gap-1 flex-wrap">
              {value.map((v, i) => (
                <span key={`${String(v)}-${i}`} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  {v}
                </span>
              ))}
            </div>
          )
        }
        return <span className="text-gray-400">-</span>
      case 'date':
        return <span className="text-sm">{String(value)}</span>
      case 'checkbox':
        return value ? '✓' : '✗'
      default:
        return <span className="text-sm">{String(value)}</span>
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>제목</th>
            <th>폴더</th>
            {properties.map((prop) => (
              <th key={prop.id}>{prop.name}</th>
            ))}
            <th>수정일</th>
          </tr>
        </thead>
        <tbody>
          {notes.length === 0 ? (
            <tr>
              <td colSpan={properties.length + 3} className="text-center p-8 text-gray-500 dark:text-indigo-300">
                노트가 없습니다
              </td>
            </tr>
          ) : (
            notes.map((note) => (
              <tr key={note.id}>
                <td>
                  <Link href={`/notes?noteId=${note.id}`} className="text-indigo-700 dark:text-indigo-200 hover:underline font-medium">
                    {note.title}
                  </Link>
                </td>
                <td className="text-sm text-indigo-600 dark:text-indigo-300">
                  {note.folder?.name || '-'}
                </td>
                {properties.map((prop) => (
                  <td key={prop.id}>
                    {renderPropertyValue(getPropertyValue(note.id, prop.id), prop.type)}
                  </td>
                ))}
                <td className="text-sm text-indigo-500 dark:text-indigo-300">
                  {format(new Date(note.updatedAt), 'yyyy-MM-dd HH:mm')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
