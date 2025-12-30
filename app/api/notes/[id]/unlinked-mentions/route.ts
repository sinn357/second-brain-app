import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 언급 주변 컨텍스트 추출
function extractMentionContext(body: string, title: string, contextLength = 50): string[] {
  const contexts: string[] = []
  const lowerBody = body.toLowerCase()
  const lowerTitle = title.toLowerCase()

  let index = 0
  while ((index = lowerBody.indexOf(lowerTitle, index)) !== -1) {
    // [[title]] 형식인지 확인 (링크된 것은 제외)
    const beforeLink = body.substring(Math.max(0, index - 2), index)
    const afterLink = body.substring(index + title.length, index + title.length + 2)

    const isLinked = beforeLink === '[[' && afterLink === ']]'

    if (!isLinked) {
      const start = Math.max(0, index - contextLength)
      const end = Math.min(body.length, index + title.length + contextLength)

      let context = body.substring(start, end)
      if (start > 0) context = '...' + context
      if (end < body.length) context = context + '...'

      contexts.push(context)
    }

    index += title.length
  }

  return contexts
}

// GET /api/notes/[id]/unlinked-mentions - Unlinked Mentions 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 현재 노트 조회
    const currentNote = await prisma.note.findUnique({
      where: { id },
      select: { title: true },
    })

    if (!currentNote) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    // 제목이 너무 짧으면 검색하지 않음 (오탐 방지)
    if (currentNote.title.length < 3) {
      return NextResponse.json({ success: true, unlinkedMentions: [] })
    }

    // 현재 노트를 제외한 모든 노트 조회
    const allNotes = await prisma.note.findMany({
      where: {
        id: { not: id },
      },
      select: {
        id: true,
        title: true,
        body: true,
        updatedAt: true,
      },
    })

    // 제목이 언급된 노트 찾기 (링크되지 않은 것만)
    const unlinkedMentions = allNotes
      .map((note) => {
        const contexts = extractMentionContext(note.body, currentNote.title)

        if (contexts.length > 0) {
          return {
            id: note.id,
            title: note.title,
            body: note.body,
            updatedAt: note.updatedAt,
            contexts,
            mentionCount: contexts.length,
          }
        }
        return null
      })
      .filter((note) => note !== null)

    return NextResponse.json({ success: true, unlinkedMentions })
  } catch (error) {
    console.error('GET /api/notes/[id]/unlinked-mentions error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
