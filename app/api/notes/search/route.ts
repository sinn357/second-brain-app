import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 검색어 주변 컨텍스트 추출 (50자)
function extractContext(text: string, query: string, contextLength = 50): string {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) {
    // 검색어가 없으면 처음 100자 반환
    return text.substring(0, 100) + '...'
  }

  const start = Math.max(0, index - contextLength)
  const end = Math.min(text.length, index + query.length + contextLength)

  let context = text.substring(start, end)

  if (start > 0) context = '...' + context
  if (end < text.length) context = context + '...'

  return context
}

// GET /api/notes/search - 노트 검색 (제목 또는 본문)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const title = searchParams.get('title')
    const folderId = searchParams.get('folderId')
    const tagId = searchParams.get('tagId')

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

    // 필터 조건 구성
    const whereConditions: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
      ],
    }

    // 폴더 필터
    if (folderId) {
      whereConditions.folderId = folderId
    }

    // 태그 필터
    if (tagId) {
      whereConditions.tags = {
        some: {
          tagId,
        },
      }
    }

    // 제목 또는 본문에서 검색
    const notes = await prisma.note.findMany({
      where: whereConditions,
      select: {
        id: true,
        title: true,
        body: true,
        updatedAt: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20, // 결과 수 증가
    })

    // 검색 결과에 컨텍스트 추가
    const notesWithContext = notes.map((note) => ({
      ...note,
      context: extractContext(note.body, query),
      matchInTitle: note.title.toLowerCase().includes(query.toLowerCase()),
    }))

    // 제목 매칭 우선 정렬
    notesWithContext.sort((a, b) => {
      if (a.matchInTitle && !b.matchInTitle) return -1
      if (!a.matchInTitle && b.matchInTitle) return 1
      return 0
    })

    return NextResponse.json({ success: true, notes: notesWithContext })
  } catch (error) {
    console.error('GET /api/notes/search error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
