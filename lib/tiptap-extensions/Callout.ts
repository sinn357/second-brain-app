import { Node, mergeAttributes } from '@tiptap/core'

type CalloutType = 'note' | 'info' | 'tip' | 'warning'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type?: CalloutType) => ReturnType
      unsetCallout: () => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      calloutType: {
        default: 'note',
        parseHTML: (element) =>
          element.getAttribute('data-callout-type') || 'note',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.calloutType,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const calloutType = (HTMLAttributes.calloutType as string) || 'note'
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        class: `callout-block callout-${calloutType}`,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        (type = 'note') =>
        ({ commands }) =>
          commands.wrapIn(this.name, { calloutType: type }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    }
  },
})
