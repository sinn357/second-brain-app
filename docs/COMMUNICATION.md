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
