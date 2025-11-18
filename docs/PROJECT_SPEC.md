# Second Brain App - 프로젝트 명세

**버전**: MVP 0.1.0
**작성일**: 2025-11-18
**CTO**: Terminal Claude
**개발**: Web Claude

---

## 🎯 프로젝트 목표

**세컨드브레인 앱**은 AI 없이도 작동하는 "기록 → 구조 → 연결 → 시각화"가 가능한 지식 관리 MVP입니다.

### 핵심 컨셉

4가지 노트 앱의 Best Practice를 결합:

1. **애플메모** → 즉시 기록 (Quick Add)
2. **옵시디언** → Markdown + 링크 + 백링크
3. **노션** → 속성 기반 DB + 뷰
4. **마인드맵** → Graph View로 연결 시각화

---

## 📊 기술 스택 (플레이북 기반)

### Frontend Stack
```json
{
  "framework": "Next.js 15 (App Router)",
  "language": "TypeScript",
  "styling": "TailwindCSS",
  "ui": "shadcn/ui",
  "forms": "React Hook Form + Zod",
  "server_state": "TanStack Query",
  "client_state": "Zustand",
  "editor": "Tiptap",
  "visualization": "D3.js"
}
```

### Backend Stack
```json
{
  "database": "PostgreSQL (Neon)",
  "orm": "Prisma",
  "api": "Next.js API Routes"
}
```

---

## 🗄️ 데이터베이스 스키마

### 핵심 모델

#### 1. Note (노트)
```typescript
{
  id: string (cuid)
  title: string (500자)
  body: string (Text)
  folderId: string? (nullable)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### 2. Folder (폴더 - 계층 구조)
```typescript
{
  id: string
  name: string (200자)
  parentId: string? (nullable, 자기 참조)
  position: number (정렬용)
}
```

#### 3. Tag (태그)
```typescript
{
  id: string
  name: string (unique, 100자)
  color: string? (nullable, hex color)
}
```

#### 4. NoteTag (다대다 관계)
```typescript
{
  noteId: string
  tagId: string
  // Composite Primary Key
}
```

#### 5. Link (내부 링크)
```typescript
{
  id: string
  sourceId: string (출발 노트)
  targetId: string (도착 노트)
  // unique(sourceId, targetId)
}
```

#### 6. Property (속성 정의)
```typescript
{
  id: string
  name: string (200자)
  type: 'select' | 'multi_select' | 'date' | 'checkbox'
  options: JSON? (Select/Multi용 옵션 배열)
}
```

#### 7. NoteProperty (노트-속성 값)
```typescript
{
  id: string
  noteId: string
  propertyId: string
  value: JSON (타입에 따라 다른 형태)
  // unique(noteId, propertyId)
}
```

---

## 🎨 MVP 핵심 기능 명세

### Phase 1: Quick Add & 기본 CRUD (Week 1)

#### 1.1 Quick Add (최우선)
- 앱 진입 시 `/notes` 페이지로 이동
- 상단 고정 "Quick Add" 버튼
- 클릭 시 빈 노트 즉시 생성 → Inbox 폴더에 저장
- 생성된 노트의 에디터로 자동 포커스

**API Endpoint**:
```
POST /api/notes
Request: { title: "", body: "", folderId: "inbox-folder-id" }
Response: { success: true, note: Note }
```

#### 1.2 노트 CRUD
- 노트 목록 조회 (최신순)
- 노트 상세 조회
- 노트 수정 (제목, 본문)
- 노트 삭제

**API Endpoints**:
```
GET    /api/notes          → 목록
GET    /api/notes/[id]     → 상세
PATCH  /api/notes/[id]     → 수정
DELETE /api/notes/[id]     → 삭제
```

#### 1.3 폴더 시스템
- 기본 폴더 "Inbox" 자동 생성
- 폴더 CRUD (생성, 수정, 삭제, 이동)
- 계층 구조 (parentId 사용)
- 트리 UI로 표시

**API Endpoints**:
```
GET    /api/folders        → 전체 트리
POST   /api/folders        → 생성
PATCH  /api/folders/[id]   → 수정
DELETE /api/folders/[id]   → 삭제
```

---

### Phase 2: Markdown & 링크 (Week 2-3)

#### 2.1 Tiptap Editor 통합
- Markdown 기본 지원 (Bold, Italic, Heading, List, Code)
- `[[note_title]]` 형태의 내부 링크 인식
- 링크 클릭 시 해당 노트로 이동
- 자동완성 (타이핑 시 노트 목록 표시)

**링크 파싱 로직**:
```typescript
// [[문자열]] 패턴 추출
const linkPattern = /\[\[(.+?)\]\]/g
const matches = body.matchAll(linkPattern)

// 각 match에 대해:
// 1. 제목으로 노트 찾기
// 2. Link 테이블에 저장 (sourceId, targetId)
```

**API Endpoint**:
```
POST /api/links/parse
Request: { noteId: string, body: string }
Response: { success: true, links: Link[] }
```

#### 2.2 Backlinks 패널
- 노트 상세 페이지 우측에 Backlinks 패널
- 현재 노트를 링크한 다른 노트 목록 표시
- 클릭 시 해당 노트로 이동

**API Endpoint**:
```
GET /api/notes/[id]/backlinks
Response: { success: true, backlinks: Note[] }
```

#### 2.3 태그 시스템
- `#tag` 형태 태그 인식
- 태그 자동 생성 (없으면 생성, 있으면 연결)
- 태그별 노트 필터링

**API Endpoints**:
```
GET    /api/tags           → 전체 태그
POST   /api/tags           → 생성
GET    /api/tags/[id]/notes → 태그별 노트
```

---

### Phase 3: 속성 시스템 (Week 4)

#### 3.1 Property 정의
- 속성 생성 (이름, 타입, 옵션)
- 지원 타입:
  - **Select**: 단일 선택 (옵션: ["중요", "보통", "낮음"])
  - **Multi-Select**: 다중 선택 (옵션: ["태스크", "아이디어", "레퍼런스"])
  - **Date**: 날짜 선택
  - **Checkbox**: 체크박스 (완료 여부)

**API Endpoints**:
```
GET    /api/properties     → 전체 속성
POST   /api/properties     → 생성
PATCH  /api/properties/[id] → 수정
DELETE /api/properties/[id] → 삭제
```

#### 3.2 노트에 속성 값 설정
- 노트 상세 페이지 우측에 Properties 패널
- 속성 선택 → 값 입력
- NoteProperty 테이블에 저장

**API Endpoint**:
```
POST /api/notes/[id]/properties
Request: { propertyId: string, value: any }
Response: { success: true, noteProperty: NoteProperty }
```

#### 3.3 Table View & List View
- `/db` 페이지에서 속성 기반 뷰 제공
- **Table View**: 노트를 테이블 형태로 표시 (각 속성이 컬럼)
- **List View**: 노트를 리스트 형태로 표시
- 필터 (속성 값 기준)
- 정렬 (속성 값 기준)

**API Endpoint**:
```
GET /api/notes/views
Query: ?filter={propertyId}:{value}&sort={propertyId}:asc
Response: { success: true, notes: Note[], properties: Property[] }
```

---

### Phase 4: Graph View (Week 5)

#### 4.1 Graph 데이터 API
- 전체 노트 + 링크 데이터 반환
- D3.js가 소비할 수 있는 형태로 변환

**API Endpoint**:
```
GET /api/graph
Response: {
  nodes: [{ id, title, folderId }],
  edges: [{ source, target }]
}
```

#### 4.2 D3.js Graph View
- `/graph` 페이지
- Force-directed graph 레이아웃
- 노드 = 노트, 엣지 = 링크
- 드래그로 노드 이동 가능
- 노드 클릭 → 해당 노트로 이동
- 줌 & 팬 지원

**컴포넌트**:
```typescript
// components/GraphView.tsx
- D3 force simulation
- SVG 렌더링
- 인터랙션 (드래그, 클릭, 줌)
```

---

## 📁 페이지 구조

```
/ (홈)
├─ /notes (노트 리스트 + Quick Add)
│  └─ /notes/[id] (노트 상세 + 에디터 + Backlinks + Properties)
│
├─ /folders (폴더 트리)
│
├─ /db (Table/List View)
│
└─ /graph (Graph View)
```

---

## 🧩 컴포넌트 구조

### UI Components (shadcn/ui 사용)
- Button, Input, Textarea, Select
- Dialog, Card, Badge, Alert
- Form, FormField, FormItem, FormControl
- Checkbox, Skeleton

### Custom Components (작성 필요)
```
components/
├── NoteEditor.tsx          # Tiptap Editor
├── NoteList.tsx            # 노트 목록
├── BacklinkPanel.tsx       # 백링크 패널
├── PropertyPanel.tsx       # 속성 패널
├── FolderTree.tsx          # 폴더 트리
├── TableView.tsx           # 테이블 뷰
├── ListView.tsx            # 리스트 뷰
├── GraphView.tsx           # D3 그래프 뷰
└── QuickAddButton.tsx      # Quick Add 버튼
```

---

## 🔧 Zod 스키마 예시

```typescript
// lib/validations/note.ts
import { z } from 'zod'

export const noteSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(500),
  body: z.string(),
  folderId: z.string().optional().nullable(),
})

export type NoteInput = z.infer<typeof noteSchema>
```

```typescript
// lib/validations/property.ts
export const propertySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['select', 'multi_select', 'date', 'checkbox']),
  options: z.array(z.string()).optional(),
})

export type PropertyInput = z.infer<typeof propertySchema>
```

---

## 🎨 UI/UX 가이드

### 레이아웃 (3분할)
```
┌────────────┬──────────────┬────────────┐
│            │              │            │
│  좌측:     │  중앙:       │  우측:     │
│  폴더 트리  │  노트 에디터  │  백링크    │
│  태그 목록  │              │  속성      │
│            │              │            │
└────────────┴──────────────┴────────────┘
```

### Command Palette (선택사항)
- `Cmd+K` or `Ctrl+K`
- 노트 검색, 폴더 이동, 새 노트 생성 등

---

## ⚠️ 중요 제약사항

### 웹 Claude의 역할
- **가능**: GitHub 리포지토리 내 파일 작성, 수정, 브랜치 작업
- **불가능**: 로컬 환경 설치, DB 마이그레이션, 로컬 서버 실행

### 작업 브랜치 전략
1. 웹 Claude는 `feature/web-claude-mvp` 브랜치에서 작업
2. 터미널 Claude는 웹 Claude의 브랜치를 읽고 로컬에서 테스트
3. 문제 없으면 메인 브랜치로 머지

### 소통 방식
- 웹 Claude: `docs/COMMUNICATION.md` 파일에 진행 상황 업데이트
- 터미널 Claude: 해당 파일을 읽고 피드백 제공

---

## 📋 작업 순서 (Web Claude)

### Week 1: 베이스 구축
1. Zod 스키마 작성 (note, folder, tag, property)
2. API Routes 작성 (notes, folders)
3. Custom Hooks 작성 (useTasks, useFolders)
4. NoteList, NoteEditor 컴포넌트
5. Quick Add 기능

### Week 2-3: 링크 & 백링크
1. Tiptap Editor 통합
2. 링크 파싱 로직 (/api/links/parse)
3. BacklinkPanel 컴포넌트
4. 태그 시스템

### Week 4: 속성 시스템
1. Properties API Routes
2. PropertyPanel 컴포넌트
3. Table/List View

### Week 5: Graph View
1. Graph API (/api/graph)
2. GraphView 컴포넌트 (D3.js)

---

**다음 문서**: [WEB_CLAUDE_GUIDE.md](./WEB_CLAUDE_GUIDE.md)
