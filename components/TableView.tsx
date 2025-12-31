'use client'

import { useProperties } from '@/lib/hooks/useProperties'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { format } from 'date-fns'

interface TableViewProps {
  notes?: any[]
}

export function TableView({ notes = [] }: TableViewProps) {
  const { data: properties = [], isLoading: propsLoading } = useProperties()

  if (propsLoading) {
    return <Skeleton className="h-96" />
  }

  // 속성 값 가져오기 헬퍼
  const getPropertyValue = (noteId: string, propertyId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note || !(note as any).properties) return null

    const noteProp = (note as any).properties.find((p: any) => p.propertyId === propertyId)
    return noteProp?.value
  }

  // 속성 값 렌더링
  const renderPropertyValue = (value: any, type: string) => {
    if (!value) return <span className="text-gray-400">-</span>

    switch (type) {
      case 'select':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{value}</span>
      case 'multi_select':
        if (Array.isArray(value)) {
          return (
            <div className="flex gap-1 flex-wrap">
              {value.map((v, i) => (
                <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  {v}
                </span>
              ))}
            </div>
          )
        }
        return <span className="text-gray-400">-</span>
      case 'date':
        return <span className="text-sm">{value}</span>
      case 'checkbox':
        return value ? '✓' : '✗'
      default:
        return <span className="text-sm">{String(value)}</span>
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="text-left p-3 font-semibold text-sm">제목</th>
            <th className="text-left p-3 font-semibold text-sm">폴더</th>
            {properties.map((prop) => (
              <th key={prop.id} className="text-left p-3 font-semibold text-sm">
                {prop.name}
              </th>
            ))}
            <th className="text-left p-3 font-semibold text-sm">수정일</th>
          </tr>
        </thead>
        <tbody>
          {notes.length === 0 ? (
            <tr>
              <td colSpan={properties.length + 3} className="text-center p-8 text-gray-500">
                노트가 없습니다
              </td>
            </tr>
          ) : (
            notes.map((note) => (
              <tr key={note.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/notes/${note.id}`} className="text-blue-600 hover:underline font-medium">
                    {note.title}
                  </Link>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {note.folder?.name || '-'}
                </td>
                {properties.map((prop) => (
                  <td key={prop.id} className="p-3">
                    {renderPropertyValue(getPropertyValue(note.id, prop.id), prop.type)}
                  </td>
                ))}
                <td className="p-3 text-sm text-gray-500">
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
