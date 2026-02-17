# Second Brain App Changelog

## 2026-02-18

### Fixed (Deploy Hotfix)

Vercel 프로덕션 빌드 실패 핫픽스 적용
- 원인: `app/api/notes/[id]/lock/route.ts`에서 사용하는 `bcryptjs` 런타임 의존성 누락
- 조치: `package.json`, `package-lock.json`에 `bcryptjs` 추가
- 결과: `npm run build` 로컬 재검증 통과, Vercel 재배포 가능 상태

### Added (Phase 3: 옵시디언 차별화)

#### Local Graph
현재 노트 중심의 미니 그래프 구현 (D3.js)
- incoming/outgoing 링크를 색상으로 구분 (파랑: 현재, 초록: Out, 주황: In)
- 노드 클릭 시 해당 노트로 이동
- ResizeObserver로 반응형 크기 조정
- 연결된 노트가 없을 때 안내 메시지

#### Outgoing Links 패널
현재 노트가 링크한 노트들의 목록 표시
- 실제 연결된 노트 (exists=true) + 미생성 링크 (exists=false) 분리 표시
- 미생성 링크에 "생성" 버튼으로 즉시 노트 생성 가능
- Link 테이블 + 위키링크 파싱 병합 방식

### Technical Changes
- `components/LocalGraph.tsx` - D3 기반 미니 그래프 컴포넌트
- `components/OutgoingLinksPanel.tsx` - Outgoing Links 패널 컴포넌트
- `app/api/notes/[id]/graph/route.ts` - Local Graph 데이터 API
- `app/api/notes/[id]/outgoing/route.ts` - Outgoing Links 데이터 API
- `lib/hooks/useNotes.ts` - useLocalGraph, useOutgoingLinks 훅 추가
- `app/notes/page.tsx` - 모바일/데스크톱 편집 영역에 패널 통합

### 달성도 변화
- 옵시디언: 92% → **95%**

---

### Fixed (Phase 4: lint 정리)

lint errors 13 → 0 달성

- `components/PropertyPanel.tsx` - any 타입 → 구체적 타입
- `components/TableView.tsx` - any 타입 → 구체적 타입
- `components/ShortcutHelpButton.tsx` - useEffect 내 setState 수정
- `components/SearchHighlight.tsx` - try/catch 내 JSX 구조 개선
- `lib/thinking/commands.ts` - any 타입 → 구체적 타입

### Commits
- `717050c`: feat: complete editor/ux parity and phase4 lint cleanup
- `6b06265`: fix: add bcryptjs runtime dependency

---

## 2026-02-10

### Added (AI Network + Note AI Expansion)
- 개별 노트 AI 7종 (Summarize/Expand/Clarify/Structure/TagSuggest/Question/Action)
- 노트 연결 AI 4종 (Connect/Contrast/Combine/Bridge)
- 네트워크 AI 9종
  - Auto-Link (링크 제안 + 승인)
  - Semantic Search (의미 검색)
  - Ask My Brain
  - Synthesis (3개 이상 종합)
  - Resurface
  - Random Spark
  - Knowledge Gap
  - Incubation (부화, DB 저장)
  - Time Capsule

### Updated
- Thinking 저장 시 새 노트가 **현재 노트 폴더**에 생성되도록 개선
- Quick Add가 `folderId=all`일 때 기본 폴더로 생성되도록 수정
- Time Capsule: 결과 없음 안내 메시지 추가
- Command Palette 상단에 네트워크 AI 아이콘 버튼들 추가

### Technical Changes
- 신규 API:
  - `/api/ai/note`
  - `/api/notes/semantic-search`
  - `/api/notes/ask-my-brain`
  - `/api/notes/synthesis`
  - `/api/notes/resurface`
  - `/api/notes/random-spark`
  - `/api/notes/knowledge-gap`
  - `/api/notes/incubation`, `/api/notes/incubation/resolve`
  - `/api/notes/time-capsule`
  - `/api/links/suggest`, `/api/links/approve`
  - `/api/thinking/contrast`, `/api/thinking/combine`, `/api/thinking/bridge`
- 신규 UI:
  - `AICommandMenu`, `AIResultPanel`
  - `AskMyBrainDialog`, `SemanticSearchDialog`, `SynthesisDialog`
  - `ResurfaceDialog`, `RandomSparkDialog`, `KnowledgeGapDialog`
  - `IncubationDialog`, `TimeCapsuleDialog`, `AutoLinkMenu`
- Prisma:
  - `IncubationQuestion` 모델 추가

### Commits (2026-02-10)
- `e23d02f` ~ `333ec8d` (AI 기능 전체 추가)
- `6981ed2` Quick Add 폴더 필터 수정

## 2026-02-08

### Updated (Notes Layout Simplification)
- 데스크톱 네비게이션을 우측 상단 메뉴 버튼으로 이동 (우측 Sheet)
- 폴더 트리를 좌측 상단 버튼으로 호출 (좌측 Sheet)
- 데스크톱 3컬럼 → 2컬럼 구조로 단순화
- 에디터 여백/포커스 강조 제거로 넓은 빈 공간 느낌 강화

### Technical Changes (Notes Layout Simplification)
- `app/layout.tsx` - 고정 사이드바 제거, 우측 상단 메뉴 트리거 추가
- `components/AppMenuSheet.tsx` - 앱 메뉴 Sheet 신규 추가
- `app/notes/page.tsx` - 폴더/메뉴 버튼, 2컬럼 레이아웃 및 리사이즈 로직 정리
- `components/NoteEditorAdvanced.tsx` - 에디터 패딩/높이 조정
- `app/globals.css` - 에디터 focus outline 제거

### Commits
- `58d8cbb`: feat: simplify notes layout and editor

## 2026-02-04

### Added (Phase 7: Performance & Version History)

#### Phase 7-1: Infinite Scroll
노트 목록 성능 최적화를 위한 무한 스크롤 구현

- **API 커서 기반 페이지네이션**: `/api/notes?cursor=&limit=20`
- **useNotesInfinite 훅**: TanStack Query `useInfiniteQuery` 사용
- **NoteList 무한 스크롤**: 하단 200px 도달 시 자동 로딩
- **고정 노트 처리**: 첫 페이지에서 별도 조회하여 항상 상단 표시
- **로딩 인디케이터**: 추가 로딩 중 스피너 표시

#### Phase 7-2: Version History
노트 변경 이력 추적 및 복원 기능

- **NoteVersion 모델**: 노트당 최대 50개 버전 자동 유지
- **버전 API**:
  - `GET /api/notes/[id]/versions` - 버전 목록
  - `GET /api/notes/[id]/versions/[versionId]` - 버전 상세
  - `POST /api/notes/[id]/versions/[versionId]/restore` - 버전 복원
- **자동 버전 생성**: 노트 title/body 변경 시 이전 상태 자동 저장
- **VersionHistoryPanel**: 버전 목록 UI (시간순 정렬)
- **VersionDiffDialog**: 이전 vs 현재 버전 Side-by-side 비교
- **History 버튼**: 노트 페이지에 통합 (데스크톱/모바일)

### Technical Changes (Phase 7)
- `prisma/schema.prisma` - NoteVersion 모델 추가
- `lib/versionUtils.ts` - 버전 생성/정리 유틸리티 (최대 50개 유지)
- `lib/hooks/useNotesInfinite.ts` - 무한 스크롤 훅
- `lib/hooks/useNoteVersions.ts` - 버전 관리 훅
- `app/api/notes/route.ts` - 커서 기반 페이지네이션
- `app/api/notes/[id]/route.ts` - PATCH 시 자동 버전 생성
- `app/api/notes/[id]/versions/` - 버전 API 엔드포인트
- `components/NoteList.tsx` - 무한 스크롤 적용
- `components/VersionHistoryPanel.tsx` - 버전 목록 UI
- `components/VersionDiffDialog.tsx` - Diff 비교 다이얼로그
- `app/notes/page.tsx` - History 버튼 추가

### Files Changed (Phase 7)
- 14 files changed
- +760 insertions, -31 deletions

### Commits
- `41cb851`: feat: add infinite scroll and version history (Phase 7)

---

## 2026-01-23

### Updated (Notes + Wiki Link Session)
- 위키링크 파싱/클릭 안정화: `[[...]]` 클릭 시 이동/생성, 중복 제목 선택 모달
- 그래프 뷰 링크 동기화: 누락 링크 표시 및 링크 파싱 후 연결 반영
- 노트 편집 UX 정리: 단축키 도움말 버튼, 에디터 프레임 최소화, H1 시작 유지
- 폴더/노트 리스트 개선: 전체 보기, 폴더 카운트 갱신, 미리보기 1줄, 타임스탬프 정렬
- 레이아웃 정리: 좌측/중앙 접기, 넓은 화면 확장, 사이드바 다크모드 일관화
- 폴더 DnD 개선: 전체 행 드래그, 최상위 드롭존 추가, 기본 폴더 유지

### Technical Changes (Notes + Wiki Link Session)
- `NoteEditorAdvanced`에 폴더 컨텍스트 전달 및 링크 생성 로직 개선
- `FolderTree`에 전체 보기/카운트/루트 드롭 안내 추가
- `NoteList`/`SwipeableNoteItem` 미리보기/시간 표시 포맷 정리
- `/notes` 라우트에서 `folderId=all` 처리 및 접기 상태 UI 추가

## 2025-12-31

### Added (Seventh Session - Claude + Codex 협업)
- **속성 필터 강화**: 노션 스타일 고급 필터 시스템
  - 다중 속성 필터 (Select, Multi-Select, Date, Checkbox)
  - AND/OR 조건 지원
  - 저장된 뷰 (Saved Views) - 필터 조합 저장/불러오기
  - 실시간 필터 적용 (Table/List View)
  - 필터 결과 카운트 표시
  - FilterBuilder 통합 UI

### Technical Changes (Seventh Session)
- Prisma schema: SavedView 모델 추가
- `lib/filterEngine.ts` - 필터 쿼리 빌더 엔진 (AND/OR 조건 → Prisma 쿼리)
- `lib/stores/filterStore.ts` - Zustand 필터 상태 관리
- `lib/hooks/useFilters.ts` - useFilteredNotes, useSavedViews hooks
- `/api/notes/filter` - POST (필터 적용된 노트 조회)
- `/api/saved-views` - GET/POST (뷰 목록/생성)
- `/api/saved-views/[id]` - GET/PATCH/DELETE (뷰 조회/수정/삭제)

### Codex Components (Seventh Session)
- `lib/validations/filter.ts` - 필터 Zod 스키마
- `lib/validations/savedView.ts` - SavedView Zod 스키마
- `components/PropertyFilterItem.tsx` - 개별 필터 아이템 UI
- `components/FilterConditionToggle.tsx` - AND/OR 토글 버튼
- `components/SavedViewDialog.tsx` - 뷰 저장 다이얼로그
- `components/SavedViewButton.tsx` - 저장된 뷰 버튼

### Integrated (Seventh Session)
- `components/FilterBuilder.tsx` - Codex 컴포넌트 활용 리팩토링
- `app/db/page.tsx` - 필터 UI 통합 (TableView/ListView 연동)
- `components/TableView.tsx` - props로 notes 받도록 수정
- `components/ListView.tsx` - props로 notes 받도록 수정

### Files Changed (Seventh Session)
- 15 files created
- 5 files modified
- +800 insertions

### Documentation (Seventh Session)
- `docs/FILTER_IMPLEMENTATION.md` - 구현 문서 작성
- `docs/ROADMAP.md` - Phase 3-4 완료 표시
- `docs/CHANGELOG.md` - 이 파일

---

## 2025-12-30

### Added (Sixth Session)
- **Timeline View**: 시간순 노트 타임라인
  - 날짜별 그룹화 (sticky 날짜 헤더)
  - 최근 24시간 수정 노트 하이라이트 (⭐)
  - 세로 Timeline 디자인 (점 + 라인)
  - 노트 미리보기 (150자 제한)
  - 날짜 범위 필터 (All Time / This Week / This Month)
  - 폴더 및 태그 표시
  - 클릭 시 노트로 이동
  - 다크모드 지원

### Technical Changes (Sixth Session)
- `/api/timeline` 신규 엔드포인트 (range 파라미터)
- `useTimeline` hook 추가
- `/timeline` 페이지 생성
- 날짜별 그룹화 로직
- 24시간 이내 수정 감지 로직

### Files Changed (Sixth Session)
- 3 files created
- +150 insertions

---

### Added (Fifth Session)
- **Dashboard (통계 대시보드)**: 노션 스타일 Analytics
  - 총 개수 카드 (Notes, Folders, Tags, Links)
  - 최근 7일 활동 그래프 (Created/Updated)
  - Top 10 연결된 노트 (링크 수 기준)
  - 폴더별 노트 분포 파이 차트
  - recharts 라이브러리 통합
  - 반응형 레이아웃
  - 다크모드 완전 지원

### Technical Changes (Fifth Session)
- `/api/dashboard` 신규 엔드포인트
- `useDashboard` hook 추가
- `/dashboard` 페이지 생성
- recharts 설치 (v2.x)
- Card 컴포넌트 활용 (shadcn/ui)
- BarChart, PieChart 구현

### Files Changed (Fifth Session)
- 3 files created
- +250 insertions
- recharts dependency 추가

---

### Added (Fourth Session)
- **Calendar View**: GitHub 스타일 활동 히트맵
  - 날짜별 노트 생성/수정 활동 시각화
  - 연도 선택 기능 (이전/다음)
  - 통계 (Total, Max/Day, Active Days)
  - 5단계 색상 강도 (활동량에 따라)
  - 범례 및 툴팁 (hover)
  - 다크모드 지원

- **노트 삭제 기능**: 안전한 삭제 UX
  - 노트 상세 페이지에 삭제 버튼 (Trash2 아이콘)
  - 삭제 확인 Dialog (되돌릴 수 없음 경고)
  - 삭제 후 /notes로 리다이렉트
  - Toast 알림

### Technical Changes (Fourth Session)
- `/api/calendar` 신규 엔드포인트 (연도별 활동 집계)
- `useCalendar` hook 추가
- `CalendarHeatmap` 컴포넌트 (주차 그리드, 월 레이블)
- `/calendar` 페이지 추가
- `/notes/[id]/page.tsx` 개선 (삭제 버튼, Dialog)
- `useDeleteNote` hook 활용

### Files Changed (Fourth Session)
- 5 files created, 1 file modified
- +250 insertions, -10 deletions

---

### Added (Third Session)
- **Enhanced Graph View**: Graph View 대폭 개선
  - 반응형 크기 (컨테이너 기반, ResizeObserver)
  - 폴더별 색상 코딩 (10색 팔레트)
  - 레전드 UI (폴더별 색상 표시)
  - 고립 노드 하이라이트 (회색 + 개수 표시)
  - 폴더 필터링 (체크박스)
  - 고립 노드 토글 (숨기기/보기)
  - 다크모드 완전 지원

### Technical Changes (Third Session)
- `/api/graph` 개선 (folders 포함, folderName 추가)
- `useGraph` hook 타입 확장 (Folder, folderName)
- GraphPage 전면 리팩토링:
  - ResizeObserver로 반응형 구현
  - 필터 상태 관리 (selectedFolders, showIsolated)
  - 필터링된 노드/엣지 렌더링
  - 폴더 색상 매핑 로직
  - 고립 노드 탐지 로직

### Files Changed (Third Session)
- 3 files changed, +150 insertions, -20 deletions

---

### Added (Second Session)
- **Enhanced Backlinks**: 백링크 개선
  - 백링크 컨텍스트 미리보기 (주변 50자)
  - 언급 횟수 배지 표시 (2회 이상 시)
  - BacklinkPanel 탭 UI (Backlinks / Unlinked)
  - Unlinked Mentions 기능 추가
  - 다크모드 지원

- **Unlinked Mentions** (New Feature):
  - 노트 제목이 언급되었지만 [[]]로 링크되지 않은 경우 탐지
  - 언급된 컨텍스트와 횟수 표시
  - 최소 제목 길이 3자 (오탐 방지)
  - `/api/notes/[id]/unlinked-mentions` 엔드포인트

### Technical Changes (Second Session)
- `/api/notes/[id]/backlinks` 개선 (context extraction)
- `/api/notes/[id]/unlinked-mentions` 신규 엔드포인트
- `useUnlinkedMentions` hook 추가
- BacklinkPanel 리팩토링 (탭, 컨텍스트, 배지)

### Documentation
- ROADMAP.md 업데이트 (Phase 2-3 계획 추가)
- 작업 우선순위 가이드 추가

---

### Added (First Session)
- **Daily Notes**: 매일 자동 생성되는 일일 노트 시스템
  - 날짜별 노트 자동 생성 (`yyyy-MM-dd` 형식)
  - 이전/다음 날짜 네비게이션
  - Daily Note 템플릿 자동 적용
  - Navigation에 "Daily" 링크 추가

- **Templates System**: 노트 템플릿 관리 시스템
  - Template 데이터베이스 모델 추가
  - 4종 기본 템플릿 제공:
    - Daily Note (Tasks, Notes, Reflections)
    - Meeting Note (Agenda, Discussion, Action Items)
    - Project Note (Overview, Requirements, Progress Log)
    - Book Note (Summary, Key Takeaways, Quotes)
  - Quick Add에 템플릿 선택 Dialog 통합
  - 템플릿 변수 치환 (`{{date}}`, `{{title}}`)
  - Template CRUD API (`/api/templates`)

- **Enhanced Search**: 검색 기능 대폭 개선
  - 검색어 주변 컨텍스트 미리보기 (50자)
  - 태그/폴더 필터링 지원
  - 제목 매칭 우선 정렬
  - Command Palette에 debounced search (300ms) 적용
  - 서버 사이드 검색으로 전환
  - 로딩 상태 표시
  - 검색 결과 20개로 증가

### Technical Changes
- Prisma schema에 Template 모델 추가
- `/api/daily-notes` 엔드포인트 구현
- `/api/templates` CRUD 엔드포인트 구현
- `useDailyNote`, `useTemplates` hooks 추가
- Template validation schema (Zod)
- Search API 개선 (context extraction, filtering)
- Command Palette 최적화

### Files Changed
- 17 files changed, 1036 insertions(+), 84 deletions(-)
- New files: 11
- Modified files: 6

### Commits
- `a00cd59`: feat: add Daily Notes, Templates, and Enhanced Search

---

## 2025-11-18

### Added
- Command Palette (Cmd+K)
- Dark Mode (indigo/purple theme)
- Toast 알림 (sonner)

### Documentation
- PR 템플릿 추가

### Commits
- `03d58e3`: docs: add complete documentation
- `c6dafb7`: feat: implement dark mode
- `d770712`: feat: replace alert() with toast
- `47487f5`: feat: add Command Palette

---

## 2025-11-17

### Added
- Wiki Link & HashTag 기능
- Graph View
- Property Database

---

**Last Updated**: 2026-02-18
