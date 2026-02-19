import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>
  onLinkClick?: (title: string, heading?: string) => void
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
              const regex = /\[\[([^\]#]+)(?:#([^\]]+))?\]\]/g
              let match

              while ((match = regex.exec(text)) !== null) {
                const from = pos + match.index
                const to = from + match[0].length

                decorations.push(
                  Decoration.inline(from, to, {
                    class: 'wiki-link-decoration',
                    'data-title': match[1].trim(),
                    ...(match[2] ? { 'data-heading': match[2].trim() } : {}),
                  })
                )
              }
            })

            return DecorationSet.create(doc, decorations)
          },
          handleClick: (view, pos, event) => {
            const target = event.target
            if (!target) return false

            let element: Element | null = null
            if (target instanceof Element) {
              element = target
            } else if (target instanceof Node) {
              element = target.parentElement
            }

            const linkEl = element?.closest('.wiki-link-decoration') as HTMLElement | null
            if (linkEl) {
              const title = linkEl.getAttribute('data-title')
              const heading = linkEl.getAttribute('data-heading') ?? undefined
              if (title && this.options.onLinkClick) {
                this.options.onLinkClick(title, heading)
                return true
              }
            }

            const { doc } = view.state
            const $pos = doc.resolve(pos)
            const parent = $pos.parent
            const parentStart = $pos.start()
            const regex = /\[\[([^\]#]+)(?:#([^\]]+))?\]\]/g
            let foundTitle: string | null = null
            let foundHeading: string | undefined

            parent.descendants((node, nodePos) => {
              if (!node.isText || foundTitle) return false
              const text = node.text || ''
              let match
              while ((match = regex.exec(text)) !== null) {
                const from = parentStart + nodePos + match.index
                const to = from + match[0].length
                if (pos >= from && pos <= to) {
                  foundTitle = match[1]?.trim() ?? null
                  foundHeading = match[2]?.trim()
                  return false
                }
              }
              return true
            })

            if (foundTitle && this.options.onLinkClick) {
              this.options.onLinkClick(foundTitle, foundHeading)
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})
