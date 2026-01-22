'use client'

import { useEditor, EditorContent } from '@tiptap/react'
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
import { useEffect, useRef, useState } from 'react'
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
}

export function NoteEditorAdvanced({
  content,
  onUpdate,
  placeholder = '내용을 입력하세요. [[노트제목]]으로 링크, #태그로 태그를 추가할 수 있습니다.',
  currentNoteId
}: NoteEditorAdvancedProps) {
  const router = useRouter()
  const { data: allNotes = [] } = useNotes()
  const createNote = useCreateNote()
  const createTag = useCreateTag()
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [creatingLinkTitle, setCreatingLinkTitle] = useState<string | null>(null)
  const lastSyncedMarkdown = useRef<string | null>(null)
  const { vimMode } = useEditorStore()
  const [vimModeState, setVimModeState] = useState<'normal' | 'insert'>('insert')

  const getEditorContent = (value: string) => {
    return isProbablyHtml(value) ? value : markdownToHtml(value)
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
        onLinkClick: async (title: string) => {
          // [[링크]] 클릭 시 해당 노트로 이동
          const targetNote = allNotes.find(n => n.title === title)
          if (targetNote) {
            router.push(`/notes?noteId=${targetNote.id}`)
            return
          }

          if (creatingLinkTitle === title) return

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
        onModeChange: (mode) => setVimModeState(mode as 'normal' | 'insert'),
      }),
    ],
    content: getEditorContent(content),
    editorProps: {
      attributes: {
        class: 'note-content max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
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

  // WikiLink hover 미리보기
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

    editorElement.addEventListener('mouseover', handleMouseOver)
    editorElement.addEventListener('mouseout', handleMouseOut)

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver)
      editorElement.removeEventListener('mouseout', handleMouseOut)
      if (tippyInstance) {
        tippyInstance.destroy()
      }
    }
  }, [editor])

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
      {/* 에디터 툴바 */}
      <div className="border-b p-2 flex gap-2 bg-gray-50 flex-wrap items-center">
        {/* Vim 모드 표시 */}
        {vimMode && (
          <div className={`px-2 py-1 rounded text-xs font-mono ${
            vimModeState === 'normal'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {vimModeState === 'normal' ? '-- NORMAL --' : '-- INSERT --'}
          </div>
        )}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('code') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          Code
        </button>
        <div className="border-l mx-2" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          H3
        </button>
        <div className="border-l mx-2" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('bulletList') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('orderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          Numbered
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('taskList') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          Task
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('codeBlock') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          Code Block
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('blockquote') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
        >
          Quote
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 rounded text-sm hover:bg-gray-200"
        >
          Divider
        </button>
        <button
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          className="px-2 py-1 rounded text-sm hover:bg-gray-200"
        >
          Table
        </button>
      </div>

      {/* 에디터 영역 */}
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
