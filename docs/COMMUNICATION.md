# 소통 로그

**목적**: 터미널 Claude ↔ 웹 Claude 간 비동기 소통
**규칙**: 작업 후 반드시 업데이트, 시간 역순 정렬

---

## [2025-11-18 15:00] Terminal Claude - 베이스먼트 구축 완료

### 완료된 작업
- [x] Next.js + TypeScript 프로젝트 초기화
- [x] 플레이북 스택 설치 완료
  - shadcn/ui (Button, Input, Textarea, Select, Form, Dialog, Card, Badge, Alert, Skeleton, Checkbox)
  - Zod
  - React Hook Form + @hookform/resolvers
  - TanStack Query + DevTools
  - Zustand
  - Prisma + @prisma/client
  - Tiptap (React, Starter Kit, Extension Link)
  - D3.js + @types/d3
- [x] Prisma 스키마 작성 (Note, Folder, Tag, Link, Property, NoteProperty)
- [x] 폴더 구조 생성 (app/api, lib/validations, lib/hooks, lib/stores, lib/db)
- [x] TanStack Query Provider 설정 (app/providers.tsx)
- [x] Prisma Client Singleton (lib/db.ts)
- [x] .env.example 파일 생성
- [x] package.json 스크립트 추가 (db:push, db:migrate, db:generate)
- [x] README.md 작성
- [x] 프로젝트 문서 작성
  - docs/PROJECT_SPEC.md
  - docs/WEB_CLAUDE_GUIDE.md
  - docs/COMMUNICATION.md (이 파일)

### 환경 정보
- **Port**: 3004
- **Database**: PostgreSQL (Neon) - 아직 미연결
- **스택**: Next.js 15 + TypeScript + TailwindCSS + Prisma

### 다음 단계
1. **터미널 Claude**: GitHub에 푸시 후 Neon DB 생성 및 연결
2. **웹 Claude**: `feature/web-claude-mvp` 브랜치에서 작업 시작
   - Zod 스키마 작성
   - API Routes 구현
   - Custom Hooks 작성
   - 컴포넌트 구현

---

## [2025-11-18 17:00] Web Claude - Week 2 고급 에디터 기능 구현 완료

### 완료된 작업
- [x] Tiptap Custom Extensions 작성 (3개)
  - `lib/tiptap-extensions/WikiLink.ts` - [[링크]] 감지 및 클릭 핸들러
  - `lib/tiptap-extensions/HashTag.ts` - #태그 감지 및 클릭 핸들러
  - `lib/tiptap-extensions/WikiLinkSuggestion.ts` - 자동완성 설정 (미사용, 향후 확장 가능)
- [x] 자동완성 및 미리보기 컴포넌트 (2개)
  - `components/WikiLinkSuggestionList.tsx` - [[링크]] 자동완성 드롭다운 (향후 확장)
  - `components/NoteLinkPreview.tsx` - 링크 hover 미리보기 카드
- [x] 고급 에디터 컴포넌트
  - `components/NoteEditorAdvanced.tsx` - WikiLink, HashTag 통합 에디터
  - [[링크]] 클릭 → 해당 노트로 이동
  - [[링크]] hover → 노트 내용 미리보기 (tippy.js)
  - #태그 클릭 → 태그 자동 생성
  - 실시간 하이라이팅 (파란색 배경: [[링크]], 보라색 배경: #태그)
- [x] 노트 검색 API
  - `app/api/notes/search/route.ts` - 제목/본문 검색 + 정확한 제목 매칭
- [x] 페이지 업데이트
  - `app/notes/[id]/page.tsx` - NoteEditorAdvanced 적용
- [x] 의존성 추가 (package.json)
  - `tippy.js` ^6.3.7
  - `@tiptap/extension-placeholder` ^3.10.7
  - `@tiptap/pm` ^3.10.7
  - `@tiptap/suggestion` ^3.10.7
  - `date-fns` ^3.3.1

### 구현된 고급 기능
1. **[[WikiLink]] 완전 지원** ✅
   - 실시간 하이라이팅 (파란색 배경)
   - 클릭 시 해당 노트로 즉시 이동
   - Hover 시 노트 내용 미리보기 (tippy.js 툴팁)
   - 노트가 없으면 알림 표시

2. **#HashTag 완전 지원** ✅
   - 실시간 하이라이팅 (보라색 배경)
   - 클릭 시 태그 자동 생성 (API 호출)
   - 한글, 영문, 숫자, _ 지원

3. **Hover 미리보기** ✅
   - tippy.js 기반 우아한 툴팁
   - 노트 제목 + 본문 일부 표시
   - 비동기 로딩 + 스켈레톤 UI

### 사용 방법

**에디터에서 링크 추가:**
```
[[노트제목]]을 입력하면 파란색으로 하이라이트됩니다.
클릭하면 해당 노트로 이동합니다.
마우스를 올리면 내용 미리보기가 표시됩니다.
```

**에디터에서 태그 추가:**
```
#태그이름을 입력하면 보라색으로 하이라이트됩니다.
클릭하면 태그가 생성됩니다.
```

### 터미널 Claude 요청 사항

다음 작업을 로컬에서 수행해주세요:

1. **의존성 재설치**
   ```bash
   git fetch origin
   git checkout claude/mvp-019TffNNZDo7Nw4SHJGwq86V
   npm install
   ```

2. **개발 서버 실행 및 테스트**
   ```bash
   npm run dev
   # http://localhost:3004
   ```

3. **테스트 시나리오**
   - [ ] 노트 에디터에서 `[[다른노트]]` 입력 → 파란색 하이라이트 확인
   - [ ] [[링크]] 클릭 → 해당 노트로 이동 확인
   - [ ] [[링크]]에 마우스 hover → 미리보기 툴팁 확인
   - [ ] `#테스트태그` 입력 → 보라색 하이라이트 확인
   - [ ] #태그 클릭 → 태그 생성 알림 확인
   - [ ] Save 버튼 → 링크 파싱 → 백링크 패널 업데이트 확인

### 발견된 이슈/개선 사항

1. **자동완성 미구현**
   - WikiLinkSuggestion 파일은 작성했으나 실제 통합은 하지 않음
   - 이유: Tiptap Suggestion 플러그인 통합이 복잡하고 터미널 테스트 필요
   - 향후 개선: `[[` 입력 시 노트 제목 드롭다운 표시

2. **태그 자동 연결 미구현**
   - 현재 #태그를 클릭하면 Tag만 생성됨
   - NoteTag 연결은 Save 시점에 별도 로직 필요
   - 향후 개선: Save 시 #태그 파싱하여 자동 연결

3. **date-fns 중복**
   - 이미 master에 있었으나 package.json에 명시적으로 추가
   - 버전 충돌 없는지 확인 필요

### 다음 작업 계획 (Week 3)

- [x] [[링크]] 자동완성 (Tiptap Suggestion 플러그인 통합) ✅
- [x] #태그 자동 NoteTag 연결 로직 ✅
- [x] Table View / List View 구현 ✅
- [x] Navigation 메뉴 추가 ✅
- [x] /folders 페이지 생성 ✅
- [ ] Command Palette (Cmd+K) - 향후 개선
- [ ] 에러 핸들링 개선 (Toast 알림) - 향후 개선

---

## [2025-11-18 19:00] Web Claude - Week 3 완성: 노션 Core + UX 개선

### 완료된 작업
- [x] #태그 자동 NoteTag 연결
  - `app/api/notes/[id]/tags/route.ts` - 태그 파싱 및 자동 연결 API
  - `app/notes/[id]/page.tsx` - Save 시 태그 자동 파싱 통합
  - #태그 입력 → Save → Tag 생성 + NoteTag 연결 자동화
- [x] Navigation 메뉴
  - `components/Navigation.tsx` - 상단 네비게이션 바
  - Notes, Graph, Folders, Database 페이지 링크
  - 현재 페이지 하이라이트
- [x] Table View / List View (노션 Core 완성)
  - `components/TableView.tsx` - 스프레드시트 형식 테이블
  - `components/ListView.tsx` - 카드 형식 리스트
  - `app/db/page.tsx` - Table/List 전환 가능한 DB 페이지
  - 속성 값 렌더링 (Select, Multi-Select, Date, Checkbox)
- [x] Folders 관리 페이지
  - `app/folders/page.tsx` - 폴더 생성/삭제 UI
  - 간단한 폴더 관리 인터페이스

### 구현된 기능

**1. #태그 자동 연결** ✅
```
1. 에디터에서 #태그이름 입력
2. Save 버튼 클릭
3. 자동으로 Tag 테이블에 생성 (없으면)
4. NoteTag 테이블에 연결
5. 노트 목록에서 태그 배지로 표시
```

**2. Navigation 메뉴** ✅
- 모든 페이지 상단에 고정 네비게이션
- Notes, Graph, Folders, Database 빠른 이동
- 현재 페이지 파란색 하이라이트

**3. Database View (노션 스타일)** ✅
- **Table View**: 노트를 스프레드시트처럼 표시
  - 모든 속성을 컬럼으로 표시
  - 속성 값 시각화 (색상 배지, 체크박스 등)
- **List View**: 노트를 카드 형식으로 표시
  - 폴더, 태그, 속성 정보 함께 표시
  - 더 읽기 쉬운 형식

**4. Folders 페이지** ✅
- 폴더 생성/삭제 UI
- 각 폴더의 노트 개수 표시
- 간단한 관리 인터페이스

### 사용 방법

**태그 자동 연결:**
```
1. 노트 에디터에서 #프로젝트 #중요 입력
2. Save 버튼 클릭
3. 자동으로 "프로젝트", "중요" 태그 생성 및 연결
4. 노트 목록에서 태그 배지 확인
```

**Database View:**
```
1. 상단 메뉴에서 "Database" 클릭
2. Table/List 버튼으로 뷰 전환
3. Table View: 스프레드시트 형식
4. List View: 카드 형식
```

### 터미널 Claude 테스트 시나리오

```bash
npm run dev
# http://localhost:3004
```

**테스트:**
- [ ] 상단 Navigation 메뉴 확인 (Notes, Graph, Folders, Database)
- [ ] 노트에 #테스트 #프로젝트 입력 → Save → 태그 연결 확인
- [ ] Database 페이지 → Table View 확인
- [ ] Table ↔ List 전환 확인
- [ ] Folders 페이지 → 폴더 생성/삭제 확인

### Week 3 완료 요약

**MVP 4대 Core 모두 완성** 🎉
1. ✅ Quick Add (애플메모 Core)
2. ✅ Markdown + [[링크]] + #태그 + 백링크 (옵시디언 Core)
3. ✅ 속성 시스템 + Table/List View (노션 Core)
4. ✅ Graph View (마인드맵 Core)

**추가 구현된 기능**
- Navigation 메뉴
- Folders 관리 페이지
- [[링크]] 자동완성
- #태그 자동 연결
- Hover 미리보기

### 남은 향후 개선 사항

- [ ] Command Palette (Cmd+K) - 빠른 검색/네비게이션
- [ ] Toast 알림 - alert() 대신 우아한 알림
- [ ] 실시간 노트 목록 업데이트 (자동완성용)
- [ ] 필터링 및 정렬 (Database View)
- [ ] 다크 모드

---

## [2025-11-18 18:00] Web Claude - [[링크]] 자동완성 구현 완료

### 완료된 작업
- [x] WikiLink 자동완성 Extension 작성
  - `lib/tiptap-extensions/WikiLinkAutocomplete.ts` - Tiptap Suggestion 플러그인 통합
  - `[[` 입력 시 노트 제목 드롭다운 표시
  - 키보드 네비게이션 (↑↓ 화살표, Enter 선택)
- [x] WikiLinkSuggestionList 개선
  - 글로벌 window 객체에 등록하여 Tiptap extension에서 접근 가능
  - 최대 높이 제한 및 스크롤
  - 더 나은 UI/UX
- [x] NoteEditorAdvanced에 자동완성 통합
  - WikiLinkAutocomplete extension 추가
  - 전체 노트 목록 전달

### 구현된 기능
**[[링크]] 자동완성** ✅
```
1. 에디터에서 [[ 입력
2. 노트 제목 드롭다운 자동 표시
3. 타이핑으로 필터링
4. ↑↓ 화살표로 선택 이동
5. Enter로 선택 → [[노트제목]] 자동 삽입
6. ESC로 취소
```

### 사용 방법
```
에디터에서 [[ 입력
→ 노트 목록 드롭다운 표시
→ 노트 제목 타이핑으로 필터링
→ 화살표 키로 선택 이동
→ Enter 또는 클릭으로 삽입
```

### 터미널 Claude 테스트 시나리오
```bash
npm run dev
# http://localhost:3004
```

**테스트:**
- [ ] 노트 에디터에서 `[[` 입력 → 드롭다운 표시 확인
- [ ] 제목 일부 타이핑 → 필터링 확인
- [ ] ↑↓ 화살표 → 선택 이동 확인
- [ ] Enter → `[[노트제목]]` 삽입 확인
- [ ] 마우스 클릭으로 선택 → 삽입 확인
- [ ] ESC → 드롭다운 닫힘 확인

### 알려진 제약사항
1. **노트 목록 실시간 업데이트 안 됨**
   - 에디터 초기화 시점의 노트 목록만 사용
   - 새 노트 추가 후 자동완성에 반영 안 됨
   - 해결: 페이지 새로고침 필요

2. **중복 자동완성**
   - 기존 WikiLink decoration과 별도로 작동
   - 충돌 가능성 낮음

### 다음 개선 사항
- [ ] 노트 목록 실시간 업데이트 (useEditor dependency 개선)
- [ ] 자동완성 트리거를 `[[`에서 `@` 또는 `/`로 추가 옵션 제공
- [ ] 최근 링크한 노트 우선 표시

---

## [2025-11-18 15:30] Web Claude - Week 1 MVP 핵심 기능 구현 완료

### 완료된 작업
- [x] `feature/web-claude-mvp` 브랜치 생성 (master 기반)
- [x] Zod Validation 스키마 작성 (5개 파일)
  - `lib/validations/note.ts` - 노트 생성/수정 스키마
  - `lib/validations/folder.ts` - 폴더 스키마
  - `lib/validations/tag.ts` - 태그 스키마
  - `lib/validations/property.ts` - 속성 스키마 (select, multi_select, date, checkbox)
  - `lib/validations/link.ts` - 링크 파싱 스키마
- [x] API Routes 전체 구현 (12개 엔드포인트)
  - `app/api/notes/route.ts` - GET, POST
  - `app/api/notes/[id]/route.ts` - GET, PATCH, DELETE
  - `app/api/notes/[id]/backlinks/route.ts` - GET
  - `app/api/folders/route.ts` - GET, POST
  - `app/api/folders/[id]/route.ts` - PATCH, DELETE
  - `app/api/tags/route.ts` - GET, POST
  - `app/api/tags/[id]/route.ts` - GET, PATCH, DELETE
  - `app/api/properties/route.ts` - GET, POST
  - `app/api/properties/[id]/route.ts` - PATCH, DELETE
  - `app/api/note-properties/route.ts` - POST (노트 속성 값 설정)
  - `app/api/links/parse/route.ts` - POST (링크 파싱 로직)
  - `app/api/graph/route.ts` - GET (Graph View 데이터)
- [x] Custom Hooks 작성 (5개 파일, TanStack Query)
  - `lib/hooks/useNotes.ts` - useNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote, useBacklinks, useParseLinks
  - `lib/hooks/useFolders.ts` - useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder
  - `lib/hooks/useTags.ts` - useTags, useTagNotes, useCreateTag, useUpdateTag, useDeleteTag
  - `lib/hooks/useProperties.ts` - useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty, useSetNoteProperty
  - `lib/hooks/useGraph.ts` - useGraph
- [x] 핵심 컴포넌트 작성 (6개)
  - `components/QuickAddButton.tsx` - Quick Add 버튼 (Inbox 자동 생성)
  - `components/NoteList.tsx` - 노트 목록 (폴더별 필터링)
  - `components/NoteEditor.tsx` - Tiptap 기반 Markdown 에디터 (툴바 포함)
  - `components/BacklinkPanel.tsx` - 백링크 패널
  - `components/PropertyPanel.tsx` - 속성 패널 (Select, Multi-Select, Date, Checkbox)
  - `components/FolderTree.tsx` - 폴더 트리 (계층 구조)
- [x] 페이지 구현 (4개)
  - `app/page.tsx` - 메인 페이지 (→ /notes 리다이렉트)
  - `app/notes/page.tsx` - 노트 리스트 페이지 (Quick Add + 폴더 트리)
  - `app/notes/[id]/page.tsx` - 노트 상세/에디터 페이지 (3분할 레이아웃)
  - `app/graph/page.tsx` - Graph View (D3.js force-directed graph)

### 구현된 핵심 기능
1. **Quick Add** ✅
   - 상단 고정 버튼
   - Inbox 폴더로 자동 저장
   - 생성 후 에디터 페이지로 이동

2. **노트 시스템** ✅
   - CRUD 전체 구현
   - Tiptap Markdown 에디터
   - 폴더 트리 (계층 구조)
   - 태그 시스템

3. **링크 & 백링크** ✅
   - `[[note]]` 형태 링크 파싱 API
   - 백링크 패널 (해당 노트를 링크한 노트 목록)
   - 링크 자동 추출 로직

4. **속성 시스템** ✅
   - Property 정의 (Select, Multi-Select, Date, Checkbox)
   - NoteProperty 값 설정 API
   - PropertyPanel 컴포넌트

5. **Graph View** ✅
   - D3.js force-directed graph
   - 노드 드래그 이동 가능
   - 노드 클릭 시 해당 노트로 이동
   - 줌 & 팬 지원

### 터미널 Claude 요청 사항

다음 작업을 로컬에서 수행해주세요:

1. **의존성 설치**
   ```bash
   git fetch origin
   git checkout feature/web-claude-mvp
   npm install
   ```

2. **환경 변수 설정**
   ```bash
   # .env 파일 생성
   cp .env.example .env

   # Neon DB 연결 문자열 입력
   # DATABASE_URL="postgresql://..."
   ```

3. **데이터베이스 마이그레이션**
   ```bash
   # Prisma Client 생성
   npm run db:generate

   # 데이터베이스 푸시
   npm run db:push
   ```

4. **Inbox 폴더 생성 (필수)**
   ```bash
   # Prisma Studio 또는 SQL로 "Inbox" 폴더 생성
   npm run db:studio
   # 또는
   # INSERT INTO folders (id, name, position) VALUES (gen_random_uuid(), 'Inbox', 0);
   ```

5. **개발 서버 실행 및 테스트**
   ```bash
   npm run dev
   # http://localhost:3004
   ```

6. **테스트 시나리오**
   - [ ] Quick Add 버튼 클릭 → 노트 생성 확인
   - [ ] 노트 제목/본문 수정 → Save 버튼 → 저장 확인
   - [ ] 노트 본문에 `[[다른노트]]` 입력 → Save → 링크 생성 확인
   - [ ] 백링크 패널에서 링크된 노트 확인
   - [ ] 속성 추가 (Property 먼저 생성 필요)
   - [ ] Graph View 접속 → 노드 드래그 및 클릭 확인

### 발견된 이슈/알려진 제약사항

1. **date-fns 한국어 locale**
   - `NoteList.tsx`에서 `date-fns/locale/ko` import 사용
   - 패키지에 한국어 locale이 없을 경우 에러 발생 가능
   - 해결: `formatDistanceToNow` 함수에서 `locale: ko` 제거 또는 `date-fns` 버전 확인

2. **Inbox 폴더 자동 생성 미구현**
   - 현재 Quick Add 시 Inbox 폴더를 찾지만, 없으면 null로 저장
   - 개선 필요: 첫 실행 시 Inbox 폴더 자동 생성 로직 추가

3. **Property 관리 UI 미구현**
   - 속성 생성은 API만 구현됨
   - 개선 필요: `/properties` 페이지에서 속성 CRUD UI

4. **Table/List View 미구현**
   - PROJECT_SPEC에는 `/db` 페이지 명세 있음
   - 개선 필요: Week 2-3에서 구현 예정

### 다음 작업 계획 (Week 2-3)

- [ ] Tiptap `[[링크]]` 자동완성 기능
- [ ] 링크 hover 시 미리보기
- [ ] 태그 `#tag` 자동 인식
- [ ] Table View / List View 구현
- [ ] Command Palette (Cmd+K)
- [ ] 에러 핸들링 개선
- [ ] 로딩 상태 개선

---

## [2025-11-18 20:45] Web Claude - Vercel 빌드 에러 수정 완료

### 완료된 작업
- [x] Vercel 빌드 에러 5건 수정
  1. `app/api/properties/route.ts` & `app/api/properties/[id]/route.ts` - Prisma JsonNull 타입 처리
  2. `lib/hooks/useNotes.ts` - Note 타입에 properties 필드 추가
  3. `lib/hooks/useNotes.ts` - Note 타입에 propertyId 필드 추가
  4. `lib/tiptap-extensions/WikiLinkAutocomplete.ts` - items 함수를 addProseMirrorPlugins로 이동
  5. `app/notes/page.tsx` - useSearchParams를 Suspense 경계로 감싸기

### 수정 내역 상세

**1. Prisma JsonNull 타입 처리**
- 문제: Property의 options 필드(JSON 타입)에 null을 직접 할당하면 TypeScript 에러
- 해결: `Prisma.JsonNull`로 변환 및 명시적 타입 어노테이션 추가
```typescript
const updateData: Prisma.PropertyUpdateInput = {
  ...(data.options !== undefined && {
    options: data.options === null ? Prisma.JsonNull : data.options
  })
}
```

**2. Note 타입에 properties 필드 추가**
- 문제: API는 properties를 반환하지만 Note 타입에 필드 없음
- 해결: Note 인터페이스에 properties 추가
```typescript
properties?: Array<{
  id: string
  propertyId: string
  value: any
  property: { ... }
}>
```

**3. WikiLinkAutocomplete this.options 접근**
- 문제: addOptions() 내부 중첩 객체에서 this.options 접근 불가
- 해결: items 함수를 addProseMirrorPlugins() 메서드로 이동
```typescript
addProseMirrorPlugins() {
  return [
    Suggestion({
      ...this.options.suggestion,
      items: ({ query }) => this.options.notes.filter(...)
    })
  ]
}
```

**4. useSearchParams Suspense 경계**
- 문제: Next.js 15에서 useSearchParams()를 Suspense로 감싸지 않으면 prerender 에러
- 해결: NotesPageContent 컴포넌트 분리 후 Suspense로 감싸기
```typescript
export default function NotesPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <NotesPageContent />
    </Suspense>
  )
}
```

### Git 커밋 내역
1. `e70b193` - feat: complete Week 3 (메인 기능 완성)
2. `a48815a` - fix: handle Prisma JsonNull for property options field
3. `9a81df8` - fix: explicit Prisma type casting for property options field
4. `54d363f` - fix: add properties field to Note type in useNotes hook
5. `0e99078` - fix: add propertyId field to Note.properties type
6. `284c4d1` - fix: move items function to addProseMirrorPlugins in WikiLinkAutocomplete
7. `319f51a` - fix: wrap useSearchParams with Suspense boundary in notes page

### 빌드 상태
- ✅ TypeScript 컴파일 성공
- ✅ Next.js Static Generation 성공
- ✅ Vercel 배포 준비 완료

### 다음 단계
- [ ] Pull Request 생성 및 리뷰 준비
- [ ] 추가 기능 구현 (Command Palette, Toast 알림, 다크 모드 등)

---

## [작업 시작 전] Web Claude - 체크리스트

작업을 시작하기 전에 다음을 확인하세요:

- [x] `README.md` 읽음
- [x] `docs/PROJECT_SPEC.md` 읽음
- [x] `docs/WEB_CLAUDE_GUIDE.md` 읽음
- [x] `prisma/schema.prisma` 확인
- [x] `feature/web-claude-mvp` 브랜치 생성

첫 커밋 후 이 섹션 위에 진행 상황을 추가하세요!

---

## 템플릿 (복사해서 사용)

```markdown
## [YYYY-MM-DD HH:MM] [본인 이름] - [작업 요약]

### 완료된 작업
- [x] 작업 1
- [x] 작업 2

### 현재 작업 중
- [ ] 작업 3

### 발견된 이슈/블로커
- 이슈 설명 (있으면)

### 터미널 Claude 요청 사항
- 로컬 테스트 필요
- DB 마이그레이션 필요
- 기타 요청

### 다음 작업 계획
- 작업 A
- 작업 B
```
