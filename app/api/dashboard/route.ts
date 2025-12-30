import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/dashboard - 통계 대시보드 데이터
export async function GET() {
  try {
    // 1. 전체 개수 통계
    const [totalNotes, totalFolders, totalTags, totalLinks] = await Promise.all([
      prisma.note.count(),
      prisma.folder.count(),
      prisma.tag.count(),
      prisma.link.count(),
    ])

    // 2. 최근 7일 활동 (작성/수정)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentNotes = await prisma.note.findMany({
      where: {
        OR: [
          { createdAt: { gte: sevenDaysAgo } },
          { updatedAt: { gte: sevenDaysAgo } },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 날짜별 활동 집계
    const activityByDate = new Map<string, { created: number; updated: number }>()
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last7Days.push(dateStr)
      activityByDate.set(dateStr, { created: 0, updated: 0 })
    }

    recentNotes.forEach((note) => {
      const createdDate = note.createdAt.toISOString().split('T')[0]
      const updatedDate = note.updatedAt.toISOString().split('T')[0]

      if (activityByDate.has(createdDate)) {
        const existing = activityByDate.get(createdDate)!
        activityByDate.set(createdDate, { ...existing, created: existing.created + 1 })
      }

      if (updatedDate !== createdDate && activityByDate.has(updatedDate)) {
        const existing = activityByDate.get(updatedDate)!
        activityByDate.set(updatedDate, { ...existing, updated: existing.updated + 1 })
      }
    })

    const recentActivity = last7Days.map((date) => ({
      date,
      ...activityByDate.get(date)!,
    }))

    // 3. Top 10 연결된 노트 (링크 수 기준)
    const notesWithLinks = await prisma.note.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            linksFrom: true,
            linksTo: true,
          },
        },
      },
    })

    const topConnectedNotes = notesWithLinks
      .map((note) => ({
        id: note.id,
        title: note.title,
        totalLinks: note._count.linksFrom + note._count.linksTo,
      }))
      .filter((note) => note.totalLinks > 0)
      .sort((a, b) => b.totalLinks - a.totalLinks)
      .slice(0, 10)

    // 4. 폴더별 노트 분포
    const folderDistribution = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            notes: true,
          },
        },
      },
    })

    const folderStats = folderDistribution
      .map((folder) => ({
        id: folder.id,
        name: folder.name,
        count: folder._count.notes,
      }))
      .filter((f) => f.count > 0)
      .sort((a, b) => b.count - a.count)

    // 폴더 없는 노트 수
    const notesWithoutFolder = await prisma.note.count({
      where: { folderId: null },
    })

    if (notesWithoutFolder > 0) {
      folderStats.push({
        id: 'null',
        name: 'No Folder',
        count: notesWithoutFolder,
      })
    }

    return NextResponse.json({
      success: true,
      dashboard: {
        totals: {
          notes: totalNotes,
          folders: totalFolders,
          tags: totalTags,
          links: totalLinks,
        },
        recentActivity,
        topConnectedNotes,
        folderDistribution: folderStats,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
