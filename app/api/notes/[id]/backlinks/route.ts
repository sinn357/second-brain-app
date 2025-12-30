import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 링크 주변 컨텍스트 추출
function extractLinkContext(body: string, targetTitle: string, contextLength = 50): string[] {
  const contexts: string[] = []
  const linkPattern = new RegExp(`\\[\\[${targetTitle}\\]\\]`, 'gi')
  let match

  while ((match = linkPattern.exec(body)) !== null) {
    const start = Math.max(0, match.index - contextLength)
    const end = Math.min(body.length, match.index + match[0].length + contextLength)

    let context = body.substring(start, end)
    if (start > 0) context = '...' + context
    if (end < body.length) context = context + '...'

    contexts.push(context)
  }

  return contexts
}

// GET /api/notes/[id]/backlinks - 백링크 조회 (컨텍스트 포함)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 현재 노트 조회 (제목 필요)
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

    // 해당 노트를 타겟으로 하는 링크들 조회
    const backlinks = await prisma.link.findMany({
      where: { targetId: id },
      include: {
        source: {
          select: {
            id: true,
            title: true,
            body: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    // 노트별로 그룹화하고 컨텍스트 추출
    const noteMap = new Map()

    backlinks.forEach((link) => {
      const sourceId = link.source.id
      const contexts = extractLinkContext(link.source.body, currentNote.title)

      if (noteMap.has(sourceId)) {
        noteMap.get(sourceId).contexts.push(...contexts)
      } else {
        noteMap.set(sourceId, {
          ...link.source,
          contexts,
          mentionCount: contexts.length,
        })
      }
    })

    const notesWithContext = Array.from(noteMap.values())

    return NextResponse.json({ success: true, backlinks: notesWithContext })
  } catch (error) {
    console.error('GET /api/notes/[id]/backlinks error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
