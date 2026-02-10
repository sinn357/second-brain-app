import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { openai } from '@/lib/openai'

function pickTwoDistinct<T>(items: T[]): [T, T] | null {
  if (items.length < 2) return null
  const firstIndex = Math.floor(Math.random() * items.length)
  let secondIndex = Math.floor(Math.random() * items.length)
  while (secondIndex === firstIndex) {
    secondIndex = Math.floor(Math.random() * items.length)
  }
  return [items[firstIndex], items[secondIndex]]
}

function buildSnippet(text: string, limit = 200) {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return normalized.slice(0, limit) + '...'
}

function fallbackMarkdown(a: string, b: string) {
  return `## 우연한 연결\n\n### 오늘의 조합\n📄 [[${a}]] + 📄 [[${b}]]\n\n### 가능한 연결점\n- 둘 다 "+공통 요소"를 다룹니다\n- 서로 다른 맥락에서 같은 문제를 다룹니다\n- 연결 가능 키워드가 있습니다\n\n### 탐구 질문\n- ${a}의 개념을 ${b}에 적용하면?\n- ${b}의 방법을 ${a}에 적용하면?\n- 두 관점이 충돌하는 지점은?`
}

export async function POST() {
  try {
    const notes = await prisma.note.findMany({
      select: { id: true, title: true, body: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    const pair = pickTwoDistinct(notes)
    if (!pair) {
      return NextResponse.json({ success: true, result: '' })
    }

    const [first, second] = pair

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: true,
        result: fallbackMarkdown(first.title, second.title),
        noteIds: [first.id, second.id],
      })
    }

    const prompt = `다음 두 노트의 예상치 못한 연결점을 찾아주세요.\n\n노트 A: ${first.title}\n내용: ${buildSnippet(first.body)}\n\n노트 B: ${second.title}\n내용: ${buildSnippet(second.body)}\n\n다음 형식으로 마크다운으로 응답하세요:\n## 우연한 연결\n\n### 오늘의 조합\n📄 [[노트 A]] + 📄 [[노트 B]]\n\n### 가능한 연결점\n- ...\n- ...\n\n### 탐구 질문\n- ...\n- ...\n\n규칙:\n- 결론 금지\n- 질문 형태 유지\n- 간결하게`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 예상치 못한 연결을 제시하는 도우미입니다.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 600,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('AI 응답 없음')

    return NextResponse.json({
      success: true,
      result: content,
      noteIds: [first.id, second.id],
    })
  } catch (error) {
    console.error('POST /api/notes/random-spark error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
