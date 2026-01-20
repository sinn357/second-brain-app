# Second Brain App Roadmap

## Current Status
Phase 3 완료 (노션 Core 강화)
**Phase 0 진행 중 (안정화)** ← 현재
Phase 4 대기 (옵시디언 Core 확장)

---

## 🚨 Phase 0: 안정화 (진행 중)

> **목적**: 기존 13개 페이지의 버그 수정 및 코드 품질 개선
> **예상 소요**: 5-6시간
> **우선순위**: Phase 4 진행 전 필수 완료

### P0-1: 자동 저장 안정화 🔴 Critical
- [ ] Notes List (`/notes`): debounce 추가 (500ms)
- [ ] Daily (`/daily`): debounce 추가 (500ms)
- [ ] Race condition 방지 로직 (Promise queue)
- [ ] 저장 상태 표시 ("저장 중..." → "저장됨")

### P0-2: 타입 안전성 확보
- [ ] Graph (`/graph`): NodeData, EdgeData 타입 정의
- [ ] Mindmap (`/mindmap`): TreeNode 타입 정의
- [ ] Dashboard (`/dashboard`): ChartData 타입 정의
- [ ] any 타입 제거 (D3 콜백)

### P0-3: API 호출 통일
- [ ] Note Detail: parseLinks → useMutation
- [ ] Note Detail: parseTags → useMutation
- [ ] Settings: export → useMutation
- [ ] Settings: import → useMutation

### P0-4: 에러/빈 상태 처리
- [ ] 전체 페이지 한글 에러 메시지
- [ ] 빈 상태 UI 추가 (empty state)
- [ ] 로딩 Skeleton 레이아웃 일치
- [ ] ErrorBoundary 적용

### P0-5: 코드 정리
- [ ] Folders: depthMap → useMemo
- [ ] Mindmap: useEffect 의존성 정리
- [ ] Settings: downloadFile/uploadFile 함수 추상화
- [ ] Timeline: 버튼 스타일 함수화
- [ ] Home: 랜딩 페이지 또는 대시보드 리다이렉트

---

## Next Tasks

### Phase 4: 옵시디언 Core 확장 (대기)

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
  - `/templates` 페이지 개선
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

## 📊 페이지별 현황 (2026-01-21 분석)

| 페이지 | 완성도 | 핵심 이슈 |
|--------|--------|-----------|
| Home (/) | 0% UI | 리다이렉트만 존재 |
| Notes List | 70% | 자동저장 Race Condition |
| Note Detail | 75% | fetch→mutation 필요 |
| Daily | 65% | **Debounce 없음 (Critical)** |
| Folders | 80% | depthMap useMemo 누락 |
| Database | 70% | 빈 상태 처리 미흡 |
| Graph | 75% | any 타입 과다, 성능 |
| Mindmap | 70% | useEffect 의존성 순환 |
| Calendar | 80% | 영문 에러 메시지 |
| Dashboard | 80% | 하드코딩 색상, any 타입 |
| Timeline | 85% | 버튼 스타일 중복 |
| Templates | 75% | Dialog 구현 검토 필요 |
| Settings | 75% | 코드 중복 (export/import) |

**평균 완성도: 75.6%** → Phase 0 완료 후 **90%+ 목표**

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

### 🔴 긴급 (Phase 0)
1. 자동 저장 debounce - 데이터 손실 방지
2. Race condition 해결 - 안정성 확보
3. 타입 안전성 - 런타임 에러 방지

### 🟡 중요 (Phase 4)
4. Export/Import - 데이터 백업 필수
5. 고급 검색 - 사용성 향상
6. 템플릿 관리 - UX 개선

### 🟢 개선 (Phase 5)
7. 모바일 UX
8. 성능 최적화
9. 키보드 단축키

---

**Last Updated**: 2026-01-21
**Current Phase**: Phase 0 (안정화)
**Next Milestone**: P0-1 자동 저장 안정화
