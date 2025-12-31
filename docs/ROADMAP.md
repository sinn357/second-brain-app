# Second Brain App Roadmap

## Current Status
Phase 3 완료 (노션 Core 강화)
Phase 4 진행 예정 (옵시디언 Core 확장)

---

## Next Tasks

### Phase 4: 옵시디언 Core 확장 (진행 예정)

---

### Phase 4: 옵시디언 Core 확장

- [ ] **Export/Import**
  - Export Markdown ZIP (폴더 구조 유지)
  - Export JSON (전체 DB 덤프)
  - Import Obsidian vault (MD 파일 + 폴더)
  - Import Notion CSV
  - 자동 백업 (주간, Neon DB)

- [ ] **고급 검색**
  - 정규식 검색
  - 검색 필터 조합 (태그 AND 폴더)
  - 검색 결과 정렬 옵션
  - 저장된 검색 (Saved Searches)

- [ ] **노트 템플릿 관리 페이지**
  - `/templates` 페이지
  - 템플릿 CRUD UI
  - 템플릿 미리보기
  - 템플릿 변수 가이드

---

### Phase 5: UX 개선 & 최적화

- [ ] **모바일 UX**
  - 단일 컬럼 레이아웃 (모바일)
  - Bottom Sheet (폴더/백링크)
  - 스와이프 제스처
  - PWA 설정 (선택)

- [ ] **성능 최적화**
  - 노트 목록 가상 스크롤
  - 이미지 lazy loading
  - Graph View 성능 개선 (큰 그래프)

- [ ] **키보드 단축키**
  - 단축키 가이드 페이지
  - 커스터마이징 가능한 단축키
  - Vim 모드 (선택)

---

## Completed Phases

### Phase 3-4: 노션 Core - 속성 필터 강화 ✅ (2025-12-31)
- [x] SavedView DB 모델 추가
- [x] 필터 쿼리 엔진 (AND/OR 조건)
- [x] /api/notes/filter 엔드포인트
- [x] /api/saved-views CRUD API
- [x] Zustand 필터 상태 관리
- [x] FilterBuilder 컴포넌트
- [x] PropertyFilterItem 컴포넌트 (Codex)
- [x] FilterConditionToggle 컴포넌트 (Codex)
- [x] SavedViewDialog 컴포넌트 (Codex)
- [x] SavedViewButton 컴포넌트 (Codex)
- [x] /db 페이지 필터 UI 통합
- [x] Claude + Codex 협업 완료

### Phase 3-3: 노션 Core - Timeline View ✅ (2025-12-30)
- [x] Timeline API (시간순 노트 조회)
- [x] useTimeline hook
- [x] /timeline 페이지
- [x] 날짜별 그룹화 (sticky 헤더)
- [x] 최근 수정 하이라이트 (24시간 이내)
- [x] 날짜 범위 필터 (All/Week/Month)
- [x] Timeline 점 디자인 (세로 라인)
- [x] 노트 미리보기 (150자)
- [x] 폴더/태그 표시
- [x] 다크모드 지원

### Phase 3-2: 노션 Core - Dashboard ✅ (2025-12-30)
- [x] Dashboard API (통계 집계)
- [x] useDashboard hook
- [x] /dashboard 페이지
- [x] 총 개수 카드 (Notes, Folders, Tags, Links)
- [x] 최근 7일 활동 그래프 (Bar Chart)
- [x] Top 10 연결된 노트 (클릭 가능)
- [x] 폴더별 분포 파이 차트
- [x] recharts 통합
- [x] 다크모드 지원

### Phase 3-1: 노션 Core - Calendar View ✅ (2025-12-30)
- [x] Calendar API (날짜별 노트 활동 집계)
- [x] useCalendar hook
- [x] CalendarHeatmap 컴포넌트 (GitHub 스타일)
- [x] /calendar 페이지
- [x] 연도 선택 기능
- [x] 통계 (Total, Max/Day, Active Days)
- [x] 노트 삭제 기능 (Dialog 확인)

### Phase 2-3: 마인드맵 강화 (Graph View 개선) ✅ (2025-12-30)
- [x] 반응형 크기 (컨테이너 기반, ResizeObserver)
- [x] 폴더별 색상 코딩 (10색 팔레트)
- [x] 레전드 UI (폴더별 색상 표시)
- [x] 고립 노드 하이라이트 (회색 + 개수)
- [x] 폴더 필터링 (체크박스)
- [x] 고립 노드 토글 (숨기기/보기)

### Phase 2-2: 옵시디언 심화 ✅ (2025-12-30)
- [x] 백링크 컨텍스트 미리보기
- [x] Unlinked Mentions
- [x] 언급 횟수 표시
- [x] BacklinkPanel 탭 UI

### Phase 2-1: 애플메모 + 옵시디언 기능 ✅ (2025-12-30)
- [x] Daily Notes (자동 생성, 날짜 네비게이션)
- [x] Templates 시스템 (4종 기본 템플릿)
- [x] Enhanced Search (컨텍스트, 필터, debounce)
- [x] Quick Add 템플릿 선택

### Phase 1: MVP ✅ (2025-11-18)
- [x] Quick Add 노트
- [x] Wiki Links (`[[]]`)
- [x] HashTags (`#`)
- [x] Property Database
- [x] Graph View (D3.js)
- [x] Folder 구조
- [x] Command Palette (Cmd+K)
- [x] Dark Mode

---

## 작업 우선순위 가이드

### 높음 🔥
1. Calendar View - 노션 Core 필수 기능
2. Export/Import - 데이터 백업 필수
3. 통계 대시보드 - 노션 Analytics

### 중간 ⭐
4. Timeline View
5. 템플릿 관리 페이지
6. 고급 검색 (정규식, 복합 필터)

### 낮음 💡
7. Graph 클러스터링 (고급 기능)
8. 미니맵 (Graph View)
9. 모바일 UX (반응형은 이미 지원)
10. 성능 최적화 (필요 시)

---

**Last Updated**: 2025-12-30
**Current Phase**: Phase 3 (노션 Core 강화)
**Next Milestone**: Calendar View 구현
