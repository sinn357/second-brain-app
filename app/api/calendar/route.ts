import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/calendar - 날짜별 노트 활동 (생성/수정)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // 해당 연도의 시작과 끝
    const startDate = new Date(year, 0, 1) // 1월 1일
    const endDate = new Date(year + 1, 0, 1) // 다음 해 1월 1일

    // 모든 노트 조회 (해당 연도)
    const notes = await prisma.note.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            updatedAt: {
              gte: startDate,
              lt: endDate,
            },
          },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 날짜별 활동 집계
    const activityMap = new Map<string, { created: number; updated: number; total: number }>()

    notes.forEach((note) => {
      // 생성일 집계
      const createdDate = note.createdAt.toISOString().split('T')[0]
      if (createdDate >= startDate.toISOString().split('T')[0] && createdDate < endDate.toISOString().split('T')[0]) {
        const existing = activityMap.get(createdDate) || { created: 0, updated: 0, total: 0 }
        activityMap.set(createdDate, {
          ...existing,
          created: existing.created + 1,
          total: existing.total + 1,
        })
      }

      // 수정일 집계 (생성일과 다른 경우만)
      const updatedDate = note.updatedAt.toISOString().split('T')[0]
      if (
        updatedDate !== createdDate &&
        updatedDate >= startDate.toISOString().split('T')[0] &&
        updatedDate < endDate.toISOString().split('T')[0]
      ) {
        const existing = activityMap.get(updatedDate) || { created: 0, updated: 0, total: 0 }
        activityMap.set(updatedDate, {
          ...existing,
          updated: existing.updated + 1,
          total: existing.total + 1,
        })
      }
    })

    // Map을 배열로 변환
    const activities = Array.from(activityMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }))

    // 날짜순 정렬
    activities.sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      year,
      activities,
    })
  } catch (error) {
    console.error('GET /api/calendar error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
