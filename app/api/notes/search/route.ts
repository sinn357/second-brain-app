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
    const mode = searchParams.get('mode') || 'normal' // 'normal' | 'regex'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

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
      AND: [],
    }

    // 검색 조건 (정규식 모드는 나중에 JavaScript로 필터링)
    if (mode === 'normal') {
      whereConditions.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      })
    }

    // 폴더 필터
    if (folderId) {
      whereConditions.AND.push({ folderId })
    }

    // 태그 필터
    if (tagId) {
      whereConditions.AND.push({
        tags: {
          some: { tagId },
        },
      })
    }

    // 날짜 범위 필터
    if (dateFrom || dateTo) {
      const dateFilter: any = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      whereConditions.AND.push({ createdAt: dateFilter })
    }

    // AND 조건이 없으면 제거
    if (whereConditions.AND.length === 0) {
      delete whereConditions.AND
    }

    // 제목 또는 본문에서 검색
    let notes = await prisma.note.findMany({
      where: whereConditions,
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
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
      take: mode === 'regex' ? 1000 : 20, // 정규식 모드에서는 더 많이 가져옴
    })

    // 정규식 검색 모드
    if (mode === 'regex') {
      try {
        const regex = new RegExp(query, 'i')
        notes = notes.filter(
          (note) => regex.test(note.title) || regex.test(note.body)
        ).slice(0, 20)
      } catch (error) {
        return NextResponse.json(
          { success: false, error: '잘못된 정규식입니다' },
          { status: 400 }
        )
      }
    }

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
