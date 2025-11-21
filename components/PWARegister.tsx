'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    // Service Worker가 지원되는지 확인
    if ('serviceWorker' in navigator) {
      // 페이지 로드 후 등록
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope)

            // 업데이트 확인
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New version available')
                    // 사용자에게 새 버전 알림 (선택적)
                    if (confirm('새 버전이 있습니다. 페이지를 새로고침하시겠습니까?')) {
                      window.location.reload()
                    }
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error)
          })

        // Service Worker 메시지 리스너
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('[PWA] Message from SW:', event.data)
        })
      })

      // 온라인/오프라인 상태 감지
      window.addEventListener('online', () => {
        console.log('[PWA] App is online')
      })

      window.addEventListener('offline', () => {
        console.log('[PWA] App is offline')
      })
    }
  }, [])

  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}
