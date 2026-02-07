# AI Thinking System Phase 1 - Codex 작업 명세서

> **목적**: Codex(X)가 독립적으로 구현할 수 있는 상세 태스크 목록
> **참조**: `docs/AI_THINKING_DESIGN.md` (설계 문서)
> **예상 작업량**: 5개 태스크

---

## 개요

### Phase 1 목표
"Connect" 명령을 통한 기본 Thinking System 구현

### 핵심 철학 (구현 시 항상 기억)
```
1. AI는 재료만 제공, 결론 금지
2. 자동 저장 금지, 사용자 확정 필수
3. 조용한 작업대 UI (챗 UI 아님)
4. 사용자 요청 시에만 작동
```

### 기술 스택 (기존)
- Next.js 15 (App Router)
- TypeScript
- Prisma + PostgreSQL (Neon)
- OpenAI API (gpt-4o-mini)
- TanStack Query
- Tiptap Editor

---

## Task 1: 스키마 확장

### 목표
Thinking Session 저장을 위한 데이터 모델 추가

### 파일 위치
`prisma/schema.prisma`

### 작업 내용

#### 1.1 ThinkingSession 모델 추가

```prisma
// Thinking Session (AI 사고 세션)
model ThinkingSession {
  id        String   @id @default(cuid())
  noteId    String   // 시작 노트
  command   String   @db.VarChar(50) // connect | contrast | combine | simplify
  input     Json     // 입력 데이터
  output    Json     // AI 출력 (임시)
  savedIds  String[] // 저장된 결과 ID들
  createdAt DateTime @default(now())
  expiresAt DateTime // 세션 만료 시간

  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@index([noteId])
  @@index([createdAt])
  @@index([expiresAt])
  @@map("thinking_sessions")
}
```

**위치**: `SavedView` 모델 아래에 추가

#### 1.2 Note 모델에 관계 추가

```prisma
model Note {
  // 기존 필드들...

  // === 아래 추가 ===
  thinkingSessions ThinkingSession[]
}
```

**위치**: `versions NoteVersion[]` 아래에 추가

### 완료 후 명령어

```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/second-brain-app
npx prisma db push
npx prisma generate
```

### 검증 방법

```bash
npx prisma studio
# thinking_sessions 테이블 존재 확인
```

### 완료 기준
- [ ] ThinkingSession 모델 생성됨
- [ ] Note-ThinkingSession 관계 설정됨
- [ ] `prisma db push` 성공
- [ ] `prisma generate` 성공

---

## Task 2: Context Stack 로직 구현

### 목표
현재 노트와 관련된 노트를 찾는 맥락 기반 로직 구현

### 파일 생성
`lib/thinking/contextStack.ts`

### 전체 코드

```typescript
// lib/thinking/contextStack.ts

import { prisma } from '@/lib/db';

// ============ 타입 정의 ============

interface ContextNote {
  noteId: string;
  title: string;
  score: number;
  reason: string;
}

interface ContextStackInput {
  currentNoteId: string;
  recentNoteIds?: string[];  // 최근 본 노트들
  limit?: number;            // 최대 결과 수
}

interface ContextStackResult {
  notes: ContextNote[];
  debug?: {
    linkNotes: number;
    recentNotes: number;
    tagNotes: number;
  };
}

// ============ 상수 ============

const WEIGHTS = {
  DIRECT_LINK: 50,      // 직접 링크
  SECOND_HOP: 25,       // 2단계 링크
  RECENT_VIEW: 30,      // 최근 30분 내 조회
  SAME_TAG: 20,         // 같은 태그
  SAME_FOLDER: 15,      // 같은 폴더
  RECENCY: 10,          // 최근 수정
};

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

// ============ 유틸리티 함수 ============

/**
 * 직접 링크된 노트 조회 (1-hop)
 */
async function getLinkedNotes(noteId: string): Promise<Map<string, number>> {
  const links = await prisma.link.findMany({
    where: {
      OR: [
        { sourceId: noteId },
        { targetId: noteId },
      ],
    },
    include: {
      source: { select: { id: true, title: true } },
      target: { select: { id: true, title: true } },
    },
  });

  const scoreMap = new Map<string, number>();

  links.forEach(link => {
    const linkedId = link.sourceId === noteId ? link.targetId : link.sourceId;
    if (linkedId !== noteId) {
      scoreMap.set(linkedId, WEIGHTS.DIRECT_LINK);
    }
  });

  return scoreMap;
}

/**
 * 2단계 링크 노트 조회 (2-hop)
 */
async function getSecondHopNotes(
  noteId: string,
  firstHopIds: string[]
): Promise<Map<string, number>> {
  if (firstHopIds.length === 0) return new Map();

  const links = await prisma.link.findMany({
    where: {
      OR: [
        { sourceId: { in: firstHopIds } },
        { targetId: { in: firstHopIds } },
      ],
    },
  });

  const scoreMap = new Map<string, number>();

  links.forEach(link => {
    const ids = [link.sourceId, link.targetId];
    ids.forEach(id => {
      if (id !== noteId && !firstHopIds.includes(id)) {
        const current = scoreMap.get(id) || 0;
        scoreMap.set(id, Math.max(current, WEIGHTS.SECOND_HOP));
      }
    });
  });

  return scoreMap;
}

/**
 * 같은 태그를 가진 노트 조회
 */
async function getSameTagNotes(noteId: string): Promise<Map<string, number>> {
  // 현재 노트의 태그 조회
  const currentTags = await prisma.noteTag.findMany({
    where: { noteId },
    select: { tagId: true },
  });

  if (currentTags.length === 0) return new Map();

  const tagIds = currentTags.map(t => t.tagId);

  // 같은 태그를 가진 다른 노트 조회
  const relatedNoteTags = await prisma.noteTag.findMany({
    where: {
      tagId: { in: tagIds },
      noteId: { not: noteId },
    },
    select: { noteId: true },
  });

  const scoreMap = new Map<string, number>();
  relatedNoteTags.forEach(nt => {
    const current = scoreMap.get(nt.noteId) || 0;
    scoreMap.set(nt.noteId, current + WEIGHTS.SAME_TAG);
  });

  return scoreMap;
}

/**
 * 같은 폴더의 노트 조회
 */
async function getSameFolderNotes(noteId: string): Promise<Map<string, number>> {
  const currentNote = await prisma.note.findUnique({
    where: { id: noteId },
    select: { folderId: true },
  });

  if (!currentNote?.folderId) return new Map();

  const folderNotes = await prisma.note.findMany({
    where: {
      folderId: currentNote.folderId,
      id: { not: noteId },
    },
    select: { id: true },
  });

  const scoreMap = new Map<string, number>();
  folderNotes.forEach(n => {
    scoreMap.set(n.id, WEIGHTS.SAME_FOLDER);
  });

  return scoreMap;
}

/**
 * 최근 본 노트 점수 부여
 */
function getRecentViewScores(
  recentNoteIds: string[],
  excludeId: string
): Map<string, number> {
  const scoreMap = new Map<string, number>();

  recentNoteIds.forEach((id, index) => {
    if (id !== excludeId) {
      // 더 최근에 본 것일수록 높은 점수
      const recencyBonus = WEIGHTS.RECENT_VIEW * (1 - index * 0.1);
      scoreMap.set(id, Math.max(recencyBonus, WEIGHTS.RECENT_VIEW * 0.5));
    }
  });

  return scoreMap;
}

/**
 * 최근 수정된 노트 점수
 */
async function getRecencyScores(
  noteIds: string[]
): Promise<Map<string, number>> {
  if (noteIds.length === 0) return new Map();

  const notes = await prisma.note.findMany({
    where: { id: { in: noteIds } },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const scoreMap = new Map<string, number>();
  const now = Date.now();

  notes.forEach((note, index) => {
    const ageMs = now - new Date(note.updatedAt).getTime();
    const dayAge = ageMs / (1000 * 60 * 60 * 24);

    // 최근 7일 이내면 점수 부여
    if (dayAge <= 7) {
      const recencyScore = WEIGHTS.RECENCY * (1 - dayAge / 7);
      scoreMap.set(note.id, recencyScore);
    }
  });

  return scoreMap;
}

/**
 * 점수 맵들 병합
 */
function mergeScoreMaps(...maps: Map<string, number>[]): Map<string, number> {
  const merged = new Map<string, number>();

  maps.forEach(map => {
    map.forEach((score, noteId) => {
      const current = merged.get(noteId) || 0;
      merged.set(noteId, current + score);
    });
  });

  return merged;
}

/**
 * 연결 이유 생성
 */
function generateReason(
  noteId: string,
  scores: {
    link: Map<string, number>;
    secondHop: Map<string, number>;
    tag: Map<string, number>;
    folder: Map<string, number>;
    recent: Map<string, number>;
  }
): string {
  const reasons: string[] = [];

  if (scores.link.has(noteId)) {
    reasons.push('직접 연결된 노트');
  }
  if (scores.secondHop.has(noteId)) {
    reasons.push('연결된 노트와 관련');
  }
  if (scores.tag.has(noteId)) {
    reasons.push('같은 태그 공유');
  }
  if (scores.folder.has(noteId)) {
    reasons.push('같은 폴더');
  }
  if (scores.recent.has(noteId)) {
    reasons.push('최근 수정됨');
  }

  return reasons.length > 0 ? reasons.join(', ') : '관련 노트';
}

// ============ 메인 함수 ============

/**
 * Context Stack 기반 관련 노트 조회
 */
export async function getContextualNotes(
  input: ContextStackInput
): Promise<ContextStackResult> {
  const { currentNoteId, recentNoteIds = [], limit = 5 } = input;

  // 1. 각 소스별 점수 계산
  const linkScores = await getLinkedNotes(currentNoteId);
  const firstHopIds = Array.from(linkScores.keys());

  const secondHopScores = await getSecondHopNotes(currentNoteId, firstHopIds);
  const tagScores = await getSameTagNotes(currentNoteId);
  const folderScores = await getSameFolderNotes(currentNoteId);
  const recentViewScores = getRecentViewScores(recentNoteIds, currentNoteId);

  // 2. 점수 병합
  const mergedScores = mergeScoreMaps(
    linkScores,
    secondHopScores,
    tagScores,
    folderScores,
    recentViewScores
  );

  // 3. 최근 수정 점수 추가
  const allNoteIds = Array.from(mergedScores.keys());
  const recencyScores = await getRecencyScores(allNoteIds);

  recencyScores.forEach((score, noteId) => {
    const current = mergedScores.get(noteId) || 0;
    mergedScores.set(noteId, current + score);
  });

  // 4. 정렬 및 상위 N개 선택
  const sortedEntries = Array.from(mergedScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // 5. 노트 정보 조회
  const topNoteIds = sortedEntries.map(([id]) => id);
  const notes = await prisma.note.findMany({
    where: { id: { in: topNoteIds } },
    select: { id: true, title: true },
  });

  const noteMap = new Map(notes.map(n => [n.id, n]));

  // 6. 결과 생성
  const scores = {
    link: linkScores,
    secondHop: secondHopScores,
    tag: tagScores,
    folder: folderScores,
    recent: recencyScores,
  };

  const result: ContextNote[] = sortedEntries.map(([noteId, score]) => ({
    noteId,
    title: noteMap.get(noteId)?.title || 'Unknown',
    score,
    reason: generateReason(noteId, scores),
  }));

  return {
    notes: result,
    debug: {
      linkNotes: linkScores.size,
      recentNotes: recentViewScores.size,
      tagNotes: tagScores.size,
    },
  };
}
```

### 완료 기준
- [ ] `lib/thinking/contextStack.ts` 파일 생성됨
- [ ] 타입 에러 없음 (`npx tsc --noEmit`)
- [ ] 모든 함수 export 확인

---

## Task 3: Connect 명령 API 구현

### 목표
Connect 명령 API 엔드포인트 구현

### 파일 생성

#### 3.1 Thinking 유틸리티

**파일**: `lib/thinking/commands.ts`

```typescript
// lib/thinking/commands.ts

import { openai } from '@/lib/openai';
import { prisma } from '@/lib/db';
import { getContextualNotes } from './contextStack';

// ============ 타입 ============

export interface ConnectResult {
  noteId: string;
  noteTitle: string;
  reason: string;
  preview?: string;
}

export interface ThinkingOutput {
  sessionId: string;
  command: string;
  results: ConnectResult[];
  expiresAt: Date;
}

// ============ Connect 명령 ============

export async function executeConnect(
  noteId: string,
  recentNoteIds: string[] = []
): Promise<ThinkingOutput> {
  // 1. 현재 노트 조회
  const currentNote = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, title: true, body: true },
  });

  if (!currentNote) {
    throw new Error('노트를 찾을 수 없습니다');
  }

  // 2. Context Stack으로 후보 노트 조회
  const contextResult = await getContextualNotes({
    currentNoteId: noteId,
    recentNoteIds,
    limit: 5,
  });

  if (contextResult.notes.length === 0) {
    // 연결된 노트가 없는 경우
    const session = await saveSession(noteId, 'connect', [], []);
    return {
      sessionId: session.id,
      command: 'connect',
      results: [],
      expiresAt: session.expiresAt,
    };
  }

  // 3. 후보 노트들의 본문 조회
  const candidateIds = contextResult.notes.map(n => n.noteId);
  const candidates = await prisma.note.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, title: true, body: true },
  });

  // 4. AI로 연결 이유 정교화
  const enhancedResults = await enhanceConnectionReasons(
    currentNote,
    candidates,
    contextResult.notes
  );

  // 5. 세션 저장
  const session = await saveSession(noteId, 'connect', candidateIds, enhancedResults);

  return {
    sessionId: session.id,
    command: 'connect',
    results: enhancedResults.slice(0, 2), // 최대 2개만 반환
    expiresAt: session.expiresAt,
  };
}

// ============ AI 연결 이유 정교화 ============

async function enhanceConnectionReasons(
  currentNote: { id: string; title: string; body: string },
  candidates: { id: string; title: string; body: string }[],
  contextNotes: { noteId: string; title: string; reason: string }[]
): Promise<ConnectResult[]> {
  // OpenAI 키가 없으면 기본 이유 사용
  if (!process.env.OPENAI_API_KEY) {
    return contextNotes.map(cn => ({
      noteId: cn.noteId,
      noteTitle: cn.title,
      reason: cn.reason,
      preview: candidates.find(c => c.id === cn.noteId)?.body.slice(0, 100),
    }));
  }

  const candidateMap = new Map(candidates.map(c => [c.id, c]));

  // AI 프롬프트 구성
  const prompt = `현재 노트와 관련 노트들의 연결 이유를 한 문장으로 설명해주세요.

현재 노트:
제목: ${currentNote.title}
내용: ${currentNote.body.slice(0, 500)}

관련 노트들:
${contextNotes.map(cn => {
  const candidate = candidateMap.get(cn.noteId);
  return `- "${cn.title}": ${candidate?.body.slice(0, 200) || ''}`;
}).join('\n')}

각 관련 노트에 대해 다음 형식으로 응답해주세요 (JSON):
[
  { "noteId": "...", "reason": "한 문장 연결 이유" }
]

규칙:
- 연결 이유는 한 문장 (15단어 이내)
- "~를 공유합니다", "~와 관련됩니다" 형태
- 결론이나 평가 금지`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 노트 간 연결을 설명하는 도우미입니다. 짧고 객관적으로 답변하세요.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 응답 없음');
    }

    const parsed = JSON.parse(content);
    const aiReasons = Array.isArray(parsed) ? parsed : parsed.results || [];

    // AI 이유와 기존 정보 병합
    return contextNotes.map(cn => {
      const aiResult = aiReasons.find((r: any) => r.noteId === cn.noteId);
      const candidate = candidateMap.get(cn.noteId);

      return {
        noteId: cn.noteId,
        noteTitle: cn.title,
        reason: aiResult?.reason || cn.reason,
        preview: candidate?.body.slice(0, 100),
      };
    });
  } catch (error) {
    console.error('AI enhance error:', error);
    // 실패 시 기본 이유 사용
    return contextNotes.map(cn => ({
      noteId: cn.noteId,
      noteTitle: cn.title,
      reason: cn.reason,
      preview: candidateMap.get(cn.noteId)?.body.slice(0, 100),
    }));
  }
}

// ============ 세션 저장 ============

async function saveSession(
  noteId: string,
  command: string,
  inputNoteIds: string[],
  results: ConnectResult[]
) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후

  return prisma.thinkingSession.create({
    data: {
      noteId,
      command,
      input: { noteIds: inputNoteIds },
      output: { results },
      savedIds: [],
      expiresAt,
    },
  });
}
```

#### 3.2 OpenAI 클라이언트 (없으면 생성)

**파일**: `lib/openai.ts`

```typescript
// lib/openai.ts

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. AI features will be limited.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});
```

#### 3.3 Connect API 엔드포인트

**파일**: `app/api/thinking/connect/route.ts`

```typescript
// app/api/thinking/connect/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeConnect } from '@/lib/thinking/commands';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteId, recentNoteIds } = body;

    if (!noteId) {
      return NextResponse.json(
        { error: 'noteId가 필요합니다' },
        { status: 400 }
      );
    }

    const result = await executeConnect(noteId, recentNoteIds || []);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 3.4 Save API 엔드포인트

**파일**: `app/api/thinking/save/route.ts`

```typescript
// app/api/thinking/save/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, resultNoteId, saveAs, targetNoteId, userContent } = body;

    if (!sessionId || !resultNoteId) {
      return NextResponse.json(
        { error: 'sessionId와 resultNoteId가 필요합니다' },
        { status: 400 }
      );
    }

    // 세션 조회
    const session = await prisma.thinkingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 이미 저장된 결과인지 확인
    if (session.savedIds.includes(resultNoteId)) {
      return NextResponse.json(
        { error: '이미 저장된 결과입니다' },
        { status: 400 }
      );
    }

    let savedNoteId: string;

    if (saveAs === 'new_note') {
      // 새 노트 생성
      const resultNote = await prisma.note.findUnique({
        where: { id: resultNoteId },
        select: { title: true },
      });

      const newNote = await prisma.note.create({
        data: {
          title: `연결: ${resultNote?.title || 'Unknown'}`,
          body: userContent || '',
        },
      });

      savedNoteId = newNote.id;

      // 원본 노트와 링크 생성
      await prisma.link.create({
        data: {
          sourceId: session.noteId,
          targetId: savedNoteId,
        },
      });
    } else if (saveAs === 'append_to_note' && targetNoteId) {
      // 기존 노트에 추가
      const targetNote = await prisma.note.findUnique({
        where: { id: targetNoteId },
      });

      if (!targetNote) {
        return NextResponse.json(
          { error: '대상 노트를 찾을 수 없습니다' },
          { status: 404 }
        );
      }

      await prisma.note.update({
        where: { id: targetNoteId },
        data: {
          body: targetNote.body + '\n\n' + (userContent || ''),
        },
      });

      savedNoteId = targetNoteId;
    } else {
      return NextResponse.json(
        { error: '잘못된 saveAs 값입니다' },
        { status: 400 }
      );
    }

    // 세션 업데이트
    await prisma.thinkingSession.update({
      where: { id: sessionId },
      data: {
        savedIds: [...session.savedIds, resultNoteId],
      },
    });

    return NextResponse.json({
      success: true,
      savedNoteId,
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 완료 기준
- [ ] `lib/thinking/commands.ts` 생성됨
- [ ] `lib/openai.ts` 생성됨 (이미 있으면 스킵)
- [ ] `app/api/thinking/connect/route.ts` 생성됨
- [ ] `app/api/thinking/save/route.ts` 생성됨
- [ ] 타입 에러 없음

### 테스트 방법

```bash
# Connect API 테스트
curl -X POST http://localhost:3004/api/thinking/connect \
  -H "Content-Type: application/json" \
  -d '{"noteId": "NOTE_ID_HERE"}'
```

---

## Task 4: Thinking Panel UI 구현

### 목표
조용한 작업대 스타일의 Thinking Panel 컴포넌트 구현

### 파일 생성

#### 4.1 Thinking Panel 컴포넌트

**파일**: `components/ThinkingPanel.tsx`

```typescript
// components/ThinkingPanel.tsx

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Link2, ArrowRight, Save, Loader2 } from 'lucide-react';

// ============ 타입 ============

interface ConnectResult {
  noteId: string;
  noteTitle: string;
  reason: string;
  preview?: string;
}

interface ThinkingPanelProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onNoteClick?: (noteId: string) => void;
}

// ============ 컴포넌트 ============

export function ThinkingPanel({
  noteId,
  isOpen,
  onClose,
  onNoteClick,
}: ThinkingPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<ConnectResult[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Connect 명령 실행
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/thinking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
      if (!res.ok) throw new Error('Connect 실패');
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setResults(data.results || []);
    },
  });

  // 저장
  const saveMutation = useMutation({
    mutationFn: async (resultNoteId: string) => {
      const res = await fetch('/api/thinking/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          resultNoteId,
          saveAs: 'new_note',
        }),
      });
      if (!res.ok) throw new Error('저장 실패');
      return res.json();
    },
    onSuccess: (_, resultNoteId) => {
      setSavedIds(prev => new Set(prev).add(resultNoteId));
      setSavingId(null);
    },
    onError: () => {
      setSavingId(null);
    },
  });

  const handleConnect = () => {
    setResults([]);
    setSessionId(null);
    setSavedIds(new Set());
    connectMutation.mutate();
  };

  const handleSave = (resultNoteId: string) => {
    setSavingId(resultNoteId);
    saveMutation.mutate(resultNoteId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-20 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="font-medium text-gray-900 dark:text-white">
            Thinking
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 명령 버튼 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleConnect}
          disabled={connectMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
        >
          {connectMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          <span>Connect</span>
        </button>
      </div>

      {/* 결과 영역 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {connectMutation.isPending && (
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">관련 노트를 찾고 있습니다...</p>
          </div>
        )}

        {!connectMutation.isPending && results.length === 0 && sessionId && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">연결된 노트가 없습니다</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.noteId}
                className={`p-3 rounded-lg border transition-colors ${
                  savedIds.has(result.noteId)
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                {/* 노트 제목 */}
                <div
                  className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => onNoteClick?.(result.noteId)}
                >
                  <span className="text-sm">📄</span>
                  <span className="font-medium text-sm truncate">
                    {result.noteTitle}
                  </span>
                  <ArrowRight className="w-3 h-3 ml-auto flex-shrink-0" />
                </div>

                {/* 연결 이유 */}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {result.reason}
                </p>

                {/* 미리보기 */}
                {result.preview && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                    {result.preview}...
                  </p>
                )}

                {/* 저장 버튼 */}
                {!savedIds.has(result.noteId) && (
                  <button
                    onClick={() => handleSave(result.noteId)}
                    disabled={savingId === result.noteId}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {savingId === result.noteId ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    <span>저장</span>
                  </button>
                )}

                {savedIds.has(result.noteId) && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    ✓ 저장됨
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 초기 상태 */}
        {!sessionId && !connectMutation.isPending && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Connect를 눌러 관련 노트를 찾아보세요</p>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
        <p className="text-xs text-gray-400 text-center">
          임시 결과 · 저장하지 않으면 사라집니다
        </p>
      </div>
    </div>
  );
}
```

#### 4.2 Thinking 버튼 컴포넌트

**파일**: `components/ThinkingButton.tsx`

```typescript
// components/ThinkingButton.tsx

'use client';

import { Brain } from 'lucide-react';

interface ThinkingButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

export function ThinkingButton({ onClick, isActive }: ThinkingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
      }`}
      title="Thinking (Cmd+/)"
    >
      <Brain className="w-4 h-4" />
      <span className="text-sm">Think</span>
    </button>
  );
}
```

### 완료 기준
- [ ] `components/ThinkingPanel.tsx` 생성됨
- [ ] `components/ThinkingButton.tsx` 생성됨
- [ ] 점선 테두리로 임시 상태 표현됨
- [ ] 저장 후 실선 + 녹색으로 변경됨
- [ ] 타입 에러 없음

---

## Task 5: 노트 에디터에 통합

### 목표
노트 에디터 페이지에 Thinking Panel 통합

### 파일 수정

**파일**: `app/notes/[id]/page.tsx`

### 수정 내용

#### 5.1 Import 추가

```typescript
// 기존 import 아래에 추가
import { ThinkingPanel } from '@/components/ThinkingPanel';
import { ThinkingButton } from '@/components/ThinkingButton';
```

#### 5.2 상태 추가

```typescript
// 컴포넌트 내부에 상태 추가
const [isThinkingOpen, setIsThinkingOpen] = useState(false);
```

#### 5.3 키보드 단축키 추가

```typescript
// useEffect로 키보드 단축키 등록
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd+/ 또는 Ctrl+/
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      setIsThinkingOpen(prev => !prev);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### 5.4 툴바에 버튼 추가

```tsx
{/* 에디터 툴바 영역에 추가 */}
<ThinkingButton
  onClick={() => setIsThinkingOpen(prev => !prev)}
  isActive={isThinkingOpen}
/>
```

#### 5.5 Thinking Panel 렌더링

```tsx
{/* 페이지 하단에 추가 */}
<ThinkingPanel
  noteId={params.id}
  isOpen={isThinkingOpen}
  onClose={() => setIsThinkingOpen(false)}
  onNoteClick={(noteId) => {
    router.push(`/notes/${noteId}`);
  }}
/>
```

### 완료 기준
- [ ] Thinking 버튼이 에디터 툴바에 표시됨
- [ ] Cmd+/ 단축키로 패널 토글됨
- [ ] 패널에서 노트 클릭 시 해당 노트로 이동
- [ ] 저장 기능 동작함

---

## Task 6: 통합 테스트 및 마무리

### 목표
전체 흐름 테스트 및 버그 수정

### 체크리스트

#### 6.1 빌드 테스트
```bash
cd /Users/woocheolshin/Documents/Vibecoding/projects/second-brain-app
npm run build
```
- [ ] 빌드 성공
- [ ] 타입 에러 없음

#### 6.2 기능 테스트

| 테스트 항목 | 예상 결과 | 통과 |
|------------|----------|------|
| Cmd+/ 단축키 | 패널 토글 | [ ] |
| Connect 버튼 클릭 | 관련 노트 표시 | [ ] |
| 연결 이유 표시 | 한 문장 이유 | [ ] |
| 저장 버튼 클릭 | 새 노트 생성 | [ ] |
| 저장 후 UI 변경 | 녹색 테두리 | [ ] |
| 노트 클릭 | 해당 노트로 이동 | [ ] |

#### 6.3 DB 확인
```bash
npx prisma studio
```
- [ ] thinking_sessions 테이블에 기록 저장 확인
- [ ] savedIds 배열 업데이트 확인

---

## 파일 구조 요약

```
second-brain-app/
├── prisma/
│   └── schema.prisma              # Task 1: 스키마 확장
│
├── lib/
│   ├── openai.ts                  # Task 3: OpenAI 클라이언트
│   └── thinking/
│       ├── contextStack.ts        # Task 2: 맥락 스택
│       └── commands.ts            # Task 3: 명령 로직
│
├── app/
│   ├── api/
│   │   └── thinking/
│   │       ├── connect/
│   │       │   └── route.ts       # Task 3: Connect API
│   │       └── save/
│   │           └── route.ts       # Task 3: Save API
│   └── notes/
│       └── [id]/
│           └── page.tsx           # Task 5: 통합
│
└── components/
    ├── ThinkingPanel.tsx          # Task 4: 패널 UI
    └── ThinkingButton.tsx         # Task 4: 버튼 UI
```

---

## 실행 순서

```
1. Task 1: 스키마 확장
   ↓
2. Task 2: Context Stack 로직
   ↓
3. Task 3: API 구현
   ↓
4. Task 4: UI 구현
   ↓
5. Task 5: 에디터 통합
   ↓
6. Task 6: 통합 테스트
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
**철학 정의**: ChatGPT (ZERO)
**실행**: Codex (X)
**최종 검토**: 사용자
