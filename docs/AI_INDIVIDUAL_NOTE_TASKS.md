# 개별 노트 AI 기능 - Codex 작업 명세서

> **목적**: Codex(X)가 독립적으로 구현할 수 있는 상세 태스크 목록
> **참조**: `docs/AI_FEATURES_SPEC.md` (전체 설계 문서)
> **우선순위**: Summarize → Expand → Tag Suggest → Structure

---

## 개요

### 핵심 철학 (구현 시 항상 기억)

```
1. AI는 재료만 제공, 결론 금지
2. 자동 저장 금지, 사용자 확정 필수
3. 모든 출력은 "임시" 상태 (점선 테두리)
4. 사용자 요청 시에만 작동
5. 답이 아닌 질문/방향으로 제시
```

### 기술 스택

- Next.js 15 (App Router)
- TypeScript
- Prisma + PostgreSQL (Neon)
- OpenAI API (gpt-4o-mini)
- TanStack Query
- Tiptap Editor

---

## Task 1: AI 서비스 기반 구축

### 목표
개별 노트 AI 기능들이 공통으로 사용할 서비스 레이어 구축

### 파일 생성

#### 1.1 개별 노트 AI 타입 정의

**파일**: `lib/ai/types.ts`

```typescript
// lib/ai/types.ts

// ============ 공통 타입 ============

export type AICommand =
  | 'summarize'
  | 'expand'
  | 'clarify'
  | 'structure'
  | 'tagSuggest'
  | 'question'
  | 'action';

export interface AIRequest {
  noteId: string;
  command: AICommand;
  content: string;  // 노트 본문
  title: string;    // 노트 제목
}

export interface AIResponse {
  command: AICommand;
  result: string;   // 마크다운 형식
  isDraft: true;    // 항상 true
  createdAt: string;
}

// ============ 명령별 결과 타입 ============

export interface SummarizeResult {
  summary: string[];      // 핵심 포인트 3-5개
  keywords: string[];     // 키워드 3-5개
}

export interface ExpandResult {
  deepDive: string[];     // 깊이 파기 질문
  broaden: string[];      // 넓히기 질문
  connect: string[];      // 연결하기 질문
}

export interface ClarifyResult {
  ambiguous: Array<{
    quote: string;
    question: string;
  }>;
  missing: string[];
  questions: string[];
}

export interface StructureResult {
  currentStructure: Array<{
    level: number;
    content: string;
  }>;
  suggestedStructure: Array<{
    level: number;
    content: string;
  }>;
  keyVariables: string[];
  redundancies: string[];
}

export interface TagSuggestResult {
  topicTags: string[];
  typeTags: string[];
  statusTags: string[];
}

export interface QuestionResult {
  unanswered: string[];
  deeper: string[];
  actionable: string[];
}

export interface ActionResult {
  explore: string[];
  research: string[];
  connect: string[];
}
```

#### 1.2 AI 프롬프트 템플릿

**파일**: `lib/ai/prompts.ts`

```typescript
// lib/ai/prompts.ts

export const SYSTEM_PROMPT = `당신은 Second Brain 앱의 AI 어시스턴트입니다.

핵심 원칙:
1. 재료만 제공하고 결론은 내리지 않습니다
2. 답이 아닌 질문과 방향을 제시합니다
3. 옳고 그름을 평가하지 않습니다
4. 짧고 명확하게 응답합니다
5. 한국어로 응답합니다

당신의 역할은 사용자가 스스로 생각할 수 있도록 재료를 제공하는 것입니다.`;

export const PROMPTS = {
  summarize: `다음 노트의 핵심을 추출해주세요.

노트 제목: {{title}}
노트 내용:
{{content}}

다음 형식으로 응답해주세요 (JSON):
{
  "summary": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "keywords": ["키워드1", "키워드2", "키워드3"]
}

규칙:
- 핵심 포인트는 3-5개
- 키워드는 3-5개
- 원문의 의미를 보존
- 평가나 판단 금지`,

  expand: `다음 노트에서 확장할 수 있는 방향을 제안해주세요.

노트 제목: {{title}}
노트 내용:
{{content}}

다음 형식으로 응답해주세요 (JSON):
{
  "deepDive": ["깊이 탐구 질문 1?", "깊이 탐구 질문 2?"],
  "broaden": ["다른 분야 적용 질문?", "반대 관점 질문?"],
  "connect": ["연결 가능한 개념?", "실제 사례?"]
}

규칙:
- 모든 항목은 질문 형태 (? 로 끝남)
- 답을 제시하지 말 것
- 각 카테고리 2-3개`,

  clarify: `다음 노트에서 명확화가 필요한 부분을 찾아주세요.

노트 제목: {{title}}
노트 내용:
{{content}}

다음 형식으로 응답해주세요 (JSON):
{
  "ambiguous": [
    {"quote": "모호한 부분 인용", "question": "구체적으로 무엇을 의미하는가?"}
  ],
  "missing": ["빠진 것 같은 부분"],
  "questions": ["명확화 질문"]
}

규칙:
- 비판이 아닌 질문으로 제시
- 개선 방향 유도
- 각 항목 2-3개`,

  structure: `다음 노트의 구조를 분석하고 정리 제안을 해주세요.

노트 제목: {{title}}
노트 내용:
{{content}}

다음 형식으로 응답해주세요 (JSON):
{
  "currentStructure": [
    {"level": 1, "content": "현재 섹션 1"},
    {"level": 2, "content": "하위 항목"}
  ],
  "suggestedStructure": [
    {"level": 1, "content": "제안 섹션 1"},
    {"level": 2, "content": "하위 항목"}
  ],
  "keyVariables": ["핵심 변수 1", "핵심 변수 2"],
  "redundancies": ["중복된 부분 설명"]
}

규칙:
- 내용 삭제 제안 금지
- 구조만 정리
- level은 1-3`,

  tagSuggest: `다음 노트에 적절한 태그를 제안해주세요.

노트 제목: {{title}}
노트 내용:
{{content}}

다음 형식으로 응답해주세요 (JSON):
{
  "topicTags": ["#주제태그1", "#주제태그2"],
  "typeTags": ["#아이디어", "#질문", "#프로젝트"],
  "statusTags": ["#진행중", "#검토필요"]
}

규칙:
- 각 카테고리 2-3개
- # 포함
- 기존 태그 스타일과 일관성 유지`,

  question: `다음 노트에서 답해야 할 질문을 도출해주세요.

노트 제목: {{title}}
노트 내용:
{{content}}

다음 형식으로 응답해주세요 (JSON):
{
  "unanswered": ["아직 답하지 않은 질문?"],
  "deeper": ["더 깊이 파고들 질문?"],
  "actionable": ["실행 관련 질문?"]
}

규칙:
- 모든 항목은 질문 형태
- 답 제시 금지
- 각 카테고리 2-3개`,

  action: `다음 노트에서 고려할 수 있는 다음 단계를 제안해주세요.

노트 제목: {{title}}
노트 내용:
{{content}}

다음 형식으로 응답해주세요 (JSON):
{
  "explore": ["탐구 방향 1?", "탐구 방향 2?"],
  "research": ["추가 조사 항목 1?", "추가 조사 항목 2?"],
  "connect": ["연결할 노트/자료"]
}

규칙:
- "해야 한다" 형태 금지
- 질문 형태로 제안
- 선택은 사용자의 몫임을 인지
- 각 카테고리 2-3개`,
};
```

#### 1.3 AI 서비스

**파일**: `lib/ai/service.ts`

```typescript
// lib/ai/service.ts

import { openai } from '@/lib/openai';
import { SYSTEM_PROMPT, PROMPTS } from './prompts';
import type { AICommand, AIRequest, AIResponse } from './types';

export async function executeAICommand(request: AIRequest): Promise<AIResponse> {
  const { command, content, title } = request;

  const promptTemplate = PROMPTS[command];
  if (!promptTemplate) {
    throw new Error(`Unknown command: ${command}`);
  }

  const prompt = promptTemplate
    .replace('{{title}}', title)
    .replace('{{content}}', content.slice(0, 3000)); // 토큰 제한

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const resultJson = response.choices[0]?.message?.content;
    if (!resultJson) {
      throw new Error('AI 응답 없음');
    }

    const parsed = JSON.parse(resultJson);
    const markdown = formatResultToMarkdown(command, parsed);

    return {
      command,
      result: markdown,
      isDraft: true,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`AI ${command} error:`, error);
    throw error;
  }
}

function formatResultToMarkdown(command: AICommand, data: any): string {
  switch (command) {
    case 'summarize':
      return `## 핵심 요약\n${data.summary.map((s: string) => `- ${s}`).join('\n')}\n\n## 키워드\n${data.keywords.map((k: string) => `#${k.replace('#', '')}`).join(' ')}`;

    case 'expand':
      return `## 확장 가능한 방향\n\n### 깊이 파기\n${data.deepDive.map((q: string) => `- ${q}`).join('\n')}\n\n### 넓히기\n${data.broaden.map((q: string) => `- ${q}`).join('\n')}\n\n### 연결하기\n${data.connect.map((q: string) => `- ${q}`).join('\n')}`;

    case 'clarify':
      let clarifyMd = '## 명확화 필요 지점\n\n### 모호한 부분\n';
      clarifyMd += data.ambiguous.map((a: any) => `- "${a.quote}" — ${a.question}`).join('\n');
      clarifyMd += '\n\n### 빠진 것 같은 부분\n';
      clarifyMd += data.missing.map((m: string) => `- ${m}`).join('\n');
      clarifyMd += '\n\n### 명확화 질문\n';
      clarifyMd += data.questions.map((q: string) => `- ${q}`).join('\n');
      return clarifyMd;

    case 'structure':
      let structMd = '## 구조 제안\n\n### 현재 구조\n';
      structMd += data.currentStructure.map((s: any) => `${'  '.repeat(s.level - 1)}${s.level}. ${s.content}`).join('\n');
      structMd += '\n\n### 제안 구조\n';
      structMd += data.suggestedStructure.map((s: any) => `${'  '.repeat(s.level - 1)}${s.level}. ${s.content}`).join('\n');
      structMd += '\n\n### 핵심 변수\n';
      structMd += data.keyVariables.map((v: string) => `- ${v}`).join('\n');
      if (data.redundancies.length > 0) {
        structMd += '\n\n### 중복/제거 가능\n';
        structMd += data.redundancies.map((r: string) => `- ${r}`).join('\n');
      }
      return structMd;

    case 'tagSuggest':
      return `## 태그 제안\n\n### 주제 태그\n${data.topicTags.join(' ')}\n\n### 유형 태그\n${data.typeTags.join(' ')}\n\n### 상태 태그\n${data.statusTags.join(' ')}`;

    case 'question':
      return `## 이 노트가 던지는 질문\n\n### 아직 답하지 않은 질문\n${data.unanswered.map((q: string) => `- ${q}`).join('\n')}\n\n### 더 깊이 파고들 질문\n${data.deeper.map((q: string) => `- ${q}`).join('\n')}\n\n### 실행 관련 질문\n${data.actionable.map((q: string) => `- ${q}`).join('\n')}`;

    case 'action':
      return `## 고려할 수 있는 다음 단계\n\n### 탐구 방향\n${data.explore.map((a: string) => `- [ ] ${a}`).join('\n')}\n\n### 추가 조사 고려\n${data.research.map((a: string) => `- [ ] ${a}`).join('\n')}\n\n### 연결 가능한 노트/자료\n${data.connect.map((a: string) => `- ${a}`).join('\n')}\n\n※ 이것은 제안일 뿐, 선택은 사용자의 몫`;

    default:
      return JSON.stringify(data, null, 2);
  }
}
```

### 완료 기준
- [ ] `lib/ai/types.ts` 생성됨
- [ ] `lib/ai/prompts.ts` 생성됨
- [ ] `lib/ai/service.ts` 생성됨
- [ ] 타입 에러 없음 (`npx tsc --noEmit`)

---

## Task 2: API 엔드포인트 구현

### 목표
개별 노트 AI 명령을 처리하는 API 엔드포인트 구현

### 파일 생성

**파일**: `app/api/ai/note/route.ts`

```typescript
// app/api/ai/note/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeAICommand } from '@/lib/ai/service';
import type { AICommand } from '@/lib/ai/types';

const VALID_COMMANDS: AICommand[] = [
  'summarize',
  'expand',
  'clarify',
  'structure',
  'tagSuggest',
  'question',
  'action',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteId, command } = body;

    // 유효성 검사
    if (!noteId) {
      return NextResponse.json(
        { error: 'noteId가 필요합니다' },
        { status: 400 }
      );
    }

    if (!command || !VALID_COMMANDS.includes(command)) {
      return NextResponse.json(
        { error: `유효하지 않은 command입니다. 가능한 값: ${VALID_COMMANDS.join(', ')}` },
        { status: 400 }
      );
    }

    // 노트 조회
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, title: true, body: true },
    });

    if (!note) {
      return NextResponse.json(
        { error: '노트를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // AI 명령 실행
    const result = await executeAICommand({
      noteId: note.id,
      command,
      content: note.body,
      title: note.title,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('AI note command error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 테스트 방법

```bash
# Summarize 테스트
curl -X POST http://localhost:3004/api/ai/note \
  -H "Content-Type: application/json" \
  -d '{"noteId": "NOTE_ID_HERE", "command": "summarize"}'

# Expand 테스트
curl -X POST http://localhost:3004/api/ai/note \
  -H "Content-Type: application/json" \
  -d '{"noteId": "NOTE_ID_HERE", "command": "expand"}'
```

### 완료 기준
- [ ] `app/api/ai/note/route.ts` 생성됨
- [ ] 모든 7개 command 처리 가능
- [ ] 에러 핸들링 완료

---

## Task 3: React Hook 구현

### 목표
개별 노트 AI 기능을 사용하기 위한 React Hook

### 파일 생성

**파일**: `lib/hooks/useNoteAI.ts`

```typescript
// lib/hooks/useNoteAI.ts

import { useMutation } from '@tanstack/react-query';
import type { AICommand, AIResponse } from '@/lib/ai/types';

interface UseNoteAIOptions {
  onSuccess?: (data: AIResponse) => void;
  onError?: (error: Error) => void;
}

export function useNoteAI(options?: UseNoteAIOptions) {
  const mutation = useMutation({
    mutationFn: async ({
      noteId,
      command,
    }: {
      noteId: string;
      command: AICommand;
    }): Promise<AIResponse> => {
      const res = await fetch('/api/ai/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, command }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'AI 요청 실패');
      }

      return res.json();
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return {
    execute: mutation.mutate,
    executeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

// 편의 훅들
export function useSummarize(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options);
  return {
    summarize: (noteId: string) => execute({ noteId, command: 'summarize' }),
    ...rest,
  };
}

export function useExpand(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options);
  return {
    expand: (noteId: string) => execute({ noteId, command: 'expand' }),
    ...rest,
  };
}

export function useTagSuggest(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options);
  return {
    suggestTags: (noteId: string) => execute({ noteId, command: 'tagSuggest' }),
    ...rest,
  };
}

export function useStructure(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options);
  return {
    analyzeStructure: (noteId: string) => execute({ noteId, command: 'structure' }),
    ...rest,
  };
}

export function useClarify(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options);
  return {
    clarify: (noteId: string) => execute({ noteId, command: 'clarify' }),
    ...rest,
  };
}

export function useQuestion(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options);
  return {
    generateQuestions: (noteId: string) => execute({ noteId, command: 'question' }),
    ...rest,
  };
}

export function useAction(options?: UseNoteAIOptions) {
  const { execute, ...rest } = useNoteAI(options);
  return {
    suggestActions: (noteId: string) => execute({ noteId, command: 'action' }),
    ...rest,
  };
}
```

### 완료 기준
- [ ] `lib/hooks/useNoteAI.ts` 생성됨
- [ ] 모든 편의 훅 구현됨
- [ ] 타입 에러 없음

---

## Task 4: AI 결과 패널 UI

### 목표
AI 결과를 표시하는 재사용 가능한 패널 컴포넌트

### 파일 생성

**파일**: `components/AIResultPanel.tsx`

```typescript
// components/AIResultPanel.tsx

'use client';

import { useState } from 'react';
import { X, Copy, Check, Save, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIResultPanelProps {
  title: string;
  result: string | null;
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
  onSave?: (content: string) => void;
  onCopy?: (content: string) => void;
}

export function AIResultPanel({
  title,
  result,
  isLoading,
  error,
  onClose,
  onSave,
  onCopy,
}: AIResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result && onCopy) {
      onCopy(result);
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed right-4 top-20 w-96 max-h-[70vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-dashed border-gray-300 dark:border-gray-600 z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {title}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
            임시
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">분석 중...</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm py-4">
            오류가 발생했습니다: {error.message}
          </div>
        )}

        {result && !isLoading && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* 푸터 */}
      {result && !isLoading && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-400">
            ※ 이것은 AI 제안입니다. 저장하지 않으면 사라집니다.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? '복사됨' : '복사'}
            </button>
            {onSave && (
              <button
                onClick={() => onSave(result)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
              >
                <Save className="w-3 h-3" />
                노트에 추가
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 완료 기준
- [ ] `components/AIResultPanel.tsx` 생성됨
- [ ] 점선 테두리로 임시 상태 표현
- [ ] 로딩/에러/결과 상태 모두 처리
- [ ] 복사/저장 기능 동작

---

## Task 5: AI 메뉴 컴포넌트

### 목표
노트 에디터에 AI 기능 메뉴 추가

### 파일 생성

**파일**: `components/AICommandMenu.tsx`

```typescript
// components/AICommandMenu.tsx

'use client';

import { useState } from 'react';
import {
  FileText,
  Rocket,
  Search,
  LayoutList,
  Tag,
  HelpCircle,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';
import type { AICommand } from '@/lib/ai/types';

interface AICommandMenuProps {
  onCommand: (command: AICommand) => void;
  isLoading: boolean;
}

const COMMANDS = [
  { id: 'summarize' as AICommand, label: '요약', icon: FileText, desc: '핵심 포인트 추출' },
  { id: 'expand' as AICommand, label: '확장', icon: Rocket, desc: '아이디어 확장 방향' },
  { id: 'clarify' as AICommand, label: '명확화', icon: Search, desc: '모호한 부분 찾기' },
  { id: 'structure' as AICommand, label: '구조화', icon: LayoutList, desc: '구조 정리 제안' },
  { id: 'tagSuggest' as AICommand, label: '태그', icon: Tag, desc: '태그 자동 제안' },
  { id: 'question' as AICommand, label: '질문', icon: HelpCircle, desc: '탐구 질문 생성' },
  { id: 'action' as AICommand, label: '액션', icon: CheckSquare, desc: '다음 단계 제안' },
];

export function AICommandMenu({ onCommand, isLoading }: AICommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
      >
        <span>🤖</span>
        <span>AI</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          {/* 배경 클릭으로 닫기 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 메뉴 */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-2">
              <p className="px-3 py-2 text-xs text-gray-400 font-medium">
                AI 기능
              </p>
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onCommand(cmd.id);
                    setIsOpen(false);
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  <cmd.icon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cmd.label}
                    </p>
                    <p className="text-xs text-gray-400">
                      {cmd.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

### 완료 기준
- [ ] `components/AICommandMenu.tsx` 생성됨
- [ ] 7개 명령 모두 표시
- [ ] 로딩 중 비활성화

---

## Task 6: 노트 에디터 통합

### 목표
노트 에디터 페이지에 AI 기능 통합

### 수정 파일

**파일**: `app/notes/[id]/page.tsx` (또는 해당 에디터 컴포넌트)

### 수정 내용

```typescript
// 기존 import에 추가
import { AICommandMenu } from '@/components/AICommandMenu';
import { AIResultPanel } from '@/components/AIResultPanel';
import { useNoteAI } from '@/lib/hooks/useNoteAI';
import type { AICommand } from '@/lib/ai/types';

// 컴포넌트 내부에 추가
const [showAIResult, setShowAIResult] = useState(false);
const [aiTitle, setAITitle] = useState('');

const { execute, isLoading, data, error, reset } = useNoteAI({
  onSuccess: () => setShowAIResult(true),
});

const handleAICommand = (command: AICommand) => {
  const titles: Record<AICommand, string> = {
    summarize: '요약',
    expand: '확장',
    clarify: '명확화',
    structure: '구조화',
    tagSuggest: '태그 제안',
    question: '질문 생성',
    action: '액션 제안',
  };
  setAITitle(titles[command]);
  execute({ noteId: params.id, command });
};

const handleCloseAI = () => {
  setShowAIResult(false);
  reset();
};

const handleSaveAIResult = (content: string) => {
  // 노트 본문에 AI 결과 추가
  // 기존 에디터 로직에 맞게 구현
};

// JSX에 추가 (툴바 영역)
<AICommandMenu
  onCommand={handleAICommand}
  isLoading={isLoading}
/>

// JSX에 추가 (페이지 하단)
{showAIResult && (
  <AIResultPanel
    title={aiTitle}
    result={data?.result || null}
    isLoading={isLoading}
    error={error}
    onClose={handleCloseAI}
    onSave={handleSaveAIResult}
  />
)}
```

### 완료 기준
- [ ] AI 메뉴가 툴바에 표시됨
- [ ] 명령 선택 시 AI 실행됨
- [ ] 결과 패널에 결과 표시됨
- [ ] 저장 시 노트에 추가됨

---

## Task 7: 통합 테스트

### 체크리스트

```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/second-brain-app
npm run build
```

| 테스트 항목 | 예상 결과 | 통과 |
|------------|----------|------|
| Summarize | 3-5개 핵심 포인트 + 키워드 | [ ] |
| Expand | 질문 형태 확장 방향 | [ ] |
| Clarify | 모호한 부분 + 질문 | [ ] |
| Structure | 구조 분석 + 제안 | [ ] |
| TagSuggest | 태그 3종 제안 | [ ] |
| Question | 탐구 질문 목록 | [ ] |
| Action | 다음 단계 제안 (질문 형태) | [ ] |
| 패널 닫기 | 결과 사라짐 | [ ] |
| 복사 | 클립보드에 복사 | [ ] |
| 저장 | 노트에 추가 | [ ] |

---

## 파일 구조 요약

```
second-brain-app/
├── lib/
│   ├── ai/
│   │   ├── types.ts          # Task 1
│   │   ├── prompts.ts        # Task 1
│   │   └── service.ts        # Task 1
│   └── hooks/
│       └── useNoteAI.ts      # Task 3
│
├── app/
│   └── api/
│       └── ai/
│           └── note/
│               └── route.ts  # Task 2
│
└── components/
    ├── AIResultPanel.tsx     # Task 4
    └── AICommandMenu.tsx     # Task 5
```

---

## 실행 순서

```
1. Task 1: AI 서비스 기반 구축
   ↓
2. Task 2: API 엔드포인트 구현
   ↓
3. Task 3: React Hook 구현
   ↓
4. Task 4: AI 결과 패널 UI
   ↓
5. Task 5: AI 메뉴 컴포넌트
   ↓
6. Task 6: 노트 에디터 통합
   ↓
7. Task 7: 통합 테스트
```

---

## 완료 보고 형식

각 Task 완료 시:

```markdown
✅ Task N 완료

**작업 내용**:
- [수행한 작업 1]
- [수행한 작업 2]

**생성/수정된 파일**:
- path/to/file1.ts
- path/to/file2.ts

**테스트 결과**:
- [테스트 항목]: 통과/실패

**이슈**:
- (있으면 기록)
```

---

**문서 작성**: Claude (Arch)
**실행**: Codex (X)
**최종 검토**: 사용자

*Last Updated: 2026-02-10*
