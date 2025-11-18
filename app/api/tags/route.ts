import { NextResponse } from 'next/server'
import { tagSchema } from '@/lib/validations/tag'
import { prisma } from '@/lib/db'

// GET /api/tags - 태그 목록 조회
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, tags })
  } catch (error) {
    console.error('GET /api/tags error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tags - 태그 생성 (or 기존 태그 찾기)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Zod 검증
    const validated = tagSchema.safeParse(body)
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

    // upsert: 같은 이름의 태그가 있으면 반환, 없으면 생성
    const tag = await prisma.tag.upsert({
      where: { name: data.name },
      update: {},
      create: data,
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, tag }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tags error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
