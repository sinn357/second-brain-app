import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { openai } from '@/lib/openai'

function buildSnippet(text: string, limit = 180) {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return normalized.slice(0, limit) + '...'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const keyword = String(body?.keyword || '').trim()

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'keyword가 필요합니다' },
        { status: 400 }
      )
    }

    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { body: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, body: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 30,
    })

    if (notes.length === 0) {
      return NextResponse.json({ success: true, result: '' })
    }

    if (!process.env.OPENAI_API_KEY) {
      const timeline = notes.slice(0, 5).map((note) => (
        `### ${note.title}\n> ${buildSnippet(note.body)}`
      ))
      const fallback = `## 시간 여행: "${keyword}"\n\n${timeline.join('\n\n')}\n\n### 변화 패턴\n- 변화를 확인해보세요\n\n### 탐구 질문\n- 이 변화의 계기는 무엇이었나?\n- 다음 진화 방향은?`
      return NextResponse.json({ success: true, result: fallback })
    }

    const prompt = `다음 노트들을 시간 순으로 정리해 생각의 변화 흐름을 요약해 주세요.\n\n키워드: ${keyword}\n\n노트 목록 (오래된 순):\n${notes
      .map((note) => `- 제목: ${note.title}\n  작성일: ${note.createdAt.toISOString().slice(0, 10)}\n  내용: ${buildSnippet(note.body)}`)
      .join('\n')}\n\n다음 형식으로 마크다운으로 응답하세요:\n## 시간 여행: "${keyword}"\n\n### 1년 전\n> ...\n\n### 6개월 전\n> ...\n\n### 현재\n> ...\n\n### 변화 패턴\n- ...\n\n### 탐구 질문\n- ...\n\n규칙:\n- 결론/판단 금지\n- 실제 노트에서 요약한 문장만 사용`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 노트의 시간 변화 흐름을 요약하는 도우미입니다.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 700,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('AI 응답 없음')

    return NextResponse.json({ success: true, result: content })
  } catch (error) {
    console.error('POST /api/notes/time-capsule error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
