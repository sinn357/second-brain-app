# 속성 필터 강화 구현 문서

**구현 날짜**: 2025-12-31
**구현자**: Claude + Codex 협업
**ROADMAP Phase**: Phase 3 - 노션 Core 강화

---

## 📋 구현 개요

노션 스타일의 강력한 속성 필터 시스템 구현:
- 다중 속성 필터 (AND/OR 조건)
- 저장된 뷰 (Saved Views)
- 실시간 필터 적용

---

## 🎯 구현된 기능

### 1. 속성 필터링
- **지원 속성 타입**: Select, Multi-Select, Date, Checkbox
- **연산자**:
  - Select: `equals` (같음)
  - Multi-Select: `contains` (포함)
  - Date: `before` (이전), `after` (이후)
  - Checkbox: `is_checked` (체크됨), `is_not_checked` (체크 안 됨)

### 2. AND/OR 조건
- 여러 필터 조건을 AND 또는 OR로 결합
- 동적 쿼리 빌더로 Prisma 쿼리 생성
- 조건 개수 제한 없음

### 3. 저장된 뷰 (Saved Views)
- 현재 필터 조합 저장 (이름 + 설명)
- 저장된 뷰 목록 조회
- 뷰 불러오기 (원클릭)
- 뷰 삭제

### 4. 실시간 필터 적용
- 필터 추가/제거 시 즉시 노트 목록 업데이트
- Table View / List View 동시 지원
- 필터 결과 카운트 표시

---

## 🏗️ 아키텍처

### DB 스키마

```prisma
model SavedView {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(200)
  description String?  @db.VarChar(500)
  filters     Json     // { operator: 'AND' | 'OR', conditions: [...] }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("saved_views")
}
```

### 필터 데이터 구조

```typescript
interface FilterCondition {
  propertyId: string
  operator: 'equals' | 'contains' | 'before' | 'after' | 'is_checked' | 'is_not_checked'
  value: any
}

interface FilterGroup {
  operator: 'AND' | 'OR'
  conditions: FilterCondition[]
}
```

---

## 📁 파일 구조

### Backend

```
lib/
├── filterEngine.ts              # 필터 쿼리 빌더 엔진
├── stores/
│   └── filterStore.ts           # Zustand 필터 상태 관리
├── hooks/
│   └── useFilters.ts            # 필터 & SavedView hooks
└── validations/
    ├── filter.ts                # 필터 Zod 스키마 (Codex)
    └── savedView.ts             # SavedView Zod 스키마 (Codex)

app/api/
├── notes/filter/
│   └── route.ts                 # POST /api/notes/filter
└── saved-views/
    ├── route.ts                 # GET/POST /api/saved-views
    └── [id]/route.ts            # GET/PATCH/DELETE /api/saved-views/[id]
```

### Frontend

```
components/
├── FilterBuilder.tsx            # 핵심 필터 UI (Claude + Codex 통합)
├── PropertyFilterItem.tsx       # 개별 필터 아이템 (Codex)
├── FilterConditionToggle.tsx    # AND/OR 토글 (Codex)
├── SavedViewDialog.tsx          # 뷰 저장 다이얼로그 (Codex)
├── SavedViewButton.tsx          # 저장된 뷰 버튼 (Codex)
├── TableView.tsx                # 필터 적용된 테이블 뷰
└── ListView.tsx                 # 필터 적용된 리스트 뷰

app/db/page.tsx                  # Database 페이지 (필터 UI 통합)
```

---

## 🔧 핵심 로직

### 1. 필터 쿼리 빌더 (`lib/filterEngine.ts`)

```typescript
export function buildFilterQuery(filters: FilterGroup): Prisma.NoteWhereInput {
  const conditions = filters.conditions.map(buildConditionQuery)

  if (filters.operator === 'AND') {
    return { AND: conditions }
  } else {
    return { OR: conditions }
  }
}
```

### 2. 필터 상태 관리 (`lib/stores/filterStore.ts`)

```typescript
export const useFilterStore = create<FilterState>((set, get) => ({
  activeFilters: { operator: 'AND', conditions: [] },
  addCondition: (condition) => { /* ... */ },
  removeCondition: (index) => { /* ... */ },
  setOperator: (operator) => { /* ... */ },
  resetFilters: () => { /* ... */ },
}))
```

### 3. 필터 적용 (`lib/hooks/useFilters.ts`)

```typescript
export function useFilteredNotes(filters: FilterGroup | null) {
  return useQuery({
    queryKey: ['notes', 'filtered', filters],
    queryFn: async () => {
      if (!filters || filters.conditions.length === 0) {
        return getAllNotes()
      }
      return fetchFilteredNotes(filters)
    },
  })
}
```

---

## 🎨 UI 구성

### FilterBuilder 컴포넌트 구조

```
FilterBuilder
├── Header (필터 아이콘 + 저장/초기화 버튼)
├── FilterConditionToggle (AND/OR 토글)
├── PropertyFilterItem[] (현재 필터 조건들)
├── 필터 추가 버튼
└── SavedViewButton[] (저장된 뷰 목록)
```

### PropertyFilterItem 컴포넌트

```
[속성 선택] [연산자 선택] [값 입력] [X 삭제]
```

- 속성 선택 시 자동으로 적절한 연산자 제공
- 연산자에 따라 값 입력 필드 동적 변경
- Checkbox 연산자는 값 입력 불필요

---

## 🧪 테스트 방법

### 1. 기본 필터 테스트

```bash
npm run dev
```

1. `/db` 페이지 접속
2. "필터 조건 추가" 클릭
3. 속성, 연산자, 값 선택
4. 필터 결과 확인

### 2. AND/OR 조건 테스트

1. 여러 필터 조건 추가
2. AND/OR 토글 클릭
3. 필터 결과 변화 확인

### 3. SavedView 테스트

1. 필터 조건 설정
2. "저장" 버튼 클릭
3. 뷰 이름/설명 입력
4. 저장된 뷰 목록에서 불러오기
5. 뷰 삭제 테스트

---

## 📊 Claude + Codex 협업 내역

### Claude 담당 (복잡한 설계 & 핵심 로직)
- Prisma SavedView 모델 설계
- 필터 쿼리 엔진 (`filterEngine.ts`)
- API 엔드포인트 구현 (filter, saved-views)
- Zustand 상태 관리 store
- FilterBuilder 핵심 로직 & 통합

### Codex 담당 (반복 작업 & 보조 UI)
- Zod validation 스키마 (`filter.ts`, `savedView.ts`)
- UI 보조 컴포넌트 4개:
  - `PropertyFilterItem.tsx`
  - `FilterConditionToggle.tsx`
  - `SavedViewDialog.tsx`
  - `SavedViewButton.tsx`

### 통합
- FilterBuilder를 Codex 컴포넌트로 리팩토링
- 모듈화된 컴포넌트 구조로 개선
- 타입 에러 해결 및 빌드 성공

---

## 🚀 향후 개선 사항

### 단기 (다음 버전)
- [ ] 필터 프리셋 (자주 사용하는 필터 조합)
- [ ] 필터 복사/붙여넣기
- [ ] 필터 히스토리 (최근 사용한 필터)

### 중기 (Phase 4)
- [ ] 고급 검색과 필터 통합
- [ ] 정규식 필터 지원
- [ ] 필터 템플릿 공유 기능

### 장기 (Phase 5)
- [ ] AI 기반 스마트 필터 추천
- [ ] 필터 성능 최적화 (인덱싱)
- [ ] 필터 시각화 (차트)

---

## 📝 알려진 제약사항

1. **Prisma JSON 필터 제약**
   - `array_contains`가 일부 Prisma 버전에서 지원 안 될 수 있음
   - 대안: `path` 쿼리 사용

2. **필터 복잡도**
   - 중첩 AND/OR (예: `(A AND B) OR (C AND D)`) 미지원
   - 현재는 단일 레벨 AND/OR만 지원

3. **성능**
   - 필터 조건이 많을수록 쿼리 속도 저하 가능
   - 향후 DB 인덱싱 최적화 필요

---

## 🔗 관련 문서

- ROADMAP.md - Phase 3 진행 상황
- CHANGELOG.md - 변경 내역
- CLAUDE.md - Claude 작업 프로토콜
- AI_WORKFLOW.md - Claude + Codex 협업 전략

---

**Last Updated**: 2025-12-31
**Status**: ✅ 완료 (빌드 성공, 기능 구현 완료)
