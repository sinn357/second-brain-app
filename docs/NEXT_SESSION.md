# Next Session Guide

**업데이트**: 2026-02-18
**목적**: 다음 세션에서 바로 작업 가능한 가이드

---

## 🔜 다음 세션에서 할 일

### Phase 4: lint 정리

```
lint 13 errors / 27 warnings 일괄 처리
```

### Phase 5: 미디어 (저장소 결정 후)

```
- 이미지 첨부
- YouTube 임베드
```

---

## ✅ 2026-02-18 완료된 작업

### 옵시디언 차별화 (Phase 3) ✅

1. **Local Graph**
   - 현재 노트 중심 incoming/outgoing 링크 미니 그래프 (D3)
   - 노드 클릭 시 해당 노트로 이동
   - 파일: `components/LocalGraph.tsx`, `app/api/notes/[id]/graph/route.ts`

2. **Outgoing Links 패널**
   - 현재 노트가 링크한 노트 목록
   - 실제 연결된 노트 + 미생성 링크 분리 표시
   - 미생성 링크 "생성" 버튼으로 즉시 노트 생성
   - 파일: `components/OutgoingLinksPanel.tsx`, `app/api/notes/[id]/outgoing/route.ts`

3. **Notes 화면 통합**
   - 모바일/데스크톱 편집 영역 하단에 LocalGraph, OutgoingLinksPanel 배치

---

## ✅ 2026-02-17 완료된 작업

### 에디터 맥시마이징 (Phase 1~3)
- 하이라이트 (다중 색상) ✅
- 텍스트 색상 ✅
- 텍스트 정렬 (좌/중/우) ✅
- 밑줄/취소선 UI 버튼 ✅
- 코드블록 구문 강조 (lowlight) ✅
- 콜아웃 (info/warning) ✅
- 토글 (접기 섹션) ✅
- 수학 수식 (KaTeX) ✅
- 목차 (TOC) ✅

### 공통 UX (Phase 1)
- Cmd+N 전역 단축키 ✅
- 저장 상태 표시 강화 (saving/saved/error) ✅
- 오프라인 모드 (next-pwa) ✅
- 오프라인 배너 + /offline 페이지 ✅

### 애플 메모 차별화 (Phase 2)
- 갤러리 뷰 (노트 썸네일 그리드) ✅
- 노트 잠금 (비밀번호, bcrypt) ✅
- 잠긴 노트 본문 마스킹 ✅
- lockHash 클라이언트 비노출 ✅

### lint 정리
- 73 errors → 13 errors
- lib/filterEngine.ts, lib/ai/service.ts 타입 정의
- tiptap-extensions 폴더 no-explicit-any 예외 처리

### 결정사항
- webpack 빌드 유지 (next-pwa가 Turbopack 미지원)
- 노트 잠금은 UX 레벨 보호 유지 (서버 세션 기반 차단 안 함)
- 미디어 기능은 후순위 (저장소 결정 후)

---

## 📊 현재 달성도 (2026-02-18)

| 앱 | 달성도 | 변화 | 남은 것 |
|----|--------|------|---------|
| 애플 메모 | **98%** | - | 미디어만 |
| 옵시디언 | **95%** | +3% | 플러그인 시스템 |
| 노션 | **77%** | - | 실시간 협업 |

---

## 📁 주요 변경 파일

### 옵시디언 Phase 3 (2026-02-18)
- `components/LocalGraph.tsx`
- `components/OutgoingLinksPanel.tsx`
- `app/api/notes/[id]/graph/route.ts`
- `app/api/notes/[id]/outgoing/route.ts`
- `lib/hooks/useNotes.ts` (useLocalGraph, useOutgoingLinks)
- `app/notes/page.tsx`

### 에디터
- `components/NoteEditor.tsx`
- `components/NoteEditorAdvanced.tsx`
- `lib/tiptap-extensions/Callout.ts`
- `lib/tiptap-extensions/ToggleBlock.ts`

### 공통 UX
- `components/ShortcutManager.tsx` (Cmd+N)
- `components/OfflineBanner.tsx`
- `lib/hooks/useOnlineStatus.ts`
- `app/offline/page.tsx`
- `next.config.ts` (next-pwa)

### 애플 메모
- `components/NoteGallery.tsx`
- `components/NoteLockDialog.tsx`
- `app/api/notes/[id]/lock/route.ts`
- `prisma/schema.prisma` (isLocked, lockHash)

---

## 🔜 다음 작업 로드맵

```
✅ Phase 3: Local Graph + Outgoing Links 완료 (옵시디언 95%)
현재 → Phase 4: lint 13 errors 정리
     → Phase 5: 미디어 (저장소 결정 후)
     → 노션 실시간 협업 (별도 큰 프로젝트)
```

---

## ⚠️ 주의사항

- **빌드**: `npm run build` (webpack 모드)
- **lint**: 13 errors / 27 warnings 잔여 (Phase 3 후 정리)
- **DB**: 노트 잠금 필드 추가됨 (isLocked, lockHash)

---

## 핵심 철학 (항상 기억)

```
1. AI는 재료만 제공, 결론 금지
2. 자동 저장 금지, 사용자 확정 필수
3. 답이 아닌 질문/방향으로 제시
4. 사용자 요청 시에만 작동
```

---

**Status**: Phase 3 완료 ✅ → Phase 4 대기 (lint 정리)
