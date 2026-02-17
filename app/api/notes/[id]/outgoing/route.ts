import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function extractWikiLinks(body: string) {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g
  const titles: string[] = []

  let match: RegExpExecArray | null
  while ((match = wikiLinkRegex.exec(body)) !== null) {
    const title = (match[1] ?? '').trim()
    if (title) titles.push(title)
  }

  return Array.from(new Set(titles))
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    void request
    const { id } = await params

    const note = await prisma.note.findUnique({
      where: { id },
      select: { id: true, body: true },
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

    const existingTitles = new Set<string>()
    const links = outgoingLinks.map((link) => {
      const title = link.target.title || '제목 없음'
      existingTitles.add(title)
      return {
        id: link.target.id,
        title,
        exists: true,
      }
    })

    const rawWikiLinks = extractWikiLinks(note.body ?? '')
    const missingLinks = rawWikiLinks
      .filter((title) => !existingTitles.has(title))
      .map((title) => ({
        id: `missing:${title}`,
        title,
        exists: false,
      }))

    return NextResponse.json({
      success: true,
      links: [...links, ...missingLinks],
    })
  } catch (error) {
    console.error('GET /api/notes/[id]/outgoing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
