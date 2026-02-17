import { openai } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getContextualNotes } from './contextStack'

export type ThinkingCommand = 'connect' | 'contrast' | 'combine' | 'bridge'

export interface ThinkingResult {
  noteId: string
  noteTitle: string
  reason: string
  preview?: string
  content?: string
  resultTitle?: string
}

export interface ThinkingOutput {
  sessionId: string
  command: ThinkingCommand
  results: ThinkingResult[]
  expiresAt: Date
}

interface ContextCandidate {
  noteId: string
  title: string
  reason: string
}

async function getContextCandidates(
  noteId: string,
  recentNoteIds: string[] = [],
  limit = 5
) {
  const currentNote = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, title: true, body: true },
  })

  if (!currentNote) {
    throw new Error('노트를 찾을 수 없습니다')
  }

  const contextResult = await getContextualNotes({
    currentNoteId: noteId,
    recentNoteIds,
    limit,
  })

  if (contextResult.notes.length === 0) {
    return { currentNote, candidates: [], contextNotes: [] as ContextCandidate[] }
  }

  const candidateIds = contextResult.notes.map((n) => n.noteId)
  const candidates = await prisma.note.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, title: true, body: true },
  })

  const contextNotes = contextResult.notes.map((n) => ({
    noteId: n.noteId,
    title: n.title,
    reason: n.reason,
  }))

  return { currentNote, candidates, contextNotes }
}

export async function executeConnect(
  noteId: string,
  recentNoteIds: string[] = []
): Promise<ThinkingOutput> {
  const { currentNote, candidates, contextNotes } = await getContextCandidates(
    noteId,
    recentNoteIds,
    5
  )

  if (contextNotes.length === 0) {
    const session = await saveSession(noteId, 'connect', [], [])
    return {
      sessionId: session.id,
      command: 'connect',
      results: [],
      expiresAt: session.expiresAt,
    }
  }

  const enhancedResults = await enhanceConnectionReasons(
    currentNote,
    candidates,
    contextNotes
  )

  const candidateIds = contextNotes.map((n) => n.noteId)
  const session = await saveSession(noteId, 'connect', candidateIds, enhancedResults)

  return {
    sessionId: session.id,
    command: 'connect',
    results: enhancedResults.slice(0, 2),
    expiresAt: session.expiresAt,
  }
}

export async function executeContrast(
  noteId: string,
  recentNoteIds: string[] = []
): Promise<ThinkingOutput> {
  const { currentNote, candidates } = await getContextCandidates(noteId, recentNoteIds, 5)

  if (candidates.length === 0) {
    const session = await saveSession(noteId, 'contrast', [], [])
    return {
      sessionId: session.id,
      command: 'contrast',
      results: [],
      expiresAt: session.expiresAt,
    }
  }

  const result = await buildContrastResult(currentNote, candidates)
  const session = await saveSession(noteId, 'contrast', [result.noteId], [result])

  return {
    sessionId: session.id,
    command: 'contrast',
    results: [result],
    expiresAt: session.expiresAt,
  }
}

export async function executeCombine(
  noteId: string,
  recentNoteIds: string[] = []
): Promise<ThinkingOutput> {
  const { currentNote, candidates } = await getContextCandidates(noteId, recentNoteIds, 5)

  if (candidates.length === 0) {
    const session = await saveSession(noteId, 'combine', [], [])
    return {
      sessionId: session.id,
      command: 'combine',
      results: [],
      expiresAt: session.expiresAt,
    }
  }

  const result = await buildCombineResult(currentNote, candidates)
  const session = await saveSession(noteId, 'combine', [result.noteId], [result])

  return {
    sessionId: session.id,
    command: 'combine',
    results: [result],
    expiresAt: session.expiresAt,
  }
}

export async function executeBridge(
  noteId: string,
  recentNoteIds: string[] = []
): Promise<ThinkingOutput> {
  const { currentNote, candidates } = await getContextCandidates(noteId, recentNoteIds, 5)

  if (candidates.length === 0) {
    const session = await saveSession(noteId, 'bridge', [], [])
    return {
      sessionId: session.id,
      command: 'bridge',
      results: [],
      expiresAt: session.expiresAt,
    }
  }

  const result = await buildBridgeResult(currentNote, candidates)
  const session = await saveSession(noteId, 'bridge', [result.noteId], [result])

  return {
    sessionId: session.id,
    command: 'bridge',
    results: [result],
    expiresAt: session.expiresAt,
  }
}

async function enhanceConnectionReasons(
  currentNote: { id: string; title: string; body: string },
  candidates: { id: string; title: string; body: string }[],
  contextNotes: { noteId: string; title: string; reason: string }[]
): Promise<ThinkingResult[]> {
  if (!process.env.OPENAI_API_KEY) {
    return contextNotes.map((cn) => ({
      noteId: cn.noteId,
      noteTitle: cn.title,
      reason: cn.reason,
      preview: candidates.find((c) => c.id === cn.noteId)?.body.slice(0, 100),
    }))
  }

  const candidateMap = new Map(candidates.map((c) => [c.id, c]))

  const prompt = `현재 노트와 관련 노트들의 연결 이유를 한 문장으로 설명해주세요.

현재 노트:
제목: ${currentNote.title}
내용: ${currentNote.body.slice(0, 500)}

관련 노트들:
${contextNotes
    .map((cn) => {
      const candidate = candidateMap.get(cn.noteId)
      return `- "${cn.title}": ${candidate?.body.slice(0, 200) || ''}`
    })
    .join('\n')}

각 관련 노트에 대해 다음 형식으로 응답해주세요 (JSON):
[
  { "noteId": "...", "reason": "한 문장 연결 이유" }
]

규칙:
- 연결 이유는 한 문장 (15단어 이내)
- "~를 공유합니다", "~와 관련됩니다" 형태
- 결론이나 평가 금지`

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
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('AI 응답 없음')
    }

    const parsed = JSON.parse(content) as unknown
    const aiReasonsRaw = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null && 'results' in parsed
        ? (parsed as { results?: unknown }).results
        : []
    const aiReasons = Array.isArray(aiReasonsRaw)
      ? aiReasonsRaw.filter(
          (item): item is { noteId: string; reason?: string } =>
            typeof item === 'object' &&
            item !== null &&
            'noteId' in item &&
            typeof (item as { noteId: unknown }).noteId === 'string'
        )
      : []

    return contextNotes.map((cn) => {
      const aiResult = aiReasons.find((r) => r.noteId === cn.noteId)
      const candidate = candidateMap.get(cn.noteId)

      return {
        noteId: cn.noteId,
        noteTitle: cn.title,
        reason: aiResult?.reason || cn.reason,
        preview: candidate?.body.slice(0, 100),
      }
    })
  } catch (error) {
    console.error('AI enhance error:', error)
    return contextNotes.map((cn) => ({
      noteId: cn.noteId,
      noteTitle: cn.title,
      reason: cn.reason,
      preview: candidateMap.get(cn.noteId)?.body.slice(0, 100),
    }))
  }
}

async function buildContrastResult(
  currentNote: { id: string; title: string; body: string },
  candidates: { id: string; title: string; body: string }[]
): Promise<ThinkingResult> {
  const fallbackCandidate = candidates[0]
  const fallbackContent = `## 대조되는 노트\n- [[${currentNote.title}]]\n- [[${fallbackCandidate.title}]]\n\n## 갈라지는 지점\n- 현재 노트: "전제를 명시해보면?"\n- 대조 노트: "다른 전제를 가진다면?"\n\n## 긴장 관계\n두 관점이 충돌하거나 긴장되는 지점을 찾아보세요.\n\n## 탐구 질문\n- 어떤 조건에서 A가 맞는가?\n- 어떤 조건에서 B가 맞는가?\n- 둘 다 맞을 수 있는가?`

  if (!process.env.OPENAI_API_KEY) {
    return {
      noteId: fallbackCandidate.id,
      noteTitle: fallbackCandidate.title,
      reason: '다른 전제가 있을 가능성이 있는 노트입니다.',
      preview: fallbackCandidate.body.slice(0, 100),
      content: fallbackContent,
      resultTitle: `대조: ${currentNote.title} vs ${fallbackCandidate.title}`,
    }
  }

  const candidateLines = candidates
    .map(
      (c) => `- id: ${c.id}\n  제목: ${c.title}\n  내용: ${c.body.slice(0, 200)}`
    )
    .join('\n')

  const prompt = `현재 노트와 대조되는 전제를 가진 후보 노트를 하나 선택해 주세요.

현재 노트:
제목: ${currentNote.title}
내용: ${currentNote.body.slice(0, 600)}

후보 노트들:
${candidateLines}

다음 형식으로 응답하세요 (JSON):
{
  "noteId": "선택한 후보 id",
  "reason": "갈라지는 전제를 한 문장으로 설명",
  "content": "아래 형식의 마크다운",
  "resultTitle": "대조: A vs B"
}

마크다운 형식:
## 대조되는 노트
- [[현재 노트]]
- [[대조 노트]]

## 갈라지는 지점
- 현재 노트: "X는 필수" 전제
- 대조 노트: "X는 선택" 전제

## 긴장 관계
[두 관점이 충돌하는 핵심]

## 탐구 질문
- 어떤 조건에서 A가 맞는가?
- 어떤 조건에서 B가 맞는가?
- 둘 다 맞을 수 있는가?

규칙:
- 옳고 그름 판단 금지
- reason은 한 문장, 결론 금지`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 노트 간의 대조 지점을 찾아주는 도우미입니다.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 700,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('AI 응답 없음')

    const parsed = safeParseJson(content)
    const selected = candidates.find((c) => c.id === parsed?.noteId) || fallbackCandidate

    return {
      noteId: selected.id,
      noteTitle: selected.title,
      reason: typeof parsed?.reason === 'string' ? parsed.reason : '전제가 다른 지점을 탐색할 수 있습니다.',
      preview: selected.body.slice(0, 100),
      content: typeof parsed?.content === 'string' ? parsed.content : fallbackContent,
      resultTitle:
        typeof parsed?.resultTitle === 'string'
          ? parsed.resultTitle
          : `대조: ${currentNote.title} vs ${selected.title}`,
    }
  } catch (error) {
    console.error('AI contrast error:', error)
    return {
      noteId: fallbackCandidate.id,
      noteTitle: fallbackCandidate.title,
      reason: '전제가 다른 지점을 탐색할 수 있습니다.',
      preview: fallbackCandidate.body.slice(0, 100),
      content: fallbackContent,
      resultTitle: `대조: ${currentNote.title} vs ${fallbackCandidate.title}`,
    }
  }
}

async function buildCombineResult(
  currentNote: { id: string; title: string; body: string },
  candidates: { id: string; title: string; body: string }[]
): Promise<ThinkingResult> {
  const fallbackCandidate = candidates[0]
  const fallbackContent = `## 결합 대상\n- [[${currentNote.title}]]\n- [[${fallbackCandidate.title}]]\n\n## 결합 개념 후보\n\n### 후보 1: [개념 이름]\n> [A의 X] + [B의 Y]를 결합한 개념\n>\n> 정의: ...\n>\n> ⚠️ 이것은 초안입니다. 사용자 확정 필요.\n\n## 결합 방식\n- 어떤 요소를 가져왔는지\n- 어떻게 결합했는지\n\n## 검증 질문\n- 이 결합이 실제로 유용한가?\n- 빠진 요소는 없는가?\n- 더 나은 결합 방식은?`

  if (!process.env.OPENAI_API_KEY) {
    return {
      noteId: fallbackCandidate.id,
      noteTitle: fallbackCandidate.title,
      reason: '두 노트를 결합할 수 있는 지점을 탐색합니다.',
      preview: fallbackCandidate.body.slice(0, 100),
      content: fallbackContent,
      resultTitle: `결합: ${currentNote.title} + ${fallbackCandidate.title}`,
    }
  }

  const candidateLines = candidates
    .map(
      (c) => `- id: ${c.id}\n  제목: ${c.title}\n  내용: ${c.body.slice(0, 200)}`
    )
    .join('\n')

  const prompt = `현재 노트와 결합할 후보 노트를 하나 선택해 결합 아이디어를 제안해 주세요.

현재 노트:
제목: ${currentNote.title}
내용: ${currentNote.body.slice(0, 600)}

후보 노트들:
${candidateLines}

다음 형식으로 응답하세요 (JSON):
{
  "noteId": "선택한 후보 id",
  "reason": "결합 가능성을 한 문장으로 설명",
  "content": "아래 형식의 마크다운",
  "resultTitle": "결합: A + B"
}

마크다운 형식:
## 결합 대상
- [[노트 A]]
- [[노트 B]]

## 결합 개념 후보

### 후보 1: [개념 이름]
> [A의 X] + [B의 Y]를 결합한 개념
>
> 정의: ...
>
> ⚠️ 이것은 초안입니다. 사용자 확정 필요.

## 결합 방식
- 어떤 요소를 가져왔는지
- 어떻게 결합했는지

## 검증 질문
- 이 결합이 실제로 유용한가?
- 빠진 요소는 없는가?
- 더 나은 결합 방식은?

규칙:
- 결론 금지
- reason은 한 문장`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 노트 결합 아이디어를 제안하는 도우미입니다.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 900,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('AI 응답 없음')

    const parsed = safeParseJson(content)
    const selected = candidates.find((c) => c.id === parsed?.noteId) || fallbackCandidate

    return {
      noteId: selected.id,
      noteTitle: selected.title,
      reason: typeof parsed?.reason === 'string' ? parsed.reason : '두 노트를 결합할 수 있습니다.',
      preview: selected.body.slice(0, 100),
      content: typeof parsed?.content === 'string' ? parsed.content : fallbackContent,
      resultTitle:
        typeof parsed?.resultTitle === 'string'
          ? parsed.resultTitle
          : `결합: ${currentNote.title} + ${selected.title}`,
    }
  } catch (error) {
    console.error('AI combine error:', error)
    return {
      noteId: fallbackCandidate.id,
      noteTitle: fallbackCandidate.title,
      reason: '두 노트를 결합할 수 있습니다.',
      preview: fallbackCandidate.body.slice(0, 100),
      content: fallbackContent,
      resultTitle: `결합: ${currentNote.title} + ${fallbackCandidate.title}`,
    }
  }
}

async function buildBridgeResult(
  currentNote: { id: string; title: string; body: string },
  candidates: { id: string; title: string; body: string }[]
): Promise<ThinkingResult> {
  const fallbackCandidate = candidates[0]
  const fallbackContent = `## 연결하려는 노트\n- [[${currentNote.title}]] (출발점)\n- [[${fallbackCandidate.title}]] (도착점)\n\n## 논리적 간극\nA에서 B로 가려면 [X]가 필요하지만, 현재 없음\n\n## 브릿지 후보\n1. [중간 개념 1] — A와 B를 연결하는 역할\n2. [중간 개념 2] — 다른 경로\n\n## 필요한 추가 노트\n- [[필요한 노트 제목 제안]]\n  - 내용: [어떤 내용이 들어가야 하는지]\n\n## 탐구 질문\n- 이 간극을 메우는 다른 방법은?\n- 간극이 존재하는 이유는?`

  if (!process.env.OPENAI_API_KEY) {
    return {
      noteId: fallbackCandidate.id,
      noteTitle: fallbackCandidate.title,
      reason: '두 노트를 연결하는 중간 고리를 탐색합니다.',
      preview: fallbackCandidate.body.slice(0, 100),
      content: fallbackContent,
      resultTitle: `브릿지: ${currentNote.title} ↔ ${fallbackCandidate.title}`,
    }
  }

  const candidateLines = candidates
    .map(
      (c) => `- id: ${c.id}\n  제목: ${c.title}\n  내용: ${c.body.slice(0, 200)}`
    )
    .join('\n')

  const prompt = `현재 노트와 연결할 후보 노트를 하나 선택하고, 그 사이의 브릿지(중간 고리)를 제안해 주세요.

현재 노트:
제목: ${currentNote.title}
내용: ${currentNote.body.slice(0, 600)}

후보 노트들:
${candidateLines}

다음 형식으로 응답하세요 (JSON):
{
  "noteId": "선택한 후보 id",
  "reason": "연결 간극을 한 문장으로 설명",
  "content": "아래 형식의 마크다운",
  "resultTitle": "브릿지: A ↔ B"
}

마크다운 형식:
## 연결하려는 노트
- [[노트 A]] (출발점)
- [[노트 B]] (도착점)

## 논리적 간극
A에서 B로 가려면 [X]가 필요하지만, 현재 없음

## 브릿지 후보
1. [중간 개념 1] — A와 B를 연결하는 역할
2. [중간 개념 2] — 다른 경로

## 필요한 추가 노트
- [[필요한 노트 제목 제안]]
  - 내용: [어떤 내용이 들어가야 하는지]

## 탐구 질문
- 이 간극을 메우는 다른 방법은?
- 간극이 존재하는 이유는?

규칙:
- 결론 금지
- reason은 한 문장`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 노트 간의 논리적 간극을 찾아주는 도우미입니다.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 900,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('AI 응답 없음')

    const parsed = safeParseJson(content)
    const selected = candidates.find((c) => c.id === parsed?.noteId) || fallbackCandidate

    return {
      noteId: selected.id,
      noteTitle: selected.title,
      reason: typeof parsed?.reason === 'string' ? parsed.reason : '연결 간극을 찾아볼 수 있습니다.',
      preview: selected.body.slice(0, 100),
      content: typeof parsed?.content === 'string' ? parsed.content : fallbackContent,
      resultTitle:
        typeof parsed?.resultTitle === 'string'
          ? parsed.resultTitle
          : `브릿지: ${currentNote.title} ↔ ${selected.title}`,
    }
  } catch (error) {
    console.error('AI bridge error:', error)
    return {
      noteId: fallbackCandidate.id,
      noteTitle: fallbackCandidate.title,
      reason: '연결 간극을 찾아볼 수 있습니다.',
      preview: fallbackCandidate.body.slice(0, 100),
      content: fallbackContent,
      resultTitle: `브릿지: ${currentNote.title} ↔ ${fallbackCandidate.title}`,
    }
  }
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch (error) {
    return null
  }
}

async function saveSession(
  noteId: string,
  command: ThinkingCommand,
  inputNoteIds: string[],
  results: ThinkingResult[]
) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  return prisma.thinkingSession.create({
    data: {
      noteId,
      command,
      input: ({ noteIds: inputNoteIds } as unknown) as Prisma.InputJsonValue,
      output: ({ results } as unknown) as Prisma.InputJsonValue,
      savedIds: [],
      expiresAt,
    },
  })
}
