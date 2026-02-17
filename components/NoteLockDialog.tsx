'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type NoteLockMode = 'set' | 'unlock' | 'remove'

interface NoteLockDialogProps {
  noteId: string
  mode: NoteLockMode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const modeConfig: Record<NoteLockMode, { title: string; description: string; submitText: string; method: 'POST' | 'PUT' | 'DELETE' }> = {
  set: {
    title: '노트 잠금 설정',
    description: '비밀번호를 입력하면 이 노트를 잠글 수 있습니다.',
    submitText: '잠금 설정',
    method: 'POST',
  },
  unlock: {
    title: '잠긴 노트',
    description: '노트를 보려면 비밀번호를 입력하세요.',
    submitText: '잠금 해제',
    method: 'PUT',
  },
  remove: {
    title: '노트 잠금 제거',
    description: '잠금 상태를 해제하려면 비밀번호를 입력하세요.',
    submitText: '잠금 제거',
    method: 'DELETE',
  },
}

export function NoteLockDialog({ noteId, mode, open, onOpenChange, onSuccess }: NoteLockDialogProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const config = modeConfig[mode]

  const reset = () => {
    setPassword('')
    setError('')
    setIsLoading(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!password.trim()) return

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/notes/${noteId}/lock`, {
        method: config.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || '잠금 처리에 실패했습니다.')
      }

      onSuccess()
      reset()
      onOpenChange(false)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '오류가 발생했습니다.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호 입력"
            autoFocus
          />
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isLoading || !password.trim()}>
            {isLoading ? '처리 중...' : config.submitText}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
