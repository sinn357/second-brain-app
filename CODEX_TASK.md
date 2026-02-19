# Codex(X) 작업 지시서: 미디어 기능

> **작성일**: 2026-02-19
> **작성자**: Arch (Claude)
> **목표**: v0.1 출시를 위한 미디어 기능 구현
> **상태**: Ready for X

---

## 📋 Task 목록

| # | Task | 난이도 | 중요도 | 상태 |
|---|------|:------:|:------:|:----:|
| 1 | Cloudinary 설정 + 이미지 업로드 API | 중 | 🔴 필수 | |
| 2 | Tiptap 이미지 Extension | 중 | 🔴 필수 | |
| 3 | 이미지 드래그&드롭 + 붙여넣기 | 중 | 🔴 필수 | |
| 4 | 파일 첨부 | 중 | 🔴 필수 | |
| 5 | 링크 미리보기 (OG) | 낮 | 🟡 권장 | |

---

## 환경변수 (설정 완료)

```env
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
```

---

## Task 1: Cloudinary 설정 + 이미지 업로드 API

### 목표
서버 사이드에서 Cloudinary로 이미지 업로드

### 구현 방법

**1. 의존성 추가**

```bash
npm install cloudinary
```

**2. Cloudinary 설정 파일**

파일: `lib/cloudinary.ts` (새 파일)

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

export async function uploadImage(
  file: Buffer,
  options?: {
    folder?: string
    maxWidth?: number
    maxHeight?: number
  }
): Promise<UploadResult> {
  const { folder = 'second-brain', maxWidth = 1920, maxHeight = 1080 } = options || {}

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: maxWidth, height: maxHeight, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          })
        }
      }
    ).end(file)
  })
}

export async function uploadFile(
  file: Buffer,
  filename: string,
  options?: { folder?: string }
): Promise<UploadResult> {
  const { folder = 'second-brain/files' } = options || {}

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        public_id: filename.replace(/\.[^/.]+$/, ''), // 확장자 제거
        use_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: 0,
            height: 0,
            format: result.format || '',
            bytes: result.bytes || 0,
          })
        }
      }
    ).end(file)
  })
}

export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
```

**3. 이미지 업로드 API**

파일: `app/api/upload/image/route.ts` (새 파일)

```typescript
import { NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer)

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    })
  } catch (error) {
    console.error('POST /api/upload/image error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}
```

**4. 파일 업로드 API**

파일: `app/api/upload/file/route.ts` (새 파일)

```typescript
import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (50MB)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 50MB' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadFile(buffer, file.name)

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      filename: file.name,
      bytes: result.bytes,
    })
  } catch (error) {
    console.error('POST /api/upload/file error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}
```

### 참고
- Cloudinary Node.js SDK: https://cloudinary.com/documentation/node_integration

---

## Task 2: Tiptap 이미지 Extension

### 목표
에디터에서 이미지 삽입/표시/리사이즈

### 구현 방법

**1. 의존성 추가**

```bash
npm install @tiptap/extension-image
```

**2. 커스텀 이미지 Extension (리사이즈 지원)**

파일: `lib/tiptap-extensions/ResizableImage.ts` (새 파일)

```typescript
import Image from '@tiptap/extension-image'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface ResizableImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, unknown>
}

export const ResizableImage = Image.extend<ResizableImageOptions>({
  name: 'resizableImage',

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
        parseHTML: (element) => element.getAttribute('width'),
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height'),
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { height: attributes.height }
        },
      },
      'data-public-id': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-public-id'),
        renderHTML: (attributes) => {
          if (!attributes['data-public-id']) return {}
          return { 'data-public-id': attributes['data-public-id'] }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('resizableImage'),
        props: {
          handleDOMEvents: {
            // 이미지 클릭 시 리사이즈 핸들 표시는 CSS로 처리
          },
        },
      }),
    ]
  },
})
```

**3. 이미지 스타일 추가**

파일: `app/globals.css` (추가)

```css
/* 이미지 스타일 */
.ProseMirror .resizable-image {
  max-width: 100%;
  height: auto;
  cursor: pointer;
  border-radius: 4px;
  transition: box-shadow 0.2s;
}

.ProseMirror .resizable-image:hover {
  box-shadow: 0 0 0 2px hsl(var(--primary));
}

.ProseMirror .resizable-image.ProseMirror-selectednode {
  box-shadow: 0 0 0 2px hsl(var(--primary));
}

/* 이미지 정렬 */
.ProseMirror img[data-align="left"] {
  float: left;
  margin-right: 1rem;
}

.ProseMirror img[data-align="center"] {
  display: block;
  margin: 0 auto;
}

.ProseMirror img[data-align="right"] {
  float: right;
  margin-left: 1rem;
}
```

---

## Task 3: 이미지 드래그&드롭 + 붙여넣기

### 목표
이미지를 드래그하거나 붙여넣기로 삽입

### 구현 방법

**1. 이미지 업로드 훅**

파일: `lib/hooks/useImageUpload.ts` (새 파일)

```typescript
import { useState } from 'react'

interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      return {
        url: data.url,
        publicId: data.publicId,
        width: data.width,
        height: data.height,
      }
    } catch (error) {
      console.error('Image upload error:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadImage, isUploading }
}
```

**2. NoteEditorAdvanced에 이미지 기능 추가**

파일: `components/NoteEditorAdvanced.tsx` (수정)

```typescript
// 상단 import 추가
import { ResizableImage } from '@/lib/tiptap-extensions/ResizableImage'
import { useImageUpload } from '@/lib/hooks/useImageUpload'
import { ImagePlus, Paperclip } from 'lucide-react'

// useEditor extensions 배열에 추가
ResizableImage.configure({
  inline: false,
  allowBase64: false,
}),

// 컴포넌트 내부에 추가
const { uploadImage, isUploading } = useImageUpload()
const fileInputRef = useRef<HTMLInputElement>(null)

// 이미지 삽입 함수
const insertImage = useCallback(async (file: File) => {
  if (!editor) return

  const result = await uploadImage(file)
  if (result) {
    editor
      .chain()
      .focus()
      .setImage({
        src: result.url,
        'data-public-id': result.publicId,
      })
      .run()
  }
}, [editor, uploadImage])

// 드래그&드롭 핸들러
const handleDrop = useCallback(async (e: React.DragEvent) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer.files)
  const imageFiles = files.filter(f => f.type.startsWith('image/'))

  for (const file of imageFiles) {
    await insertImage(file)
  }
}, [insertImage])

// 붙여넣기 핸들러
const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
  const items = Array.from(e.clipboardData.items)
  const imageItems = items.filter(item => item.type.startsWith('image/'))

  if (imageItems.length > 0) {
    e.preventDefault()
    for (const item of imageItems) {
      const file = item.getAsFile()
      if (file) {
        await insertImage(file)
      }
    }
  }
}, [insertImage])

// 툴바에 이미지 버튼 추가
<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  disabled={isUploading}
  className="p-2 rounded hover:bg-muted"
  title="이미지 삽입"
>
  <ImagePlus className="w-4 h-4" />
</button>

// hidden file input
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      await insertImage(file)
      e.target.value = ''
    }
  }}
/>

// EditorContent에 이벤트 핸들러 추가
<div onDrop={handleDrop} onPaste={handlePaste} onDragOver={(e) => e.preventDefault()}>
  <EditorContent editor={editor} />
</div>
```

---

## Task 4: 파일 첨부

### 목표
이미지 외 파일 (PDF, 문서 등) 첨부

### 구현 방법

**1. 파일 첨부 Extension**

파일: `lib/tiptap-extensions/FileAttachment.ts` (새 파일)

```typescript
import { Node, mergeAttributes } from '@tiptap/core'

export interface FileAttachmentOptions {
  HTMLAttributes: Record<string, unknown>
}

export const FileAttachment = Node.create<FileAttachmentOptions>({
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
      bytes: { default: null },
      publicId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-file-attachment]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const filename = HTMLAttributes.filename || 'file'
    const bytes = HTMLAttributes.bytes || 0
    const sizeStr = formatBytes(bytes)

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-file-attachment': '',
      }),
      [
        'a',
        {
          href: HTMLAttributes.url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'file-link',
        },
        [
          'span',
          { class: 'file-icon' },
          '📎',
        ],
        [
          'span',
          { class: 'file-name' },
          filename,
        ],
        [
          'span',
          { class: 'file-size' },
          sizeStr,
        ],
      ],
    ]
  },

  addCommands() {
    return {
      setFileAttachment:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
```

**2. 파일 첨부 스타일**

파일: `app/globals.css` (추가)

```css
/* 파일 첨부 스타일 */
.file-attachment {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: hsl(var(--muted));
  border-radius: 6px;
  margin: 0.5rem 0;
}

.file-attachment .file-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
}

.file-attachment .file-link:hover {
  text-decoration: underline;
}

.file-attachment .file-icon {
  font-size: 1.25rem;
}

.file-attachment .file-name {
  font-weight: 500;
}

.file-attachment .file-size {
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
}
```

**3. 파일 업로드 훅**

파일: `lib/hooks/useFileUpload.ts` (새 파일)

```typescript
import { useState } from 'react'

interface UploadResult {
  url: string
  publicId: string
  filename: string
  bytes: number
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      return {
        url: data.url,
        publicId: data.publicId,
        filename: data.filename,
        bytes: data.bytes,
      }
    } catch (error) {
      console.error('File upload error:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadFile, isUploading }
}
```

---

## Task 5: 링크 미리보기 (OG)

### 목표
URL 붙여넣기 시 OG 이미지/제목 표시

### 구현 방법

**1. OG 메타 파싱 API**

파일: `app/api/og/route.ts` (새 파일)

```typescript
import { NextResponse } from 'next/server'

interface OGData {
  title: string
  description: string
  image: string
  url: string
  siteName: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL required' },
        { status: 400 }
      )
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecondBrainBot/1.0)',
      },
    })

    const html = await response.text()
    const og = parseOG(html, url)

    return NextResponse.json({ success: true, og })
  } catch (error) {
    console.error('GET /api/og error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch OG data' },
      { status: 500 }
    )
  }
}

function parseOG(html: string, url: string): OGData {
  const getMetaContent = (property: string): string => {
    const regex = new RegExp(
      `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`,
      'i'
    )
    const match = html.match(regex)
    return match?.[1] || ''
  }

  const getTitle = (): string => {
    const ogTitle = getMetaContent('og:title')
    if (ogTitle) return ogTitle

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return titleMatch?.[1] || url
  }

  return {
    title: getTitle(),
    description: getMetaContent('og:description') || getMetaContent('description'),
    image: getMetaContent('og:image'),
    url: getMetaContent('og:url') || url,
    siteName: getMetaContent('og:site_name') || new URL(url).hostname,
  }
}
```

**2. 링크 미리보기 Extension**

파일: `lib/tiptap-extensions/LinkPreview.ts` (새 파일)

```typescript
import { Node, mergeAttributes } from '@tiptap/core'

export interface LinkPreviewOptions {
  HTMLAttributes: Record<string, unknown>
}

export const LinkPreview = Node.create<LinkPreviewOptions>({
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
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-link-preview': '',
      }),
      [
        'a',
        {
          href: HTMLAttributes.url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'link-preview-content',
        },
        HTMLAttributes.image
          ? ['img', { src: HTMLAttributes.image, class: 'link-preview-image' }]
          : '',
        [
          'div',
          { class: 'link-preview-text' },
          ['div', { class: 'link-preview-title' }, HTMLAttributes.title || HTMLAttributes.url],
          HTMLAttributes.description
            ? ['div', { class: 'link-preview-description' }, HTMLAttributes.description]
            : '',
          ['div', { class: 'link-preview-site' }, HTMLAttributes.siteName || ''],
        ],
      ],
    ]
  },

  addCommands() {
    return {
      setLinkPreview:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
```

**3. 링크 미리보기 스타일**

파일: `app/globals.css` (추가)

```css
/* 링크 미리보기 스타일 */
.link-preview {
  margin: 1rem 0;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  overflow: hidden;
}

.link-preview-content {
  display: flex;
  text-decoration: none;
  color: inherit;
}

.link-preview-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  flex-shrink: 0;
}

.link-preview-text {
  padding: 0.75rem 1rem;
  flex: 1;
  min-width: 0;
}

.link-preview-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-preview-description {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-preview-site {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .link-preview-content {
    flex-direction: column;
  }

  .link-preview-image {
    width: 100%;
    height: 160px;
  }
}
```

---

## 📁 파일 구조

```
새로 만들 파일:
├── lib/cloudinary.ts                      # Task 1
├── app/api/upload/image/route.ts          # Task 1
├── app/api/upload/file/route.ts           # Task 1
├── lib/tiptap-extensions/ResizableImage.ts # Task 2
├── lib/hooks/useImageUpload.ts            # Task 3
├── lib/tiptap-extensions/FileAttachment.ts # Task 4
├── lib/hooks/useFileUpload.ts             # Task 4
├── app/api/og/route.ts                    # Task 5
├── lib/tiptap-extensions/LinkPreview.ts   # Task 5

수정할 파일:
├── package.json                           # 의존성 추가
├── components/NoteEditorAdvanced.tsx      # 에디터 통합
├── app/globals.css                        # 스타일 추가
```

---

## ⚠️ 주의사항

1. **빌드 확인**: 각 Task 완료 후 `npm run build`
2. **lint 유지**: 0 errors 유지
3. **환경변수**: Cloudinary 설정 확인 (이미 완료)
4. **파일 크기**: 이미지 10MB, 파일 50MB 제한
5. **보안**: 서버 사이드 업로드로 secret 보호

---

## ✅ 완료 기준

- [x] Task 1: 이미지 업로드 API 작동
- [x] Task 2: 에디터에서 이미지 표시
- [x] Task 3: 드래그&드롭, 붙여넣기로 이미지 삽입
- [x] Task 4: 파일 첨부 작동
- [x] Task 5: URL 붙여넣기 시 미리보기 표시

---

## ✅ 완료 보고 형식

```markdown
✅ 미디어 기능 완료

**완료 Task**:
- [x] Task 1: Cloudinary + 업로드 API
- [x] Task 2: Tiptap 이미지 Extension
- [x] Task 3: 드래그&드롭 + 붙여넣기
- [x] Task 4: 파일 첨부
- [x] Task 5: 링크 미리보기

**테스트 결과**:
- npm run lint: 0 errors
- npm run build: 통과
- 이미지 업로드: 테스트 완료
- 파일 첨부: 테스트 완료

**수정된 파일 목록**:
- (파일 리스트)
```

---

## 📞 질문 시

- Arch (Claude)에게 질문
- 또는 사용자에게 직접 질문

---

**Status**: Ready for X (Codex)
**이전 작업 (아카이브)**: Obsidian Parity 99% 완료 (2026-02-19)

---

## ✅ 완료 보고 (X) - 2026-02-19

✅ 미디어 기능 완료

**완료 Task**:
- [x] Task 1: Cloudinary + 업로드 API
- [x] Task 2: Tiptap 이미지 Extension
- [x] Task 3: 드래그&드롭 + 붙여넣기
- [x] Task 4: 파일 첨부
- [x] Task 5: 링크 미리보기

**테스트 결과**:
- `npm run lint`: 0 errors (기존 warning 27개 유지)
- `npm run build`: 통과

**수정된 파일 목록**:
- `package.json`
- `package-lock.json`
- `lib/cloudinary.ts`
- `app/api/upload/image/route.ts`
- `app/api/upload/file/route.ts`
- `app/api/og/route.ts`
- `lib/hooks/useImageUpload.ts`
- `lib/hooks/useFileUpload.ts`
- `lib/hooks/useOgPreview.ts`
- `lib/tiptap-extensions/ResizableImage.ts`
- `lib/tiptap-extensions/FileAttachment.ts`
- `lib/tiptap-extensions/LinkPreview.ts`
- `components/NoteEditorAdvanced.tsx`
- `app/globals.css`
