'use client'

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] bg-amber-400 px-3 py-2 text-center text-xs font-medium text-amber-950">
      오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.
    </div>
  )
}
