# Second Brain App Changelog

## 2025-12-30

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
