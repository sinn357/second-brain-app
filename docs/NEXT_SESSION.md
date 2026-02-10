# Next Session Guide

**업데이트**: 2026-02-10
**목적**: 다음 세션에서 바로 작업 가능한 가이드

---

## ✅ 2026-02-10 완료된 작업

### AI 기능 설계 완료
- 개별 노트 AI 7개 기능 정의 (Summarize, Expand, Clarify, Structure, TagSuggest, Question, Action)
- 노트 연결 AI 4개 기능 정의 (Connect, Contrast, Combine, Bridge)
- 네트워크 AI 9개 기능 정의 (Auto-Link, Semantic Search, Ask My Brain, Synthesis, Resurface, Random Spark, Knowledge Gap, Incubation, Time Capsule)

### 문서 생성
- `AI_FEATURES_SPEC.md` - 전체 AI 기능 명세
- `AI_INDIVIDUAL_NOTE_TASKS.md` - Codex용 개별 노트 AI 작업 명세서

---

## ▶ 다음 세션 작업 (우선순위)

### 1. Codex: 개별 노트 AI 구현
```
참고: docs/AI_INDIVIDUAL_NOTE_TASKS.md
```

Task 순서:
1. AI 서비스 기반 구축 (types, prompts, service)
2. API 엔드포인트 구현
3. React Hook 구현
4. AI 결과 패널 UI
5. AI 메뉴 컴포넌트
6. 노트 에디터 통합
7. 통합 테스트

### 2. Connect 저장 보완
- 빈 노트 → AI 콘텐츠 채우기
- 출력 구조: 연결된 노트, 공통점, 차이점, 연결 이유, 결합 아이디어, 탐구 질문, 내 생각

### 3. Auto-Link 설계/구현
- 노트 저장 시 자동 분석
- 링크 제안 배지
- 사용자 승인 후 링크 생성

---

## 📁 AI 관련 문서

| 문서 | 내용 |
|------|------|
| `AI_THINKING_DESIGN.md` | 철학 + 설계 원칙 |
| `AI_THINKING_PHASE1_TASKS.md` | Connect 구현 명세 (완료) |
| `AI_FEATURES_SPEC.md` | 전체 AI 기능 명세 (NEW) |
| `AI_INDIVIDUAL_NOTE_TASKS.md` | 개별 노트 AI 작업 명세 (NEW) |

---

## ⚠️ 보류 상태

- 모바일 앱스토어 등록 (잠정 보류)
- Thinking 저장 시 새 노트 본문 비어있음 (개선 예정)

---

## 핵심 철학 (항상 기억)

```
1. AI는 재료만 제공, 결론 금지
2. 자동 저장 금지, 사용자 확정 필수
3. 답이 아닌 질문/방향으로 제시
4. 사용자 요청 시에만 작동
```

---

**Status**: AI 기능 설계 완료, Codex 작업 대기
