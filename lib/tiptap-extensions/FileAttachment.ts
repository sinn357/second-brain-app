import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileAttachment: {
      setFileAttachment: (options: {
        url: string
        filename: string
        bytes?: number
        publicId?: string
      }) => ReturnType
    }
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const FileAttachment = Node.create({
  name: 'fileAttachment',

  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'file-attachment',
      },
    }
  },

  addAttributes() {
    return {
      url: { default: null },
      filename: { default: null },
      bytes: { default: 0 },
      publicId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-file-attachment]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const filename = String(HTMLAttributes.filename || 'file')
    const bytes = Number(HTMLAttributes.bytes || 0)
    const sizeText = formatBytes(bytes)
    const url = String(HTMLAttributes.url || '#')

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-file-attachment': '',
      }),
      [
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'file-link',
        },
        ['span', { class: 'file-icon' }, '📎'],
        ['span', { class: 'file-name' }, filename],
        ['span', { class: 'file-size' }, sizeText],
      ],
    ]
  },

  addCommands() {
    return {
      setFileAttachment:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    }
  },
})
