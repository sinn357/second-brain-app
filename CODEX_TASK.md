# Codex(X) 작업 지시서

> **작성일**: 2026-02-18
> **작성자**: Arch (Claude)
> **상태**: 즉시 실행

---

## 📋 할 일

**Phase 4: lint 정리**

13 errors / 27 warnings → 0 errors / 최소 warnings

---

## 🎯 Error 수정 (13개)

### 1. PropertyPanel.tsx (3 errors)
`@typescript-eslint/no-explicit-any`

```tsx
// 19:12, 43:63, 57:38
// any → 구체적 타입으로 변경

// 예시: Property 타입 정의
interface PropertyValue {
  type: 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'checkbox'
  value: string | number | Date | string[] | boolean
}
```

### 2. TableView.tsx (5 errors)
`@typescript-eslint/no-explicit-any`

```tsx
// 9:11, 22:28, 24:31, 24:56, 29:39
// Property 관련 any → 구체적 타입으로 변경
```

### 3. ShortcutHelpButton.tsx (1 error)
`react-hooks/set-state-in-effect`

```tsx
// 40:5 - useEffect 내 직접 setState 호출
// 해결: 초기값으로 설정하거나 useMemo 사용

// Before
const [isMac, setIsMac] = useState(false)
useEffect(() => {
  setIsMac(navigator.platform.includes('Mac'))
}, [])

// After (옵션 1: 초기값에서 판단)
const [isMac] = useState(() =>
  typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
)

// After (옵션 2: useMemo)
const isMac = useMemo(() =>
  typeof navigator !== 'undefined' && navigator.platform.includes('Mac'),
  []
)
```

### 4. SearchHighlight.tsx (2 errors)
`react-hooks/error-boundaries`, `react-hooks/missing-return-value`

```tsx
// 69:5 - try/catch 내 JSX 구성 금지
// 해결: try/catch를 데이터 처리에만 사용, JSX는 외부에서 구성

// Before
try {
  return <span>{/* JSX */}</span>
} catch (error) {
  return <span>{text}</span>
}

// After
let segments: Array<{text: string, highlight: boolean}> = []
try {
  // 데이터 처리만
  segments = computeHighlightSegments(text, query)
} catch {
  segments = [{text, highlight: false}]
}
return <span>{segments.map(...)}</span>
```

### 5. lib/thinking/commands.ts (1 error)
`@typescript-eslint/no-explicit-any`

```tsx
// 251:43
// any → 구체적 타입으로 변경
```

---

## ⚠️ Warning 수정 (27개) - 선택적

우선순위 높은 것만 처리:

### 높음 (수정 권장)
- **unused vars** (8개): 사용하지 않는 import/변수 제거
  - `Card`, `Button` in PropertyPanel.tsx
  - `error` in 여러 파일
  - `Suggestion`, `SuggestionProps` in WikiLinkSuggestion.ts
  - `useCallback` in usePresence.ts
  - `get` in shortcutStore.ts
  - `pendingValue` in useDebounce.ts

### 중간 (시간 여유 시)
- **exhaustive-deps** (10개): 의도적 생략이면 `// eslint-disable-next-line` 추가

### 낮음 (무시 가능)
- **folders logical expression** (6개): 복잡한 리팩토링 필요
- **incompatible-library** (1개): TanStack Virtual 관련, 무시 가능

---

## 📁 수정 파일 목록

| 파일 | Errors | Warnings |
|------|--------|----------|
| `components/PropertyPanel.tsx` | 3 | 2 |
| `components/TableView.tsx` | 5 | 0 |
| `components/ShortcutHelpButton.tsx` | 1 | 0 |
| `components/SearchHighlight.tsx` | 2 | 1 |
| `lib/thinking/commands.ts` | 1 | 1 |

---

## ⚠️ 주의사항

1. **타입 정의**: Property 관련 타입이 여러 파일에서 사용됨 → `lib/types/property.ts` 생성 고려
2. **기능 유지**: lint 수정으로 기능이 깨지지 않도록 주의
3. **빌드 테스트**: `npm run build` 확인
4. **lint 재확인**: `npm run lint` 0 errors 확인

---

## 🛠️ 시작 명령어

```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/second-brain-app
npm run lint
```

---

## ✅ 완료 보고 형식

```markdown
✅ Phase 4 완료

**수정 내역**:
- Errors: 13 → 0
- Warnings: 27 → N

**수정된 파일**:
- path/to/file.ts

**테스트 결과**:
- npm run lint: 통과
- npm run build: 통과
```

---

**시작하세요! 🚀**
