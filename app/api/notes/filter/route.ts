import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildFilterQuery, validateFilter, type FilterGroup } from '@/lib/filterEngine'

/**
 * POST /api/notes/filter
 * 필터 조건에 맞는 노트 조회
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const filters: FilterGroup = body.filters

    // 필터 유효성 검증
    if (!validateFilter(filters)) {
      return NextResponse.json(
        { success: false, error: '잘못된 필터 형식입니다' },
        { status: 400 }
      )
    }

    // 필터를 Prisma 쿼리로 변환
    const whereClause = buildFilterQuery(filters)

    // 노트 조회
    const notes = await prisma.note.findMany({
      where: whereClause,
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
        properties: {
          include: {
            property: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
    })
  } catch (error) {
    console.error('Filter notes error:', error)
    return NextResponse.json(
      { success: false, error: '필터 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
