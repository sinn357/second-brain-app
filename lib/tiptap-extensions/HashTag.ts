import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface HashTagOptions {
  HTMLAttributes: Record<string, any>
  onTagClick?: (tag: string) => void
}

// HashTag Mark (#tag 형태)
export const HashTag = Mark.create<HashTagOptions>({
  name: 'hashTag',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'hash-tag',
      },
      onTagClick: undefined,
    }
  },

  addAttributes() {
    return {
      tag: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-tag'),
        renderHTML: (attributes) => {
          return {
            'data-tag': attributes.tag,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="hash-tag"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'hash-tag' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('hashTag'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = []
            const { doc } = state

            doc.descendants((node, pos) => {
              if (!node.isText) return

              const text = node.text || ''
              // #로 시작하고 공백 전까지가 태그 (영문, 한글, 숫자, _ 허용)
              const regex = /#([\w가-힣_]+)/g
              let match

              while ((match = regex.exec(text)) !== null) {
                const from = pos + match.index
                const to = from + match[0].length

                decorations.push(
                  Decoration.inline(from, to, {
                    class: 'hash-tag-decoration',
                    'data-tag': match[1],
                  })
                )
              }
            })

            return DecorationSet.create(doc, decorations)
          },
          handleClick: (view, pos, event) => {
            const { doc } = view.state
            const $pos = doc.resolve(pos)
            const node = $pos.parent

            if (node.isText) {
              const text = node.text || ''
              const offset = $pos.parentOffset
              const regex = /#([\w가-힣_]+)/g
              let match

              while ((match = regex.exec(text)) !== null) {
                const from = match.index
                const to = from + match[0].length

                if (offset >= from && offset <= to) {
                  const tag = match[1]
                  if (this.options.onTagClick) {
                    this.options.onTagClick(tag)
                    return true
                  }
                }
              }
            }

            return false
          },
        },
      }),
    ]
  },
})
