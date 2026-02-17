import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { openai } from '@/lib/openai'
import { Prisma } from '@prisma/client'

interface SemanticPick {
  id: string
  reason: string
  context?: string
}

function buildCandidateSnippet(text: string, limit = 220) {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return normalized.slice(0, limit) + '...'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const folderId = searchParams.get('folderId') || undefined
    const tagId = searchParams.get('tagId') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter required' },
        { status: 400 }
      )
    }

    const andConditions: Prisma.NoteWhereInput[] = []

    if (folderId) {
      andConditions.push({ folderId })
    }

    if (tagId) {
      andConditions.push({
        tags: {
          some: { tagId },
        },
      })
    }

    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter<'Note'> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      andConditions.push({ createdAt: dateFilter })
    }

    const whereConditions: Prisma.NoteWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {}

    const candidates = await prisma.note.findMany({
      where: whereConditions,
      select: {
        id: true,
        title: true,
        body: true,
        updatedAt: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, notes: [] })
    }

    if (!process.env.OPENAI_API_KEY) {
      const fallback = candidates.slice(0, 5).map((note) => ({
        ...note,
        context: buildCandidateSnippet(note.body),
      }))
      return NextResponse.json({ success: true, notes: fallback })
    }

    const candidatePayload = candidates.map((note) => ({
      id: note.id,
      title: note.title,
      snippet: buildCandidateSnippet(note.body),
    }))

    const prompt = `사용자 질의와 의미적으로 가장 가까운 노트를 5개 이하로 골라주세요.

질의: ${query}

후보 노트 목록:
${candidatePayload
      .map((note) => `- id: ${note.id}\n  제목: ${note.title}\n  내용: ${note.snippet}`)
      .join('\n')}

다음 형식으로 응답하세요 (JSON):
{
  "results": [
    { "id": "노트 id", "reason": "왜 관련 있는지 한 문장", "context": "핵심 발췌" }
  ]
}

규칙:
- 최대 5개
- 평가나 결론 금지
- reason은 한 문장
- context는 후보 내용 중 핵심 한 문장`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 노트 검색을 돕는 도우미입니다. 간결하게 응답하세요.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 700,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('AI 응답 없음')
    }

    const parsed = JSON.parse(content)
    const results: SemanticPick[] = Array.isArray(parsed?.results) ? parsed.results : []

    const noteMap = new Map(candidates.map((note) => [note.id, note]))

    const notes = results
      .map((pick) => {
        const note = noteMap.get(pick.id)
        if (!note) return null
        return {
          ...note,
          context: pick.context || pick.reason || buildCandidateSnippet(note.body),
          semanticReason: pick.reason,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('GET /api/notes/semantic-search error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
