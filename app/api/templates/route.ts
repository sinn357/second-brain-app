import { NextResponse } from 'next/server'
import { templateSchema } from '@/lib/validations/template'
import { prisma } from '@/lib/db'

// GET /api/templates - 템플릿 목록 조회
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: [
        { isDefault: 'desc' }, // 기본 템플릿 먼저
        { createdAt: 'asc' },  // 생성일 오름차순
      ],
    })

    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error('GET /api/templates error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/templates - 템플릿 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Zod 검증
    const validated = templateSchema.safeParse(body)
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

    const template = await prisma.template.create({
      data,
    })

    return NextResponse.json({ success: true, template }, { status: 201 })
  } catch (error) {
    console.error('POST /api/templates error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
