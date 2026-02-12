# Second Brain App Roadmap

## Current Status
Phase 0~8 완료 ✅
**Phase 8 (AI) 전체 구현 완료** (2026-02-10)
**병행 트랙: 모바일 앱 전환(PWA -> Expo) 진행 중**
**다음: 안정화 & UX 개선 또는 신규 기능 검토**

---

## 🎯 경쟁 앱 대비 진행도 (2026-02-12 기준)

| 앱 | 달성도 | 핵심 차이점 |
|----|--------|------------|
| 애플 메모 | **90%** | 이미지 첨부만 없음 |
| 옵시디언 | **85%** | AI 기능으로 차별화, 플러그인/로컬 파일 없음 |
| 노션 | **65%** | AI 기능 추가, 블록 에디터/협업 부족 |
| 마인드맵 | **40%** | 시각화만, 편집 불가 |

### 상세
- **애플 메모 90%**: Quick Add, 폴더, 고정, 검색, 스와이프 ✅ / 이미지 ❌
- **옵시디언 85%**: Wiki Links, 백링크, Graph, 태그, Daily, 템플릿, Export/Import, **AI 20개 기능** ✅ / 플러그인 ❌
- **노션 65%**: 속성, DB뷰, 필터, SavedView, 버전히스토리, **AI 기능** ✅ / 블록에디터, 실시간협업 ⚠️
- **마인드맵 40%**: Graph View ✅ / 마인드맵 편집 ❌

---

## ✅ Phase 0: 안정화 (완료 - 2026-01-22)

> **목적**: 기존 13개 페이지의 버그 수정 및 코드 품질 개선

### P0-1: 자동 저장 안정화 ✅
- [x] Notes List: debounce 추가 (500ms)
- [x] Daily: debounce 추가 (500ms)
- [x] Race condition 방지 로직
- [x] 저장 상태 표시 한글화

### P0-2: 타입 안전성 확보 ✅
- [x] Dashboard: recharts 타입 호환성 개선
- [x] useParseTags 훅 신규 생성

### P0-3: API 호출 통일 ✅
- [x] Note Detail: parseTags → useMutation 적용

### P0-4: 에러/빈 상태 처리 ✅
- [x] 7개 페이지 한글 에러 메시지
- [x] db 페이지 빈 상태 UI 추가
- [x] ErrorBoundary 적용 (error.tsx, global-error.tsx)

### P0-5: 코드 정리 ✅
- [x] Folders: depthMap → useMemo
- [x] Settings: downloadFile/handleExport 함수 추상화
- [x] Timeline: 버튼 스타일 함수화

---

## ✅ Phase 4: 옵시디언 Core 확장 (완료 - 2026-01-22)

- [x] **Export/Import** (이미 구현됨)
  - Export Markdown ZIP (폴더 구조 유지) ✅
  - Export JSON (전체 DB 덤프) ✅
  - Import Obsidian vault (MD 파일 + 폴더) ✅

- [x] **고급 검색** (이미 구현됨)
  - 정규식 검색 ✅
  - 검색 필터 조합 (태그 AND 폴더) ✅
  - 검색 결과 정렬 옵션 ✅
  - 검색 히스토리 ✅

- [x] **노트 템플릿 관리 페이지**
  - 템플릿 CRUD UI ✅
  - 템플릿 미리보기 추가 ✅
  - 템플릿 변수 가이드 추가 ✅

---

## Next Tasks

> **상세 명세**: `docs/APPLE_NOTES_PARITY.md` 참조

### Phase 1: 핵심 UX (즉시성/단순성/신뢰성)
- [ ] Home 페이지 → 최신 메모 + 바로 작성
- [ ] Cmd+N 전역 단축키
- [ ] 저장 상태 표시 강화
- [ ] 테이블 기능 (Tiptap Table)
- [ ] 텍스트 하이라이트

### Phase 2: 안정성 + 편의성
- [ ] 오프라인 모드 (ServiceWorker)
- [ ] 갤러리 뷰
- [ ] 집중 모드
- [ ] 접기 섹션
- [ ] 노트 잠금

### AI 기능 품질 개선

> **상세 명세**: `docs/AI_ENHANCEMENT_PLAN.md` 참조

- [ ] Phase 1: Ask My Brain 강화 (컨텍스트 확장, 출처 표시)
- [ ] Phase 2: 실시간 연상 (글쓰기 중 관련 노트 제안)
- [ ] Phase 3: Graph View + AI 통합
- [ ] Phase 4: 개별 노트 AI 강화
- [ ] Phase 5: 알림/자동화

### 마인드맵 → Graph View 통합

> **상세 명세**: `docs/MINDMAP_DECISION.md` 참조

- [ ] Mindmap 페이지 삭제
- [ ] Graph View에 레이아웃 토글 (Network/Tree)
- [ ] Local Graph (현재 노트 중심 미니 그래프)

### Obsidian 기능 동등성

> **상세 명세**: `docs/OBSIDIAN_PARITY.md` 참조

현재 달성도: **70%** (AI 기능으로 차별화)

### 코드 품질
- [ ] DialogContent aria warning 수정
- [ ] Mindmap useEffect 의존성 정리
- [ ] any 타입 정리

### 후순위 (Phase 3+)
- 이미지/파일 첨부
- 오디오 녹음/전사
- 실시간 협업
- 모바일 네이티브

---

## Completed Phases

### ✅ Phase 8: AI 기능 (완료 - 2026-02-10)

#### 개별 노트 AI (7개)
- [x] Summarize (요약)
- [x] Expand (확장)
- [x] Clarify (명확화)
- [x] Structure (구조화)
- [x] TagSuggest (태그 제안)
- [x] Question (질문 생성)
- [x] Action (액션 제안)

#### 노트 연결 AI (4개)
- [x] Connect (연결)
- [x] Contrast (대조)
- [x] Combine (결합)
- [x] Bridge (브릿지)

#### 네트워크 AI (9개)
- [x] Auto-Link (자동 링크 제안/승인)
- [x] Semantic Search (의미 검색)
- [x] Ask My Brain (내 뇌에 질문)
- [x] Synthesis (다중 노트 종합)
- [x] Resurface (다시 떠오르기)
- [x] Random Spark (랜덤 연결)
- [x] Knowledge Gap (지식 빈틈)
- [x] Incubation (부화 - DB 저장)
- [x] Time Capsule (시간 캡슐)

#### 핵심 철학
```
1. AI는 재료만 제공, 결론 금지
2. 자동 저장 금지, 사용자 확정 필수
3. 답이 아닌 질문/방향으로 제시
4. 사용자 요청 시에만 작동
```

---

### ✅ Phase 5: UX 개선 & 최적화 (완료 - 2026-01-22)

- [x] **모바일 UX**
  - 스와이프 제스처 ✅
  - PWA 설정 ✅

- [x] **성능 최적화**
  - 노트 목록 가상 스크롤 ✅
  - Graph View 성능 개선 ✅

- [x] **키보드 단축키**
  - 단축키 가이드 페이지 (/shortcuts) ✅
  - Vim 모드 ✅

---

## 📊 페이지별 현황 (2026-01-22 업데이트)

| 페이지 | 완성도 | 상태 |
|--------|--------|------|
| Home (/) | 10% | 리다이렉트만 존재 (개선 검토) |
| Notes List | 95% | 가상 스크롤, debounce 완료 |
| Note Detail | 90% | 완료 |
| Daily | 90% | Debounce 완료 |
| Folders | 90% | useMemo 적용 완료 |
| Database | 90% | 빈 상태 UI 완료 |
| Graph | 90% | 성능 최적화 완료 |
| Mindmap | 85% | 기능 동작 |
| Calendar | 90% | 완료 |
| Dashboard | 90% | 완료 |
| Timeline | 90% | 완료 |
| Templates | 90% | 완료 |
| Settings | 90% | 완료 |
| Shortcuts | 100% | 신규 페이지 |

**평균 완성도: 90%+** ✅ (Home 제외)

---

## Completed Phases

### Phase 7: 성능 & 버전 관리 ✅ (2026-02-04)

#### Phase 7-1: 무한 스크롤
- [x] API 커서 기반 페이지네이션 (`/api/notes?cursor=&limit=20`)
- [x] `useNotesInfinite` 훅 (TanStack Query useInfiniteQuery)
- [x] NoteList 무한 스크롤 (하단 200px 도달 시 자동 로드)
- [x] 고정 노트 별도 처리 (첫 페이지에서 상단 표시)
- [x] 로딩 인디케이터

#### Phase 7-2: 버전 히스토리
- [x] NoteVersion 모델 추가 (노트당 최대 50개)
- [x] 버전 API: 목록, 상세, 복원
- [x] 노트 수정 시 자동 버전 생성
- [x] VersionHistoryPanel, VersionDiffDialog 컴포넌트
- [x] 노트 페이지에 History 버튼 통합 (데스크톱/모바일)

### Phase 6: 고급 검색 & 모바일 ✅ (이전 완료)
- [x] 정규식 검색 (AdvancedSearchDialog)
- [x] 검색 히스토리 (useSearchHistory)
- [x] 검색 결과 하이라이트 (SearchHighlight)
- [x] 모바일 네비게이션 (MobileNav - 햄버거 메뉴)
- [x] PWA manifest.json

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

### ✅ 완료된 Phase
- Phase 0: 안정화 ✅
- Phase 1: MVP ✅
- Phase 2: 기능 확장 ✅
- Phase 3: 노션 Core ✅
- Phase 4: 옵시디언 Core ✅
- Phase 5: UX 개선 & 최적화 ✅
- Phase 6: 고급 검색 & 모바일 ✅
- Phase 7: 성능 & 버전 관리 ✅
- Phase 8: AI 기능 ✅

### 🟡 다음 단계 (검토 필요)
1. **안정화 & UX 개선** - AI 기능 피드백 반영, 접근성 개선
2. Home 페이지 개선 (랜딩/대시보드/온보딩)
3. 이미지 첨부 기능 (애플 메모 100%)
4. 마인드맵 편집 모드 (마인드맵 70%)
5. 실시간 협업 (노션 80%)

---

**Last Updated**: 2026-02-12
**Current Phase**: Phase 8 완료
**Status**: AI 20개 기능 구현 완료, 안정화/UX 개선 또는 신규 기능 검토 중
