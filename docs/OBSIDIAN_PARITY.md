# Obsidian 기능 동등성 분석

> **목적**: Obsidian 핵심 기능 대비 Second Brain 현황 파악
> **작성일**: 2026-02-12
> **기준**: Obsidian v1.11 (2025-2026)
> **검증**: 코드 기반 확인 완료

---

## 요약

| 영역 | 달성도 | 검증 상태 |
|------|:------:|:--------:|
| 연결 기능 | **90%** | ✅ 코드 확인 |
| 검색/네비게이션 | **90%** | ✅ 코드 확인 |
| 조직화 | **85%** | ✅ 코드 확인 |
| Export/Import | **85%** | ✅ 코드 확인 |
| 템플릿/자동화 | **80%** | ✅ 코드 확인 |
| 에디터 | **75%** | ✅ 코드 확인 |
| 시각화 | **60%** | ✅ 코드 확인 |
| 커스터마이징 | **20%** | ✅ 코드 확인 |
| **종합** | **73%** | |

---

## Obsidian 핵심 철학

> **"Obsidian's core philosophy centers on three fundamental principles: local storage, future-proofing, and networked thinking."**

| 핵심 원칙 | Obsidian | Second Brain | 비고 |
|----------|---------|--------------|------|
| 로컬 저장 | 마크다운 파일 | 클라우드 DB | 다른 접근 |
| 미래 보장 | 표준 포맷 | Export로 대체 | 부분 충족 |
| 네트워크 사고 | 양방향 링크 | ✅ 구현됨 | 핵심 구현 |

---

## 상세 비교 (코드 검증)

### 1. 연결 기능 — 90%

| 기능 | 코드 위치 | 상태 |
|------|----------|:----:|
| Wiki Links `[[]]` | `lib/tiptap-extensions/WikiLink.ts` | ✅ |
| 링크 자동완성 | `WikiLinkAutocomplete.ts`, `WikiLinkSuggestion.ts` | ✅ |
| 링크 클릭 이동 | `WikiLink.ts` handleClick | ✅ |
| 백링크 패널 | `components/BacklinkPanel.tsx` | ✅ |
| 백링크 API | `app/api/notes/[id]/backlinks/route.ts` | ✅ |
| Unlinked Mentions | `app/api/notes/[id]/unlinked-mentions/route.ts` | ✅ |
| 링크 파싱/저장 | `app/api/links/parse/route.ts` | ✅ |
| 멘션 횟수 표시 | `BacklinkPanel.tsx` mentionCount | ✅ |
| 컨텍스트 미리보기 | `BacklinkPanel.tsx` contexts | ✅ |
| **별칭 (Alias)** | - | ❌ |
| **블록 참조 `^`** | - | ❌ |
| **헤딩 링크 `#`** | - | ❌ |
| **임베드 `![[]]`** | - | ❌ |

### 2. 검색/네비게이션 — 90%

| 기능 | 코드 위치 | 상태 |
|------|----------|:----:|
| Command Palette | `components/CommandPalette.tsx` | ✅ |
| 검색 debounce | 300ms | ✅ |
| 정규식 검색 | `searchMode === 'regex'` | ✅ |
| Semantic Search | `SemanticSearchDialog.tsx` | ✅ |
| 검색 히스토리 | `lib/hooks/useSearchHistory.ts` | ✅ |
| 고급 필터 | `AdvancedSearchDialog.tsx` | ✅ |
| 태그/폴더 필터 | `advancedFilters` | ✅ |
| 날짜 범위 필터 | `dateFrom`, `dateTo` | ✅ |
| 결과 하이라이트 | `SearchHighlight.tsx` | ✅ |
| **검색 연산자** | - | ⚠️ 일부만 |

### 3. 조직화 — 85%

| 기능 | 코드 위치 | 상태 |
|------|----------|:----:|
| 폴더 (무한 중첩) | `Folder` 모델 (parentId) | ✅ |
| 폴더 드래그앤드롭 | 구현됨 | ✅ |
| 태그 | `Tag`, `NoteTag` 모델 | ✅ |
| 노트 고정 (Pin) | `isPinned`, `pinnedAt` 필드 | ✅ |
| 속성/프론트매터 | `Property`, `NoteProperty` 모델 | ✅ |
| 속성 타입 | select, multi_select, date, checkbox | ✅ |
| SavedView | `SavedView` 모델 | ✅ |
| 필터 저장/불러오기 | `/api/saved-views` | ✅ |
| **중첩 태그 `#a/b`** | - | ❌ |
| **스마트 폴더** | SavedView로 유사 | ⚠️ |

### 4. Export/Import — 85%

| 기능 | 코드 위치 | 상태 |
|------|----------|:----:|
| JSON Export | `app/api/export/json/route.ts` | ✅ |
| Markdown Export | `app/api/export/markdown/route.ts` | ✅ |
| JSON Import | `app/api/import/json/route.ts` | ✅ |
| Obsidian Import | `app/api/import/obsidian/route.ts` | ✅ |
| **PDF Export** | - | ❌ |
| **HTML Export** | - | ❌ |

### 5. 템플릿/자동화 — 80%

| 기능 | 코드 위치 | 상태 |
|------|----------|:----:|
| 템플릿 CRUD | `app/templates/page.tsx` | ✅ |
| 템플릿 변수 | `{{date}}`, `{{time}}`, `{{datetime}}`, `{{title}}`, `{{cursor}}` | ✅ |
| 템플릿 미리보기 | 구현됨 | ✅ |
| Daily Notes | `app/daily/page.tsx` | ✅ |
| Daily API | `app/api/daily-notes/route.ts` | ✅ |
| 날짜 네비게이션 | 이전/다음 버튼 | ✅ |
| **Weekly Notes** | - | ❌ |
| **Monthly Notes** | - | ❌ |
| **Templater (고급)** | - | ❌ |

### 6. 에디터 — 75%

| 기능 | 코드 위치 | 상태 |
|------|----------|:----:|
| 리치 텍스트 (WYSIWYG) | Tiptap | ✅ |
| 마크다운 지원 | Tiptap extensions | ✅ |
| Vim 모드 | `useEditorStore` | ✅ |
| 자동 저장 | debounce 500ms | ✅ |
| 저장 상태 표시 | `saveStatus` | ✅ |
| 버전 히스토리 | `NoteVersion` 모델 (최대 50개) | ✅ |
| 버전 비교 | `VersionDiffDialog.tsx` | ✅ |
| 버전 복원 | `/api/notes/[id]/versions/[versionId]/restore` | ✅ |
| **소스 모드** | - | ❌ |
| **오프라인 편집** | - | ❌ |
| **멀티 탭/창** | - | ❌ |
| **스플릿 뷰** | - | ❌ |

### 7. 시각화 — 60%

| 기능 | 코드 위치 | 상태 |
|------|----------|:----:|
| Graph View | `app/graph/page.tsx` | ✅ |
| D3.js force simulation | 구현됨 | ✅ |
| 폴더별 색상 | 10색 팔레트 | ✅ |
| 고립 노드 표시 | `ISOLATED_NODE_COLOR` | ✅ |
| Missing Links 표시 | `showMissing` | ✅ |
| 필터링 | 폴더, 고립 노드, 라벨 | ✅ |
| 줌/팬 | D3 zoom | ✅ |
| 노드 드래그 | D3 drag | ✅ |
| 성능 최적화 | `LARGE_GRAPH_THRESHOLD` | ✅ |
| **Local Graph** | - | ❌ |
| **Canvas** | - | ❌ |

### 8. 커스터마이징 — 20%

| 기능 | 상태 |
|------|:----:|
| 다크/라이트 모드 | ✅ |
| 단축키 (일부) | ✅ |
| **플러그인 시스템** | ❌ |
| **커뮤니티 플러그인** | ❌ |
| **테마** | ❌ |
| **CSS 스니펫** | ❌ |
| **단축키 커스텀** | ❌ |

---

## Second Brain 고유 기능 (Obsidian에 없음)

| 기능 | 설명 |
|------|------|
| **AI 20개 기능** | 요약, 연결, 질문 생성, Ask My Brain 등 |
| **Semantic Search** | 의미 기반 검색 (AI) |
| **Auto-Link** | AI 링크 제안 |
| **Incubation** | 질문 부화 (DB 저장) |
| Timeline View | 시간순 노트 보기 |
| Dashboard | 통계 대시보드 |
| Calendar Heatmap | GitHub 스타일 활동 시각화 |
| 실시간 동기화 | 로그인만 하면 어디서든 접근 |

---

## 우선순위별 개선 항목

### Phase 1 (핵심 UX)

| 항목 | 이유 | 난이도 |
|------|------|:------:|
| **Local Graph** | 현재 노트 맥락 파악 필수 | 중 |
| 레이아웃 토글 | Mindmap 통합 | 낮 |

### Phase 2 (안정성)

| 항목 | 이유 | 난이도 |
|------|------|:------:|
| **오프라인 모드** | 신뢰성 핵심 | 중 |
| 검색 연산자 확장 | `tag:`, `path:`, `file:` | 낮 |

### Phase 3 (확장)

| 항목 | 이유 | 난이도 |
|------|------|:------:|
| 헤딩 링크 `[[#]]` | 정밀한 참조 | 중 |
| 중첩 태그 | 조직화 강화 | 중 |
| Periodic Notes | Weekly, Monthly | 낮 |
| PDF Export | 공유 필요 | 중 |

### Phase 4 (고급)

| 항목 | 난이도 |
|------|:------:|
| 블록 참조 `^` | 높 |
| 임베드 `![[]]` | 높 |
| 멀티 탭/스플릿 | 높 |

### Phase 5 (장기)

| 항목 | 난이도 |
|------|:------:|
| Canvas | 매우 높 |
| 플러그인 시스템 | 매우 높 |

---

## 전략

```
Obsidian의 "모든 기능"을 따라갈 필요 없음.

차별화 포인트:
1. AI 기능 (Obsidian은 플러그인 필요)
2. 웹 접근성 (설치 없이 어디서든)
3. 실시간 동기화 (설정 필요 없음)

핵심 기능 확실히:
1. 연결 (Wiki Links, 백링크) ✅
2. 검색 ✅
3. Graph View + Local Graph (추가 필요)
4. 오프라인 (추가 필요)
```

---

## 참고 자료

- [Obsidian Overview 2025 - eesel.ai](https://www.eesel.ai/blog/obsidian-overview)
- [Obsidian Release Notes - Releasebot](https://releasebot.io/updates/obsidian)
- [Obsidian Roadmap](https://obsidian.md/roadmap/)

---

**Last Updated**: 2026-02-12
**Owner**: CEO + Arch (Claude)
**검증**: 코드 기반 확인 완료
