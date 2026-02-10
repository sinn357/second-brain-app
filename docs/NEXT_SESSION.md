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

## ✅ 2026-02-10 구현 완료

### 개별 노트 AI 구현 완료
- AI 서비스 레이어 + API + React Hook
- 결과 패널 UI + AI 메뉴 + 노트 에디터 통합

### 노트 연결 AI 구현 완료
- Connect / Contrast / Combine / Bridge
- 저장 시 결과 노트 생성 및 폴더 유지

### 네트워크 AI 구현 완료 (1~9)
- Auto-Link (제안/승인)
- Semantic Search (Advanced + 아이콘)
- Ask My Brain
- Synthesis
- Resurface
- Random Spark
- Knowledge Gap
- Incubation (DB 저장)
- Time Capsule

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
- 접근성 경고: DialogContent aria warning (추후 정리)

---

## 핵심 철학 (항상 기억)

```
1. AI는 재료만 제공, 결론 금지
2. 자동 저장 금지, 사용자 확정 필수
3. 답이 아닌 질문/방향으로 제시
4. 사용자 요청 시에만 작동
```

---

**Status**: AI 기능 구현 완료, 안정화/UX 개선 단계
