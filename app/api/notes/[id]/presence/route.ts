import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/notes/[id]/presence - 특정 노트를 보고 있는 사용자 목록
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // 30초 이내에 활동한 presence만 가져오기
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)

    const presences = await prisma.presence.findMany({
      where: {
        noteId: id,
        lastSeenAt: {
          gte: thirtySecondsAgo,
        },
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
      select: {
        id: true,
        sessionId: true,
        userName: true,
        lastSeenAt: true,
      },
    })

    return NextResponse.json({ presences })
  } catch (error) {
    console.error('GET /api/notes/[id]/presence error:', error)
    return NextResponse.json({ error: 'Failed to fetch presences' }, { status: 500 })
  }
}
