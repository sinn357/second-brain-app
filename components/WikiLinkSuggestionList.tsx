'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

interface Note {
  id: string
  title: string
}

interface SuggestionListProps {
  items: Note[]
  command: (item: Note) => void
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
        enterHandler()
        return true
      }

      return false
    },
  }))

  if (props.items.length === 0) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
        <div className="text-sm text-gray-500 px-3 py-2">No results</div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          className={`w-full text-left px-3 py-2 rounded text-sm ${
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
