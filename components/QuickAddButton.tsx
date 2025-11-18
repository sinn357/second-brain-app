'use client'

import { useState } from 'react'
import { useCreateNote } from '@/lib/hooks/useNotes'
import { useFolders } from '@/lib/hooks/useFolders'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function QuickAddButton() {
  const router = useRouter()
  const createNote = useCreateNote()
  const { data: folders } = useFolders()
  const [isCreating, setIsCreating] = useState(false)

  // Inbox 폴더 찾기 (없으면 null)
  const inboxFolder = folders?.find((f) => f.name.toLowerCase() === 'inbox')

  const handleQuickAdd = async () => {
    setIsCreating(true)
    try {
      const note = await createNote.mutateAsync({
        title: 'Untitled',
        body: '',
        folderId: inboxFolder?.id || null,
      })

      // 생성된 노트의 상세 페이지로 이동
      router.push(`/notes/${note.id}`)
    } catch (error) {
      console.error('Quick add error:', error)
      toast.error('노트 생성에 실패했습니다')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Button
      onClick={handleQuickAdd}
      disabled={isCreating}
      className="fixed top-4 right-4 z-50"
      size="lg"
    >
      <Plus className="h-5 w-5 mr-2" />
      {isCreating ? 'Creating...' : 'Quick Add'}
    </Button>
  )
}
