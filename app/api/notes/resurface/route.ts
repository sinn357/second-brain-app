import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getContextualNotes } from '@/lib/thinking/contextStack'

function daysAgo(date: Date, now: Date) {
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const noteId = body?.noteId as string | undefined

    const now = new Date()

    const linkCounts = await prisma.link.groupBy({
      by: ['sourceId'],
      _count: { sourceId: true },
    })

    const linkMap = new Map(linkCounts.map((row) => [row.sourceId, row._count.sourceId]))

    const staleNotes = await prisma.note.findMany({
      where: {
        updatedAt: { lt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60) }, // 60 days
      },
      select: { id: true, title: true, body: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
      take: 20,
    })

    const staleImportant = staleNotes
      .map((note) => ({
        ...note,
        linkCount: linkMap.get(note.id) || 0,
      }))
      .sort((a, b) => b.linkCount - a.linkCount)
      .slice(0, 3)
      .map((note) => ({
        id: note.id,
        title: note.title,
        reason: `${daysAgo(new Date(note.updatedAt), now)}일 전 업데이트 · 링크 ${note.linkCount}개`,
      }))

    let anchorNoteId = noteId
    if (!anchorNoteId) {
      const latest = await prisma.note.findFirst({
        select: { id: true },
        orderBy: { updatedAt: 'desc' },
      })
      anchorNoteId = latest?.id
    }

    let relatedToCurrent: Array<{ id: string; title: string; reason: string }> = []
    if (anchorNoteId) {
      const context = await getContextualNotes({
        currentNoteId: anchorNoteId,
        recentNoteIds: [],
        limit: 5,
      })
      relatedToCurrent = context.notes.slice(0, 3).map((note) => ({
        id: note.noteId,
        title: note.title,
        reason: note.reason,
      }))
    }

    const incompleteCandidates = await prisma.note.findMany({
      select: { id: true, title: true, body: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
      take: 50,
    })

    const incomplete = incompleteCandidates
      .filter((note) => (note.body || '').trim().length < 120)
      .slice(0, 3)
      .map((note) => ({
      id: note.id,
      title: note.title,
      reason: `짧은 노트 · ${daysAgo(new Date(note.updatedAt), now)}일 전`,
      }))

    return NextResponse.json({
      success: true,
      sections: {
        staleImportant,
        relatedToCurrent,
        incomplete,
      },
    })
  } catch (error) {
    console.error('POST /api/notes/resurface error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
