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
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Mathematics from '@tiptap/extension-mathematics'
import { common, createLowlight } from 'lowlight'
import { WikiLink } from '@/lib/tiptap-extensions/WikiLink'
import { HashTag } from '@/lib/tiptap-extensions/HashTag'
import { WikiLinkAutocomplete } from '@/lib/tiptap-extensions/WikiLinkAutocomplete'
import { VimMode } from '@/lib/tiptap-extensions/VimMode'
import { Callout } from '@/lib/tiptap-extensions/Callout'
import { ToggleBlock } from '@/lib/tiptap-extensions/ToggleBlock'
import { useEditorStore } from '@/lib/stores/editorStore'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useCreateNote, useNotes } from '@/lib/hooks/useNotes'
import { useCreateTag } from '@/lib/hooks/useTags'
import { useRouter } from 'next/navigation'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { NoteLinkPreview } from './NoteLinkPreview'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { htmlToMarkdown, isProbablyHtml, markdownToHtml } from '@/lib/markdown'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Heading1,
  Italic,
  Link2,
  List,
  ListOrdered,
  Code2,
  CheckSquare,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Paintbrush,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlertTriangle,
  ChevronsUpDown,
  Sigma,
  SlidersHorizontal,
  X,
} from 'lucide-react'

const lowlight = createLowlight(common)

interface NoteEditorAdvancedProps {
  content: string
  onUpdate: (content: string) => void
  placeholder?: string
  currentNoteId?: string
  forceFirstHeading?: boolean
  currentFolderId?: string | null
}

interface TocHeading {
  id: string
  text: string
  level: number
  pos: number
}

const DESKTOP_TOOLBAR_STORAGE_KEY = 'noteToolbarDesktop'
const MOBILE_TOOLBAR_STORAGE_KEY = 'noteToolbarMobile'

export function NoteEditorAdvanced({
  content,
  onUpdate,
  placeholder = '내용을 입력하세요. [[노트제목]]으로 링크, #태그로 태그를 추가할 수 있습니다.',
  forceFirstHeading = false,
  currentFolderId = null
}: NoteEditorAdvancedProps) {
  const router = useRouter()
  const { data: allNotes = [] } = useNotes()
  const createNote = useCreateNote()
  const createTag = useCreateTag()
  const [creatingLinkTitle, setCreatingLinkTitle] = useState<string | null>(null)
  const [linkChoices, setLinkChoices] = useState<{
    title: string
    candidates: typeof allNotes
  } | null>(null)
  const [tocHeadings, setTocHeadings] = useState<TocHeading[]>([])
  const [isDesktopToolbarOpen, setIsDesktopToolbarOpen] = useState(false)
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false)
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
    async (title: string, heading?: string) => {
      const matches = notesRef.current.filter((note) => note.title === title)
      if (matches.length === 1) {
        const noteId = matches[0].id
        if (heading) {
          router.push(`/notes?noteId=${noteId}&heading=${encodeURIComponent(heading)}`)
        } else {
          router.push(`/notes?noteId=${noteId}`)
        }
        return
      }

      if (matches.length > 1) {
        const sameFolder = matches.find((note) => note.folderId === currentFolderId)
        if (sameFolder) {
          if (heading) {
            router.push(`/notes?noteId=${sameFolder.id}&heading=${encodeURIComponent(heading)}`)
          } else {
            router.push(`/notes?noteId=${sameFolder.id}`)
          }
          return
        }
        setLinkChoices({ title, candidates: matches })
        return
      }

      if (creatingLinkRef.current === title) return

      try {
        setCreatingLinkTitle(title)
        const newNote = await createNote.mutateAsync({
          title,
          body: '',
          folderId: currentFolderId ?? null,
        })
        toast.success(`"${title}" 노트를 생성했습니다`)
        if (heading) {
          router.push(`/notes?noteId=${newNote.id}&heading=${encodeURIComponent(heading)}`)
        } else {
          router.push(`/notes?noteId=${newNote.id}`)
        }
      } catch (error) {
        console.error('Create note from link failed:', error)
        toast.error(`"${title}" 노트 생성에 실패했습니다`)
      } finally {
        setCreatingLinkTitle(null)
      }
    },
    [createNote, router, currentFolderId]
  )

  const getEditorContent = (value: string) => {
    return isProbablyHtml(value) ? value : markdownToHtml(value)
  }

  const buildTocHeadings = useCallback((editorInstance: Editor | null) => {
    if (!editorInstance) return []

    const headings: TocHeading[] = []
    editorInstance.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'heading') return true
      const level = Number(node.attrs.level ?? 1)
      const text = node.textContent.trim()
      if (!text) return true
      headings.push({
        id: `heading-${pos}`,
        text,
        level: Math.min(Math.max(level, 1), 6),
        pos,
      })
      return true
    })

    return headings
  }, [])

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
        codeBlock: false,
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Typography,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
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
      Callout,
      ToggleBlock,
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
        id: 'note-content',
        class: 'note-content max-w-none focus:outline-none min-h-[60vh] px-0 py-6',
      },
    },
    onUpdate: ({ editor }) => {
      if (forceFirstHeading && ensureFirstHeading(editor)) {
        return
      }
      setTocHeadings(buildTocHeadings(editor))
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      lastSyncedMarkdown.current = markdown
      onUpdate(markdown)
    },
    onCreate: ({ editor }) => {
      setTocHeadings(buildTocHeadings(editor))
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const desktopSaved = window.localStorage.getItem(DESKTOP_TOOLBAR_STORAGE_KEY)
    const mobileSaved = window.localStorage.getItem(MOBILE_TOOLBAR_STORAGE_KEY)
    if (desktopSaved === 'true') setIsDesktopToolbarOpen(true)
    if (mobileSaved === 'true') setIsMobileToolbarOpen(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DESKTOP_TOOLBAR_STORAGE_KEY, String(isDesktopToolbarOpen))
  }, [isDesktopToolbarOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(MOBILE_TOOLBAR_STORAGE_KEY, String(isMobileToolbarOpen))
  }, [isMobileToolbarOpen])

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
      const target = event.target
      let element: Element | null = null
      if (target instanceof Element) {
        element = target
      } else if (target instanceof Node) {
        element = target.parentElement
      }

      const linkEl = element?.closest('.wiki-link-decoration') as HTMLElement | null
      if (!linkEl) return
      const title = linkEl.getAttribute('data-title')
      const heading = linkEl.getAttribute('data-heading') ?? undefined
      if (title) {
        event.preventDefault()
        void handleWikiLinkClick(title, heading)
      }
    }

    editorElement.addEventListener('mouseover', handleMouseOver)
    editorElement.addEventListener('mouseout', handleMouseOut)
    editorElement.addEventListener('click', handleClick, true)

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver)
      editorElement.removeEventListener('mouseout', handleMouseOut)
      editorElement.removeEventListener('click', handleClick, true)
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
      <div className="p-4 min-h-[400px] animate-pulse text-indigo-500 dark:text-indigo-300">
        Loading editor...
      </div>
    )
  }

  const applyLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('링크 URL을 입력하세요', previousUrl || 'https://')
    if (url === null) return

    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      editor.chain().focus().unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmedUrl }).run()
  }

  const insertInlineMath = () => {
    const latex = window.prompt('인라인 수식(LaTeX)을 입력하세요', 'E = mc^2')
    if (!latex || !latex.trim()) return
    editor.chain().focus().insertInlineMath({ latex: latex.trim() }).run()
  }

  const insertBlockMath = () => {
    const latex = window.prompt('블록 수식(LaTeX)을 입력하세요', '\\sum_{i=1}^{n} x_i')
    if (!latex || !latex.trim()) return
    editor.chain().focus().insertBlockMath({ latex: latex.trim() }).run()
  }

  const moveToHeading = (pos: number) => {
    editor.chain().focus().setTextSelection(pos + 1).run()
  }

  const highlightColors = [
    { key: 'hl-yellow', label: '노랑 강조', color: '#fef08a' },
    { key: 'hl-green', label: '초록 강조', color: '#bbf7d0' },
    { key: 'hl-blue', label: '파랑 강조', color: '#bfdbfe' },
    { key: 'hl-red', label: '빨강 강조', color: '#fecaca' },
  ] as const

  const textColors = [
    { key: 'txt-red', label: '빨강 글자', color: '#ef4444' },
    { key: 'txt-blue', label: '파랑 글자', color: '#3b82f6' },
    { key: 'txt-green', label: '초록 글자', color: '#10b981' },
  ] as const

  const desktopToolbarItems = [
    {
      key: 'bold',
      label: '굵게',
      icon: Bold,
      active: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: '기울임',
      icon: Italic,
      active: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'underline',
      label: '밑줄',
      icon: UnderlineIcon,
      active: editor.isActive('underline'),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      key: 'strike',
      label: '취소선',
      icon: Strikethrough,
      active: editor.isActive('strike'),
      onClick: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      key: 'heading',
      label: '제목',
      icon: Heading1,
      active: editor.isActive('heading', { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      key: 'bullet',
      label: '목록',
      icon: List,
      active: editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'ordered',
      label: '번호',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'task',
      label: '체크',
      icon: CheckSquare,
      active: editor.isActive('taskList'),
      onClick: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      key: 'codeblock',
      label: '코드',
      icon: Code2,
      active: editor.isActive('codeBlock'),
      onClick: () => editor.chain().focus().setCodeBlock({ language: 'plaintext' }).run(),
    },
    {
      key: 'link',
      label: '링크',
      icon: Link2,
      active: editor.isActive('link'),
      onClick: applyLink,
    },
    {
      key: 'math-inline',
      label: '인라인 수식',
      icon: Sigma,
      active: editor.isActive('inlineMath'),
      onClick: insertInlineMath,
    },
    {
      key: 'math-block',
      label: '블록 수식',
      icon: Sigma,
      active: editor.isActive('blockMath'),
      onClick: insertBlockMath,
    },
  ]

  const mobileToolbarItems = [
    {
      key: 'h1',
      label: '제목',
      icon: Heading1,
      active: editor.isActive('heading', { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      key: 'bold',
      label: '굵게',
      icon: Bold,
      active: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: '기울임',
      icon: Italic,
      active: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'underline',
      label: '밑줄',
      icon: UnderlineIcon,
      active: editor.isActive('underline'),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      key: 'strike',
      label: '취소선',
      icon: Strikethrough,
      active: editor.isActive('strike'),
      onClick: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      key: 'highlight',
      label: '강조',
      icon: Highlighter,
      active: editor.isActive('highlight'),
      onClick: () => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run(),
    },
    {
      key: 'text-red',
      label: '글자 빨강',
      icon: Paintbrush,
      active: editor.isActive('textStyle', { color: '#ef4444' }),
      onClick: () => editor.chain().focus().setColor('#ef4444').run(),
    },
    {
      key: 'text-clear',
      label: '색상 지우기',
      icon: Paintbrush,
      active: false,
      onClick: () => editor.chain().focus().unsetColor().run(),
    },
    {
      key: 'bullet',
      label: '목록',
      icon: List,
      active: editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'ordered',
      label: '번호',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'task',
      label: '체크',
      icon: CheckSquare,
      active: editor.isActive('taskList'),
      onClick: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      key: 'codeblock',
      label: '코드',
      icon: Code2,
      active: editor.isActive('codeBlock'),
      onClick: () => editor.chain().focus().setCodeBlock({ language: 'plaintext' }).run(),
    },
    {
      key: 'callout',
      label: '콜아웃',
      icon: AlertTriangle,
      active: editor.isActive('callout'),
      onClick: () => editor.chain().focus().setCallout('note').run(),
    },
    {
      key: 'toggle-block',
      label: '토글',
      icon: ChevronsUpDown,
      active: editor.isActive('toggleBlock'),
      onClick: () => editor.chain().focus().insertToggleBlock('토글').run(),
    },
    {
      key: 'link',
      label: '링크',
      icon: Link2,
      active: editor.isActive('link'),
      onClick: applyLink,
    },
    {
      key: 'math-inline',
      label: '인라인 수식',
      icon: Sigma,
      active: editor.isActive('inlineMath'),
      onClick: insertInlineMath,
    },
    {
      key: 'math-block',
      label: '블록 수식',
      icon: Sigma,
      active: editor.isActive('blockMath'),
      onClick: insertBlockMath,
    },
    {
      key: 'align-left',
      label: '왼쪽 정렬',
      icon: AlignLeft,
      active: editor.isActive({ textAlign: 'left' }),
      onClick: () => editor.chain().focus().setTextAlign('left').run(),
    },
    {
      key: 'align-center',
      label: '가운데 정렬',
      icon: AlignCenter,
      active: editor.isActive({ textAlign: 'center' }),
      onClick: () => editor.chain().focus().setTextAlign('center').run(),
    },
    {
      key: 'align-right',
      label: '오른쪽 정렬',
      icon: AlignRight,
      active: editor.isActive({ textAlign: 'right' }),
      onClick: () => editor.chain().focus().setTextAlign('right').run(),
    },
  ]

  return (
    <div>
      <div className="mb-2 hidden justify-end lg:flex">
        <Button
          type="button"
          variant={isDesktopToolbarOpen ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => setIsDesktopToolbarOpen((prev) => !prev)}
          aria-expanded={isDesktopToolbarOpen}
          aria-controls="note-editor-desktop-toolbar"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {isDesktopToolbarOpen ? '도구 접기' : '도구 펼치기'}
        </Button>
      </div>

      {isDesktopToolbarOpen && tocHeadings.length > 0 && (
        <div className="mb-2 hidden rounded-lg border border-indigo-200/70 bg-white/85 px-3 py-2 dark:border-indigo-700/60 dark:bg-indigo-950/70 lg:block">
          <p className="mb-2 text-xs font-semibold text-indigo-500 dark:text-indigo-300">목차</p>
          <div className="flex flex-wrap gap-1">
            {tocHeadings.map((heading) => (
              <button
                key={heading.id}
                type="button"
                onClick={() => moveToHeading(heading.pos)}
                className="rounded-md px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-100 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
                style={{ marginLeft: `${Math.max(0, heading.level - 1) * 8}px` }}
                title={heading.text}
              >
                {heading.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {isDesktopToolbarOpen && (
      <div
        id="note-editor-desktop-toolbar"
        className="mb-2 hidden items-center gap-2 overflow-x-auto rounded-lg border border-indigo-200/70 bg-white/85 px-3 py-2 dark:border-indigo-700/60 dark:bg-indigo-950/70 lg:flex"
      >
        {desktopToolbarItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.key}
              type="button"
              variant={item.active ? 'default' : 'outline'}
              size="sm"
              className="h-8 shrink-0 gap-1"
              onClick={item.onClick}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          )
        })}

        <div className="mx-1 h-6 w-px bg-indigo-200 dark:bg-indigo-700" />

        {highlightColors.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color: item.color }).run()}
            className="h-7 w-7 shrink-0 rounded border border-indigo-200 dark:border-indigo-700"
            style={{ backgroundColor: item.color }}
            aria-label={item.label}
            title={item.label}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => editor.chain().focus().unsetHighlight().run()}
        >
          강조 해제
        </Button>

        <div className="mx-1 h-6 w-px bg-indigo-200 dark:bg-indigo-700" />

        {textColors.map((item) => (
          <Button
            key={item.key}
            type="button"
            variant={editor.isActive('textStyle', { color: item.color }) ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            onClick={() => editor.chain().focus().setColor(item.color).run()}
          >
            <span style={{ color: item.color }}>{item.label.replace(' 글자', '')}</span>
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => editor.chain().focus().unsetColor().run()}
        >
          색상 해제
        </Button>

        <div className="mx-1 h-6 w-px bg-indigo-200 dark:bg-indigo-700" />

        <Button
          type="button"
          variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={() => editor.chain().focus().setCodeBlock({ language: 'javascript' }).run()}
        >
          JS
        </Button>
        <Button
          type="button"
          variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={() => editor.chain().focus().setCodeBlock({ language: 'typescript' }).run()}
        >
          TS
        </Button>
        <Button
          type="button"
          variant={editor.isActive('callout') ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={() => editor.chain().focus().setCallout('note').run()}
        >
          콜아웃
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => editor.chain().focus().setCallout('warning').run()}
        >
          경고 콜아웃
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => editor.chain().focus().unsetCallout().run()}
        >
          콜아웃 해제
        </Button>
        <Button
          type="button"
          variant={editor.isActive('toggleBlock') ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={() => editor.chain().focus().insertToggleBlock('토글').run()}
        >
          토글
        </Button>
        <Button
          type="button"
          variant={editor.isActive('inlineMath') ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={insertInlineMath}
        >
          인라인 수식
        </Button>
        <Button
          type="button"
          variant={editor.isActive('blockMath') ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={insertBlockMath}
        >
          블록 수식
        </Button>
      </div>
      )}

      <EditorContent editor={editor} />
      <div className="fixed bottom-3 right-3 z-40 lg:hidden">
        <Button
          type="button"
          variant={isMobileToolbarOpen ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-2 rounded-full"
          onClick={() => setIsMobileToolbarOpen((prev) => !prev)}
          aria-expanded={isMobileToolbarOpen}
          aria-controls="note-editor-mobile-toolbar"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {isMobileToolbarOpen ? '도구 닫기' : '도구'}
        </Button>
      </div>

      {isMobileToolbarOpen && (
        <div
          id="note-editor-mobile-toolbar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-indigo-200/70 bg-white/95 px-3 py-2 backdrop-blur supports-[padding:max(0px)]:pb-[max(env(safe-area-inset-bottom),0.5rem)] dark:border-indigo-700/60 dark:bg-indigo-950/90 lg:hidden"
        >
          <div className="mb-2 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsMobileToolbarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {mobileToolbarItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.key}
                  type="button"
                  variant={item.active ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 shrink-0 gap-1"
                  onClick={item.onClick}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
        </div>
      )}
      <Dialog open={Boolean(linkChoices)} onOpenChange={(open) => !open && setLinkChoices(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>동일한 노트 제목이 있습니다</DialogTitle>
            <DialogDescription>
              &quot;{linkChoices?.title}&quot; 노트가 여러 개입니다. 열 노트를 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {linkChoices?.candidates.map((note) => (
              <Button
                key={note.id}
                variant="outline"
                className="w-full justify-between text-left"
                onClick={() => {
                  setLinkChoices(null)
                  router.push(`/notes?noteId=${note.id}`)
                }}
              >
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {note.title}
                </span>
                <span className="text-xs text-indigo-500 dark:text-indigo-300">
                  {note.folder?.name ?? '폴더 없음'}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
        .callout-block {
          border-left: 4px solid #6366f1;
          border-radius: 0.5rem;
          background: rgba(99, 102, 241, 0.08);
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
        }
        .callout-warning {
          border-left-color: #f59e0b;
          background: rgba(245, 158, 11, 0.12);
        }
        .toggle-block {
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          margin: 0.75rem 0;
          background: rgba(99, 102, 241, 0.05);
        }
        .toggle-summary {
          cursor: pointer;
          font-weight: 600;
          color: rgb(67 56 202);
          margin-bottom: 0.5rem;
        }
        .toggle-content {
          margin-top: 0.5rem;
        }
        .ProseMirror pre {
          border-radius: 0.5rem;
          background: #0f172a;
          color: #e2e8f0;
          padding: 0.75rem 1rem;
          overflow-x: auto;
        }
        @media (max-width: 1023px) {
          .note-content,
          .ProseMirror {
            min-height: 52dvh;
            padding-bottom: 5.5rem;
          }
        }
      `}</style>
    </div>
  )
}
