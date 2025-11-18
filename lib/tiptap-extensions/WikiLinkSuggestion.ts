import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { SuggestionOptions } from '@tiptap/suggestion'

interface Note {
  id: string
  title: string
}

interface SuggestionProps {
  query: string
  notes: Note[]
  command: (item: Note) => void
}

// Suggestion 렌더러 컴포넌트 (별도 파일에서 import 예정)
let SuggestionList: any

export const WikiLinkSuggestion = (notes: Note[]): Partial<SuggestionOptions> => {
  return {
    items: ({ query }: { query: string }) => {
      return notes
        .filter((note) => note.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
    },

    render: () => {
      let component: ReactRenderer
      let popup: TippyInstance[]

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(SuggestionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },

        onUpdate(props: any) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          })
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide()
            return true
          }

          return (component.ref as any)?.onKeyDown(props)
        },

        onExit() {
          popup[0].destroy()
          component.destroy()
        },
      }
    },
  }
}

// Suggestion 설정을 위한 helper
export const setSuggestionList = (component: any) => {
  SuggestionList = component
}
