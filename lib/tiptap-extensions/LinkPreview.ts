import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkPreview: {
      setLinkPreview: (options: {
        url: string
        title: string
        description?: string
        image?: string
        siteName?: string
      }) => ReturnType
    }
  }
}

export const LinkPreview = Node.create({
  name: 'linkPreview',

  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'link-preview',
      },
    }
  },

  addAttributes() {
    return {
      url: { default: null },
      title: { default: null },
      description: { default: null },
      image: { default: null },
      siteName: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-link-preview]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const title = String(HTMLAttributes.title || 'Link')
    const description = String(HTMLAttributes.description || '')
    const image = String(HTMLAttributes.image || '')
    const siteName = String(HTMLAttributes.siteName || '')
    const url = String(HTMLAttributes.url || '#')

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-link-preview': '',
      }),
      [
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'link-preview-card',
        },
        ...(image
          ? [['img', { src: image, alt: title, class: 'link-preview-image' }] as any]
          : []),
        [
          'div',
          { class: 'link-preview-body' },
          ['div', { class: 'link-preview-title' }, title],
          ...(description ? [['div', { class: 'link-preview-description' }, description] as any] : []),
          [
            'div',
            { class: 'link-preview-meta' },
            siteName || (() => {
              try {
                return new URL(url).hostname
              } catch {
                return url
              }
            })(),
          ],
        ],
      ],
    ]
  },

  addCommands() {
    return {
      setLinkPreview:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    }
  },
})
