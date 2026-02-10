# Codex(X) 작업 지시서

> **작성일**: 2026-02-10
> **작성자**: Arch (Claude)
> **상태**: 즉시 실행

---

## 📋 할 일

**개별 노트 AI 기능 구현 (Phase 2)**

7개 AI 명령 (Summarize, Expand, Clarify, Structure, TagSuggest, Question, Action)을 노트 에디터에서 사용할 수 있도록 구현

---

## 📖 읽어야 할 문서 (순서대로)

```
1. docs/AI_THINKING_DESIGN.md        ← 철학/원칙 (필수)
2. docs/AI_FEATURES_SPEC.md          ← 전체 기능 명세 (Part A 집중)
3. docs/AI_INDIVIDUAL_NOTE_TASKS.md  ← 작업 명세서 (이대로 구현)
```

---

## 🎯 구현할 Task (순서대로)

| Task | 내용 | 파일 |
|------|------|------|
| 1 | AI 서비스 기반 구축 | `lib/ai/types.ts`, `lib/ai/prompts.ts`, `lib/ai/service.ts` |
| 2 | API 엔드포인트 | `app/api/ai/note/route.ts` |
| 3 | React Hook | `lib/hooks/useNoteAI.ts` |
| 4 | AI 결과 패널 UI | `components/AIResultPanel.tsx` |
| 5 | AI 메뉴 컴포넌트 | `components/AICommandMenu.tsx` |
| 6 | 노트 에디터 통합 | `app/notes/[id]/page.tsx` 수정 |
| 7 | 통합 테스트 | 빌드 + 기능 테스트 |

---

## ⚠️ 핵심 원칙 (구현 시 항상 기억)

```
1. AI는 재료만 제공, 결론 금지
2. 자동 저장 금지, 사용자 확정 필수
3. 모든 출력은 "임시" 상태 (점선 테두리)
4. 사용자 요청 시에만 작동
5. 답이 아닌 질문/방향으로 제시
```

---

## 🛠️ 시작 명령어

```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/second-brain-app
npm run dev
```

---

## ✅ 완료 보고 형식

각 Task 완료 시:

```markdown
✅ Task N 완료

**작업 내용**:
- [수행한 작업]

**생성/수정된 파일**:
- path/to/file.ts

**테스트 결과**:
- [테스트 항목]: 통과/실패

**이슈**:
- (있으면 기록)
```

---

## 📍 참고

- 상세 코드는 `docs/AI_INDIVIDUAL_NOTE_TASKS.md`에 모두 있음
- 그대로 복사해서 사용 가능
- 의문 있으면 Arch에게 질문

---

**시작하세요!**
