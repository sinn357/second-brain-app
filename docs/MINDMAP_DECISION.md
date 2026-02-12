# Mindmap 기능 결정

> **결정**: Mindmap 페이지 삭제, Graph View에 레이아웃 토글 통합
> **작성일**: 2026-02-12
> **실행**: Codex (X)

---

## 배경

### 현재 상태

| 페이지 | 역할 |
|--------|------|
| Graph View | Force-directed 네트워크로 전체 노트 연결 시각화 |
| Mindmap | Tree 레이아웃으로 선택한 노트 중심 시각화 |

### 문제점

1. **중복**: 둘 다 같은 데이터(useGraph)를 다른 레이아웃으로 보여줌
2. **Mindmap 기능 부족**: Graph View 대비 필터링, 색상, 줌 등 모두 없음
3. **차별화 실패**: "마인드맵"이라는 이름과 맞지 않음

---

## 분석: Mind Map vs Knowledge Graph

### 근본적 차이

| 구분 | Mind Map | Knowledge Graph |
|------|----------|-----------------|
| **구조** | 중심 → 가지 (계층) | Any-to-any (네트워크) |
| **시작점** | 빈 캔버스 + 중심 아이디어 | 기존 데이터 |
| **목적** | 생각을 **만들기** (창작) | 있는 것을 **보기** (탐색) |
| **데이터** | 없어도 됨 (새로 만듦) | 있어야 함 (기존 노트) |

### 마인드맵의 고유 특성

```
"빈 캔버스에서 새로운 아이디어를 구조화한다"
```

이것이 Graph View가 가질 수 없는 특성.

### Second Brain 맥락

- 현재 Second Brain은 **노트 기반**
- 노트가 있어야 그래프가 있음
- 현재 Mindmap은 "기존 노트를 트리로 보여주기"일 뿐
- → Graph View에 통합 가능

---

## 결정

### 삭제 대상

- `app/mindmap/page.tsx`
- 관련 네비게이션 링크

### Graph View 개선

| 기능 | 설명 |
|------|------|
| 레이아웃 토글 | [Network] / [Tree] 버튼 |
| Tree 모드 | 선택한 노트를 root로 트리 표시 |
| 깊이 제한 | Tree 모드에서 1~5 깊이 설정 |
| Root 선택 | 드롭다운 또는 노드 클릭 |

### 구현 상세

```tsx
// Graph View에 추가할 상태
const [layout, setLayout] = useState<'network' | 'tree'>('network')
const [rootId, setRootId] = useState<string | null>(null)
const [depthLimit, setDepthLimit] = useState(3)

// Tree 모드 선택 시
// - 기존 force simulation 대신 d3.tree() 사용
// - Mindmap 코드의 트리 로직 재사용
```

### UI 변경

```
Graph View 툴바
├── [Network] [Tree] 토글 버튼
├── Tree 선택 시:
│   ├── Root 노트 선택 드롭다운
│   └── Depth 슬라이더 (1~5)
└── 기존 필터들 (폴더, 고립 노드 등)
```

---

## 후순위: 진짜 브레인스토밍 기능

향후 Canvas 기능으로 구현 가능:

| 기능 | 설명 |
|------|------|
| 빈 캔버스 | 노트 없이 시작 |
| 자유 노드 생성 | 클릭해서 아이디어 추가 |
| 연결선 그리기 | 드래그로 관계 설정 |
| 노트로 변환 | 완성된 구조를 노트들로 저장 |

**우선순위**: Phase 5 이후 검토

---

## 참고 자료

- [Concept Map vs Mind Map vs Knowledge Graph - Gloow](https://gloow.io/blog/concept-map-vs-mind-map-vs-knowledge-graph)
- [Knowledge Graphs vs Mind Maps - Restackio](https://www.restack.io/p/knowledge-graphs-answer-knowledge-graph-vs-mind-map-cat-ai)

---

**Last Updated**: 2026-02-12
**Owner**: CEO + Arch (Claude)
**Executor**: X (Codex)
