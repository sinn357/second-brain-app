import { NextResponse } from 'next/server'
import { parseLinkSchema } from '@/lib/validations/link'
import { prisma } from '@/lib/db'

// POST /api/links/parse - 노트 본문에서 [[링크]] 파싱
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Zod 검증
    const validated = parseLinkSchema.safeParse(body)
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

    const { noteId, body: noteBody } = validated.data
    const normalizedBody = noteBody.replace(/\\+\[\[/g, '[[').replace(/\\+\]\]/g, ']]')

    // [[문자열]] 패턴 추출
    const linkPattern = /\[\[(.+?)\]\]/g
    const matches = [...normalizedBody.matchAll(linkPattern)]

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        links: [],
        message: 'No links found'
      })
    }

    // 중복 제거
    const uniqueTitles = [...new Set(matches.map((m) => m[1]))]

    // 기존 링크 삭제 (이 노트에서 출발하는)
    await prisma.link.deleteMany({
      where: { sourceId: noteId },
    })

    // 각 제목으로 노트 찾기
    const createdLinks = []

    for (const title of uniqueTitles) {
      const targetNote = await prisma.note.findFirst({
        where: { title },
      })

      if (targetNote && targetNote.id !== noteId) {
        // 자기 자신에게 링크는 생성하지 않음
        const link = await prisma.link.create({
          data: {
            sourceId: noteId,
            targetId: targetNote.id,
          },
          include: {
            target: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        })
        createdLinks.push(link)
      }
    }

    return NextResponse.json({
      success: true,
      links: createdLinks,
      message: `${createdLinks.length} links created`
    })
  } catch (error) {
    console.error('POST /api/links/parse error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
