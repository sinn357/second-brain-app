import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleBlock: {
      insertToggleBlock: (title?: string) => ReturnType
      setToggleOpen: (open: boolean) => ReturnType
    }
  }
}

export const ToggleBlock = Node.create({
  name: 'toggleBlock',
  group: 'block',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      title: {
        default: '토글',
        parseHTML: (element) =>
          element.getAttribute('data-toggle-title') || '토글',
        renderHTML: (attributes) => ({
          'data-toggle-title': attributes.title,
        }),
      },
      open: {
        default: false,
        parseHTML: (element) => element.hasAttribute('open'),
        renderHTML: (attributes) => (attributes.open ? { open: '' } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'details[data-type="toggle-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const title = (HTMLAttributes.title as string) || '토글'
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toggle-block',
        class: 'toggle-block',
      }),
      ['summary', { class: 'toggle-summary' }, title],
      ['div', { class: 'toggle-content' }, 0],
    ]
  },

  addCommands() {
    return {
      insertToggleBlock:
        (title = '토글') =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { title, open: false },
            content: [{ type: 'paragraph' }],
          }),
      setToggleOpen:
        (open) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { open }),
    }
  },
})
