import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, resultNoteId, saveAs, targetNoteId, userContent, resultTitle } = body

    if (!sessionId || !resultNoteId) {
      return NextResponse.json(
        { error: 'sessionId와 resultNoteId가 필요합니다' },
        { status: 400 }
      )
    }

    const session = await prisma.thinkingSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
    }

    if (session.savedIds.includes(resultNoteId)) {
      return NextResponse.json({ error: '이미 저장된 결과입니다' }, { status: 400 })
    }

    const output = session.output as { results?: Array<{ noteId?: string; content?: string; resultTitle?: string }> }
    const resultEntry = output?.results?.find((result) => result.noteId === resultNoteId)
    const resolvedContent = userContent || resultEntry?.content || ''
    const resolvedTitle = resultTitle || resultEntry?.resultTitle

    let savedNoteId: string

    if (saveAs === 'new_note') {
      const resultNote = await prisma.note.findUnique({
        where: { id: resultNoteId },
        select: { title: true },
      })

      const newNote = await prisma.note.create({
        data: {
          title: resolvedTitle || `연결: ${resultNote?.title || 'Unknown'}`,
          body: resolvedContent,
        },
      })

      savedNoteId = newNote.id

      await prisma.link.create({
        data: {
          sourceId: session.noteId,
          targetId: savedNoteId,
        },
      })
    } else if (saveAs === 'append_to_note' && targetNoteId) {
      const targetNote = await prisma.note.findUnique({
        where: { id: targetNoteId },
      })

      if (!targetNote) {
        return NextResponse.json({ error: '대상 노트를 찾을 수 없습니다' }, { status: 404 })
      }

      await prisma.note.update({
        where: { id: targetNoteId },
        data: {
          body: `${targetNote.body}\n\n${resolvedContent}`,
        },
      })

      savedNoteId = targetNoteId
    } else {
      return NextResponse.json({ error: '잘못된 saveAs 값입니다' }, { status: 400 })
    }

    await prisma.thinkingSession.update({
      where: { id: sessionId },
      data: {
        savedIds: [...session.savedIds, resultNoteId],
      },
    })

    return NextResponse.json({
      success: true,
      savedNoteId,
    })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
