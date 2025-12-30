# Second Brain App Changelog

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

**Last Updated**: 2025-11-18
