import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/notes/[id]/backlinks - 백링크 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    const notes = backlinks.map((link) => link.source)

    return NextResponse.json({ success: true, backlinks: notes })
  } catch (error) {
    console.error('GET /api/notes/[id]/backlinks error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
