import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getContextualNotes } from '@/lib/thinking/contextStack'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { noteId } = body

    if (!noteId) {
      return NextResponse.json({ success: false, error: 'noteId가 필요합니다' }, { status: 400 })
    }

    const currentNote = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, title: true, body: true },
    })

    if (!currentNote) {
      return NextResponse.json({ success: false, error: '노트를 찾을 수 없습니다' }, { status: 404 })
    }

    const existingLinks = await prisma.link.findMany({
      where: { sourceId: noteId },
      select: { targetId: true },
    })

    const existingIds = new Set(existingLinks.map((link) => link.targetId))

    const contextResult = await getContextualNotes({
      currentNoteId: noteId,
      recentNoteIds: [],
      limit: 8,
    })

    const candidateIds = contextResult.notes
      .map((note) => note.noteId)
      .filter((id) => id !== noteId && !existingIds.has(id))

    if (candidateIds.length === 0) {
      return NextResponse.json({ success: true, suggestions: [] })
    }

    const candidates = await prisma.note.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, title: true, body: true },
    })

    const noteMap = new Map(candidates.map((note) => [note.id, note]))

    const suggestions = contextResult.notes
      .filter((note) => candidateIds.includes(note.noteId))
      .slice(0, 3)
      .map((note) => {
        const candidate = noteMap.get(note.noteId)
        return {
          noteId: note.noteId,
          noteTitle: note.title,
          reason: note.reason,
          preview: candidate?.body.slice(0, 120) || '',
        }
      })

    return NextResponse.json({ success: true, suggestions })
  } catch (error) {
    console.error('POST /api/links/suggest error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
