import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

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
    const sortBy = searchParams.get('sortBy') || ''
    const orderParam = searchParams.get('order')

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
    const andConditions: Prisma.NoteWhereInput[] = []

    // 검색 조건 (정규식 모드는 나중에 JavaScript로 필터링)
    if (mode === 'normal') {
      andConditions.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      })
    }

    // 폴더 필터
    if (folderId) {
      andConditions.push({ folderId })
    }

    // 태그 필터
    if (tagId) {
      andConditions.push({
        tags: {
          some: { tagId },
        },
      })
    }

    // 날짜 범위 필터
    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter<'Note'> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      andConditions.push({ createdAt: dateFilter })
    }

    const whereConditions: Prisma.NoteWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {}

    const defaultOrder: Prisma.SortOrder =
      sortBy === 'title' || sortBy === 'manual' ? 'asc' : 'desc'
    const order: Prisma.SortOrder =
      orderParam === 'asc' || orderParam === 'desc' ? orderParam : defaultOrder
    const hasSort = sortBy.length > 0

    const orderBy: Prisma.NoteOrderByWithRelationInput[] = (() => {
      switch (sortBy) {
        case 'updated':
          return [{ updatedAt: order }, { title: 'asc' as const }]
        case 'opened':
          return [
            { lastOpenedAt: { sort: order, nulls: Prisma.NullsOrder.last } },
            { updatedAt: Prisma.SortOrder.desc },
          ]
        case 'created':
          return [{ createdAt: order }, { title: 'asc' as const }]
        case 'manual':
          return [{ manualOrder: order }, { title: 'asc' as const }]
        case 'title':
          return [{ title: order }, { id: 'asc' as const }]
        default:
          return [{ updatedAt: 'desc' as const }]
      }
    })()

    // 제목 또는 본문에서 검색
    let notes = await prisma.note.findMany({
      where: whereConditions,
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        lastOpenedAt: true,
        manualOrder: true,
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
      orderBy,
      take: mode === 'regex' ? 1000 : 20, // 정규식 모드에서는 더 많이 가져옴
    })

    // 정규식 검색 모드
    if (mode === 'regex') {
      try {
        const regex = new RegExp(query, 'i')
        notes = notes.filter(
          (note) => regex.test(note.title) || regex.test(note.body)
        ).slice(0, 20)
      } catch {
        return NextResponse.json(
          { success: false, error: '잘못된 정규식입니다' },
          { status: 400 }
        )
      }
    }

    if (mode === 'regex' && hasSort) {
      notes.sort((a, b) => {
        const direction = order === 'asc' ? 1 : -1
        switch (sortBy) {
          case 'title':
            return a.title.localeCompare(b.title) * direction
          case 'created':
            return (a.createdAt.getTime() - b.createdAt.getTime()) * direction
          case 'updated':
            return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction
          case 'opened': {
            const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0
            const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0
            return (aTime - bTime) * direction
          }
          case 'manual':
            return (a.manualOrder - b.manualOrder) * direction
          default:
            return 0
        }
      })
    }

    // 검색 결과에 컨텍스트 추가
    const notesWithContext = notes.map((note) => ({
      ...note,
      context: extractContext(note.body, query),
      matchInTitle: note.title.toLowerCase().includes(query.toLowerCase()),
    }))

    if (!hasSort) {
      // 제목 매칭 우선 정렬
      notesWithContext.sort((a, b) => {
        if (a.matchInTitle && !b.matchInTitle) return -1
        if (!a.matchInTitle && b.matchInTitle) return 1
        return 0
      })
    }

    return NextResponse.json({ success: true, notes: notesWithContext })
  } catch (error) {
    console.error('GET /api/notes/search error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
