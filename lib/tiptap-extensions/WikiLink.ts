import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>
  onLinkClick?: (title: string) => void
}

// WikiLink Mark ([[note]] 형태)
export const WikiLink = Mark.create<WikiLinkOptions>({
  name: 'wikiLink',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'wiki-link',
      },
      onLinkClick: undefined,
    }
  },

  addAttributes() {
    return {
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => {
          return {
            'data-title': attributes.title,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="wiki-link"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'wiki-link' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('wikiLink'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = []
            const { doc } = state

            doc.descendants((node, pos) => {
              if (!node.isText) return

              const text = node.text || ''
              const regex = /\[\[([^\]]+)\]\]/g
              let match

              while ((match = regex.exec(text)) !== null) {
                const from = pos + match.index
                const to = from + match[0].length

                decorations.push(
                  Decoration.inline(from, to, {
                    class: 'wiki-link-decoration',
                    'data-title': match[1],
                  })
                )
              }
            })

            return DecorationSet.create(doc, decorations)
          },
          handleClick: (view, pos, event) => {
            const target = event.target
            if (!(target instanceof Element)) return false

            const linkEl = target.closest('.wiki-link-decoration') as HTMLElement | null
            if (!linkEl) return false

            const title = linkEl.getAttribute('data-title')
            if (title && this.options.onLinkClick) {
              this.options.onLinkClick(title)
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})
