'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { useEffect, useRef } from 'react'
import { htmlToMarkdown, isProbablyHtml, markdownToHtml } from '@/lib/markdown'

interface NoteEditorProps {
  content: string
  onUpdate: (content: string) => void
  placeholder?: string
}

export function NoteEditor({ content, onUpdate, placeholder = '내용을 입력하세요...' }: NoteEditorProps) {
  const lastSyncedMarkdown = useRef<string | null>(null)

  const getEditorContent = (value: string) => {
    return isProbablyHtml(value) ? value : markdownToHtml(value)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
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
      <div className="border-b p-2 flex gap-2 bg-gray-50">
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
    </div>
  )
}
