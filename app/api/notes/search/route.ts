import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/notes/search - 노트 검색 (제목 또는 본문)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const title = searchParams.get('title')

    if (title) {
      // 제목으로 정확히 찾기 (링크 미리보기용)
      const note = await prisma.note.findFirst({
        where: { title },
        select: {
          id: true,
          title: true,
          body: true,
        },
      })

      return NextResponse.json({ success: true, note })
    }

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter required' },
        { status: 400 }
      )
    }

    // 제목 또는 본문에서 검색
    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        body: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('GET /api/notes/search error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
