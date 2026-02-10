import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = String(body?.id || '')
    const action = body?.action as 'done' | 'snooze' | undefined
    const days = Number(body?.days ?? 3)

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'id와 action이 필요합니다' },
        { status: 400 }
      )
    }

    if (action === 'done') {
      const updated = await prisma.incubationQuestion.update({
        where: { id },
        data: {
          status: 'done',
          reviewedAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, question: updated })
    }

    const reviewAt = new Date(Date.now() + Math.max(days, 1) * 24 * 60 * 60 * 1000)
    const updated = await prisma.incubationQuestion.update({
      where: { id },
      data: {
        status: 'open',
        reviewAt,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, question: updated })
  } catch (error) {
    console.error('POST /api/notes/incubation/resolve error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
