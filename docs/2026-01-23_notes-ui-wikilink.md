# 2026-01-23 Notes + Wiki Link 정리

## 목표
- 위키링크 클릭/생성 동작 안정화
- 그래프 뷰 링크 누락 및 잔여 노드 정리
- 폴더/노트/에디터 레이아웃 개선 및 접기 지원
- 노트 리스트 미리보기/타임스탬프 정렬 개선

## 변경 사항 요약

### Wiki Link & Graph
- `[[...]]` 클릭 시 기존 노트 이동 또는 새 노트 생성
- 동일 제목 다중 노트 선택 다이얼로그 추가
- 링크 파싱/그래프 연결 동기화 보강

### Notes UX
- 노트 리스트 미리보기 1줄로 축소
- 타임스탬프를 제목 라인 우측에 정렬
- 에디터 외곽 박스 제거로 텍스트 에리어 강조

### Layout & Navigation
- 폴더/노트 목록 접기 기능 추가 (데스크톱)
- 전체 보기용 `folderId=all` 지원
- 사이드바 다크모드 배경 일관화

### Folder Tree & DnD
- 전체 폴더(가상) 표시 및 노트 수 카운트
- 드래그 영역을 폴더 행 전체로 확장
- 최상위 드롭존 추가

## 주요 파일
- `app/notes/page.tsx`
- `components/NoteEditorAdvanced.tsx`
- `components/NoteList.tsx`
- `components/SwipeableNoteItem.tsx`
- `components/FolderTree.tsx`
- `components/SidebarNav.tsx`
- `app/globals.css`

## 커밋
- `39b7336` fix: refine notes layout and folder controls
- `6d8eb78` fix: polish notes layout and wikilink flows
- `934a0d3` fix: resolve wikilink click fallback
- `2f1c28e` fix: unescape bracket wikilinks
- `52192c6` fix: normalize wikilink escapes and capture clicks
- `99c2b7d` fix: stabilize wikilink UX and folder counts
- `4d83917` fix: prevent stale autosave and normalize wikilinks
- `062b527` fix: remove invalid suggestion allow hook
- `e9e12fd` fix: stabilize wiki links and folder counts
- `fe5d5fa` fix: ensure wiki link clicks open notes
- `3df0aab` feat: show missing wiki links in graph
- `7a4b489` fix: constrain shortcut dialog height
- `49be989` feat: unify note title and add shortcut help
- `8dda388` feat: add collapsible sidebar and fluid notes layout
- `1c6ce0a` fix: remove unsupported draggable transition
- `60cb80b` chore: add prisma migration baseline
- `41d298c` feat: add default folder, pinning, and drag-and-drop
- `3f64842` feat: add folder context menu and inline rename
- `92cfebb` feat: switch to sidebar nav and manage folders in notes
- `566d4e9` fix: avoid autosave when title is empty
- `abb11b8` fix: stabilize editor hooks and extensions

## 남은 이슈
- 최상위 폴더 정책(전체 + 메모만 유지) 추가 정리 여부 확인 필요
- 폴더 DnD UX 추가 튜닝 필요 시 반영
