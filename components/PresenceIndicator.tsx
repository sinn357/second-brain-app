'use client'

import { useOtherPresences } from '@/lib/hooks/usePresence'
import { Users } from 'lucide-react'

interface PresenceIndicatorProps {
  noteId: string
}

export function PresenceIndicator({ noteId }: PresenceIndicatorProps) {
  const { presences, isLoading } = useOtherPresences(noteId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Users className="h-4 w-4" />
        <span>로딩 중...</span>
      </div>
    )
  }

  if (presences.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      <div className="flex items-center gap-2">
        {presences.slice(0, 3).map((presence, index) => (
          <div
            key={presence.id}
            className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full"
            style={{ zIndex: presences.length - index }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium">{presence.userName}</span>
          </div>
        ))}
        {presences.length > 3 && (
          <span className="text-gray-600 dark:text-gray-400">
            +{presences.length - 3}명 더
          </span>
        )}
      </div>
    </div>
  )
}
