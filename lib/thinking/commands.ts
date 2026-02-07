import { openai } from '@/lib/openai'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getContextualNotes } from './contextStack'

export interface ConnectResult {
  noteId: string
  noteTitle: string
  reason: string
  preview?: string
}

export interface ThinkingOutput {
  sessionId: string
  command: string
  results: ConnectResult[]
  expiresAt: Date
}

export async function executeConnect(
  noteId: string,
  recentNoteIds: string[] = []
): Promise<ThinkingOutput> {
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
    limit: 5,
  })

  if (contextResult.notes.length === 0) {
    const session = await saveSession(noteId, 'connect', [], [])
    return {
      sessionId: session.id,
      command: 'connect',
      results: [],
      expiresAt: session.expiresAt,
    }
  }

  const candidateIds = contextResult.notes.map((n) => n.noteId)
  const candidates = await prisma.note.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, title: true, body: true },
  })

  const enhancedResults = await enhanceConnectionReasons(
    currentNote,
    candidates,
    contextResult.notes
  )

  const session = await saveSession(noteId, 'connect', candidateIds, enhancedResults)

  return {
    sessionId: session.id,
    command: 'connect',
    results: enhancedResults.slice(0, 2),
    expiresAt: session.expiresAt,
  }
}

async function enhanceConnectionReasons(
  currentNote: { id: string; title: string; body: string },
  candidates: { id: string; title: string; body: string }[],
  contextNotes: { noteId: string; title: string; reason: string }[]
): Promise<ConnectResult[]> {
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

    const parsed = JSON.parse(content)
    const aiReasons = Array.isArray(parsed) ? parsed : parsed.results || []

    return contextNotes.map((cn) => {
      const aiResult = aiReasons.find((r: any) => r.noteId === cn.noteId)
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

async function saveSession(
  noteId: string,
  command: string,
  inputNoteIds: string[],
  results: ConnectResult[]
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
