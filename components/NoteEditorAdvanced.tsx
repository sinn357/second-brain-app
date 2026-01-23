'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { WikiLink } from '@/lib/tiptap-extensions/WikiLink'
import { HashTag } from '@/lib/tiptap-extensions/HashTag'
import { WikiLinkAutocomplete } from '@/lib/tiptap-extensions/WikiLinkAutocomplete'
import { VimMode } from '@/lib/tiptap-extensions/VimMode'
import { useEditorStore } from '@/lib/stores/editorStore'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useCreateNote, useNotes } from '@/lib/hooks/useNotes'
import { useCreateTag } from '@/lib/hooks/useTags'
import { useRouter } from 'next/navigation'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { NoteLinkPreview } from './NoteLinkPreview'
import { WikiLinkSuggestionList } from './WikiLinkSuggestionList'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { htmlToMarkdown, isProbablyHtml, markdownToHtml } from '@/lib/markdown'

interface NoteEditorAdvancedProps {
  content: string
  onUpdate: (content: string) => void
  placeholder?: string
  currentNoteId?: string
  forceFirstHeading?: boolean
}

export function NoteEditorAdvanced({
  content,
  onUpdate,
  placeholder = '내용을 입력하세요. [[노트제목]]으로 링크, #태그로 태그를 추가할 수 있습니다.',
  currentNoteId,
  forceFirstHeading = false
}: NoteEditorAdvancedProps) {
  const router = useRouter()
  const { data: allNotes = [] } = useNotes()
  const createNote = useCreateNote()
  const createTag = useCreateTag()
  const [creatingLinkTitle, setCreatingLinkTitle] = useState<string | null>(null)
  const lastSyncedMarkdown = useRef<string | null>(null)
  const { vimMode } = useEditorStore()
  const notesRef = useRef(allNotes)
  const creatingLinkRef = useRef<string | null>(null)

  useEffect(() => {
    notesRef.current = allNotes
  }, [allNotes])

  useEffect(() => {
    creatingLinkRef.current = creatingLinkTitle
  }, [creatingLinkTitle])

  const handleWikiLinkClick = useCallback(
    async (title: string) => {
      const existing = notesRef.current.find((note) => note.title === title)
      if (existing) {
        router.push(`/notes?noteId=${existing.id}`)
        return
      }

      if (creatingLinkRef.current === title) return

      try {
        setCreatingLinkTitle(title)
        const newNote = await createNote.mutateAsync({
          title,
          body: '',
          folderId: null,
        })
        toast.success(`"${title}" 노트를 생성했습니다`)
        router.push(`/notes?noteId=${newNote.id}`)
      } catch (error) {
        console.error('Create note from link failed:', error)
        toast.error(`"${title}" 노트 생성에 실패했습니다`)
      } finally {
        setCreatingLinkTitle(null)
      }
    },
    [createNote, router]
  )

  const getEditorContent = (value: string) => {
    return isProbablyHtml(value) ? value : markdownToHtml(value)
  }

  const ensureFirstHeading = (editorInstance: Editor | null) => {
    if (!editorInstance) return false
    const { state } = editorInstance
    const firstNode = state.doc.firstChild
    if (!firstNode) return false
    const headingType = state.schema.nodes.heading
    if (!headingType) return false
    if (firstNode.type === headingType && firstNode.attrs.level === 1) return false

    let firstPos: number | null = null
    state.doc.descendants((node, pos, parent) => {
      if (parent === state.doc) {
        firstPos = pos
        return false
      }
      return false
    })

    if (firstPos === null) return false

    const tr = state.tr.setNodeMarkup(firstPos, headingType, { level: 1 }, firstNode.marks)
    editorInstance.view.dispatch(tr)
    return true
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      Highlight,
      Typography,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder,
      }),
      WikiLink.configure({
        HTMLAttributes: {
          class: 'wiki-link-decoration',
        },
        onLinkClick: handleWikiLinkClick,
      }),
      HashTag.configure({
        HTMLAttributes: {
          class: 'hash-tag-decoration',
        },
        onTagClick: async (tag: string) => {
          // #태그 클릭 시 태그 생성 (없으면)
          try {
            await createTag.mutateAsync({ name: tag })
            toast.success(`태그 "${tag}"가 생성되었습니다`)
          } catch (error) {
            console.log('Tag already exists or error:', error)
          }
        },
      }),
      WikiLinkAutocomplete.configure({
        notes: allNotes.map(note => ({ id: note.id, title: note.title })),
        suggestion: {},
      }),
      VimMode.configure({
        enabled: vimMode,
      }),
    ],
    content: getEditorContent(content),
    editorProps: {
      attributes: {
        class: 'note-content max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      if (forceFirstHeading && ensureFirstHeading(editor)) {
        return
      }
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      lastSyncedMarkdown.current = markdown
      onUpdate(markdown)
    },
  })

  // content가 외부에서 변경되면 에디터 업데이트
  useEffect(() => {
    if (!editor) return
    if (content === lastSyncedMarkdown.current) return
    const nextHtml = getEditorContent(content)
    if (nextHtml !== editor.getHTML()) {
      editor.commands.setContent(nextHtml)
    }
  }, [content, editor])

  useEffect(() => {
    if (!editor || !forceFirstHeading) return
    ensureFirstHeading(editor)
  }, [editor, forceFirstHeading])

  // WikiLink hover 미리보기 + 클릭 핸들러 보강
  useEffect(() => {
    if (!editor) return

    const editorElement = editor.view.dom
    let tippyInstance: TippyInstance | null = null

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (target.classList.contains('wiki-link-decoration')) {
        const title = target.getAttribute('data-title')
        if (!title) return

        // 미리보기 생성
        const container = document.createElement('div')
        const root = createRoot(container)
        root.render(<NoteLinkPreview title={title} />)

        tippyInstance = tippy(target, {
          content: container,
          interactive: true,
          placement: 'top',
          arrow: true,
          theme: 'light-border',
          onHidden: () => {
            root.unmount()
          },
        })

        tippyInstance.show()
      }
    }

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (target.classList.contains('wiki-link-decoration')) {
        if (tippyInstance) {
          tippyInstance.destroy()
          tippyInstance = null
        }
      }
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const linkEl = target?.closest?.('.wiki-link-decoration') as HTMLElement | null
      if (!linkEl) return
      const title = linkEl.getAttribute('data-title')
      if (title) {
        event.preventDefault()
        void handleWikiLinkClick(title)
      }
    }

    editorElement.addEventListener('mouseover', handleMouseOver)
    editorElement.addEventListener('mouseout', handleMouseOut)
    editorElement.addEventListener('click', handleClick)

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver)
      editorElement.removeEventListener('mouseout', handleMouseOut)
      editorElement.removeEventListener('click', handleClick)
      if (tippyInstance) {
        tippyInstance.destroy()
      }
    }
  }, [editor, handleWikiLinkClick])

  // Vim 모드 변경 시 에디터 업데이트
  useEffect(() => {
    if (!editor) return
    if (vimMode) {
      editor.commands.enableVimMode()
    } else {
      editor.commands.disableVimMode()
    }
  }, [vimMode, editor])

  if (!editor) {
    return (
      <div className="border rounded p-4 min-h-[400px] bg-gray-50 animate-pulse">
        Loading editor...
      </div>
    )
  }

  return (
    <div className="border rounded">
      <EditorContent editor={editor} />

      {/* 글로벌 스타일 */}
      <style jsx global>{`
        .wiki-link-decoration {
          color: #2563eb;
          background-color: #dbeafe;
          padding: 0 2px;
          border-radius: 2px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .wiki-link-decoration:hover {
          background-color: #bfdbfe;
        }

        .hash-tag-decoration {
          color: #7c3aed;
          background-color: #ede9fe;
          padding: 0 2px;
          border-radius: 2px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .hash-tag-decoration:hover {
          background-color: #ddd6fe;
        }

        .tippy-box[data-theme~='light-border'] {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
        .tippy-box[data-theme~='light-border'][data-placement^='top'] > .tippy-arrow::before {
          border-top-color: white;
        }
      `}</style>
    </div>
  )
}
