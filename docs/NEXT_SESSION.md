# Next Session Guide

**작성일**: 2025-12-31
**목적**: 다음 세션에서 바로 작업을 시작할 수 있도록 컨텍스트 제공

---

## ✅ 방금 완료한 작업 (현재 세션)

### Phase 3-4: 속성 필터 강화 완료
- **커밋**: `ce91a41` - feat: add property filter system with saved views
- **상태**: ✅ 빌드 성공, 커밋 완료, 문서화 완료
- **협업**: Claude + Codex

**구현 내용:**
- 다중 속성 필터 (Select, Multi-Select, Date, Checkbox)
- AND/OR 조건 지원
- 저장된 뷰 (Saved Views)
- FilterBuilder + 4개 보조 컴포넌트 (Codex)

**파일**: 20 files changed, 1,610 insertions(+)

---

## 🎯 다음 작업 추천 (Phase 4)

### ROADMAP 기준 우선순위:

**1. Export/Import (높음 🔥)**
```
- Export Markdown ZIP (폴더 구조 유지)
- Export JSON (전체 DB 덤프)
- Import Obsidian vault (MD 파일 + 폴더)
- Import Notion CSV
- 자동 백업 (주간, Neon DB)
```

**2. 고급 검색 (중간 ⭐)**
```
- 정규식 검색
- 검색 필터 조합 (태그 AND 폴더)
- 검색 결과 정렬 옵션
- 저장된 검색 (Saved Searches)
```

**3. 노트 템플릿 관리 페이지 (중간 ⭐)**
```
- /templates 페이지
- 템플릿 CRUD UI
- 템플릿 미리보기
- 템플릿 변수 가이드
```

---

## 📁 현재 프로젝트 상태

### 완료된 Phase
- ✅ Phase 1: MVP (Wiki Links, Property DB, Graph View)
- ✅ Phase 2-1: Daily Notes, Templates, Enhanced Search
- ✅ Phase 2-2: Enhanced Backlinks, Unlinked Mentions
- ✅ Phase 2-3: Graph View 개선
- ✅ Phase 3-1: Calendar View
- ✅ Phase 3-2: Dashboard
- ✅ Phase 3-3: Timeline View
- ✅ Phase 3-4: 속성 필터 강화 ← **방금 완료**

### 다음 Phase
- ⏳ Phase 4: 옵시디언 Core 확장 (Export/Import, 고급 검색, 템플릿 관리)

---

## 🗂️ 주요 파일 위치

### 필터 시스템 (방금 구현)
```
lib/
├── filterEngine.ts              # 필터 쿼리 엔진
├── stores/filterStore.ts        # 상태 관리
├── hooks/useFilters.ts          # Hooks
├── validations/
│   ├── filter.ts                # Zod 스키마
│   └── savedView.ts             # SavedView 스키마

app/api/
├── notes/filter/route.ts        # 필터 API
└── saved-views/
    ├── route.ts                 # GET/POST
    └── [id]/route.ts            # GET/PATCH/DELETE

components/
├── FilterBuilder.tsx            # 핵심 UI
├── PropertyFilterItem.tsx       # Codex
├── FilterConditionToggle.tsx    # Codex
├── SavedViewDialog.tsx          # Codex
└── SavedViewButton.tsx          # Codex
```

### 기존 시스템
```
app/
├── daily/page.tsx               # Daily Notes
├── dashboard/page.tsx           # Dashboard
├── timeline/page.tsx            # Timeline
├── calendar/page.tsx            # Calendar
├── graph/page.tsx               # Graph View
├── db/page.tsx                  # Database View (필터 통합됨)
└── templates/page.tsx           # Templates

components/
├── NoteEditor.tsx               # Tiptap 에디터
├── TableView.tsx                # DB 테이블 뷰
├── ListView.tsx                 # DB 리스트 뷰
└── ...
```

---

## 🧪 빠른 테스트 방법

```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/second-brain-app

# 개발 서버 시작
npm run dev

# 빌드 테스트
npm run build

# DB 푸시 (스키마 변경 시)
npx prisma db push
```

**테스트 페이지:**
- http://localhost:3004/db - 필터 기능 테스트
- http://localhost:3004/dashboard - 대시보드
- http://localhost:3004/timeline - 타임라인
- http://localhost:3004/calendar - 캘린더

---

## 📋 다음 세션 시작 시 할 일

### 1. 컨텍스트 로드
```
"readme 읽고 시작해줘"
```

### 2. 최신 커밋 확인
```bash
git log --oneline -5
git status
```

### 3. 작업 선택
사용자에게 다음 중 선택 요청:
1. Export/Import 구현 (높은 우선순위)
2. 고급 검색 구현
3. 템플릿 관리 페이지
4. 기타 사용자 요청 작업

### 4. Codex 협업 여부
- 복잡한 작업이면 Claude 단독
- 반복 작업 많으면 Codex 협업 제안

---

## 🔍 참고 문서

### 필수 읽기
- `README.md` - 프로젝트 개요
- `CLAUDE.md` - Claude 작업 프로토콜
- `AI_WORKFLOW.md` - Claude + Codex 협업 전략
- `docs/ROADMAP.md` - 전체 로드맵

### 최근 구현 문서
- `docs/FILTER_IMPLEMENTATION.md` - 필터 시스템 구현 상세
- `docs/CHANGELOG.md` - 변경 내역

### 프로젝트 스펙
- `docs/PROJECT_SPEC.md` - 전체 프로젝트 스펙

---

## 💡 Tip: 토큰 효율적인 세션 시작

```markdown
다음 세션 시작 시 이렇게 요청:

"second brain app 작업 계속할게.
NEXT_SESSION.md 읽고, 다음 작업 뭐 할지 추천해줘."
```

이렇게 하면:
- ✅ 전체 README/CLAUDE.md 읽지 않고 빠른 시작
- ✅ 최소 토큰으로 컨텍스트 로드
- ✅ 바로 작업 선택 및 시작 가능

---

## 🚀 추천 다음 작업: Export/Import

**이유:**
1. ROADMAP 높은 우선순위 (🔥)
2. 사용자 요구 많음 (백업 필수)
3. 독립적 기능 (다른 부분 영향 적음)
4. Claude + Codex 협업 가능

**작업 범위:**
- Export Markdown ZIP
- Export JSON
- Import Obsidian (.md files)
- Import Notion CSV

**예상 시간:** 2-3시간 (Claude + Codex 협업)

---

## 📞 협업 준비

**Codex 대기 중이라면:**
- Export/Import는 Claude 설계 + Codex 보조 작업 가능
- ZIP 생성, 파일 파싱 등 반복 작업 → Codex
- 복잡한 데이터 변환 로직 → Claude

---

**Last Updated**: 2025-12-31
**Next Session Ready**: ✅
**Recommended Next**: Export/Import 구현
