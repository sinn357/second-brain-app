'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="page-shell">
      <div className="page-content flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
            문제가 발생했습니다
          </h1>
          <p className="text-indigo-700 dark:text-indigo-300 mb-6 max-w-md">
            예기치 않은 오류가 발생했습니다. 다시 시도하거나 홈으로 이동해주세요.
          </p>
          {error.message && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded max-w-md mx-auto">
              {error.message}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={reset}
              className="gradient-mesh hover-glow text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
            <Link href="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                홈으로
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
