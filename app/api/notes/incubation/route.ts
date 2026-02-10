import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ready'
    const now = new Date()

    const questions = await prisma.incubationQuestion.findMany({
      where: {
        status: status === 'ready' ? { in: ['open', 'ready'] } : status,
        ...(status === 'ready' ? { reviewAt: { lte: now } } : {}),
      },
      orderBy: { reviewAt: 'asc' },
      take: 20,
    })

    const noteIds = questions.flatMap((q) => q.noteIds)
    const notes = await prisma.note.findMany({
      where: { id: { in: noteIds } },
      select: { id: true, title: true },
    })
    const noteMap = new Map(notes.map((note) => [note.id, note]))

    const result = questions.map((q) => ({
      id: q.id,
      question: q.question,
      noteIds: q.noteIds,
      status: q.status,
      createdAt: q.createdAt,
      reviewAt: q.reviewAt,
      notes: q.noteIds
        .map((id) => noteMap.get(id))
        .filter(Boolean)
        .map((note) => ({ id: note!.id, title: note!.title })),
    }))

    return NextResponse.json({ success: true, questions: result })
  } catch (error) {
    console.error('GET /api/notes/incubation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = String(body?.question || '').trim()
    const noteIds: string[] = Array.isArray(body?.noteIds) ? body.noteIds : []
    const days = Number(body?.days ?? 3)

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'question이 필요합니다' },
        { status: 400 }
      )
    }

    const reviewAt = new Date(Date.now() + Math.max(days, 1) * 24 * 60 * 60 * 1000)

    const created = await prisma.incubationQuestion.create({
      data: {
        question,
        noteIds,
        status: 'open',
        reviewAt,
      },
    })

    return NextResponse.json({ success: true, question: created })
  } catch (error) {
    console.error('POST /api/notes/incubation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
