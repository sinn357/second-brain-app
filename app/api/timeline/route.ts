import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/timeline - 시간순 노트 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'all' // all, week, month

    // 날짜 범위 계산
    let dateFilter = {}
    const now = new Date()

    if (range === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      dateFilter = { gte: weekAgo }
    } else if (range === 'month') {
      const monthAgo = new Date(now)
      monthAgo.setMonth(now.getMonth() - 1)
      dateFilter = { gte: monthAgo }
    }

    // 노트 조회 (최신순)
    const notes = await prisma.note.findMany({
      where: Object.keys(dateFilter).length > 0 ? { updatedAt: dateFilter } : {},
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
      orderBy: {
        updatedAt: 'desc',
      },
      take: 100, // 최대 100개
    })

    // 날짜별 그룹화
    const timelineGroups = new Map<string, typeof notes>()

    notes.forEach((note) => {
      const date = note.updatedAt.toISOString().split('T')[0]
      if (!timelineGroups.has(date)) {
        timelineGroups.set(date, [])
      }
      timelineGroups.get(date)!.push(note)
    })

    // Map을 배열로 변환
    const timeline = Array.from(timelineGroups.entries()).map(([date, notes]) => ({
      date,
      notes: notes.map((note) => ({
        id: note.id,
        title: note.title,
        preview: note.body.slice(0, 150),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        folder: note.folder,
        tags: note.tags.map((t) => t.tag),
        isRecentlyModified:
          (now.getTime() - note.updatedAt.getTime()) / (1000 * 60 * 60) < 24, // 24시간 이내
      })),
    }))

    return NextResponse.json({
      success: true,
      timeline,
      range,
      total: notes.length,
    })
  } catch (error) {
    console.error('GET /api/timeline error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
