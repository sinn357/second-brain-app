import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { openai } from '@/lib/openai'

function buildSnippet(text: string, limit = 260) {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return normalized.slice(0, limit) + '...'
}

function formatToMarkdown(data: {
  question: string
  concepts: string[]
  notes: Array<{ title: string }>
  gaps: string[]
}) {
  const concepts = data.concepts.map((c) => `- ${c}`).join('\n')
  const notes = data.notes.map((n) => `- [[${n.title}]]`).join('\n')
  const gaps = data.gaps.map((g) => `- ${g}`).join('\n')

  return `질문: "${data.question}"

## 당신의 지식 요약

### 핵심 개념
${concepts}

### 관련 노트
${notes}

### 아직 탐구하지 않은 영역
${gaps}

※ 이것은 노트 기반 요약이며, AI의 판단이 아닙니다.`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = String(body?.question || '').trim()

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'question이 필요합니다' },
        { status: 400 }
      )
    }

    const candidates = await prisma.note.findMany({
      select: { id: true, title: true, body: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        result: `질문: "${question}"\n\n현재 노트가 없습니다. 먼저 노트를 작성해 주세요.`,
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      const fallbackNotes = candidates.slice(0, 5).map((note) => ({ title: note.title }))
      const result = formatToMarkdown({
        question,
        concepts: ['최근 노트에서 추출된 핵심 개념을 확인하세요'],
        notes: fallbackNotes,
        gaps: ['아직 충분한 노트 데이터가 없습니다'],
      })
      return NextResponse.json({ success: true, result })
    }

    const candidatePayload = candidates.map((note) => ({
      id: note.id,
      title: note.title,
      snippet: buildSnippet(note.body),
    }))

    const prompt = `사용자의 질문에 대해 사용자의 노트에서 핵심 개념과 관련 노트를 요약해 주세요.

질문: ${question}

후보 노트 목록:
${candidatePayload
      .map((note) => `- id: ${note.id}\n  제목: ${note.title}\n  내용: ${note.snippet}`)
      .join('\n')}

다음 형식으로 응답하세요 (JSON):
{
  "concepts": ["핵심 개념 1", "핵심 개념 2"],
  "notes": [
    { "id": "노트 id", "title": "노트 제목" }
  ],
  "gaps": ["아직 탐구하지 않은 영역 1", "영역 2"]
}

규칙:
- 최대 5개 노트
- 결론/판단 금지
- 질문에 대한 답이 아니라 요약
- gaps는 부족한 관점만 제시`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 사용자의 노트를 요약해주는 도우미입니다. 간결하게 답하세요.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 700,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('AI 응답 없음')

    const parsed = JSON.parse(content)
    const concepts = Array.isArray(parsed?.concepts) ? parsed.concepts : []
    const notes = Array.isArray(parsed?.notes) ? parsed.notes : []
    const gaps = Array.isArray(parsed?.gaps) ? parsed.gaps : []

    const result = formatToMarkdown({
      question,
      concepts,
      notes,
      gaps,
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('POST /api/notes/ask-my-brain error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
