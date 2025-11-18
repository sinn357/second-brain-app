# Second Brain App

> MVP: Quick Add + Markdown Links + Property-based DB + Graph View

## 📋 프로젝트 개요

**세컨드브레인 앱**은 지식 관리 및 노트 앱으로, 다음 4가지 핵심 기능을 제공합니다:

1. **애플메모 Core** — 즉시 기록(Quick Add)
2. **옵시디언 Core** — Markdown + 링크([[note]]) + 백링크
3. **노션 Core** — 속성 기반 DB(Select, Multi, Date, Checkbox) + Table/List 뷰
4. **마인드맵 Core** — 링크 기반 Graph View(D3.js)

## 🛠️ 기술 스택

**플레이북 기반 베이스먼트:**
- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui (Tailwind + Radix UI)
- **Form**: React Hook Form + Zod
- **Server State**: TanStack Query (React Query)
- **Client State**: Zustand
- **Editor**: Tiptap (Markdown + Links)
- **Visualization**: D3.js (Graph View)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma

## 🚀 시작하기

### 1. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# DATABASE_URL 설정
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

### 2. 데이터베이스 설정

```bash
# Prisma Client 생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:migrate

# 또는 dev 환경에서 빠르게 push
npm run db:push
```

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

`http://localhost:3004`에서 앱을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
second-brain-app/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── notes/          # 노트 CRUD
│   │   ├── folders/        # 폴더 CRUD
│   │   ├── tags/           # 태그 CRUD
│   │   ├── links/          # 링크 CRUD
│   │   ├── properties/     # 속성 CRUD
│   │   └── graph/          # Graph 데이터
│   ├── notes/              # 노트 페이지
│   ├── graph/              # Graph View
│   ├── db/                 # Table/List View
│   └── folders/            # 폴더 트리
│
├── components/              # React 컴포넌트
│   └── ui/                 # shadcn/ui 컴포넌트
│
├── lib/                     # 유틸리티 & 설정
│   ├── db.ts               # Prisma Client
│   ├── validations/        # Zod 스키마
│   ├── hooks/              # Custom Hooks (TanStack Query)
│   └── stores/             # Zustand 스토어
│
├── prisma/
│   └── schema.prisma       # 데이터베이스 스키마
│
├── docs/                    # 프로젝트 문서
│   ├── PROJECT_SPEC.md     # 프로젝트 명세
│   └── WEB_CLAUDE_GUIDE.md # 웹 Claude 작업 가이드
│
└── .env                     # 환경 변수 (git에서 제외)
```

## 📊 데이터베이스 스키마

### 핵심 모델

- **Note**: 노트 (제목, 본문, 폴더, 생성일, 수정일)
- **Folder**: 폴더 (계층 구조)
- **Tag**: 태그
- **NoteTag**: 노트-태그 관계 (다대다)
- **Link**: 내부 링크 ([[note]] 형태)
- **Property**: 속성 정의 (Select, Multi-Select, Date, Checkbox)
- **NoteProperty**: 노트-속성 값

## 🎯 MVP 핵심 기능

### 1. Quick Add (애플메모 Core)
- 앱 진입 시 자동으로 빈 노트 생성
- Quick Add 버튼 (상단 고정)
- 모든 새 노트는 Inbox 폴더로 저장

### 2. 노트 시스템 (옵시디언 Core)
- Markdown 기반 Editor (Tiptap)
- `[[note]]` 형태 내부 링크 자동 생성
- Backlinks 패널 구현
- 폴더 구조 (트리)
- 태그 (#tag)
- Hover 시 링크 미리보기

### 3. 속성 시스템 (노션 Core)
- 속성 타입: Select, Multi-Select, Date, Checkbox
- Table View / List View
- 필터 (속성 기반)
- 정렬

### 4. Graph View (마인드맵 Core)
- D3.js 기반 시각화
- 노트 = node, 링크 = edge
- 드래그로 위치 이동 가능
- 클릭 시 해당 노트로 이동

## 📝 개발 스크립트

```bash
# 개발 서버 (포트 3004)
npm run dev

# 빌드 (Prisma 생성 + Next.js 빌드)
npm run build

# 프로덕션 서버
npm start

# 린트
npm run lint

# Prisma 관련
npm run db:push       # 스키마를 DB에 푸시 (dev)
npm run db:migrate    # 마이그레이션 생성 및 실행
npm run db:studio     # Prisma Studio 실행
npm run db:generate   # Prisma Client 생성
```

## 🌐 배포

### Vercel (Frontend)
```bash
# Vercel CLI로 배포
vercel

# 환경 변수 설정
# Vercel 대시보드에서 DATABASE_URL 추가
```

### Neon DB (Database)
- [Neon Console](https://console.neon.tech)에서 PostgreSQL 생성
- Connection string을 `.env`와 Vercel 환경 변수에 추가

## 📚 참고 문서

- [프로젝트 명세](./docs/PROJECT_SPEC.md)
- [웹 Claude 작업 가이드](./docs/WEB_CLAUDE_GUIDE.md)
- [플레이북](../../docs/WEB-APP-EFFICIENCY-BOOST-PLAYBOOK.md)

## 🔗 관련 링크

- **GitHub**: https://github.com/sinn357/second-brain-app
- **Vercel**: TBD
- **Database**: TBD (Neon)

## 📄 라이선스

MIT

---

**Last Updated**: 2025-11-18
**Version**: 0.1.0 (MVP)
