'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

interface Note {
  id: string
  title: string
}

interface SuggestionListProps {
  items: Note[]
  command: (item: Note) => void
  query?: string
}

export const WikiLinkSuggestionList = forwardRef((props: SuggestionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        if (props.items.length === 0) return false
        if (props.query?.includes(']]')) return false
        enterHandler()
        return true
      }

      return false
    },
  }))

  if (props.items.length === 0) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
        <div className="text-sm text-gray-500 px-3 py-2">노트를 찾을 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg shadow-lg p-2 min-w-[250px] max-h-[200px] overflow-y-auto">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
            index === selectedIndex ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
          }`}
        >
          {item.title}
        </button>
      ))}
    </div>
  )
})

WikiLinkSuggestionList.displayName = 'WikiLinkSuggestionList'

// 글로벌에 등록하여 Tiptap extension에서 사용 가능하도록
if (typeof window !== 'undefined') {
  (window as any).WikiLinkSuggestionListComponent = WikiLinkSuggestionList
}
