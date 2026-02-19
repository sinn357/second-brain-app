import Image from '@tiptap/extension-image'

declare module '@tiptap/extension-image' {
  interface SetImageOptions {
    publicId?: string
  }
}

export interface ResizableImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, unknown>
}

export const ResizableImage = Image.extend<ResizableImageOptions>({
  name: 'image',

  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: 'resizable-image',
      },
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('width')
          return value ? Number(value) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('height')
          return value ? Number(value) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { height: attributes.height }
        },
      },
      publicId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-public-id'),
        renderHTML: (attributes) => {
          if (!attributes.publicId) return {}
          return { 'data-public-id': attributes.publicId }
        },
      },
    }
  },
})
