import { NextResponse } from 'next/server'
import { noteSchema } from '@/lib/validations/note'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/notes - 노트 목록 조회 (커서 기반 페이지네이션)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sortBy = searchParams.get('sortBy') || 'title'
    const orderParam = searchParams.get('order')

    const folderFilter = folderId ? { folderId } : {}
    const includeConfig = {
      folder: true,
      tags: {
        include: {
          tag: true,
        },
      },
    }

    const defaultOrder: Prisma.SortOrder =
      sortBy === 'title' || sortBy === 'manual' ? 'asc' : 'desc'
    const order: Prisma.SortOrder =
      orderParam === 'asc' || orderParam === 'desc' ? orderParam : defaultOrder

    const orderBy = (() => {
      switch (sortBy) {
        case 'updated':
          return [{ updatedAt: order }, { title: 'asc' as const }]
        case 'opened':
          return [
            { lastOpenedAt: { sort: order, nulls: 'last' } },
            { updatedAt: 'desc' },
          ]
        case 'created':
          return [{ createdAt: order }, { title: 'asc' as const }]
        case 'manual':
          return [{ manualOrder: order }, { title: 'asc' as const }]
        case 'title':
        default:
          return [{ title: order }, { id: 'asc' as const }]
      }
    })()

    // 노트는 커서 기반 페이지네이션
    const notes = await prisma.note.findMany({
      where: { ...folderFilter },
      take: limit + 1, // 다음 페이지 존재 여부 확인용
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // 커서 아이템 스킵
      }),
      orderBy,
      include: includeConfig,
    })

    // 다음 페이지 존재 여부 확인
    const hasMore = notes.length > limit
    const paginatedNotes = hasMore ? notes.slice(0, limit) : notes
    const nextCursor = hasMore ? paginatedNotes[paginatedNotes.length - 1]?.id : null

    return NextResponse.json({
      success: true,
      notes: paginatedNotes,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error('GET /api/notes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/notes - 노트 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Zod 검증
    const validated = noteSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validated.error.format()
        },
        { status: 400 }
      )
    }

    const data = validated.data

    // 노트 생성
    const note = await prisma.note.create({
      data,
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, note }, { status: 201 })
  } catch (error) {
    console.error('POST /api/notes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
