import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/notes/[id]/tags - 노트 본문에서 #태그 파싱하여 자동 연결
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { body } = await request.json()

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Body is required' },
        { status: 400 }
      )
    }

    // #태그 패턴 추출 (한글, 영문, 숫자, _ 허용)
    const tagPattern = /#([\w가-힣_]+)/g
    const matches = [...body.matchAll(tagPattern)]

    if (matches.length === 0) {
      // 태그가 없으면 기존 NoteTag 모두 삭제
      await prisma.noteTag.deleteMany({
        where: { noteId: id },
      })

      return NextResponse.json({
        success: true,
        tags: [],
        message: 'No tags found, removed all existing tags'
      })
    }

    // 중복 제거
    const uniqueTagNames = [...new Set(matches.map((m) => m[1]))]

    // 각 태그 생성 또는 찾기
    const tags = await Promise.all(
      uniqueTagNames.map(async (name) => {
        return await prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      })
    )

    // 기존 NoteTag 삭제
    await prisma.noteTag.deleteMany({
      where: { noteId: id },
    })

    // 새로운 NoteTag 생성
    await prisma.noteTag.createMany({
      data: tags.map((tag) => ({
        noteId: id,
        tagId: tag.id,
      })),
    })

    return NextResponse.json({
      success: true,
      tags,
      message: `${tags.length} tags connected`
    })
  } catch (error) {
    console.error('POST /api/notes/[id]/tags error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
