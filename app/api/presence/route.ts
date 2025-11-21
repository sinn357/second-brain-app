import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Presence 업데이트 스키마
const presenceSchema = z.object({
  noteId: z.string(),
  sessionId: z.string(),
  userName: z.string().max(100),
})

// POST /api/presence - 사용자가 노트를 보고 있음을 기록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = presenceSchema.parse(body)

    // Upsert: 이미 있으면 lastSeenAt 업데이트, 없으면 생성
    const presence = await prisma.presence.upsert({
      where: {
        noteId_sessionId: {
          noteId: data.noteId,
          sessionId: data.sessionId,
        },
      },
      update: {
        userName: data.userName,
        lastSeenAt: new Date(),
      },
      create: {
        noteId: data.noteId,
        sessionId: data.sessionId,
        userName: data.userName,
      },
    })

    return NextResponse.json({ presence })
  } catch (error) {
    console.error('Presence POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 })
  }
}

// DELETE /api/presence - 사용자가 노트를 떠남 (선택적)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')
    const sessionId = searchParams.get('sessionId')

    if (!noteId || !sessionId) {
      return NextResponse.json({ error: 'noteId and sessionId are required' }, { status: 400 })
    }

    await prisma.presence.deleteMany({
      where: {
        noteId,
        sessionId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Presence DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete presence' }, { status: 500 })
  }
}

// Cleanup 오래된 presence (30초 이상 비활성)
// 주기적으로 호출되어야 함 (cron job 또는 클라이언트 요청 시)
export async function GET() {
  try {
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)

    const deleted = await prisma.presence.deleteMany({
      where: {
        lastSeenAt: {
          lt: thirtySecondsAgo,
        },
      },
    })

    return NextResponse.json({ deletedCount: deleted.count })
  } catch (error) {
    console.error('Presence cleanup error:', error)
    return NextResponse.json({ error: 'Failed to cleanup presence' }, { status: 500 })
  }
}
