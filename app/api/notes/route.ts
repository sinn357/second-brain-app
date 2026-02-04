import { NextResponse } from 'next/server'
import { noteSchema } from '@/lib/validations/note'
import { prisma } from '@/lib/db'

// GET /api/notes - 노트 목록 조회 (커서 기반 페이지네이션)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const folderFilter = folderId ? { folderId } : {}
    const includeConfig = {
      folder: true,
      tags: {
        include: {
          tag: true,
        },
      },
    }

    // 첫 페이지일 때만 고정 노트를 별도로 가져옴
    let pinnedNotes: any[] = []
    if (!cursor) {
      pinnedNotes = await prisma.note.findMany({
        where: { isPinned: true, ...folderFilter },
        orderBy: [{ pinnedAt: 'desc' }, { createdAt: 'desc' }],
        include: includeConfig,
      })
    }

    // 일반 노트는 커서 기반 페이지네이션
    const regularNotes = await prisma.note.findMany({
      where: { isPinned: false, ...folderFilter },
      take: limit + 1, // 다음 페이지 존재 여부 확인용
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // 커서 아이템 스킵
      }),
      orderBy: [{ createdAt: 'desc' }],
      include: includeConfig,
    })

    // 다음 페이지 존재 여부 확인
    const hasMore = regularNotes.length > limit
    const paginatedRegularNotes = hasMore ? regularNotes.slice(0, limit) : regularNotes
    const nextCursor = hasMore ? paginatedRegularNotes[paginatedRegularNotes.length - 1]?.id : null

    // 첫 페이지: 고정 노트 + 일반 노트, 이후 페이지: 일반 노트만
    const notes = cursor ? paginatedRegularNotes : [...pinnedNotes, ...paginatedRegularNotes]

    return NextResponse.json({
      success: true,
      notes,
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
