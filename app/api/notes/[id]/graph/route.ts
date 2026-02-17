import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    void request
    const { id } = await params

    const note = await prisma.note.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    const outgoingLinks = await prisma.link.findMany({
      where: { sourceId: id },
      include: {
        target: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    const incomingLinks = await prisma.link.findMany({
      where: { targetId: id },
      include: {
        source: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    const linkMap = new Map<
      string,
      { id: string; title: string; direction: 'outgoing' | 'incoming' }
    >()

    outgoingLinks.forEach((link) => {
      linkMap.set(link.target.id, {
        id: link.target.id,
        title: link.target.title || '제목 없음',
        direction: 'outgoing',
      })
    })

    incomingLinks.forEach((link) => {
      if (linkMap.has(link.source.id)) return
      linkMap.set(link.source.id, {
        id: link.source.id,
        title: link.source.title || '제목 없음',
        direction: 'incoming',
      })
    })

    return NextResponse.json({
      success: true,
      links: Array.from(linkMap.values()),
    })
  } catch (error) {
    console.error('GET /api/notes/[id]/graph error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
