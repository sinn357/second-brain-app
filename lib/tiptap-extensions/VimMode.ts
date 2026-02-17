import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

type VimMode = 'normal' | 'insert' | 'visual'

interface VimModeOptions {
  enabled: boolean
  onModeChange?: (mode: VimMode) => void
}

interface VimStorage {
  enabled: boolean
  mode: VimMode
  yankBuffer: string
  lastCommand: string
  count: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    vimMode: {
      enableVimMode: () => ReturnType
      disableVimMode: () => ReturnType
      toggleVimMode: () => ReturnType
    }
  }

  interface Storage {
    vimMode: VimStorage
  }
}

export const VimModeKey = new PluginKey('vimMode')

export const VimMode = Extension.create<VimModeOptions>({
  name: 'vimMode',

  addOptions() {
    return {
      enabled: false,
      onModeChange: undefined,
    }
  },

  addCommands() {
    return {
      enableVimMode:
        () =>
        ({ editor }) => {
          const storage = editor.storage.vimMode as VimStorage
          storage.enabled = true
          storage.mode = 'normal'
          this.options.onModeChange?.('normal')
          return true
        },
      disableVimMode:
        () =>
        ({ editor }) => {
          const storage = editor.storage.vimMode as VimStorage
          storage.enabled = false
          storage.mode = 'insert'
          this.options.onModeChange?.('insert')
          return true
        },
      toggleVimMode:
        () =>
        ({ editor }) => {
          const storage = editor.storage.vimMode as VimStorage
          if (storage.enabled) {
            return editor.commands.disableVimMode()
          }
          return editor.commands.enableVimMode()
        },
    }
  },

  addStorage() {
    return {
      enabled: this.options.enabled,
      mode: this.options.enabled ? 'normal' : 'insert',
      yankBuffer: '',
      lastCommand: '',
      count: '',
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: VimModeKey,
        props: {
          handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
            const storage = this.editor?.storage.vimMode as VimStorage | undefined
            if (!storage?.enabled) return false

            const mode = storage.mode

            // Normal 모드 키 처리
            if (mode === 'normal') {
              return handleNormalMode(view, event, storage, {
                options: this.options,
                editor: this.editor
                  ? {
                      commands: {
                        undo: () => this.editor!.commands.undo(),
                        redo: () => this.editor!.commands.redo(),
                      },
                    }
                  : undefined,
              })
            }

            // Insert 모드에서 Escape -> Normal
            if (mode === 'insert' && event.key === 'Escape') {
              storage.mode = 'normal'
              this.options.onModeChange?.('normal')
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})

interface VimExtensionContext {
  options: VimModeOptions
  editor?: { commands: { undo: () => boolean; redo: () => boolean } }
}

function handleNormalMode(
  view: EditorView,
  event: KeyboardEvent,
  storage: VimStorage,
  extension: VimExtensionContext
): boolean {
  const { state, dispatch } = view
  const { selection, doc } = state
  const { from, to } = selection

  // 숫자 (count prefix)
  if (/^[0-9]$/.test(event.key) && storage.count !== '' || /^[1-9]$/.test(event.key)) {
    storage.count += event.key
    return true
  }

  const count = parseInt(storage.count) || 1
  const resetCount = () => { storage.count = '' }

  switch (event.key) {
    // 이동 명령
    case 'h': // 왼쪽
      for (let i = 0; i < count; i++) {
        if (from > 0) {
          dispatch(state.tr.setSelection(
            TextSelection.near(doc.resolve(from - 1))
          ))
        }
      }
      resetCount()
      return true

    case 'l': // 오른쪽
      for (let i = 0; i < count; i++) {
        if (to < doc.content.size) {
          dispatch(state.tr.setSelection(
            TextSelection.near(doc.resolve(to + 1))
          ))
        }
      }
      resetCount()
      return true

    case 'j': // 아래
      for (let i = 0; i < count; i++) {
        const $pos = doc.resolve(from)
        const nextLine = $pos.end() + 1
        if (nextLine <= doc.content.size) {
          dispatch(state.tr.setSelection(
            TextSelection.near(doc.resolve(Math.min(nextLine, doc.content.size)))
          ))
        }
      }
      resetCount()
      return true

    case 'k': // 위
      for (let i = 0; i < count; i++) {
        const $pos = doc.resolve(from)
        const prevLine = $pos.start() - 1
        if (prevLine >= 0) {
          dispatch(state.tr.setSelection(
            TextSelection.near(doc.resolve(Math.max(prevLine, 0)))
          ))
        }
      }
      resetCount()
      return true

    case '0': // 줄 시작
      if (storage.count === '') {
        const $pos = doc.resolve(from)
        dispatch(state.tr.setSelection(
          TextSelection.near(doc.resolve($pos.start()))
        ))
        return true
      }
      break

    case '$': // 줄 끝
      const $posEnd = doc.resolve(from)
      dispatch(state.tr.setSelection(
        TextSelection.near(doc.resolve($posEnd.end()))
      ))
      resetCount()
      return true

    case 'g': // gg - 문서 시작
      if (storage.lastCommand === 'g') {
        dispatch(state.tr.setSelection(
          TextSelection.near(doc.resolve(0))
        ))
        storage.lastCommand = ''
        resetCount()
        return true
      }
      storage.lastCommand = 'g'
      return true

    case 'G': // 문서 끝
      dispatch(state.tr.setSelection(
        TextSelection.near(doc.resolve(doc.content.size))
      ))
      resetCount()
      return true

    // 삽입 모드 진입
    case 'i': // 커서 앞에 삽입
      storage.mode = 'insert'
      extension.options.onModeChange?.('insert')
      resetCount()
      return true

    case 'a': // 커서 뒤에 삽입
      if (to < doc.content.size) {
        dispatch(state.tr.setSelection(
          TextSelection.near(doc.resolve(to + 1))
        ))
      }
      storage.mode = 'insert'
      extension.options.onModeChange?.('insert')
      resetCount()
      return true

    case 'o': // 아래에 새 줄
      const $posO = doc.resolve(from)
      const endOfLine = $posO.end()
      const tr = state.tr.insert(endOfLine, state.schema.text('\n'))
      tr.setSelection(TextSelection.near(doc.resolve(endOfLine + 1)))
      dispatch(tr)
      storage.mode = 'insert'
      extension.options.onModeChange?.('insert')
      resetCount()
      return true

    case 'O': // 위에 새 줄
      const $posOUp = doc.resolve(from)
      const startOfLine = $posOUp.start()
      const trUp = state.tr.insert(startOfLine, state.schema.text('\n'))
      trUp.setSelection(TextSelection.near(doc.resolve(startOfLine)))
      dispatch(trUp)
      storage.mode = 'insert'
      extension.options.onModeChange?.('insert')
      resetCount()
      return true

    // 삭제 명령
    case 'd':
      if (storage.lastCommand === 'd') {
        // dd - 줄 삭제
        const $posD = doc.resolve(from)
        const lineStart = $posD.start()
        const lineEnd = $posD.end() + 1
        const delTr = state.tr.delete(lineStart, Math.min(lineEnd, doc.content.size))
        dispatch(delTr)
        storage.lastCommand = ''
        resetCount()
        return true
      }
      storage.lastCommand = 'd'
      return true

    case 'x': // 문자 삭제
      if (to <= doc.content.size) {
        dispatch(state.tr.delete(from, Math.min(from + count, doc.content.size)))
      }
      resetCount()
      return true

    // 복사 & 붙여넣기
    case 'y':
      if (storage.lastCommand === 'y') {
        // yy - 줄 복사
        const $posY = doc.resolve(from)
        const yStart = $posY.start()
        const yEnd = $posY.end()
        storage.yankBuffer = doc.textBetween(yStart, yEnd)
        storage.lastCommand = ''
        resetCount()
        return true
      }
      storage.lastCommand = 'y'
      return true

    case 'p': // 붙여넣기
      if (storage.yankBuffer) {
        const pTr = state.tr.insertText(storage.yankBuffer, from)
        dispatch(pTr)
      }
      resetCount()
      return true

    // Undo/Redo
    case 'u': // Undo
      extension.editor?.commands.undo()
      resetCount()
      return true

    case 'r':
      if (event.ctrlKey) { // Ctrl+r = Redo
        extension.editor?.commands.redo()
        resetCount()
        return true
      }
      break

    // Escape는 count 리셋
    case 'Escape':
      resetCount()
      storage.lastCommand = ''
      return true
  }

  // 다른 키는 무시
  resetCount()
  storage.lastCommand = ''
  return true // Normal 모드에서는 다른 키 입력 차단
}
