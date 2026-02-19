# Codex(X) 작업 지시서: Obsidian Parity 99%

> **작성일**: 2026-02-19
> **작성자**: Arch (Claude)
> **목표**: 옵시디언 95% → 99% 달성
> **상태**: Ready for X

---

## 📋 Task 목록

| # | Task | 난이도 | 예상 기여도 | 상태 |
|---|------|:------:|:-----------:|:----:|
| 1 | 검색 연산자 확장 | 낮 | +1% | |
| 2 | Periodic Notes (Weekly/Monthly) | 낮 | +1% | |
| 3 | 헤딩 링크 `[[Note#Heading]]` | 중 | +1% | |
| 4 | 중첩 태그 `#a/b` | 중 | +1% | |
| 5 | PDF Export | 중 | +0.5% | |

---

## Task 1: 검색 연산자 확장

### 목표
검색창에서 `tag:태그명`, `path:폴더명`, `file:파일명` 연산자 지원

### 구현 방법

**1. 검색 쿼리 파서 추가**

파일: `lib/searchParser.ts` (새 파일)

```typescript
export interface ParsedQuery {
  text: string           // 일반 검색어
  tags: string[]         // tag:xxx
  paths: string[]        // path:xxx
  files: string[]        // file:xxx
}

export function parseSearchQuery(query: string): ParsedQuery {
  const result: ParsedQuery = { text: '', tags: [], paths: [], files: [] }

  const operatorRegex = /(tag|path|file):(\S+)/gi
  let match

  let remaining = query
  while ((match = operatorRegex.exec(query)) !== null) {
    const [full, operator, value] = match
    remaining = remaining.replace(full, '')

    switch (operator.toLowerCase()) {
      case 'tag': result.tags.push(value); break
      case 'path': result.paths.push(value); break
      case 'file': result.files.push(value); break
    }
  }

  result.text = remaining.trim()
  return result
}
```

**2. 검색 API 수정**

파일: `app/api/notes/search/route.ts`

```typescript
import { parseSearchQuery } from '@/lib/searchParser'

// GET 핸들러 내부 (기존 query 파라미터 처리 부분 수정)
const parsed = parseSearchQuery(query)

// tag: 연산자
if (parsed.tags.length > 0) {
  andConditions.push({
    tags: {
      some: {
        tag: { name: { in: parsed.tags } }
      }
    }
  })
}

// path: 연산자
if (parsed.paths.length > 0) {
  andConditions.push({
    folder: {
      name: { in: parsed.paths, mode: 'insensitive' }
    }
  })
}

// file: 연산자
if (parsed.files.length > 0) {
  andConditions.push({
    OR: parsed.files.map(f => ({
      title: { contains: f, mode: 'insensitive' }
    }))
  })
}

// 일반 텍스트 검색 (기존 로직 유지하되 parsed.text 사용)
if (parsed.text && mode === 'normal') {
  andConditions.push({
    OR: [
      { title: { contains: parsed.text, mode: 'insensitive' } },
      { body: { contains: parsed.text, mode: 'insensitive' } },
    ]
  })
}
```

**3. CommandPalette UI 힌트**

파일: `components/CommandPalette.tsx`

- placeholder 수정: `"검색... (tag:, path:, file: 지원)"`

### 참고 파일
- `app/api/notes/search/route.ts:28-215` (기존 검색)
- `lib/filterEngine.ts` (필터 쿼리 빌더)
- `components/CommandPalette.tsx`

### 테스트 케이스
```
tag:프로젝트
path:Daily Notes
file:회의록
tag:중요 path:업무
검색어 tag:메모
```

---

## Task 2: Periodic Notes (Weekly/Monthly)

### 목표
Daily Notes처럼 Weekly Notes, Monthly Notes 자동 생성

### 구현 방법

**1. Weekly Notes API**

파일: `app/api/weekly-notes/route.ts` (새 파일)

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format, startOfWeek, endOfWeek } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam ? new Date(dateParam) : new Date()

    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 })
    const weekTitle = `${format(weekStart, 'yyyy-MM-dd')} ~ ${format(weekEnd, 'MM-dd')}`

    let folder = await prisma.folder.findFirst({
      where: { name: 'Weekly Notes' }
    })
    if (!folder) {
      folder = await prisma.folder.create({
        data: { name: 'Weekly Notes', position: 1 }
      })
    }

    let note = await prisma.note.findFirst({
      where: { title: weekTitle, folderId: folder.id },
      include: { folder: true, tags: { include: { tag: true } } }
    })

    if (!note) {
      const template = await prisma.template.findFirst({
        where: { name: 'Weekly Note' }
      })

      const content = template?.content
        .replace(/\{\{week_start\}\}/g, format(weekStart, 'yyyy-MM-dd'))
        .replace(/\{\{week_end\}\}/g, format(weekEnd, 'yyyy-MM-dd'))
        || `# ${weekTitle}\n\n## Goals\n\n- [ ] \n\n## Review\n\n`

      note = await prisma.note.create({
        data: { title: weekTitle, body: content, folderId: folder.id },
        include: { folder: true, tags: { include: { tag: true } } }
      })
    }

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('GET /api/weekly-notes error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

**2. Monthly Notes API**

파일: `app/api/monthly-notes/route.ts` (새 파일)

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam ? new Date(dateParam) : new Date()

    const monthTitle = format(targetDate, 'yyyy-MM')

    let folder = await prisma.folder.findFirst({
      where: { name: 'Monthly Notes' }
    })
    if (!folder) {
      folder = await prisma.folder.create({
        data: { name: 'Monthly Notes', position: 2 }
      })
    }

    let note = await prisma.note.findFirst({
      where: { title: monthTitle, folderId: folder.id },
      include: { folder: true, tags: { include: { tag: true } } }
    })

    if (!note) {
      const template = await prisma.template.findFirst({
        where: { name: 'Monthly Note' }
      })

      const content = template?.content
        .replace(/\{\{month\}\}/g, monthTitle)
        || `# ${monthTitle}\n\n## Goals\n\n- [ ] \n\n## Review\n\n`

      note = await prisma.note.create({
        data: { title: monthTitle, body: content, folderId: folder.id },
        include: { folder: true, tags: { include: { tag: true } } }
      })
    }

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('GET /api/monthly-notes error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

**3. Weekly 페이지**

파일: `app/weekly/page.tsx` (새 파일)

- `app/daily/page.tsx` 패턴 복사
- API: `/api/weekly-notes`
- 이전/다음 주 네비게이션: `addWeeks`, `subWeeks` 사용

**4. Monthly 페이지**

파일: `app/monthly/page.tsx` (새 파일)

- 이전/다음 월 네비게이션: `addMonths`, `subMonths` 사용

**5. 네비게이션 추가**

파일: `components/SidebarNav.tsx`

```typescript
// Daily Notes 아래에 추가
{ name: 'Weekly', href: '/weekly', icon: CalendarDaysIcon },
{ name: 'Monthly', href: '/monthly', icon: CalendarIcon },
```

### 참고 파일
- `app/api/daily-notes/route.ts` (패턴 참고)
- `app/daily/page.tsx` (UI 패턴)
- `lib/hooks/useDailyNote.ts` (훅 패턴)

---

## Task 3: 헤딩 링크 `[[Note#Heading]]`

### 목표
`[[노트명#헤딩]]` 형식으로 특정 헤딩으로 직접 링크

### 구현 방법

**1. WikiLink 정규식 수정**

파일: `lib/tiptap-extensions/WikiLink.ts:70`

```typescript
// 기존
const regex = /\[\[([^\]]+)\]\]/g

// 변경 (# 뒤 헤딩 캡처)
const regex = /\[\[([^\]#]+)(?:#([^\]]+))?\]\]/g
// match[1] = 노트명
// match[2] = 헤딩 (optional)
```

**2. 클릭 핸들러 수정**

파일: `lib/tiptap-extensions/WikiLink.ts:101-134`

```typescript
// foundTitle 처리 부분
if (foundTitle && this.options.onLinkClick) {
  // '#' 기준으로 분리
  const hashIndex = foundTitle.indexOf('#')
  if (hashIndex > -1) {
    const noteTitle = foundTitle.substring(0, hashIndex)
    const heading = foundTitle.substring(hashIndex + 1)
    this.options.onLinkClick(noteTitle, heading)
  } else {
    this.options.onLinkClick(foundTitle)
  }
  return true
}
```

**3. onLinkClick 타입 수정**

파일: `lib/tiptap-extensions/WikiLink.ts:7`

```typescript
export interface WikiLinkOptions {
  HTMLAttributes: Record<string, unknown>
  onLinkClick?: (title: string, heading?: string) => void  // heading 추가
}
```

**4. NoteEditor에서 헤딩 스크롤 처리**

파일: `components/NoteEditor.tsx` (handleWikiLinkClick 부분)

```typescript
const handleWikiLinkClick = async (title: string, heading?: string) => {
  // 기존 노트 찾기 로직...
  const note = await findNoteByTitle(title)
  if (!note) return

  router.push(`/notes?id=${note.id}`)

  // 헤딩이 있으면 스크롤
  if (heading) {
    setTimeout(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      for (const el of headings) {
        if (el.textContent?.toLowerCase().includes(heading.toLowerCase())) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          break
        }
      }
    }, 500)  // 노트 로드 대기
  }
}
```

### 참고 파일
- `lib/tiptap-extensions/WikiLink.ts` (메인 수정)
- `components/NoteEditor.tsx` (클릭 핸들러)

### 주의사항
- 헤딩에 특수문자 있을 수 있음 → 정규식 이스케이프 고려
- 헤딩 없으면 기존처럼 노트 상단으로 이동

---

## Task 4: 중첩 태그 `#a/b`

### 목표
`#project/personal` 같은 계층적 태그 지원

### 구현 방법

**1. HashTag 정규식 수정**

파일: `lib/tiptap-extensions/HashTag.ts`

```typescript
// 기존
const tagRegex = /#[\w가-힣]+/g

// 변경 (슬래시 허용)
const tagRegex = /#[\w가-힣]+(\/[\w가-힣]+)*/g
```

**2. 태그 유효성 검사 수정**

파일: `lib/validations/tag.ts`

```typescript
// 슬래시 허용하도록 스키마 수정
export const tagNameSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[\w가-힣]+(\/[\w가-힣]+)*$/, '유효하지 않은 태그명')
```

**3. 필터 엔진 수정 (하위 태그 포함 검색)**

파일: `lib/filterEngine.ts:272-306`

```typescript
function buildTagConditionQuery(
  operator: FilterCondition['operator'],
  value: unknown
): Prisma.NoteWhereInput {
  const safeValue = String(value ?? '')

  switch (operator) {
    case 'equals':
    case 'contains':
      return {
        tags: {
          some: {
            tag: {
              OR: [
                { name: { equals: safeValue } },
                { name: { startsWith: safeValue + '/' } }  // 하위 태그도 매칭
              ]
            }
          }
        }
      }
    // ... 나머지 케이스
  }
}
```

**4. UI 힌트 (선택)**

- 태그 입력 시 `#project/` 입력하면 하위 태그 자동완성 표시
- 복잡하면 생략 가능

### 참고 파일
- `lib/tiptap-extensions/HashTag.ts`
- `lib/validations/tag.ts`
- `lib/filterEngine.ts:272-306`

### 테스트 케이스
```
#project
#project/personal
#project/work/urgent
```

---

## Task 5: PDF Export

### 목표
노트를 PDF로 내보내기

### 구현 방법 (브라우저 print 활용 - 가장 간단)

**1. 의존성 추가**

```bash
npm install html2pdf.js
```

**2. ExportPdfButton 컴포넌트**

파일: `components/ExportPdfButton.tsx` (새 파일)

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

interface ExportPdfButtonProps {
  noteTitle: string
  contentElementId?: string
}

export function ExportPdfButton({
  noteTitle,
  contentElementId = 'note-content'
}: ExportPdfButtonProps) {
  const handleExport = async () => {
    const element = document.getElementById(contentElementId)
    if (!element) return

    const html2pdf = (await import('html2pdf.js')).default

    const opt = {
      margin: 10,
      filename: `${noteTitle}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().from(element).set(opt).save()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleExport}>
      <FileDown className="h-4 w-4 mr-1" />
      PDF
    </Button>
  )
}
```

**3. 노트 편집기에 버튼 추가**

파일: `components/NoteEditor.tsx` 또는 `NoteEditorAdvanced.tsx`

- 상단 툴바에 `<ExportPdfButton noteTitle={note.title} />` 추가
- 노트 본문 영역에 `id="note-content"` 추가

**4. 프린트 스타일**

파일: `app/globals.css`

```css
@media print {
  .no-print {
    display: none !important;
  }
  #note-content {
    max-width: 100%;
    padding: 20px;
  }
}
```

### 참고 파일
- `app/api/export/markdown/route.ts` (Export 패턴)
- `components/NoteEditor.tsx`

---

## ⚠️ 공통 주의사항

1. **빌드 확인**: 각 Task 완료 후 `npm run build`
2. **lint 유지**: 현재 0 errors 상태 유지
3. **기존 패턴**: 이미 있는 코드 스타일 준수
4. **타입 안전성**: TypeScript 타입 명시
5. **에러 핸들링**: try-catch 사용

---

## 📁 파일 구조

```
새로 만들 파일:
├── lib/searchParser.ts              # Task 1
├── app/api/weekly-notes/route.ts    # Task 2
├── app/api/monthly-notes/route.ts   # Task 2
├── app/weekly/page.tsx              # Task 2
├── app/monthly/page.tsx             # Task 2
├── components/ExportPdfButton.tsx   # Task 5

수정할 파일:
├── app/api/notes/search/route.ts    # Task 1
├── components/CommandPalette.tsx    # Task 1
├── lib/tiptap-extensions/WikiLink.ts        # Task 3
├── components/NoteEditor.tsx        # Task 3
├── lib/tiptap-extensions/HashTag.ts # Task 4
├── lib/validations/tag.ts           # Task 4
├── lib/filterEngine.ts              # Task 4
├── components/SidebarNav.tsx        # Task 2
├── app/globals.css                  # Task 5
```

---

## ✅ 완료 기준

- [ ] Task 1: `tag:`, `path:`, `file:` 검색 작동
- [ ] Task 2: `/weekly`, `/monthly` 페이지 작동
- [ ] Task 3: `[[Note#Heading]]` 클릭 시 헤딩으로 스크롤
- [ ] Task 4: `#a/b/c` 태그 생성/필터 가능
- [ ] Task 5: PDF 다운로드 작동

---

## ✅ 완료 보고 형식

```markdown
✅ Obsidian Parity 99% 완료

**완료 Task**:
- [x] Task 1: 검색 연산자
- [x] Task 2: Periodic Notes
- [x] Task 3: 헤딩 링크
- [x] Task 4: 중첩 태그
- [x] Task 5: PDF Export

**테스트 결과**:
- npm run lint: 0 errors
- npm run build: 통과

**수정된 파일 목록**:
- (파일 리스트)
```

---

## 📞 질문 시

- Arch (Claude)에게 질문
- 또는 사용자에게 직접 질문

---

**Status**: Ready for X (Codex)
**이전 작업 (아카이브)**: Phase 4 lint 정리 완료 (2026-02-18)

---

## ✅ X 완료 보고 (2026-02-19)

✅ Obsidian Parity 99% 완료

**완료 Task**:
- [x] Task 1: 검색 연산자
- [x] Task 2: Periodic Notes
- [x] Task 3: 헤딩 링크
- [x] Task 4: 중첩 태그
- [x] Task 5: PDF Export

**테스트 결과**:
- npm run lint: 0 errors (warnings only)
- npm run build: 통과

**수정된 파일 목록**:
- app/notes/page.tsx
- lib/searchParser.ts
- app/api/notes/search/route.ts
- components/CommandPalette.tsx
- app/api/weekly-notes/route.ts
- app/api/monthly-notes/route.ts
- app/weekly/page.tsx
- app/monthly/page.tsx
- components/AppMenuSheet.tsx
- components/SidebarNav.tsx
- lib/tiptap-extensions/WikiLink.ts
- components/NoteEditorAdvanced.tsx
- lib/tiptap-extensions/HashTag.ts
- lib/validations/tag.ts
- lib/filterEngine.ts
- components/ExportPdfButton.tsx
- app/globals.css
