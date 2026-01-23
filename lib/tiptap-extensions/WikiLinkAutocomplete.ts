import { Extension } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'

interface Note {
  id: string
  title: string
}

export interface WikiLinkAutocompleteOptions {
  notes: Note[]
  suggestion: Partial<SuggestionOptions>
}

export const WikiLinkAutocomplete = Extension.create<WikiLinkAutocompleteOptions>({
  name: 'wikiLinkAutocomplete',

  addOptions() {
    return {
      notes: [],
      suggestion: {
        char: '[[',
        allowSpaces: true,
        startOfLine: false,
        render: () => {
          let component: ReactRenderer
          let popup: TippyInstance[]

          return {
            onStart: (props: any) => {
              // Dynamic import를 피하기 위해 글로벌에서 컴포넌트 가져오기
              const SuggestionList = (window as any).WikiLinkSuggestionListComponent

              if (!SuggestionList) {
                console.warn('WikiLinkSuggestionList component not found')
                return
              }

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
                maxWidth: 'none',
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
        command: ({ editor, range, props }: any) => {
          // [[노트제목]] 형태로 삽입
          const nodeAfter = editor.view.state.selection.$to.nodeAfter
          const overrideSpace = nodeAfter?.text?.startsWith(' ')

          if (overrideSpace) {
            range.to += 1
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: 'text',
                text: `${props.title}]]`,
              },
            ])
            .run()

          // 커서를 ]] 뒤로 이동
          window.setTimeout(() => {
            editor.commands.focus()
          }, 0)
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return this.options.notes
            .filter((note) => note.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
        },
      }),
    ]
  },
})
