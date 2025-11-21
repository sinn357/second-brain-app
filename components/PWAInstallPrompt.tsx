'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // beforeinstallprompt 이벤트 리스너
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // 이미 설치했거나 사용자가 프롬프트를 닫은 경우 표시하지 않음
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const installed = localStorage.getItem('pwa-installed')

      if (!dismissed && !installed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // 이미 설치된 경우 감지
    if (window.matchMedia('(display-mode: standalone)').matches) {
      localStorage.setItem('pwa-installed', 'true')
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // 설치 프롬프트 표시
    deferredPrompt.prompt()

    // 사용자 선택 대기
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA 설치 승인')
      localStorage.setItem('pwa-installed', 'true')
    } else {
      console.log('PWA 설치 거부')
    }

    // 프롬프트 초기화
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
            <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
              앱으로 설치하기
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              홈 화면에 추가하여 앱처럼 사용하세요. 오프라인에서도 작동합니다!
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                설치
              </Button>
              <Button onClick={handleDismiss} variant="ghost" size="sm">
                나중에
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
