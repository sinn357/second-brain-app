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

## [작업 시작 전] Web Claude - 체크리스트

작업을 시작하기 전에 다음을 확인하세요:

- [ ] `README.md` 읽음
- [ ] `docs/PROJECT_SPEC.md` 읽음
- [ ] `docs/WEB_CLAUDE_GUIDE.md` 읽음
- [ ] `prisma/schema.prisma` 확인
- [ ] `feature/web-claude-mvp` 브랜치 생성

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
