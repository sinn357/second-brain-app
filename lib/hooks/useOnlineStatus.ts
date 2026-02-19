'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type OnlineStatus = {
  isOnline: boolean
  isChecking: boolean
}

const OFFLINE_CONFIRM_DELAY = 2000

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkIdRef = useRef(0)

  const clearOfflineTimer = useCallback(() => {
    if (!offlineTimerRef.current) return
    clearTimeout(offlineTimerRef.current)
    offlineTimerRef.current = null
  }, [])

  const verifyConnectivity = useCallback(async () => {
    if (typeof window === 'undefined') return

    clearOfflineTimer()
    const checkId = ++checkIdRef.current

    if (!navigator.onLine) {
      setIsChecking(false)
      setIsOnline(false)
      return
    }

    setIsChecking(true)
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
      })
      if (checkIdRef.current !== checkId) return
      setIsOnline(response.ok)
    } catch {
      if (checkIdRef.current !== checkId) return
      setIsOnline(false)
    } finally {
      if (checkIdRef.current === checkId) {
        setIsChecking(false)
      }
    }
  }, [clearOfflineTimer])

  useEffect(() => {
    void verifyConnectivity()

    const handleOnline = () => {
      void verifyConnectivity()
    }

    const handleOffline = () => {
      clearOfflineTimer()
      offlineTimerRef.current = setTimeout(() => {
        setIsOnline(false)
        setIsChecking(false)
      }, OFFLINE_CONFIRM_DELAY)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearOfflineTimer()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [clearOfflineTimer, verifyConnectivity])

  return { isOnline, isChecking }
}
