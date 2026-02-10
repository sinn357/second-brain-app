import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { openai } from '@/lib/openai'

function buildSnippet(text: string, limit = 200) {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return normalized.slice(0, limit) + '...'
}

function fallbackMarkdown(titleList: string[]) {
  const titles = titleList.map((title) => `- [[${title}]]`).join('\n')
  return `## 지식 빈틈 분석\n\n### 약한 연결\n- 노트 간 연결이 충분하지 않은 영역이 있습니다\n\n### 빠진 주제\n- 아직 다루지 않은 주제를 탐색해보세요\n\n### 답하지 않은 질문\n- 핵심 질문이 남아있습니다\n\n### 제안\n- 새로운 노트를 추가하거나 기존 노트를 확장하세요\n\n## 참고 노트\n${titles}\n\n※ 이것은 노트 기반 요약이며, AI의 판단이 아닙니다.`
}

export async function POST() {
  try {
    const notes = await prisma.note.findMany({
      select: { id: true, title: true, body: true },
      orderBy: { updatedAt: 'desc' },
      take: 40,
    })

    if (notes.length === 0) {
      return NextResponse.json({ success: true, result: '' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: true,
        result: fallbackMarkdown(notes.slice(0, 5).map((note) => note.title)),
      })
    }

    const prompt = `다음 노트들을 보고 지식의 빈틈(부족한 연결, 빠진 주제)을 찾아주세요.\n\n노트 목록:\n${notes
      .map((note) => `- 제목: ${note.title}\n  내용: ${buildSnippet(note.body)}`)
      .join('\n')}\n\n다음 형식으로 마크다운으로 응답하세요:\n## 지식 빈틈 분석\n\n### 약한 연결\n- ...\n\n### 빠진 주제\n- ...\n\n### 답하지 않은 질문\n- ...\n\n### 제안\n- ...\n\n규칙:\n- 결론/판단 금지\n- 질문/제안 형태 유지\n- 간결하게`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 사용자의 지식 빈틈을 찾아주는 도우미입니다.',
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
    console.error('POST /api/notes/knowledge-gap error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
