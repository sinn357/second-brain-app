import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { openai } from '@/lib/openai'

function buildSnippet(text: string, limit = 260) {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return normalized.slice(0, limit) + '...'
}

function fallbackMarkdown(titles: string[]) {
  const titleLines = titles.map((title) => `- [[${title}]]`).join('\n')
  return `## 종합 분석 (${titles.length}개 노트)

### 공통점
- 공통 개념을 아직 충분히 찾지 못했습니다

### 차이점
- 관점의 차이를 정리해보세요

### 빠진 연결
- 누락된 연결 고리가 있는지 확인하세요

### 결합 가능 아이디어
> 새로운 개념을 결합해보세요

### 다음 탐구 질문
- 이 노트들을 하나로 묶는 전제는?
- 어떤 상황에서 각 관점이 유효한가?

## 결합 대상
${titleLines}

※ 이것은 노트 기반 요약이며, AI의 판단이 아닙니다.`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const noteIds: string[] = Array.isArray(body?.noteIds) ? body.noteIds : []

    if (noteIds.length < 3) {
      return NextResponse.json(
        { success: false, error: '최소 3개의 노트가 필요합니다' },
        { status: 400 }
      )
    }

    const notes = await prisma.note.findMany({
      where: { id: { in: noteIds } },
      select: { id: true, title: true, body: true },
    })

    if (notes.length === 0) {
      return NextResponse.json({ success: true, result: '' })
    }

    const titles = notes.map((note) => note.title)

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: true, result: fallbackMarkdown(titles) })
    }

    const prompt = `다음 노트들을 종합 분석해 주세요.

노트 목록:
${notes
      .map(
        (note) => `- 제목: ${note.title}\n  내용: ${buildSnippet(note.body)}`
      )
      .join('\n')}

다음 형식의 마크다운으로 응답하세요:
## 종합 분석 (${notes.length}개 노트)

### 공통점
- ...

### 차이점
| 노트 | 관점 |
| --- | --- |
| 노트 A | ... |

### 빠진 연결
- ...

### 결합 가능 아이디어
> ...

### 다음 탐구 질문
- ...

## 결합 대상
- [[노트 A]]
- [[노트 B]]

규칙:
- 결론/판단 금지
- 질문 형태 유지
- 간결하게`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 사용자의 노트를 종합해 재료를 제공하는 도우미입니다.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 900,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('AI 응답 없음')

    return NextResponse.json({ success: true, result: content })
  } catch (error) {
    console.error('POST /api/notes/synthesis error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
