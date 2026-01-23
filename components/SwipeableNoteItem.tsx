'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface SwipeableNoteItemProps {
  note: {
    id: string
    title: string
    body: string
    updatedAt: Date
    folder?: { name: string } | null
    tags?: { tag: { id: string; name: string; color?: string | null } }[]
  }
  isSelected: boolean
  onSelect?: (noteId: string) => void
  onDelete?: (noteId: string) => void
}

const SWIPE_THRESHOLD = 100

export function SwipeableNoteItem({ note, isSelected, onSelect, onDelete }: SwipeableNoteItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)

  // 배경색 변환 (스와이프 정도에 따라)
  const backgroundColor = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0],
    ['rgba(239, 68, 68, 1)', 'rgba(239, 68, 68, 0)']
  )

  // 삭제 아이콘 투명도
  const deleteIconOpacity = useTransform(
    x,
    [-SWIPE_THRESHOLD, -30, 0],
    [1, 0.5, 0]
  )

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)

    // 왼쪽으로 충분히 스와이프하면 삭제
    if (info.offset.x < -SWIPE_THRESHOLD && onDelete) {
      onDelete(note.id)
    }
  }

  const handleClick = () => {
    if (!isDragging && onSelect) {
      onSelect(note.id)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* 삭제 배경 */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-lg"
        style={{ backgroundColor }}
      >
        <motion.div style={{ opacity: deleteIconOpacity }}>
          <Trash2 className="h-6 w-6 text-white" />
        </motion.div>
      </motion.div>

      {/* 스와이프 가능한 카드 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={handleClick}
        className="relative cursor-pointer"
      >
        <Card
          className={`panel hover-lift p-4 ${
            isSelected ? 'border border-indigo-400/70 shadow-lg' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg mb-1 text-indigo-900 dark:text-indigo-100">
                  {note.title}
                </h3>
                <span className="ml-auto text-xs text-indigo-500 dark:text-indigo-300">
                  {formatDistanceToNow(new Date(note.updatedAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 line-clamp-1 mb-2">
                {note.body.slice(0, 120) || '내용 없음'}
              </p>
              <div className="flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-300">
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1">
                    {note.tags.slice(0, 3).map((nt) => (
                      <Badge
                        key={nt.tag.id}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: nt.tag.color || undefined,
                        }}
                      >
                        {nt.tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 스와이프 힌트 (첫 번째 아이템에만) */}
      <div className="absolute bottom-1 right-2 text-[10px] text-indigo-400 dark:text-indigo-500 pointer-events-none opacity-60">
        ← 스와이프하여 삭제
      </div>
    </div>
  )
}
