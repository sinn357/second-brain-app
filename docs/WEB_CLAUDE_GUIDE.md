# Web Claude 작업 가이드

**대상**: Web Claude (GitHub 전용 작업자)
**역할**: MVP 기능 구현 (API Routes, Components, Hooks, Validations)
**제약**: 로컬 환경 접근 불가, DB 마이그레이션 불가

---

## 🎯 당신의 미션

세컨드브레인 앱의 MVP를 구현하는 것입니다. 터미널 Claude(CTO)가 플레이북 기반으로 베이스먼트를 만들어놨으니, 당신은 **비즈니스 로직과 UI 컴포넌트**에 집중하세요.

---

## ✅ 당신이 할 수 있는 것

1. **파일 작성 및 수정**
   - TypeScript/React 컴포넌트
   - API Routes (Next.js)
   - Zod 스키마
   - Custom Hooks
   - Zustand 스토어

2. **GitHub 작업**
   - 브랜치 생성 (`feature/web-claude-mvp`)
   - 커밋 & 푸시
   - PR 생성 (터미널 Claude가 리뷰)

3. **문서 작성**
   - `docs/COMMUNICATION.md` 업데이트 (진행 상황 공유)
   - 코드 주석
   - 컴포넌트 설명

---

## ❌ 당신이 할 수 없는 것

1. **로컬 환경 작업**
   - `npm install` 실행
   - 개발 서버 실행 (`npm run dev`)
   - Prisma 마이그레이션 (`npm run db:migrate`)

2. **DB 접근**
   - Neon DB 직접 접근
   - Prisma Studio 실행

3. **메인 브랜치 직접 푸시**
   - 메인 브랜치는 읽기만 가능
   - 작업은 반드시 `feature/web-claude-mvp` 브랜치에서

---

## 🔄 워크플로우

### 1단계: 브랜치 생성 및 시작

```bash
# feature/web-claude-mvp 브랜치 생성 (GitHub UI 또는 첫 커밋 시 자동 생성)
```

### 2단계: 작업 순서

**Week 1: 핵심 CRUD**
1. Zod 스키마 작성 (`lib/validations/`)
2. API Routes 작성 (`app/api/`)
3. Custom Hooks 작성 (`lib/hooks/`)
4. 기본 컴포넌트 작성 (`components/`)
5. Quick Add 기능 구현

**Week 2-3: 링크 & 백링크**
1. Tiptap Editor 통합
2. 링크 파싱 로직
3. Backlink API & 컴포넌트

**Week 4: 속성 시스템**
1. Property CRUD API
2. PropertyPanel 컴포넌트
3. Table/List View

**Week 5: Graph View**
1. Graph API
2. D3.js 통합

### 3단계: 진행 상황 공유

**매 작업 후 `docs/COMMUNICATION.md` 업데이트**:

```markdown
## [2025-11-18 15:30] Web Claude 진행 상황

### 완료된 작업
- [x] lib/validations/note.ts 작성
- [x] app/api/notes/route.ts 작성

### 현재 작업 중
- [ ] components/NoteEditor.tsx 작성

### 발견된 이슈
- Tiptap 타입 에러 (해결 필요)

### 다음 작업
- components/NoteList.tsx 작성
```

### 4단계: 터미널 Claude에게 요청

**로컬 테스트가 필요한 경우**:

```markdown
## [2025-11-18 16:00] 터미널 Claude 요청

### 요청 사항
- API Routes 로컬 테스트 필요
- DB 마이그레이션 실행 필요

### 테스트 방법
1. npm run db:push
2. npm run dev
3. http://localhost:3004/api/notes 접속
4. 응답 확인

### 예상 결과
{ success: true, notes: [] }
```

---

## 📝 코딩 가이드라인

### TypeScript 타입 안전성

```typescript
// ✅ Good: Zod 스키마에서 타입 추론
import { z } from 'zod'

export const noteSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string(),
  folderId: z.string().optional().nullable(),
})

export type NoteInput = z.infer<typeof noteSchema>

// ✅ Good: API Response 타입
type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}
```

### API Route 패턴

```typescript
// app/api/notes/route.ts
import { NextResponse } from 'next/server'
import { noteSchema } from '@/lib/validations/note'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Zod 검증
    const validated = noteSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validated.error.format() },
        { status: 400 }
      )
    }

    const data = validated.data

    // DB 저장
    const note = await prisma.note.create({ data })

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('POST /api/notes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Custom Hook 패턴 (TanStack Query)

```typescript
// lib/hooks/useNotes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Note {
  id: string
  title: string
  body: string
  folderId: string | null
  createdAt: Date
  updatedAt: Date
}

export function useNotes() {
  return useQuery<Note[], Error>({
    queryKey: ['notes'],
    queryFn: async () => {
      const response = await fetch('/api/notes')
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.notes
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NoteInput) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.note as Note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
```

### 컴포넌트 패턴

```typescript
// components/NoteList.tsx
'use client'

import { useNotes } from '@/lib/hooks/useNotes'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function NoteList() {
  const { data: notes = [], isLoading, error } = useNotes()

  if (isLoading) return <Skeleton className="h-96" />
  if (error) return <div>에러: {error.message}</div>

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="p-4">
          <h3 className="font-bold">{note.title}</h3>
          <p className="text-sm text-gray-600">{note.body.slice(0, 100)}...</p>
        </Card>
      ))}
    </div>
  )
}
```

---

## 🔍 참고 자료

### 이미 설치된 패키지
- **shadcn/ui**: Button, Input, Textarea, Select, Form, Dialog, Card, Badge, Alert, Skeleton, Checkbox
- **Zod**: 스키마 검증
- **React Hook Form**: 폼 관리
- **TanStack Query**: 서버 상태 관리
- **Zustand**: 클라이언트 상태 관리
- **Tiptap**: Markdown Editor
- **D3.js**: Graph 시각화
- **Prisma**: ORM (터미널 Claude가 마이그레이션 담당)

### Prisma 스키마 위치
- `prisma/schema.prisma` (메인 브랜치에서 읽기만)
- 변경 필요 시 터미널 Claude에게 요청

### 플레이북 참조
- `/Users/woocheolshin/Documents/Vibecoding/docs/WEB-APP-EFFICIENCY-BOOST-PLAYBOOK.md`
- 예제 코드와 베스트 프랙티스 참고

---

## 💬 소통 프로토콜

### 진행 상황 보고 (매일)
`docs/COMMUNICATION.md`에 다음 형식으로 업데이트:

```markdown
## [날짜 시간] Web Claude 진행 상황

### 완료
- [x] 작업 1
- [x] 작업 2

### 진행 중
- [ ] 작업 3

### 블로커
- 이슈 설명

### 다음 단계
- 계획
```

### 터미널 Claude 요청
로컬 테스트, DB 마이그레이션, 패키지 설치 등이 필요한 경우:

```markdown
## [날짜 시간] 터미널 Claude 요청

### 요청 내용
- 구체적인 요청

### 테스트 방법
1. 단계별 가이드

### 예상 결과
- 기대하는 결과
```

---

## 🚀 시작하기

1. **메인 브랜치 파일 읽기**
   - `README.md` - 프로젝트 개요
   - `docs/PROJECT_SPEC.md` - 상세 명세
   - `prisma/schema.prisma` - DB 스키마

2. **첫 작업: Zod 스키마**
   ```typescript
   // lib/validations/note.ts
   // lib/validations/folder.ts
   // lib/validations/tag.ts
   ```

3. **두 번째 작업: API Routes**
   ```typescript
   // app/api/notes/route.ts
   // app/api/folders/route.ts
   ```

4. **진행 상황 공유**
   ```markdown
   // docs/COMMUNICATION.md 업데이트
   ```

5. **커밋 & 푸시**
   ```bash
   git add .
   git commit -m "feat: Add note validation schema and API routes"
   git push origin feature/web-claude-mvp
   ```

---

## 📋 체크리스트

### 코드 작성 전
- [ ] PROJECT_SPEC.md 읽음
- [ ] Prisma 스키마 확인
- [ ] 필요한 shadcn/ui 컴포넌트 확인

### 코드 작성 중
- [ ] TypeScript 타입 안전성 유지
- [ ] Zod 스키마로 검증
- [ ] TanStack Query로 서버 상태 관리
- [ ] shadcn/ui 컴포넌트 사용

### 코드 작성 후
- [ ] 타입 에러 없음
- [ ] ESLint 경고 없음
- [ ] COMMUNICATION.md 업데이트
- [ ] 커밋 메시지 명확 (Conventional Commits)

---

**행운을 빕니다! 질문이 있으면 `docs/COMMUNICATION.md`에 남겨주세요. 🚀**
